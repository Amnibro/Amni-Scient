package com.amniscient.amnitest

import android.content.Context
import androidx.core.app.NotificationManagerCompat
import java.io.IOException

object Account {

    fun signedIn(context: Context, token: String) {
        Session.setToken(context, token)
        CheckInWorker.schedule(context)
    }

    /** Clears the session locally right away; tells the API in the background (best effort). */
    fun signOut(context: Context) {
        val app = context.applicationContext
        val token = Session.token(app)
        Session.clear(app)
        CheckInWorker.cancel(app)
        NotificationManagerCompat.from(app).cancelAll()
        if (token != null) {
            Thread {
                try {
                    Api().post("/api/auth/logout", token = token)
                } catch (e: IOException) {
                    // The server session expires on its own.
                }
            }.start()
        }
    }
}
