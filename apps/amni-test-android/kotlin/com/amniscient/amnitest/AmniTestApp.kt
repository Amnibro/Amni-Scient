package com.amniscient.amnitest

import android.app.Application

class AmniTestApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Notifier.createChannel(this)
    }
}
