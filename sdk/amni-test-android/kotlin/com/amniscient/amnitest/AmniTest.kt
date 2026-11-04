package com.amniscient.amnitest

import android.annotation.SuppressLint
import android.app.Activity
import android.app.AlertDialog
import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputFilter
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.android.installreferrer.api.InstallReferrerClient
import com.android.installreferrer.api.InstallReferrerClient.InstallReferrerResponse
import com.android.installreferrer.api.InstallReferrerStateListener
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.lang.ref.WeakReference
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Amni-Test SDK: proves which tester installed a closed-test build and that the
 * app is opened during the 14-day test.
 *
 * Call [init] once from `Application.onCreate()`. Everything else is optional.
 * The SDK never throws into the host app; problems are logged at debug level
 * under the tag `AmniTest`.
 */
// ApplySharedPref: commit() is intentional; it only runs on the SDK's background thread.
// StaticFieldLeak: only the application context is held.
// SetTextI18n: the claim dialog is English-only so the library ships no resources.
@SuppressLint("ApplySharedPref", "StaticFieldLeak", "SetTextI18n")
object AmniTest {

    /** Amni-Test server used when [init] is not given another base URL. */
    const val DEFAULT_BASE_URL = "https://amni-test.amnibro7.workers.dev"

    /** SDK version, sent in the User-Agent header. */
    const val VERSION = "0.1.0"

    private const val TAG = "AmniTest"
    private const val PREFS = "amnitest"
    private const val KEY_INSTALL_ID = "install_id"
    private const val KEY_CLAIMED = "claimed"
    private const val KEY_CODE = "code"
    private const val KEY_ASSIGNMENT_ID = "assignment_id"
    private const val KEY_PENDING_CODE = "pending_code"
    private const val KEY_REFERRER_CHECKED = "referrer_checked"
    private const val KEY_LAST_PING_DAY = "last_ping_day"
    private const val KEY_SERVER_DAY = "server_day"

    private const val TIMEOUT_MS = 10_000
    private const val MAX_RESPONSE_BYTES = 64 * 1024
    private const val RETRY_AFTER_MS = 60_000L
    private const val REFERRER_TIMEOUT_MS = 15_000L

    private class Config(
        val app: Context,
        val sdkKey: String,
        val baseUrl: String,
        val autoPrompt: Boolean,
    ) {
        val prefs: SharedPreferences by lazy { prefsOf(app) }
    }

    @Volatile private var config: Config? = null
    @Volatile private var resumedActivity: WeakReference<Activity>? = null
    @Volatile private var openDialog: WeakReference<AlertDialog>? = null

    private val callbacksRegistered = AtomicBoolean(false)
    private val referrerCheckStarted = AtomicBoolean(false)
    private val referrerPhaseDone = AtomicBoolean(false)
    private val autoPromptShown = AtomicBoolean(false)

    // Only touched on the executor thread.
    private var lastPingAttemptAt = 0L
    private var lastPendingClaimAttemptAt = 0L

    private val mainHandler: Handler by lazy { Handler(Looper.getMainLooper()) }

    private val executor: ExecutorService by lazy {
        Executors.newSingleThreadExecutor { r ->
            Thread(r, "AmniTest").apply { isDaemon = true }
        }
    }

    // ------------------------------------------------------------------ API

    /**
     * Starts the SDK. Call from `Application.onCreate()`.
     *
     * @param sdkKey the key from the developer's campaign page on
     *   amni-scient.com/test/. If blank, the SDK does nothing.
     * @param baseUrl Amni-Test server, default [DEFAULT_BASE_URL].
     * @param autoPrompt if true and the install is still unclaimed after the
     *   Install Referrer check, [showClaimDialog] is shown once per process on
     *   the next resumed activity.
     */
    @JvmStatic
    @JvmOverloads
    fun init(
        context: Context,
        sdkKey: String,
        baseUrl: String = DEFAULT_BASE_URL,
        autoPrompt: Boolean = false,
    ) {
        try {
            val key = sdkKey.trim()
            if (key.isEmpty()) {
                log("init: sdkKey is blank, SDK disabled")
                return
            }
            val url = AmniTestLogic.normalizeBaseUrl(baseUrl)
            if (url == null) {
                log("init: baseUrl '$baseUrl' is not an http(s) URL, SDK disabled")
                return
            }
            val app = context.applicationContext ?: context
            val cfg = Config(app, key, url, autoPrompt)
            config = cfg

            val application = app as? Application
            if (application == null) {
                log("init: no Application context; daily pings need activity callbacks")
            } else if (callbacksRegistered.compareAndSet(false, true)) {
                application.registerActivityLifecycleCallbacks(Lifecycle)
            }
            runInBackground("startup") { startup(cfg) }
        } catch (t: Throwable) {
            log("init failed", t)
        }
    }

