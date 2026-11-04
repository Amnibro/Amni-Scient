package com.amniscient.amnitest

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.net.URI
import java.net.URISyntaxException
import java.util.Locale

/**
 * Pure decisions with no Android dependencies, so they run in plain JVM unit
 * tests: bridge input validation, origin checks, navigation rules, update
 * checks and which reminders to post. (org.json ships with Android; the unit
 * tests bring the reference implementation.)
 */
object AppLogic {

    // ---------------------------------------------------------------- bridge input

    const val MAX_PACKAGES = 50
    private const val MAX_PACKAGE_LENGTH = 255
    private const val MAX_PACKAGES_JSON_LENGTH = 20_000
    const val MAX_SHARE_LENGTH = 4_000

    /** Java-style package name with at least two segments, e.g. `com.example.app`. */
    private val PACKAGE_NAME = Regex("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+")

    fun isValidPackageName(name: String): Boolean =
        name.length <= MAX_PACKAGE_LENGTH && PACKAGE_NAME.matches(name)

    /**
     * Parses the `installed(packagesJson)` argument: a JSON array of at most
     * [MAX_PACKAGES] valid package names. Returns null (reject everything) when
     * the input is not such an array; duplicates are dropped.
     */
    fun parsePackageList(json: String?): List<String>? {
        if (json == null || json.length > MAX_PACKAGES_JSON_LENGTH) return null
        val array = try {
            JSONArray(json)
        } catch (e: JSONException) {
            return null
        }
        if (array.length() > MAX_PACKAGES) return null
        val out = LinkedHashSet<String>()
        for (i in 0 until array.length()) {
            val name = array.opt(i) as? String ?: return null
            if (!isValidPackageName(name)) return null
            out.add(name)
        }
        return out.toList()
    }

    /** `{ "<pkg>": versionCode or 0 }`. */
    fun installedJson(versions: Map<String, Long>): String {
        val out = JSONObject()
        for ((pkg, code) in versions) out.put(pkg, code)
        return out.toString()
    }

    enum class Haptic { LIGHT, SUCCESS, WARNING }

    fun parseHaptic(kind: String?): Haptic? = when (kind?.trim()?.lowercase(Locale.ROOT)) {
        "light" -> Haptic.LIGHT
        "success" -> Haptic.SUCCESS
        "warning" -> Haptic.WARNING
        else -> null
    }

    /** Text for the share sheet, or null when there is nothing to share. */
    fun shareText(text: String?): String? =
        text?.trim()?.takeIf { it.isNotEmpty() }?.take(MAX_SHARE_LENGTH)

    // ---------------------------------------------------------------- origins & navigation

    /**
     * `scheme://host:port` for http(s) URLs (default ports filled in, scheme and
     * host lower-cased), or null for anything else or anything unparseable.
     */
    fun originOf(url: String?): String? {
        if (url.isNullOrBlank()) return null
        val uri = try {
            URI(url.trim())
        } catch (e: URISyntaxException) {
            return null
        }
        val scheme = uri.scheme?.lowercase(Locale.ROOT) ?: return null
        if (scheme != "http" && scheme != "https") return null
        val host = uri.host?.lowercase(Locale.ROOT)?.takeIf { it.isNotEmpty() } ?: return null
        val port = if (uri.port == -1) (if (scheme == "https") 443 else 80) else uri.port
        return "$scheme://$host:$port"
    }

    /** True only when [url] is an http(s) URL with exactly the site's origin. */
    fun sameOrigin(url: String?, siteUrl: String): Boolean {
        val origin = originOf(url) ?: return false
        return origin == originOf(siteUrl)
    }

    fun isWebUrl(url: String?): Boolean = originOf(url) != null

    fun isPlayStoreUrl(url: String?): Boolean =
        originOf(url).let { it == "https://play.google.com:443" || it == "http://play.google.com:80" }

    enum class Navigation { IN_APP, EXTERNAL, BLOCKED }

    /**
     * Same-origin pages stay in the WebView; other web pages, Play Store and
     * mail links go to other apps; every other scheme (intent:, file:,
     * javascript:, content: ...) is blocked.
     */
    fun classifyNavigation(url: String?, siteUrl: String): Navigation {
        if (sameOrigin(url, siteUrl)) return Navigation.IN_APP
        if (isWebUrl(url)) return Navigation.EXTERNAL
        val scheme = url?.substringBefore(':', "")?.trim()?.lowercase(Locale.ROOT)
        return if (scheme == "market" || scheme == "mailto") Navigation.EXTERNAL else Navigation.BLOCKED
    }

    fun townUrl(siteUrl: String): String = siteUrl.trimEnd('/') + "/test/town/?app=1"
    fun latestJsonUrl(siteUrl: String): String = siteUrl.trimEnd('/') + "/test/app/latest.json"
    fun termsUrl(siteUrl: String): String = siteUrl.trimEnd('/') + "/test/terms.html"
    fun privacyUrl(siteUrl: String): String = siteUrl.trimEnd('/') + "/test/privacy.html"

    // ---------------------------------------------------------------- updates

    data class Update(val versionCode: Long, val versionName: String, val url: String)

