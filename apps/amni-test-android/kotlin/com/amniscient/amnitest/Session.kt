package com.amniscient.amnitest

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit

/**
 * The Amni-Test session token and small bits of app state, in private
 * SharedPreferences. The file is excluded from backup and device transfer
 * (res/xml/data_extraction_rules.xml, allowBackup=false).
 */
object Session {
    private const val PREFS = "amni_session"
    private const val KEY_TOKEN = "token"
    private const val KEY_NOTIFIED = "notified"
    private const val KEY_NOTIF_PROMPTED = "notif_prompted"

    private fun prefs(context: Context): SharedPreferences =
        context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun token(context: Context): String? =
        prefs(context).getString(KEY_TOKEN, null)?.takeIf { it.isNotBlank() }

    fun setToken(context: Context, token: String) =
        prefs(context).edit { putString(KEY_TOKEN, token) }

    /** Forgets the token and the reminders already shown. */
    fun clear(context: Context) = prefs(context).edit {
        remove(KEY_TOKEN)
        remove(KEY_NOTIFIED)
    }

    fun notifiedKeys(context: Context): Set<String> =
        prefs(context).getStringSet(KEY_NOTIFIED, null)?.toSet() ?: emptySet()

    fun setNotifiedKeys(context: Context, keys: Set<String>) =
        prefs(context).edit { putStringSet(KEY_NOTIFIED, HashSet(keys)) }

    fun notificationPrompted(context: Context): Boolean =
        prefs(context).getBoolean(KEY_NOTIF_PROMPTED, false)

    fun setNotificationPrompted(context: Context) =
        prefs(context).edit { putBoolean(KEY_NOTIF_PROMPTED, true) }
}
