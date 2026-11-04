package com.amniscient.amnitest

import java.net.URLDecoder

/**
 * Pure logic with no Android dependencies, so it can be unit tested on a plain JVM.
 */
internal object AmniTestLogic {

    /** Referrer parameter that carries the claim code: `amnitest=AT-XXXX-XXXX`. */
    const val REFERRER_KEY = "amnitest"

    const val DAY_MS = 86_400_000L

    private val CODE_BODY = Regex("^[A-Z2-9]{8}$")

    /**
     * Normalises a claim code the same way the server does: upper case, drop
     * everything that is not A-Z or 0-9, drop a leading "AT", then require eight
     * characters from A-Z / 2-9. Returns `AT-XXXX-XXXX`, or null if invalid.
     */
    fun normalizeCode(raw: String?): String? {
        if (raw == null) return null
        val s = buildString(raw.length) {
            for (c in raw.uppercase()) {
                if (c in 'A'..'Z' || c in '0'..'9') append(c)
            }
        }
        val body = if (s.startsWith("AT")) s.substring(2) else s
        if (!CODE_BODY.matches(body)) return null
        return "AT-" + body.substring(0, 4) + "-" + body.substring(4)
    }

    /**
     * Extracts and normalises the claim code from a Play Install Referrer string.
     * The referrer may be `amnitest=CODE`, URL-encoded (`amnitest%3DCODE`), or one
     * of several `&`-separated parameters. Returns null if there is no valid code.
     */
    fun parseReferrer(referrer: String?): String? {
        if (referrer.isNullOrBlank()) return null
        findCode(referrer)?.let { return it }
        // The whole string may have been URL-encoded once (or twice) more.
        var current: String = referrer
        repeat(2) {
            val decoded = urlDecode(current) ?: return null
            if (decoded == current) return null
            findCode(decoded)?.let { return it }
            current = decoded
        }
        return null
    }

    private fun findCode(query: String): String? {
        for (part in query.trim().trimStart('?').split('&')) {
            val eq = part.indexOf('=')
            if (eq <= 0) continue
            val key = (urlDecode(part.substring(0, eq)) ?: part.substring(0, eq)).trim()
            if (!key.equals(REFERRER_KEY, ignoreCase = true)) continue
            val rawValue = part.substring(eq + 1)
            val value = urlDecode(rawValue) ?: rawValue
            normalizeCode(value)?.let { return it }
        }
        return null
    }

    /** URL-decodes, or returns null if the input is malformed. */
    fun urlDecode(s: String): String? = try {
        URLDecoder.decode(s, "UTF-8")
    } catch (e: Exception) {
        null
    }

    /** Days since 1970-01-01 in UTC for the given epoch milliseconds. */
    fun utcEpochDay(epochMillis: Long): Long = epochMillis.floorDiv(DAY_MS)

    /**
     * True if a ping is due: the last successful ping was on a different UTC
     * calendar day (or never; pass a negative [lastPingDay] for "never").
     */
    fun shouldPing(lastPingDay: Long, nowMillis: Long): Boolean =
        lastPingDay < 0 || lastPingDay != utcEpochDay(nowMillis)

    /** Trims whitespace and trailing slashes; returns null if not an http(s) URL. */
    fun normalizeBaseUrl(raw: String?): String? {
        val s = raw?.trim()?.trimEnd('/') ?: return null
        val lower = s.lowercase()
        if (!lower.startsWith("https://") && !lower.startsWith("http://")) return null
        if (s.length <= lower.indexOf("//") + 2) return null
        return s
    }

    /**
     * True if an HTTP status means the server has definitively refused the
     * request (retrying the same request will not help). 408 and 429 are
     * treated as transient, as are 5xx and network failures (status <= 0).
     */
    fun isDefinitiveFailure(status: Int): Boolean =
        status in 400..499 && status != 408 && status != 429

    /** Escapes a string for inclusion in a JSON string literal. */
    fun jsonString(value: String): String = buildString(value.length + 2) {
        append('"')
        for (c in value) {
            when (c) {
                '"' -> append("\\\"")
                '\\' -> append("\\\\")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                '\b' -> append("\\b")
                '\u000C' -> append("\\f")
                else -> if (c < ' ' || c == ' ' || c == ' ') {
                    append("\\u").append(Integer.toHexString(c.code).padStart(4, '0'))
                } else {
                    append(c)
                }
            }
        }
        append('"')
    }

    /** Builds a flat JSON object from string fields, in the given order. */
    fun jsonObject(vararg fields: Pair<String, String>): String =
        fields.joinToString(separator = ",", prefix = "{", postfix = "}") { (k, v) ->
            jsonString(k) + ":" + jsonString(v)
        }
}