    /** True once this install has successfully claimed a tester's code. */
    @JvmStatic
    fun isClaimed(context: Context): Boolean = try {
        prefsOf(context).getBoolean(KEY_CLAIMED, false)
    } catch (t: Throwable) {
        log("isClaimed failed", t)
        false
    }

    /**
     * Claims [code] (`AT-XXXX-XXXX`, any case, dashes and spaces optional) for
     * this install. [callback] runs on the main thread with success, or a failure
     * holding an [AmniTestException] whose message can be shown to the tester.
     */
    @JvmStatic
    fun claimCode(context: Context, code: String, callback: (Result<Unit>) -> Unit) {
        try {
            val normalized = AmniTestLogic.normalizeCode(code)
            if (normalized == null) {
                deliver(callback, failure("That is not an Amni-Test code. Codes look like AT-XXXX-XXXX."))
                return
            }
            val cfg = config
            if (cfg == null) {
                log("claimCode: AmniTest.init() has not been called with an sdkKey (context ${context.packageName})")
                deliver(callback, failure("Amni-Test is not set up in this build."))
                return
            }
            executor.execute {
                val result = try {
                    claim(cfg, normalized)
                } catch (t: Throwable) {
                    log("claim failed", t)
                    failure("Something went wrong. Please try again.")
                }
                deliver(callback, result)
            }
        } catch (t: Throwable) {
            log("claimCode failed", t)
            deliver(callback, failure("Something went wrong. Please try again."))
        }
    }

    /**
     * Shows a plain dialog where the tester types their claim code. It shows the
     * error and stays open on failure, and closes on success. Safe to call from
     * any thread; does nothing if a claim dialog is already showing.
     */
    @JvmStatic
    fun showClaimDialog(activity: Activity) {
        if (Looper.myLooper() != Looper.getMainLooper()) {
            try {
                mainHandler.post { showClaimDialog(activity) }
            } catch (t: Throwable) {
                log("showClaimDialog post failed", t)
            }
            return
        }
        try {
            if (!isAlive(activity)) return
            openDialog?.get()?.let { if (it.isShowing) return }
            buildClaimDialog(activity).show()
        } catch (t: Throwable) {
            log("showClaimDialog failed", t)
        }
    }

    // -------------------------------------------------------------- startup

    private fun startup(cfg: Config) {
        val prefs = cfg.prefs
        installId(prefs)
        when {
            prefs.getBoolean(KEY_CLAIMED, false) -> referrerPhaseFinished()
            prefs.getString(KEY_PENDING_CODE, null) != null -> {
                // A referrer code was found earlier but the claim did not get through.
                claimPendingCode(cfg)
                referrerPhaseFinished()
            }
            !prefs.getBoolean(KEY_REFERRER_CHECKED, false) ->
                mainHandler.post { safely("referrer") { startReferrerCheck(cfg) } }
            else -> referrerPhaseFinished()
        }
    }

    private fun startReferrerCheck(cfg: Config) {
        if (!referrerCheckStarted.compareAndSet(false, true)) return
        val client = InstallReferrerClient.newBuilder(cfg.app).build()
        val finished = AtomicBoolean(false)
        client.startConnection(object : InstallReferrerStateListener {
            override fun onInstallReferrerSetupFinished(responseCode: Int) {
                if (!finished.compareAndSet(false, true)) return
                runInBackground("referrer") {
                    try {
                        handleReferrer(cfg, client, responseCode)
                    } finally {
                        endQuietly(client)
                        referrerPhaseFinished()
                    }
                }
            }

            override fun onInstallReferrerServiceDisconnected() {
                // Lost before we got an answer: try again on the next launch.
                if (finished.compareAndSet(false, true)) {
                    log("referrer: service disconnected")
                    endQuietly(client)
                    referrerPhaseFinished()
                }
            }
        })
        mainHandler.postDelayed({
            if (finished.compareAndSet(false, true)) {
                log("referrer: no answer from Play, will retry next launch")
                endQuietly(client)
                referrerPhaseFinished()
            }
        }, REFERRER_TIMEOUT_MS)
    }

