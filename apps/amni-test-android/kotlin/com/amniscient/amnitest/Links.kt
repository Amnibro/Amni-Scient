package com.amniscient.amnitest

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.widget.Toast

/** Opens links in other apps. Play Store links prefer the Play Store app. */
object Links {
    private const val PLAY_STORE_PACKAGE = "com.android.vending"

    fun open(activity: Activity, url: String) {
        val view = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)
        if (AppLogic.isPlayStoreUrl(url) || url.startsWith("market:", ignoreCase = true)) {
            try {
                activity.startActivity(Intent(view).setPackage(PLAY_STORE_PACKAGE))
                return
            } catch (e: ActivityNotFoundException) {
                // No Play Store app: fall through to a browser.
            }
        }
        try {
            activity.startActivity(view)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(activity, R.string.no_app_for_link, Toast.LENGTH_SHORT).show()
        }
    }
}
