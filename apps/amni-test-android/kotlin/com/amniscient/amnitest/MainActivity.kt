package com.amniscient.amnitest

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.View
import android.view.ViewGroup
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/** Full-screen WebView with Test Town, plus the `AmniApp` bridge. */
class MainActivity : ComponentActivity(), Bridge.Host {

    private lateinit var webView: WebView
    private lateinit var errorView: View
    private lateinit var errorDetail: TextView
    private lateinit var progress: ProgressBar
    private var webViewAlive = false

    /** Top-level page URL, written on the UI thread, read by the bridge thread. */
    @Volatile
    private var pageUrl: String? = null
    private var loadFailed = false
    private var pageLoaded = false

    private val io: ExecutorService = Executors.newSingleThreadExecutor()

    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            // Reminders found before the answer were not shown; look again now. A "no" is fine.
            if (granted) CheckInWorker.runNow(this)
        }

    override val context: Context get() = applicationContext

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        if (Session.token(this) == null) {
            openSignIn()
            return
        }
        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.web)
        errorView = findViewById(R.id.error_view)
        errorDetail = findViewById(R.id.error_detail)
        progress = findViewById(R.id.progress)
        findViewById<Button>(R.id.retry).setOnClickListener { load() }
        setUpWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webViewAlive && webView.canGoBack()) webView.goBack() else finish()
            }
        })

        load()
        CheckInWorker.schedule(this)
        askForNotificationsOnce()
        if (savedInstanceState == null) checkForUpdate()
    }

    // ------------------------------------------------------------------ WebView

    // JavaScript is required: the town is a three.js scene. The bridge only
    // answers pages on SITE_URL's origin (see Bridge).
    @SuppressLint("SetJavaScriptEnabled")
    private fun setUpWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        webView.setBackgroundColor(ContextCompat.getColor(this, R.color.ink))
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            userAgentString = "$userAgentString AmniTestApp/${BuildConfig.VERSION_NAME}"
        }
        webView.addJavascriptInterface(Bridge(this), "AmniApp")
        webView.webViewClient = Client()
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
            }
        }
        webView.setDownloadListener { url, _, _, _, _ ->
            if (AppLogic.isWebUrl(url)) Links.open(this, url)
        }
        webViewAlive = true
    }

    private fun load() {
        if (!webViewAlive) return
        loadFailed = false
        pageLoaded = false
        errorView.visibility = View.GONE
        webView.visibility = View.VISIBLE
        webView.loadUrl(AppLogic.townUrl(BuildConfig.SITE_URL))
    }

    private fun showLoadError(detail: String?) {
        loadFailed = true
        pageLoaded = false
        progress.visibility = View.GONE
        errorDetail.text = detail.orEmpty()
        errorDetail.visibility = if (detail.isNullOrBlank()) View.GONE else View.VISIBLE
        webView.visibility = View.INVISIBLE
        errorView.visibility = View.VISIBLE
    }

    private inner class Client : WebViewClient() {

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            if (!request.isForMainFrame) return false
            val url = request.url.toString()
            return when (AppLogic.classifyNavigation(url, BuildConfig.SITE_URL)) {
                AppLogic.Navigation.IN_APP -> false
                AppLogic.Navigation.EXTERNAL -> {
                    Links.open(this@MainActivity, url)
                    true
                }
                AppLogic.Navigation.BLOCKED -> true
            }
        }

        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
            // Only ever revoke here; access is granted once a page has committed.
            if (!AppLogic.sameOrigin(url, BuildConfig.SITE_URL)) pageUrl = url
        }

        override fun doUpdateVisitedHistory(view: WebView, url: String?, isReload: Boolean) {
            pageUrl = url
        }

        override fun onPageFinished(view: WebView, url: String?) {
            pageUrl = view.url
            progress.visibility = View.GONE
            if (!loadFailed) {
                pageLoaded = true
                errorView.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }
        }

        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
            if (request.isForMainFrame) showLoadError(error.description?.toString())
        }

        override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, response: WebResourceResponse) {
            if (request.isForMainFrame && response.statusCode >= 400) showLoadError("HTTP ${response.statusCode}")
        }

        @SuppressLint("WebViewClientOnReceivedSslError")
        override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
            handler.cancel()
            if (AppLogic.sameOrigin(error.url, BuildConfig.SITE_URL)) showLoadError(getString(R.string.error_ssl))
        }

        override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
            // The WebGL scene can take the renderer down; start over instead of crashing.
            destroyWebView()
            recreate()
            return true
        }
    }

    private fun destroyWebView() {
        if (!webViewAlive) return
        webViewAlive = false
        pageUrl = null
        (webView.parent as? ViewGroup)?.removeView(webView)
        webView.destroy()
    }

    private fun dispatchResumeEvent() {
        if (!AppLogic.sameOrigin(pageUrl, BuildConfig.SITE_URL)) return
        webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('amniapp',{detail:{type:'resume'}}))",
            null,
        )
    }

    // ------------------------------------------------------------------ lifecycle

    override fun onResume() {
        super.onResume()
        if (!webViewAlive) return
        if (Session.token(this) == null) {
            // The background check found the session expired.
            openSignIn()
            return
        }
        webView.onResume()
        if (loadFailed) load() else if (pageLoaded) dispatchResumeEvent()
    }

    override fun onPause() {
        if (webViewAlive) webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        io.shutdownNow()
        destroyWebView()
        super.onDestroy()
    }

    private fun openSignIn() {
        startActivity(Intent(this, SignInActivity::class.java))
        finish()
    }

    // ------------------------------------------------------------------ notifications & updates

    private fun askForNotificationsOnce() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (Session.notificationPrompted(this)) return
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) return
        Session.setNotificationPrompted(this)
        notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun checkForUpdate() {
        io.execute {
            val update = try {
                AppLogic.parseUpdate(Http.getTextOrNull(AppLogic.latestJsonUrl(BuildConfig.SITE_URL)), BuildConfig.SITE_URL)
            } catch (e: Exception) {
                null // Missing file, offline, bad JSON: no update prompt.
            }
            if (update != null && AppLogic.isNewer(update, BuildConfig.VERSION_CODE.toLong())) {
                runOnUiThread { showUpdate(update) }
            }
        }
    }

    private fun showUpdate(update: AppLogic.Update) {
        if (isFinishing || isDestroyed) return
        AlertDialog.Builder(this)
            .setTitle(R.string.update_title)
            .setMessage(getString(R.string.update_message, update.versionName))
            .setPositiveButton(R.string.update_download) { _, _ -> Links.open(this, update.url) }
            .setNegativeButton(R.string.update_later, null)
            .show()
    }

    // ------------------------------------------------------------------ Bridge.Host

    override fun currentPageUrl(): String? = pageUrl

    override fun openExternal(url: String) = runOnUiThread {
        if (!isFinishing) Links.open(this, url)
    }

    override fun haptic(kind: AppLogic.Haptic) = runOnUiThread {
        if (!webViewAlive) return@runOnUiThread
        val constant = when (kind) {
            AppLogic.Haptic.LIGHT -> HapticFeedbackConstants.KEYBOARD_TAP
            AppLogic.Haptic.SUCCESS ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.CONFIRM
                else HapticFeedbackConstants.VIRTUAL_KEY
            AppLogic.Haptic.WARNING ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) HapticFeedbackConstants.REJECT
                else HapticFeedbackConstants.LONG_PRESS
        }
        webView.performHapticFeedback(constant)
    }

    override fun share(text: String) = runOnUiThread {
        val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
        try {
            startActivity(Intent.createChooser(send, null))
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(this, R.string.no_app_for_link, Toast.LENGTH_SHORT).show()
        }
    }

    override fun signOut() = runOnUiThread {
        if (isFinishing) return@runOnUiThread
        Account.signOut(this)
        openSignIn()
    }
}
