package com.bluraypos.terminal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.bluraypos.terminal.ui.navigation.AppNavHost
import com.bluraypos.terminal.ui.theme.BlurayPosTheme
import com.bluraypos.terminal.util.ImmersiveMode

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ImmersiveMode.apply(this)
        val app = application as BlurayPosApp
        setContent {
            BlurayPosTheme {
                AppNavHost(sessionStore = app.sessionStore)
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) ImmersiveMode.apply(this)
    }
}
