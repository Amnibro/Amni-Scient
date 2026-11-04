package com.amniscient.amnitest

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AmniTestLogicTest {

    // ---------------------------------------------------------- normalizeCode

    @Test
    fun normalizeCode_acceptsCanonicalForm() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("AT-AB2C-D3EF"))
    }

    @Test
    fun normalizeCode_isCaseInsensitive() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("at-ab2c-d3ef"))
    }

    @Test
    fun normalizeCode_acceptsWithoutDashesOrWithSpaces() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("ATAB2CD3EF"))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("  at ab2c d3ef "))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("AT AB2C-D3EF\n"))
    }

    @Test
    fun normalizeCode_acceptsBodyWithoutPrefix() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.normalizeCode("AB2C-D3EF"))
        assertEquals("AT-WXYZ-2345", AmniTestLogic.normalizeCode("wxyz2345"))
    }

    @Test
    fun normalizeCode_rejectsInvalid() {
        assertNull(AmniTestLogic.normalizeCode(null))
        assertNull(AmniTestLogic.normalizeCode(""))
        assertNull(AmniTestLogic.normalizeCode("AT-"))
        assertNull(AmniTestLogic.normalizeCode("AT-ABCD-EFG"))     // too short
        assertNull(AmniTestLogic.normalizeCode("AT-ABCD-EFGHI"))   // too long
        assertNull(AmniTestLogic.normalizeCode("AT-AB0C-D3EF"))    // 0 not allowed
        assertNull(AmniTestLogic.normalizeCode("AT-AB1C-D3EF"))    // 1 not allowed
        assertNull(AmniTestLogic.normalizeCode("hello world"))
    }

    @Test
    fun normalizeCode_matchesServerPrefixRule() {
        // The server strips a leading "AT" before checking the 8-character body,
        // so an 8-character body that itself starts with AT is not accepted bare.
        assertNull(AmniTestLogic.normalizeCode("ATXY2345"))
        assertEquals("AT-ATXY-2345", AmniTestLogic.normalizeCode("AT-ATXY-2345"))
    }

    // --------------------------------------------------------- parseReferrer

    @Test
    fun parseReferrer_plain() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest=AT-AB2C-D3EF"))
    }

    @Test
    fun parseReferrer_lowercaseCode() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest=at-ab2c-d3ef"))
    }

    @Test
    fun parseReferrer_wholeStringUrlEncoded() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest%3DAT-AB2C-D3EF"))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest%3dAT-AB2C-D3EF"))
    }

    @Test
    fun parseReferrer_doubleEncoded() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest%253DAT-AB2C-D3EF"))
    }

    @Test
    fun parseReferrer_amongOtherParams() {
        assertEquals(
            "AT-AB2C-D3EF",
            AmniTestLogic.parseReferrer("utm_source=google-play&amnitest=AT-AB2C-D3EF&utm_medium=organic"),
        )
        assertEquals(
            "AT-AB2C-D3EF",
            AmniTestLogic.parseReferrer("utm_source%3Dx%26amnitest%3DAT-AB2C-D3EF"),
        )
    }

    @Test
    fun parseReferrer_valueEncodedAndKeyCaseInsensitive() {
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("AmniTest=AT%2DAB2C%2DD3EF"))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("amnitest=AT+AB2C+D3EF"))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("?amnitest=ATAB2CD3EF"))
    }

    @Test
    fun parseReferrer_noCode() {
        assertNull(AmniTestLogic.parseReferrer(null))
        assertNull(AmniTestLogic.parseReferrer(""))
        assertNull(AmniTestLogic.parseReferrer("utm_source=google-play&utm_medium=organic"))
        assertNull(AmniTestLogic.parseReferrer("amnitest="))
        assertNull(AmniTestLogic.parseReferrer("amnitest=nope-1"))
        assertNull(AmniTestLogic.parseReferrer("xamnitest=AT-AB2C-D3EF"))
        assertNull(AmniTestLogic.parseReferrer("AT-AB2C-D3EF"))
    }

    @Test
    fun parseReferrer_malformedPercentDoesNotThrow() {
        assertNull(AmniTestLogic.parseReferrer("utm=%ZZ&foo=%"))
        assertEquals("AT-AB2C-D3EF", AmniTestLogic.parseReferrer("bad=%ZZ&amnitest=AT-AB2C-D3EF"))
    }

    @Test
    fun parseReferrer_firstValidCodeWins() {
        assertEquals(
            "AT-WXYZ-2345",
            AmniTestLogic.parseReferrer("amnitest=junk&amnitest=AT-WXYZ-2345&amnitest=AT-AB2C-D3EF"),
        )
    }

    // ------------------------------------------------------------- UTC days

    @Test
    fun utcEpochDay_boundaries() {
        // 2026-11-04T00:00:00Z = 1_793_750_400_000 ms = epoch day 20_761
        val midnight = 1_793_750_400_000L
        assertEquals(20_761L, AmniTestLogic.utcEpochDay(midnight))
        assertEquals(20_760L, AmniTestLogic.utcEpochDay(midnight - 1))
        assertEquals(20_761L, AmniTestLogic.utcEpochDay(midnight + AmniTestLogic.DAY_MS - 1))
        assertEquals(20_762L, AmniTestLogic.utcEpochDay(midnight + AmniTestLogic.DAY_MS))
        assertEquals(0L, AmniTestLogic.utcEpochDay(0L))
        assertEquals(-1L, AmniTestLogic.utcEpochDay(-1L))
    }

    @Test
    fun utcEpochDay_matchesJavaTime() {
        val millis = 1_793_799_999_123L
        val expected = java.time.Instant.ofEpochMilli(millis)
            .atZone(java.time.ZoneOffset.UTC).toLocalDate().toEpochDay()
        assertEquals(expected, AmniTestLogic.utcEpochDay(millis))
    }

    @Test
    fun shouldPing_oncePerUtcDay() {
        val midnight = 1_793_750_400_000L
        val today = AmniTestLogic.utcEpochDay(midnight)
        assertTrue(AmniTestLogic.shouldPing(-1L, midnight))                     // never pinged
        assertFalse(AmniTestLogic.shouldPing(today, midnight))                  // same day
        assertFalse(AmniTestLogic.shouldPing(today, midnight + 86_399_999L))    // 23:59:59.999
        assertTrue(AmniTestLogic.shouldPing(today, midnight + 86_400_000L))     // next day
        assertTrue(AmniTestLogic.shouldPing(today - 1, midnight))               // yesterday
        assertTrue(AmniTestLogic.shouldPing(today + 1, midnight))               // clock went back
    }

    // ------------------------------------------------------------------ misc

    @Test
    fun normalizeBaseUrl() {
        assertEquals(
            "https://amni-test.amnibro7.workers.dev",
            AmniTestLogic.normalizeBaseUrl(" https://amni-test.amnibro7.workers.dev/ "),
        )
        assertEquals("http://10.0.2.2:8787", AmniTestLogic.normalizeBaseUrl("http://10.0.2.2:8787//"))
        assertNull(AmniTestLogic.normalizeBaseUrl("ftp://example.com"))
        assertNull(AmniTestLogic.normalizeBaseUrl("example.com"))
        assertNull(AmniTestLogic.normalizeBaseUrl("https://"))
        assertNull(AmniTestLogic.normalizeBaseUrl(null))
    }

    @Test
    fun isDefinitiveFailure() {
        assertTrue(AmniTestLogic.isDefinitiveFailure(400))
        assertTrue(AmniTestLogic.isDefinitiveFailure(403))
        assertTrue(AmniTestLogic.isDefinitiveFailure(404))
        assertTrue(AmniTestLogic.isDefinitiveFailure(409))
        assertFalse(AmniTestLogic.isDefinitiveFailure(408))
        assertFalse(AmniTestLogic.isDefinitiveFailure(429))
        assertFalse(AmniTestLogic.isDefinitiveFailure(500))
        assertFalse(AmniTestLogic.isDefinitiveFailure(503))
        assertFalse(AmniTestLogic.isDefinitiveFailure(0))
        assertFalse(AmniTestLogic.isDefinitiveFailure(-1))
        assertFalse(AmniTestLogic.isDefinitiveFailure(200))
    }

    @Test
    fun jsonObject_escapes() {
        assertEquals(
            "{\"key\":\"k\\\"1\\\\\",\"package\":\"com.example.app\",\"installId\":\"a\\nb\\u0001\"}",
            AmniTestLogic.jsonObject(
                "key" to "k\"1\\",
                "package" to "com.example.app",
                "installId" to "a\nb\u0001",
            ),
        )
        assertEquals("{}", AmniTestLogic.jsonObject())
    }
}
