package com.bluraypos.terminal.ui.shell

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.TableBar
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.table.TableSession
import com.bluraypos.terminal.data.tenant.TenantFeatures
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.navigation.AppViewModelFactory
import com.bluraypos.terminal.ui.navigation.Routes
import com.bluraypos.terminal.ui.orders.OrdersScreen
import com.bluraypos.terminal.ui.orders.OrdersViewModel
import com.bluraypos.terminal.ui.pos.PosScreen
import com.bluraypos.terminal.ui.pos.PosViewModel
import com.bluraypos.terminal.ui.settings.SettingsScreen
import com.bluraypos.terminal.ui.settings.SettingsViewModel
import com.bluraypos.terminal.ui.tables.TablesScreen
import com.bluraypos.terminal.ui.tables.TablesViewModel
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.ui.theme.ShadcnPrimary

private data class BottomTab(
    val route: String,
    val label: String,
    val icon: ImageVector,
)

private fun tabsForTenant(tenantFeatures: TenantFeatures): List<BottomTab> {
    val ordersLabel = if (tenantFeatures.isRetailMode) "Sales" else "Orders"
    val items = mutableListOf(
        BottomTab(Routes.Pos, "POS", Icons.Default.PointOfSale),
        BottomTab(Routes.Orders, ordersLabel, Icons.AutoMirrored.Filled.ReceiptLong),
    )
    if (tenantFeatures.showTablesTab) {
        items.add(BottomTab(Routes.Tables, "Tables", Icons.Default.TableBar))
    }
    items.add(BottomTab(Routes.Settings, "Settings", Icons.Default.Settings))
    return items
}

@Composable
fun MainShell(
    sessionStore: SessionStore,
    onLogout: () -> Unit,
) {
    val navController = rememberNavController()
    val tableSession = remember { TableSession() }
    val factory = remember { AppViewModelFactory(sessionStore, tableSession) }
    val tenantFeatures by sessionStore.tenantFeatures.collectAsState(initial = TenantFeatures())
    val tabs = tabsForTenant(tenantFeatures)
    val tabRoutes = tabs.map { it.route }.toSet()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route ?: Routes.Pos

    LaunchedEffect(tenantFeatures.showTablesTab, currentRoute) {
        if (currentRoute !in tabRoutes) {
            navController.navigate(Routes.Pos) {
                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                launchSingleTop = true
                restoreState = true
            }
        }
    }

    ShadcnScreen {
        Scaffold(
            containerColor = Color.Transparent,
            bottomBar = {
                NavigationBar(
                    containerColor = MaterialTheme.colorScheme.background,
                    tonalElevation = 0.dp,
                    modifier = Modifier
                        .border(width = 1.dp, color = ShadcnBorder)
                        .navigationBarsPadding(),
                ) {
                    tabs.forEach { tab ->
                        val selected = currentRoute == tab.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    tab.icon,
                                    contentDescription = tab.label,
                                    modifier = Modifier.size(22.dp),
                                )
                            },
                            label = {
                                Text(
                                    tab.label,
                                    fontSize = 11.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                )
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = ShadcnPrimary,
                                selectedTextColor = ShadcnForeground,
                                indicatorColor = ShadcnPrimary.copy(alpha = 0.12f),
                                unselectedIconColor = ShadcnMutedForeground,
                                unselectedTextColor = ShadcnMutedForeground,
                            ),
                        )
                    }
                }
            },
        ) { padding ->
            NavHost(
                navController = navController,
                startDestination = Routes.Pos,
                modifier = Modifier.padding(padding),
            ) {
                composable(Routes.Pos) {
                    val vm: PosViewModel = viewModel(factory = factory)
                    PosScreen(viewModel = vm, tableSession = tableSession)
                }
                composable(Routes.Orders) {
                    val vm: OrdersViewModel = viewModel(factory = factory)
                    OrdersScreen(viewModel = vm, tenantFeatures = tenantFeatures)
                }
                composable(Routes.Tables) {
                    val vm: TablesViewModel = viewModel(factory = factory)
                    TablesScreen(
                        viewModel = vm,
                        onOpenPos = {
                            navController.navigate(Routes.Pos) {
                                popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                    )
                }
                composable(Routes.Settings) {
                    val vm: SettingsViewModel = viewModel(factory = factory)
                    SettingsScreen(viewModel = vm, onLogout = onLogout)
                }
            }
        }
    }
}
