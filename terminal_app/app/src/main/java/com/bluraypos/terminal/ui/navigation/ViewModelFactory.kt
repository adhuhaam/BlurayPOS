package com.bluraypos.terminal.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.table.TableSession
import com.bluraypos.terminal.ui.dashboard.DashboardViewModel
import com.bluraypos.terminal.ui.login.LoginViewModel
import com.bluraypos.terminal.ui.orders.OrdersViewModel
import com.bluraypos.terminal.ui.pos.PosViewModel
import com.bluraypos.terminal.ui.settings.SettingsViewModel
import com.bluraypos.terminal.ui.tables.TablesViewModel

object Routes {
    const val Splash = "splash"
    const val Login = "login"
    const val Main = "main"
    const val Dashboard = "dashboard"
    const val Pos = "pos"
    const val Orders = "orders"
    const val Tables = "tables"
    const val Settings = "settings"
}

class AppViewModelFactory(
    private val sessionStore: SessionStore,
    private val tableSession: TableSession,
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = when {
        modelClass.isAssignableFrom(LoginViewModel::class.java) -> LoginViewModel(sessionStore)
        modelClass.isAssignableFrom(DashboardViewModel::class.java) -> DashboardViewModel(sessionStore)
        modelClass.isAssignableFrom(PosViewModel::class.java) -> PosViewModel(sessionStore, tableSession)
        modelClass.isAssignableFrom(OrdersViewModel::class.java) -> OrdersViewModel(sessionStore)
        modelClass.isAssignableFrom(SettingsViewModel::class.java) -> SettingsViewModel(sessionStore)
        modelClass.isAssignableFrom(TablesViewModel::class.java) -> TablesViewModel(sessionStore, tableSession)
        else -> throw IllegalArgumentException("Unknown ViewModel: ${modelClass.name}")
    } as T
}
