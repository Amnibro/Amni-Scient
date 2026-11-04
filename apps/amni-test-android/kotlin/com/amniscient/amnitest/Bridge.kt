package com.amniscient.amnitest

import android.content.Context
import android.webkit.JavascriptInterface

/**
 * `window.AmniApp` inside the Test Town WebView. Strings in, strings out.
 *
 * JavaScript calls arrive on a WebView background thread. Every method first
 * checks that the page currently shown has exactly the origin of SITE_URL;
 * otherwise it returns "" or does nothing, so a page the WebView has navigated
 * to (for example after a cross-origin form POST) cannot read the token.
 *
 * Note: a JavaScript interface is visible to every frame of the page, and the
 * check is on the top-level page. Pages on the site must not embed
 * cross-origin iframes (send `Content-Security-Policy: frame-src 'self'`).
 */
class Bridge(private val host: Host) {

    interface Host {
        val context: Context
        /** URL of the top-level page last committed in the WebView. */
        fun currentPageUrl(): String?
        fun openExternal(url: String)
        fun haptic(kind: AppLogic.Haptic)
        fun share(text: String)
        fun signOut()
    }

    private fun allowed(): Boolean = AppLogic.sameOrigin(host.currentPageUrl(), BuildConfig.SITE_URL)

    /** The Amni-Test session token for `Authorization: Bearer`, or "". */
    @JavascriptInterface
    fun getToken(): String = if (allowed()) Session.token(host.context).orEmpty() else ""

    /** The API base URL, e.g. https://amni-test.amnibro7.workers.dev (no trailing slash). */
    @JavascriptInterface
    fun getApiBase(): String = if (allowed()) BuildConfig.API_URL.trimEnd('/') else ""

    /** The app's versionName, e.g. "0.1.0". */
    @JavascriptInterface
    fun appVersion(): String = if (allowed()) BuildConfig.VERSION_NAME else ""

    /**
     * [packagesJson]: a JSON array of up to 50 package names. Returns
     * `{ "<pkg>": versionCode or 0 }`, or "{}" when the input is invalid.
     */
    @JavascriptInterface
    fun installed(packagesJson: String?): String {
        if (!allowed()) return ""
        val packages = AppLogic.parsePackageList(packagesJson) ?: return "{}"
        val pm = host.context.packageManager
        return AppLogic.installedJson(packages.associateWith { Installed.versionCode(pm, it) })
    }

    /** Opens an http(s) URL in another app; Play Store links open the Play Store app. */
    @JavascriptInterface
    fun openExternal(url: String?) {
        if (!allowed() || url == null || !AppLogic.isWebUrl(url)) return
        host.openExternal(url.trim())
    }

    /** `light`, `success` or `warning`. */
    @JavascriptInterface
    fun haptic(kind: String?) {
        if (!allowed()) return
        AppLogic.parseHaptic(kind)?.let { host.haptic(it) }
    }

    /** Opens the system share sheet with [text] (trimmed to 4000 characters). */
    @JavascriptInterface
    fun share(text: String?) {
        if (!allowed()) return
        AppLogic.shareText(text)?.let { host.share(it) }
    }

    /** Clears the token, signs out on the server (best effort) and shows the sign-in screen. */
    @JavascriptInterface
    fun signOut() {
        if (!allowed()) return
        host.signOut()
    }
}
