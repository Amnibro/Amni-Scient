package com.amniscient.amnitest

import com.amniscient.amnitest.AppLogic.Navigation
import com.amniscient.amnitest.AppLogic.NoticeKind
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AppLogicTest {

    private val site = "https://amni-scient.com"

    // ---------------------------------------------------------------- bridge input

    @Test
    fun packageNames() {
        assertTrue(AppLogic.isValidPackageName("com.example.app"))
        assertTrue(AppLogic.isValidPackageName("a.b"))
        assertTrue(AppLogic.isValidPackageName("com.Example_1.app2"))
        assertFalse(AppLogic.isValidPackageName("single"))
        assertFalse(AppLogic.isValidPackageName("com..app"))
        assertFalse(AppLogic.isValidPackageName(".com.app"))
        assertFalse(AppLogic.isValidPackageName("com.app."))
        assertFalse(AppLogic.isValidPackageName("1com.app"))
        assertFalse(AppLogic.isValidPackageName("com.1app"))
        assertFalse(AppLogic.isValidPackageName("com.app-x"))
        assertFalse(AppLogic.isValidPackageName("com.app x"))
        assertFalse(AppLogic.isValidPackageName("com.app\n"))
        assertFalse(AppLogic.isValidPackageName(""))
        assertFalse(AppLogic.isValidPackageName("a." + "b".repeat(300)))
    }

    @Test
    fun packageListAcceptsValidArraysAndDropsDuplicates() {
        assertEquals(listOf("com.a.b", "org.c"), AppLogic.parsePackageList("""["com.a.b","org.c","com.a.b"]"""))
        assertEquals(emptyList<String>(), AppLogic.parsePackageList("[]"))
        val fifty = (1..50).joinToString(",", "[", "]") { "\"com.app.p$it\"" }
        assertEquals(50, AppLogic.parsePackageList(fifty)!!.size)
    }

    @Test
    fun packageListRejectsBadInput() {
        assertNull(AppLogic.parsePackageList(null))
        assertNull(AppLogic.parsePackageList(""))
        assertNull(AppLogic.parsePackageList("com.a.b"))
        assertNull(AppLogic.parsePackageList("""{"a":1}"""))
        assertNull(AppLogic.parsePackageList("""["com.a.b", 3]"""))
        assertNull(AppLogic.parsePackageList("""["com.a.b", null]"""))
        assertNull(AppLogic.parsePackageList("""["com.a.b", ["x.y"]]"""))
        assertNull(AppLogic.parsePackageList("""["../etc/passwd"]"""))
        val fiftyOne = (1..51).joinToString(",", "[", "]") { "\"com.app.p$it\"" }
        assertNull(AppLogic.parsePackageList(fiftyOne))
        assertNull(AppLogic.parsePackageList("[\"" + "a.b".repeat(10_000) + "\"]"))
    }

    @Test
    fun installedJsonMapsPackagesToVersionCodes() {
        val o = JSONObject(AppLogic.installedJson(linkedMapOf("com.a.b" to 42L, "org.c.d" to 0L)))
        assertEquals(42L, o.getLong("com.a.b"))
        assertEquals(0L, o.getLong("org.c.d"))
        assertEquals(2, o.length())
    }

    @Test
    fun hapticKinds() {
        assertEquals(AppLogic.Haptic.LIGHT, AppLogic.parseHaptic("light"))
        assertEquals(AppLogic.Haptic.SUCCESS, AppLogic.parseHaptic(" Success "))
        assertEquals(AppLogic.Haptic.WARNING, AppLogic.parseHaptic("warning"))
        assertNull(AppLogic.parseHaptic("heavy"))
        assertNull(AppLogic.parseHaptic(null))
    }

    @Test
    fun shareText() {
        assertNull(AppLogic.shareText(null))
        assertNull(AppLogic.shareText("   "))
        assertEquals("hi", AppLogic.shareText(" hi "))
        assertEquals(AppLogic.MAX_SHARE_LENGTH, AppLogic.shareText("x".repeat(10_000))!!.length)
    }

    // ---------------------------------------------------------------- origin check

    @Test
    fun originsNormalise() {
        assertEquals("https://amni-scient.com:443", AppLogic.originOf("https://amni-scient.com"))
        assertEquals("https://amni-scient.com:443", AppLogic.originOf("HTTPS://Amni-Scient.COM:443/test/town/?app=1#x"))
        assertEquals("http://10.0.2.2:8080", AppLogic.originOf("http://10.0.2.2:8080/test/town/"))
        assertNull(AppLogic.originOf("file:///android_asset/x.html"))
        assertNull(AppLogic.originOf("javascript:alert(1)"))
        assertNull(AppLogic.originOf("about:blank"))
        assertNull(AppLogic.originOf("data:text/html,hi"))
        assertNull(AppLogic.originOf(null))
        assertNull(AppLogic.originOf("not a url"))
    }

    @Test
    fun sameOriginOnlyForTheSite() {
        assertTrue(AppLogic.sameOrigin("https://amni-scient.com/test/town/?app=1", site))
        assertTrue(AppLogic.sameOrigin("https://amni-scient.com:443/other", site))
        assertTrue(AppLogic.sameOrigin("https://amni-scient.com/", "https://amni-scient.com/"))
        assertFalse(AppLogic.sameOrigin("http://amni-scient.com/test/town/", site))
        assertFalse(AppLogic.sameOrigin("https://www.amni-scient.com/test/", site))
        assertFalse(AppLogic.sameOrigin("https://amni-scient.com.evil.example/", site))
        assertFalse(AppLogic.sameOrigin("https://amni-scient.com@evil.example/", site))
        assertFalse(AppLogic.sameOrigin("https://evil.example/?https://amni-scient.com", site))
        assertFalse(AppLogic.sameOrigin("https://amni-scient.com:8443/", site))
        assertFalse(AppLogic.sameOrigin("javascript:fetch('https://amni-scient.com')", site))
        assertFalse(AppLogic.sameOrigin(null, site))
        assertFalse(AppLogic.sameOrigin("", site))
        // Debug build against local servers.
        assertTrue(AppLogic.sameOrigin("http://10.0.2.2:8080/test/town/?app=1", "http://10.0.2.2:8080"))
        assertFalse(AppLogic.sameOrigin("http://10.0.2.2:8787/api", "http://10.0.2.2:8080"))
    }

    @Test
    fun navigationRules() {
        assertEquals(Navigation.IN_APP, AppLogic.classifyNavigation("https://amni-scient.com/test/app.html", site))
        assertEquals(Navigation.EXTERNAL, AppLogic.classifyNavigation("https://play.google.com/apps/testing/com.a.b", site))
        assertEquals(Navigation.EXTERNAL, AppLogic.classifyNavigation("https://example.com/", site))
        assertEquals(Navigation.EXTERNAL, AppLogic.classifyNavigation("http://amni-scient.com/", site))
        assertEquals(Navigation.EXTERNAL, AppLogic.classifyNavigation("market://details?id=com.a.b", site))
        assertEquals(Navigation.EXTERNAL, AppLogic.classifyNavigation("mailto:help@amni-scient.com", site))
        assertEquals(Navigation.BLOCKED, AppLogic.classifyNavigation("intent://x#Intent;scheme=http;end", site))
        assertEquals(Navigation.BLOCKED, AppLogic.classifyNavigation("file:///sdcard/x", site))
        assertEquals(Navigation.BLOCKED, AppLogic.classifyNavigation("javascript:alert(1)", site))
        assertEquals(Navigation.BLOCKED, AppLogic.classifyNavigation(null, site))
    }

    @Test
    fun playStoreUrls() {
        assertTrue(AppLogic.isPlayStoreUrl("https://play.google.com/store/apps/details?id=com.a.b&referrer=amnitest%3DX"))
        assertFalse(AppLogic.isPlayStoreUrl("https://play.google.com.evil.example/store"))
        assertFalse(AppLogic.isPlayStoreUrl("https://example.com/play.google.com"))
        assertTrue(AppLogic.isWebUrl("https://example.com"))
        assertFalse(AppLogic.isWebUrl("ftp://example.com"))
    }

    @Test
    fun siteUrls() {
        assertEquals("https://amni-scient.com/test/town/?app=1", AppLogic.townUrl("https://amni-scient.com/"))
        assertEquals("http://10.0.2.2:8080/test/app/latest.json", AppLogic.latestJsonUrl("http://10.0.2.2:8080"))
        assertEquals("https://amni-scient.com/test/terms.html", AppLogic.termsUrl(site))
        assertEquals("https://amni-scient.com/test/privacy.html", AppLogic.privacyUrl(site))
    }

    // ---------------------------------------------------------------- updates

    @Test
    fun updateVersionComparison() {
        val u = AppLogic.parseUpdate(
            """{"versionCode": 3, "versionName": "0.3.0", "url": "https://amni-scient.com/test/app/amni-test-0.3.0.apk"}""",
            site,
        )!!
        assertEquals(3L, u.versionCode)
        assertEquals("0.3.0", u.versionName)
        assertTrue(AppLogic.isNewer(u, 2))
        assertFalse(AppLogic.isNewer(u, 3))
        assertFalse(AppLogic.isNewer(u, 4))
        assertFalse(AppLogic.isNewer(null, 1))
    }

    @Test
    fun updateParsingIsTolerant() {
        assertEquals(7L, AppLogic.parseUpdate("""{"versionCode":"7","url":"https://x.example/a.apk"}""", site)!!.versionCode)
        assertEquals("7", AppLogic.parseUpdate("""{"versionCode":7,"url":"https://x.example/a.apk"}""", site)!!.versionName)
        assertNull(AppLogic.parseUpdate(null, site))
        assertNull(AppLogic.parseUpdate("", site))
        assertNull(AppLogic.parseUpdate("<html>404</html>", site))
        assertNull(AppLogic.parseUpdate("""{"versionName":"1.0","url":"https://x.example/a.apk"}""", site))
        assertNull(AppLogic.parseUpdate("""{"versionCode":0,"url":"https://x.example/a.apk"}""", site))
        assertNull(AppLogic.parseUpdate("""{"versionCode":"abc","url":"https://x.example/a.apk"}""", site))
        assertNull(AppLogic.parseUpdate("""{"versionCode":5}""", site))
        assertNull(AppLogic.parseUpdate("""{"versionCode":5,"url":"javascript:alert(1)"}""", site))
        // Plain http only on the site's own origin (local testing).
        assertNull(AppLogic.parseUpdate("""{"versionCode":5,"url":"http://x.example/a.apk"}""", site))
        val local = "http://10.0.2.2:8080"
        assertEquals(5L, AppLogic.parseUpdate("""{"versionCode":5,"url":"http://10.0.2.2:8080/test/app/a.apk"}""", local)!!.versionCode)
    }

    // ---------------------------------------------------------------- assignments & reminders

    private fun assignment(
        id: Int,
        status: String,
        pkg: String,
        app: String = "App $id",
        openCheckin: Int? = null,
        filed: List<Int> = emptyList(),
    ): String = """
        {"id": $id, "status": "$status", "day": 7, "filedDays": ${filed.joinToString(",", "[", "]")},
         "openCheckin": ${openCheckin ?: "null"}, "nextCheckin": null,
         "campaign": {"id": 9, "appName": "$app", "package": "$pkg", "verification": "sdk"},
         "links": {"optIn": "https://play.google.com/apps/testing/$pkg"}}
    """.trimIndent()

    private fun parse(vararg rows: String) =
        AppLogic.parseAssignments("""{"assignments": [${rows.joinToString(",")}]}""")

    @Test
    fun parsesAssignments() {
        val list = parse(
            assignment(1, "active", "com.a.one", "One", openCheckin = 7, filed = listOf(1)),
            """{"status":"active"}""",
            """"not an object"""",
            assignment(2, "invited", "com.a.two", ""),
        )
        assertEquals(2, list.size)
        assertEquals("1", list[0].id)
        assertEquals("One", list[0].appName)
        assertEquals(7, list[0].openCheckin)
        assertEquals(setOf(1), list[0].filedDays)
        assertEquals("com.a.two", list[1].appName) // falls back to the package name
        assertNull(list[1].openCheckin)
        assertEquals(emptyList<AppLogic.Assignment>(), AppLogic.parseAssignments("{}"))
    }

    @Test
    fun remindersForOpenCheckinsInvitesAndMissingApps() {
        val list = parse(
            assignment(1, "active", "com.a.one", "One", openCheckin = 7),
            assignment(2, "invited", "com.a.two", "Two"),
            assignment(3, "active", "com.a.three", "Three"),
            assignment(4, "accepted", "com.a.four", "Four"),
            assignment(5, "completed", "com.a.five", "Five", openCheckin = 14),
            assignment(6, "active", "com.a.six", "Six", openCheckin = 14, filed = listOf(1, 7, 14)),
        )
        val installed = setOf("com.a.one", "com.a.six")
        val plan = AppLogic.planNotices(list, installed, emptySet())
        val byKey = plan.post.associateBy { it.key }
        assertEquals(setOf("checkin:1:7", "invited:2", "missing:3"), byKey.keys)
        assertEquals(NoticeKind.CHECKIN, byKey["checkin:1:7"]!!.kind)
        assertEquals(7, byKey["checkin:1:7"]!!.day)
        assertEquals("One", byKey["checkin:1:7"]!!.appName)
        assertEquals(NoticeKind.INVITED, byKey["invited:2"]!!.kind)
        assertEquals(NoticeKind.NOT_INSTALLED, byKey["missing:3"]!!.kind)
        assertEquals(plan.post.map { it.key }.toSet(), plan.current)
    }

    @Test
    fun remindersAreNotRepeated() {
        val list = parse(
            assignment(1, "active", "com.a.one", openCheckin = 7),
            assignment(2, "invited", "com.a.two"),
        )
        val first = AppLogic.planNotices(list, setOf("com.a.one"), emptySet())
        val stored = first.remember(emptySet(), first.post.map { it.key })
        assertEquals(setOf("checkin:1:7", "invited:2"), stored)

        val second = AppLogic.planNotices(list, setOf("com.a.one"), stored)
        assertTrue(second.post.isEmpty())
        assertEquals(stored, second.remember(stored, emptyList()))
    }

    @Test
    fun nextCheckinWindowIsANewReminder() {
        val day7 = parse(assignment(1, "active", "com.a.one", openCheckin = 7, filed = listOf(1)))
        val stored = setOf("checkin:1:7")
        val day14 = parse(assignment(1, "active", "com.a.one", openCheckin = 14, filed = listOf(1, 7)))
        assertTrue(AppLogic.planNotices(day7, setOf("com.a.one"), stored).post.isEmpty())
        val plan = AppLogic.planNotices(day14, setOf("com.a.one"), stored)
        assertEquals(listOf("checkin:1:14"), plan.post.map { it.key })
        // The day-7 key no longer applies and is dropped.
        assertEquals(setOf("checkin:1:14"), plan.remember(stored, plan.post.map { it.key }))
    }

    @Test
    fun missingAppReminderReturnsAfterReinstallAndUninstall() {
        val list = parse(assignment(3, "active", "com.a.three"))
        val missing = AppLogic.planNotices(list, emptySet(), emptySet())
        var stored = missing.remember(emptySet(), missing.post.map { it.key })
        assertEquals(setOf("missing:3"), stored)

        val back = AppLogic.planNotices(list, setOf("com.a.three"), stored)
        assertTrue(back.post.isEmpty())
        stored = back.remember(stored, emptyList())
        assertTrue(stored.isEmpty())

        val goneAgain = AppLogic.planNotices(list, emptySet(), stored)
        assertEquals(listOf("missing:3"), goneAgain.post.map { it.key })
    }

    @Test
    fun unpostedRemindersAreNotRemembered() {
        // Notifications off: nothing posted, so nothing is stored and they show once allowed.
        val list = parse(assignment(2, "invited", "com.a.two"))
        val plan = AppLogic.planNotices(list, emptySet(), emptySet())
        assertTrue(plan.remember(emptySet(), emptyList()).isEmpty())
    }

    @Test
    fun installsReportListsInstalledActivePackagesOnly() {
        val list = parse(
            assignment(1, "active", "com.a.one"),
            assignment(2, "active", "com.a.two"),
            assignment(3, "invited", "com.a.three"),
            assignment(4, "active", "bad package"),
            assignment(5, "active", "com.a.one"),
        )
        assertEquals(listOf("com.a.one", "com.a.two"), AppLogic.activePackages(list))
        assertEquals(
            listOf("com.a.one"),
            AppLogic.installsReport(list, setOf("com.a.one", "com.a.three", "bad package")),
        )
        // A test with an invalid package never triggers a "not installed" reminder.
        val plan = AppLogic.planNotices(parse(assignment(4, "active", "bad package")), emptySet(), emptySet())
        assertTrue(plan.post.isEmpty())
    }
}
