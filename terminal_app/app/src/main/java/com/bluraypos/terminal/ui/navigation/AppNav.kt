package com.bluraypos.terminal.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.table.TableSession
import com.bluraypos.terminal.ui.login.LoginScreen
import com.bluraypos.terminal.ui.login.LoginViewModel
import com.bluraypos.terminal.ui.shell.MainShell
import com.bluraypos.terminal.ui.splash.SplashScreen
import kotlinx.coroutines.runBlocking

@Composable
fun AppNavHost(sessionStore: SessionStore) {
    val navController = rememberNavController()
    val factory = remember { AppViewModelFactory(sessionStore, TableSession()) }

    NavHost(navController = navController, startDestination = Routes.Splash) {
        composable(Routes.Splash) {
            SplashScreen(
                sessionStore = sessionStore,
                onNavigateToLogin = {
                    navController.navigate(Routes.Login) {
                        popUpTo(Routes.Splash) { inclusive = true }
                    }
                },
                onNavigateToMain = {
                    navController.navigate(Routes.Main) {
                        popUpTo(Routes.Splash) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.Login) {
            val vm: LoginViewModel = viewModel(factory = factory)
            LoginScreen(
                viewModel = vm,
                onLoggedIn = {
                    navController.navigate(Routes.Main) {
                        popUpTo(Routes.Login) { inclusive = true }
                    }
                },
            )
        }
        composable(Routes.Main) {
            MainShell(
                sessionStore = sessionStore,
                onLogout = {
                    runBlocking { sessionStore.clear() }
                    navController.navigate(Routes.Login) {
                        popUpTo(Routes.Main) { inclusive = true }
                    }
                },
            )
        }
    }
}
