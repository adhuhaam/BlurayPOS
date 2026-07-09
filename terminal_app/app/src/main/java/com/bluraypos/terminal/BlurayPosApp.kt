package com.bluraypos.terminal

import android.app.Application
import com.bluraypos.terminal.data.prefs.SessionStore

class BlurayPosApp : Application() {
    lateinit var sessionStore: SessionStore
        private set

    override fun onCreate() {
        super.onCreate()
        sessionStore = SessionStore(this)
    }
}