    /**
     * Parses `/test/app/latest.json` (`{ versionCode, versionName, url }`). The
     * download URL must be https, or on the site's own origin (local testing).
     */
    fun parseUpdate(json: String?, siteUrl: String): Update? {
        if (json.isNullOrBlank()) return null
        val o = try {
            JSONObject(json)
        } catch (e: JSONException) {
            return null
        }
        val code = when (val v = o.opt("versionCode")) {
            is Number -> v.toLong()
            is String -> v.trim().toLongOrNull()
            else -> null
        } ?: return null
        if (code <= 0) return null
        val url = o.optString("url", "").trim()
        val okUrl = originOf(url)?.startsWith("https://") == true || sameOrigin(url, siteUrl)
        if (!okUrl) return null
        val name = o.optString("versionName", "").trim().take(40).ifEmpty { code.toString() }
        return Update(code, name, url)
    }

    fun isNewer(update: Update?, currentVersionCode: Long): Boolean =
        update != null && update.versionCode > currentVersionCode

    // ---------------------------------------------------------------- assignments & reminders

    data class Assignment(
        val id: String,
        val status: String,
        val appName: String,
        val packageName: String,
        val openCheckin: Int?,
        val filedDays: Set<Int>,
    )

    /** Parses `GET /api/assignments` (`{ assignments: [...] }`), skipping malformed rows. */
    fun parseAssignments(json: String): List<Assignment> {
        val rows = JSONObject(json).optJSONArray("assignments") ?: return emptyList()
        val out = ArrayList<Assignment>()
        for (i in 0 until rows.length()) {
            val a = rows.optJSONObject(i) ?: continue
            val id = a.optString("id", "").trim()
            val status = a.optString("status", "").trim()
            if (id.isEmpty() || status.isEmpty()) continue
            val campaign = a.optJSONObject("campaign")
            val pkg = campaign?.optString("package", "")?.trim().orEmpty()
            val name = campaign?.optString("appName", "")?.trim().orEmpty().ifEmpty { pkg }.take(80)
            val open = if (a.isNull("openCheckin")) null else (a.opt("openCheckin") as? Number)?.toInt()
            val filed = HashSet<Int>()
            a.optJSONArray("filedDays")?.let { days ->
                for (j in 0 until days.length()) (days.opt(j) as? Number)?.let { filed.add(it.toInt()) }
            }
            out.add(Assignment(id, status, name, pkg, open, filed))
        }
        return out
    }

    /** Valid packages of the tester's `active` tests, sorted and without duplicates. */
    fun activePackages(assignments: List<Assignment>): List<String> =
        assignments.asSequence()
            .filter { it.status == "active" && isValidPackageName(it.packageName) }
            .map { it.packageName }
            .distinct().sorted().toList()

    /** Body list for `POST /api/app/installs`: active-test packages that are installed. */
    fun installsReport(assignments: List<Assignment>, installed: Set<String>): List<String> =
        activePackages(assignments).filter { it in installed }

    enum class NoticeKind { CHECKIN, INVITED, NOT_INSTALLED }

    data class Notice(
        val key: String,
        val kind: NoticeKind,
        val assignmentId: String,
        val appName: String,
        val day: Int? = null,
    )

    /**
     * [post]: reminders to show now. [current]: keys of every reminder whose
     * condition holds right now (whether or not it is shown again).
     */
    data class NoticePlan(val post: List<Notice>, val current: Set<String>) {
        /**
         * Keys to store for next time: ones already shown that still apply, plus
         * the ones just posted. Dropping keys whose condition has ended keeps the
         * set small and lets a reminder come back if its condition returns (for
         * example the app is uninstalled again).
         */
        fun remember(alreadyNotified: Set<String>, posted: Collection<String>): Set<String> =
            alreadyNotified.intersect(current) + posted
    }

    /**
     * Decides which reminders to post from the tester's assignments:
     * - an `active` test with an open check-in window that is not filed yet;
     * - an `invited` test (the tester has to join, install and press Started);
     * - an `active` test whose app is not installed on this phone.
     * A reminder whose key is in [alreadyNotified] is not repeated.
     */
    fun planNotices(
        assignments: List<Assignment>,
        installed: Set<String>,
        alreadyNotified: Set<String>,
    ): NoticePlan {
        val all = ArrayList<Notice>()
        for (a in assignments) {
            when (a.status) {
                "active" -> {
                    val day = a.openCheckin
                    if (day != null && day !in a.filedDays) {
                        all.add(Notice("checkin:${a.id}:$day", NoticeKind.CHECKIN, a.id, a.appName, day))
                    }
                    if (isValidPackageName(a.packageName) && a.packageName !in installed) {
                        all.add(Notice("missing:${a.id}", NoticeKind.NOT_INSTALLED, a.id, a.appName))
                    }
                }
                "invited" -> all.add(Notice("invited:${a.id}", NoticeKind.INVITED, a.id, a.appName))
            }
        }
        val current = all.mapTo(LinkedHashSet()) { it.key }
        return NoticePlan(all.filter { it.key !in alreadyNotified }, current)
    }
}
