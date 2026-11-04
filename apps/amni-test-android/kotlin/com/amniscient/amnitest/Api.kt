package com.amniscient.amnitest

import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/** A non-2xx answer. [message] is the API's `{ error }` text when it sent one. */
class ApiException(val status: Int, message: String) : IOException(message)

/**
 * Blocking JSON client for the Amni-Test Worker. Call it off the main thread.
 * Errors: [ApiException] for HTTP errors, [IOException] for network failures.
 */
class Api(private val base: String = BuildConfig.API_URL) {

    fun get(path: String, token: String? = null): JSONObject = request("GET", path, null, token)

    fun post(path: String, body: JSONObject = JSONObject(), token: String? = null): JSONObject =
        request("POST", path, body, token)

    private fun request(method: String, path: String, body: JSONObject?, token: String?): JSONObject {
        val conn = Http.open(base.trimEnd('/') + path)
        try {
            conn.requestMethod = method
            conn.setRequestProperty("Accept", "application/json")
            if (token != null) conn.setRequestProperty("Authorization", "Bearer $token")
            if (body != null) {
                val bytes = body.toString().toByteArray(Charsets.UTF_8)
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json")
                conn.setFixedLengthStreamingMode(bytes.size)
                conn.outputStream.use { it.write(bytes) }
            }
            val status = conn.responseCode
            val text = Http.readText(if (status in 200..299) conn.inputStream else conn.errorStream)
            val json = try {
                if (text.isBlank()) JSONObject() else JSONObject(text)
            } catch (e: JSONException) {
                if (status in 200..299) throw IOException("Unexpected response from the server")
                JSONObject()
            }
            if (status !in 200..299) {
                throw ApiException(status, json.optString("error", "").ifBlank { "HTTP $status" })
            }
            return json
        } finally {
            conn.disconnect()
        }
    }
}

object Http {
    private const val MAX_BYTES = 1_000_000

    fun open(url: String): HttpURLConnection {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.connectTimeout = 15_000
        conn.readTimeout = 20_000
        conn.instanceFollowRedirects = true
        conn.useCaches = false
        conn.setRequestProperty("User-Agent", "AmniTestApp/${BuildConfig.VERSION_NAME} (Android)")
        return conn
    }

    /** GET [url] as text; null for a non-2xx answer (e.g. a missing file). */
    fun getTextOrNull(url: String): String? {
        val conn = open(url)
        try {
            if (conn.responseCode !in 200..299) return null
            return readText(conn.inputStream)
        } finally {
            conn.disconnect()
        }
    }

    fun readText(stream: InputStream?): String {
        if (stream == null) return ""
        stream.use { input ->
            val bytes = input.readNBytesCompat(MAX_BYTES)
            return String(bytes, Charsets.UTF_8)
        }
    }

    private fun InputStream.readNBytesCompat(limit: Int): ByteArray {
        val out = java.io.ByteArrayOutputStream()
        val buf = ByteArray(8192)
        while (out.size() < limit) {
            val n = read(buf, 0, minOf(buf.size, limit - out.size()))
            if (n < 0) break
            out.write(buf, 0, n)
        }
        return out.toByteArray()
    }
}
