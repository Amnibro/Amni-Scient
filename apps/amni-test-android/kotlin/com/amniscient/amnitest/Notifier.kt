package com.amniscient.amnitest

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/** Check-in reminders on the "Check-ins" channel. */
object Notifier {
    const val CHANNEL_ID = "checkins"

    fun createChannel(context: Context) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            context.getString(R.string.channel_checkins),
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply { description = context.getString(R.string.channel_checkins_description) }
        context.getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }

    /** Posts [notices]; returns the keys actually posted (none when notifications are off). */
    fun post(context: Context, notices: List<AppLogic.Notice>): List<String> {
        if (notices.isEmpty()) return emptyList()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) return emptyList()
        val manager = NotificationManagerCompat.from(context)
        if (!manager.areNotificationsEnabled()) return emptyList()

        val open = Intent(context, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val tap = PendingIntent.getActivity(
            context, 0, open, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val posted = ArrayList<String>()
        for (n in notices) {
            val (title, text) = texts(context, n)
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_amni)
                .setColor(ContextCompat.getColor(context, R.color.gold))
                .setContentTitle(title)
                .setContentText(text)
                .setStyle(NotificationCompat.BigTextStyle().bigText(text))
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(tap)
                .setAutoCancel(true)
                .build()
            try {
                manager.notify(n.key.hashCode(), notification)
                posted.add(n.key)
            } catch (e: SecurityException) {
                // Permission revoked between the check and the post.
            }
        }
        return posted
    }

    private fun texts(context: Context, n: AppLogic.Notice): Pair<String, String> = when (n.kind) {
        AppLogic.NoticeKind.CHECKIN -> Pair(
            context.getString(R.string.notif_checkin_title, n.day ?: 0, n.appName),
            context.getString(R.string.notif_checkin_text),
        )
        AppLogic.NoticeKind.INVITED -> Pair(
            context.getString(R.string.notif_invited_title, n.appName),
            context.getString(R.string.notif_invited_text),
        )
        AppLogic.NoticeKind.NOT_INSTALLED -> Pair(
            context.getString(R.string.notif_missing_title, n.appName),
            context.getString(R.string.notif_missing_text),
        )
    }
}