    private fun handleReferrer(cfg: Config, client: InstallReferrerClient, responseCode: Int) {
        val prefs = cfg.prefs
        when (responseCode) {
            InstallReferrerResponse.OK -> {
                val referrer = client.installReferrer?.installReferrer
                val code = AmniTestLogic.parseReferrer(referrer)
                val editor = prefs.edit().putBoolean(KEY_REFERRER_CHECKED, true)
                if (code != null) editor.putString(KEY_PENDING_CODE, code)
                editor.commit()
                if (code != null) {
                    log("referrer: found code $code")
                    claimPendingCode(cfg)
                } else {
                    log("referrer: no amnitest code")
                }
            }
            InstallReferrerResponse.FEATURE_NOT_SUPPORTED,
            InstallReferrerResponse.DEVELOPER_ERROR,
            InstallReferrerResponse.PERMISSION_ERROR -> {
                log("referrer: unavailable on this device (response $responseCode)")
                prefs.edit().putBoolean(KEY_REFERRER_CHECKED, true).commit()
            }
            else -> log("referrer: temporary failure (response $responseCode), will retry next launch")
        }
    }

    private fun referrerPhaseFinished() {
        referrerPhaseDone.set(true)
        mainHandler.post {
            safely("autoPrompt") { resumedActivity?.get()?.let { maybeAutoPrompt(it) } }
        }
    }

    // ------------------------------------------------------- claim and ping

    /** Runs on the executor. */
    private fun claim(cfg: Config, code: String): Result<Unit> {
        val prefs = cfg.prefs
        val body = AmniTestLogic.jsonObject(
            "key" to cfg.sdkKey,
            "package" to cfg.app.packageName,
            "code" to code,
            "installId" to installId(prefs),
        )
        val response = post(cfg, "/api/sdk/claim", body)
        if (response.status in 200..299 && response.json?.optBoolean("ok", true) != false) {
            val assignment = response.json?.optJSONObject("assignment")
            prefs.edit()
                .putBoolean(KEY_CLAIMED, true)
                .putString(KEY_CODE, code)
                .putString(KEY_ASSIGNMENT_ID, assignment?.opt("id")?.toString())
                .remove(KEY_PENDING_CODE)
                .commit()
            log("claim: ok ($code, assignment ${assignment?.opt("id")}, status ${assignment?.opt("status")})")
            pingIfDue(cfg, force = true)
            return Result.success(Unit)
        }
        log("claim: failed with ${response.status}: ${response.error}")
        val message = when {
            response.status <= 0 -> "Could not reach Amni-Test. Check your connection and try again."
            response.error != null -> response.error
            response.status >= 500 -> "Amni-Test is having trouble. Please try again later."
            else -> "The code was not accepted (HTTP ${response.status})."
        }
        return failure(message, response.status.coerceAtLeast(0))
    }

    /** Claims a code found in the Install Referrer. Runs on the executor. */
    private fun claimPendingCode(cfg: Config) {
        val prefs = cfg.prefs
        if (prefs.getBoolean(KEY_CLAIMED, false)) return
        val code = prefs.getString(KEY_PENDING_CODE, null) ?: return
        lastPendingClaimAttemptAt = System.currentTimeMillis()
        val result = claim(cfg, code)
        val status = (result.exceptionOrNull() as? AmniTestException)?.httpStatus ?: 0
        if (result.isFailure && AmniTestLogic.isDefinitiveFailure(status)) {
            log("claim: server refused referrer code $code, not retrying")
            prefs.edit().remove(KEY_PENDING_CODE).commit()
        }
    }

    /** Sends the daily ping if one is due. Runs on the executor. */
    private fun pingIfDue(cfg: Config, force: Boolean = false) {
        val prefs = cfg.prefs
        if (!prefs.getBoolean(KEY_CLAIMED, false)) return
        val now = System.currentTimeMillis()
        if (!AmniTestLogic.shouldPing(prefs.getLong(KEY_LAST_PING_DAY, -1L), now)) return
        if (!force && now - lastPingAttemptAt in 0 until RETRY_AFTER_MS) return
        lastPingAttemptAt = now

        val body = AmniTestLogic.jsonObject(
            "key" to cfg.sdkKey,
            "package" to cfg.app.packageName,
            "installId" to installId(prefs),
        )
        val response = post(cfg, "/api/sdk/ping", body)
        when (response.status) {
            200 -> {
                val day = response.json?.optInt("day", -1) ?: -1
                prefs.edit()
                    .putLong(KEY_LAST_PING_DAY, AmniTestLogic.utcEpochDay(now))
                    .putInt(KEY_SERVER_DAY, day)
                    .commit()
                log("ping: ok, day $day")
            }
            404 -> {
                // The server does not know this install: forget the claim so the
                // referrer code or the claim dialog can link it again.
                log("ping: server has no claim for this install, resetting")
                prefs.edit()
                    .putBoolean(KEY_CLAIMED, false)
                    .remove(KEY_CODE)
                    .remove(KEY_ASSIGNMENT_ID)
                    .remove(KEY_LAST_PING_DAY)
                    .commit()
            }
            else -> log("ping: failed with ${response.status}: ${response.error}")
        }
    }

