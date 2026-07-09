package com.bluraypos.terminal.ui.splash

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.tenant.TenantSync
import com.bluraypos.terminal.ui.branding.BrandAppIcon
import com.bluraypos.terminal.ui.branding.BrandSplashBackground
import com.bluraypos.terminal.ui.branding.BrandTagline
import com.bluraypos.terminal.ui.branding.BlurayWordmark
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first

@Composable
fun SplashScreen(
    sessionStore: SessionStore,
    onNavigateToLogin: () -> Unit,
    onNavigateToMain: () -> Unit,
) {
    LaunchedEffect(Unit) {
        delay(1400)
        val loggedIn = sessionStore.isLoggedIn.first()
        if (loggedIn) {
            TenantSync.refresh(sessionStore)
            onNavigateToMain()
        } else {
            onNavigateToLogin()
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        BrandSplashBackground(Modifier.fillMaxSize())
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            BrandAppIcon(size = 112.dp)
            Spacer(Modifier.height(24.dp))
            BlurayWordmark(lightOnDark = true)
            Spacer(Modifier.height(10.dp))
            BrandTagline(lightOnDark = true)
            Spacer(Modifier.height(40.dp))
            CircularProgressIndicator(
                modifier = Modifier.size(28.dp),
                color = Color.White.copy(alpha = 0.9f),
                strokeWidth = 2.dp,
            )
            Spacer(Modifier.height(12.dp))
            Text("Loading...", color = Color.White.copy(alpha = 0.65f))
        }
    }
}