    /** Called on every activity resume. Runs on the executor. */
    private fun onResumeTick(cfg: Config) {
        val prefs = cfg.prefs
        if (prefs.getBoolean(KEY_CLAIMED, false)) {
            pingIfDue(cfg)
        } else if (prefs.getString(KEY_PENDING_CODE, null) != null &&
            System.currentTimeMillis() - lastPendingClaimAttemptAt !in 0 until RETRY_AFTER_MS
        ) {
            claimPendingCode(cfg)
        }
    }

    // ----------------------------------------------------------------- HTTP

    private class Response(val status: Int, val json: JSONObject?, val error: String?)

    /** POSTs a JSON body. Network failures come back as status -1. */
    private fun post(cfg: Config, path: String, body: String): Response {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(cfg.baseUrl + path).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = TIMEOUT_MS
                readTimeout = TIMEOUT_MS
                doOutput = true
                useCaches = false
                instanceFollowRedirects = false
                setRequestProperty("Content-Type", "application/json; charset=utf-8")
                setRequestProperty("Accept", "application/json")
                setRequestProperty("User-Agent", "AmniTest-Android/$VERSION")
            }
            val bytes = body.toByteArray(Charsets.UTF_8)
            conn.setFixedLengthStreamingMode(bytes.size)
            conn.outputStream.use { it.write(bytes) }
            val status = conn.responseCode
            val stream = if (status >= 400) conn.errorStream else conn.inputStream
            val text = stream?.use { readLimited(it) }
            val json = try {
                if (text.isNullOrBlank()) null else JSONObject(text)
            } catch (e: Exception) {
                null
            }
            val error = json?.optString("error")?.takeIf { it.isNotBlank() }
            Response(status, json, error)
        } catch (e: IOException) {
            log("POST $path: ${e.javaClass.simpleName}: ${e.message}")
            Response(-1, null, null)
        } finally {
            try {
                conn?.disconnect()
            } catch (_: Throwable) {
            }
        }
    }

    private fun readLimited(input: InputStream): String {
        val out = ByteArrayOutputStream()
        val buf = ByteArray(4096)
        while (out.size() < MAX_RESPONSE_BYTES) {
            val n = input.read(buf)
            if (n < 0) break
            out.write(buf, 0, n)
        }
        return out.toString("UTF-8")
    }

    // ------------------------------------------------------------ lifecycle

    private object Lifecycle : Application.ActivityLifecycleCallbacks {
        override fun onActivityResumed(activity: Activity) {
            try {
                resumedActivity = WeakReference(activity)
                val cfg = config ?: return
                runInBackground("resume") { onResumeTick(cfg) }
                maybeAutoPrompt(activity)
            } catch (t: Throwable) {
                log("onActivityResumed failed", t)
            }
        }

        override fun onActivityPaused(activity: Activity) {
            if (resumedActivity?.get() === activity) resumedActivity = null
        }

        override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
        override fun onActivityStarted(activity: Activity) {}
        override fun onActivityStopped(activity: Activity) {}
        override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
        override fun onActivityDestroyed(activity: Activity) {}
    }

    /** Main thread. Shows the claim dialog once per process if configured. */
    private fun maybeAutoPrompt(activity: Activity) {
        val cfg = config ?: return
        if (!cfg.autoPrompt || !referrerPhaseDone.get() || autoPromptShown.get()) return
        val prefs = cfg.prefs
        if (prefs.getBoolean(KEY_CLAIMED, false)) return
        if (prefs.getString(KEY_PENDING_CODE, null) != null) return
        if (!isAlive(activity)) return
        if (autoPromptShown.compareAndSet(false, true)) showClaimDialog(activity)
    }

    // --------------------------------------------------------------- dialog

    private fun buildClaimDialog(activity: Activity): AlertDialog {
        val density = activity.resources.displayMetrics.density
        fun dp(v: Int) = (v * density + 0.5f).toInt()

        val claimedCode = config?.prefs?.takeIf { it.getBoolean(KEY_CLAIMED, false) }
            ?.getString(KEY_CODE, null)
        val message = TextView(activity).apply {
            text = if (claimedCode != null) {
                "This install is linked to $claimedCode. Enter a different code only if Amni-Test asked you to."
            } else {
                "Enter the code shown for this test on your Amni-Test page. It looks like AT-XXXX-XXXX."
            }
        }
        val input = EditText(activity).apply {
            hint = "AT-XXXX-XXXX"
            isSingleLine = true
            inputType = InputType.TYPE_CLASS_TEXT or
                InputType.TYPE_TEXT_FLAG_CAP_CHARACTERS or
                InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS
            filters = arrayOf(InputFilter.AllCaps(), InputFilter.LengthFilter(24))
            imeOptions = EditorInfo.IME_ACTION_DONE
        }
        val error = TextView(activity).apply {
            setTextColor(0xFFD32F2F.toInt())
            visibility = View.GONE
        }
        val layout = LinearLayout(activity).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(8), dp(24), 0)
            addView(message)
            addView(input, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = dp(12) })
            addView(error, LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { topMargin = dp(4) })
        }

        val dialog = AlertDialog.Builder(activity)
            .setTitle("Amni-Test code")
            .setView(layout)
            .setPositiveButton("Claim", null)
            .setNegativeButton("Cancel", null)
            .create()

        fun showError(text: String) {
            error.text = text
            error.visibility = View.VISIBLE
        }

        fun submit(button: Button) {
            if (!button.isEnabled) return
            val raw = input.text?.toString().orEmpty()
            if (AmniTestLogic.normalizeCode(raw) == null) {
                showError("That is not an Amni-Test code. Codes look like AT-XXXX-XXXX.")
                return
            }
            error.visibility = View.GONE
            button.isEnabled = false
            input.isEnabled = false
            button.text = "Checking…"
            claimCode(activity, raw) { result ->
                try {
                    if (!dialog.isShowing) return@claimCode
                    if (result.isSuccess) {
                        if (isAlive(activity)) {
                            dialog.dismiss()
                            Toast.makeText(activity, "Amni-Test code claimed. Thanks for testing!", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        button.isEnabled = true
                        input.isEnabled = true
                        button.text = "Claim"
                        showError(result.exceptionOrNull()?.message ?: "The code was not accepted.")
                    }
                } catch (t: Throwable) {
                    log("claim dialog update failed", t)
                }
            }
        }

        dialog.setOnShowListener {
            safely("dialog") {
                val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
                button.setOnClickListener { safely("dialog") { submit(button) } }
                input.setOnEditorActionListener { _, actionId, _ ->
                    if (actionId == EditorInfo.IME_ACTION_DONE) {
                        safely("dialog") { submit(button) }
                        true
                    } else {
                        false
                    }
                }
                input.requestFocus()
            }
        }
        dialog.window?.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE)
        openDialog = WeakReference(dialog)
        return dialog
    }

    // -------------------------------------------------------------- helpers

    private fun prefsOf(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    @Synchronized
    private fun installId(prefs: SharedPreferences): String {
        prefs.getString(KEY_INSTALL_ID, null)?.let { return it }
        val id = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_INSTALL_ID, id).commit()
        return id
    }

    private fun isAlive(activity: Activity): Boolean =
        !activity.isFinishing && !activity.isDestroyed

    private fun endQuietly(client: InstallReferrerClient) {
        try {
            client.endConnection()
        } catch (_: Throwable) {
        }
    }

    private fun failure(message: String, status: Int = 0): Result<Unit> =
        Result.failure(AmniTestException(message, status))

    private fun deliver(callback: (Result<Unit>) -> Unit, result: Result<Unit>) {
        try {
            mainHandler.post {
                try {
                    callback(result)
                } catch (t: Throwable) {
                    log("claimCode callback threw", t)
                }
            }
        } catch (t: Throwable) {
            log("deliver failed", t)
        }
    }

    private fun runInBackground(what: String, block: () -> Unit) {
        try {
            executor.execute { safely(what, block) }
        } catch (t: Throwable) {
            log("$what: could not schedule", t)
        }
    }

    private inline fun safely(what: String, block: () -> Unit) {
        try {
            block()
        } catch (t: Throwable) {
            log("$what failed", t)
        }
    }

    private fun log(message: String, t: Throwable? = null) {
        try {
            if (t == null) Log.d(TAG, message) else Log.d(TAG, message, t)
        } catch (_: Throwable) {
            // android.util.Log is unavailable in plain JVM unit tests.
        }
    }
}
