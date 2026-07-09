package com.bluraypos.terminal.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.TableBar
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.api.OrderDto
import com.bluraypos.terminal.data.api.TopProductDto
import com.bluraypos.terminal.data.network.ConnectionChecker
import com.bluraypos.terminal.data.network.ConnectionStatus
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.tenant.TenantFeatures
import com.bluraypos.terminal.ui.components.LoadingCenter
import com.bluraypos.terminal.ui.components.ShadcnBadge
import com.bluraypos.terminal.ui.components.ShadcnButton
import com.bluraypos.terminal.ui.components.ShadcnButtonVariant
import com.bluraypos.terminal.ui.components.ShadcnCard
import com.bluraypos.terminal.ui.components.ShadcnMetricCard
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.components.orderStatusColor
import com.bluraypos.terminal.ui.theme.BrandBlue
import com.bluraypos.terminal.ui.theme.BrandBlue
import com.bluraypos.terminal.ui.theme.BrandNavy
import com.bluraypos.terminal.ui.theme.BrandWarning
import com.bluraypos.terminal.ui.theme.ChargeGreen
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMuted
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.util.Formatters
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class DashboardUiState(
    val displayName: String = "",
    val storeName: String = "",
    val userEmail: String = "",
    val roleLabel: String = "",
    val tenantFeatures: TenantFeatures = TenantFeatures(),
    val todaySales: Double = 0.0,
    val todayOrders: Int = 0,
    val weekSales: Double = 0.0,
    val weekOrders: Int = 0,
    val topProducts: List<TopProductDto> = emptyList(),
    val recentOrders: List<OrderDto> = emptyList(),
    val loading: Boolean = true,
    val offline: Boolean = false,
    val error: String? = null,
    val lastRefreshedAt: Long? = null,
) {
    val avgOrderValue: Double
        get() = if (todayOrders > 0) todaySales / todayOrders else 0.0
}

class DashboardViewModel(
    private val sessionStore: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null, offline = false) }
            val storeName = sessionStore.storeName.first().orEmpty()
            val email = sessionStore.userEmail.first().orEmpty()
            val displayName = sessionStore.userDisplayName.first().orEmpty()
            val storeId = sessionStore.storeId.first()
            val roles = sessionStore.userRoles.first()
            val roleLabel = roles.firstOrNull()?.let(Formatters::formatRole).orEmpty()
            val features = sessionStore.tenantFeatures.first()

            when (val connection = ConnectionChecker.check(sessionStore)) {
                is ConnectionStatus.Offline -> {
                    _state.update {
                        it.copy(
                            displayName = displayName,
                            storeName = storeName,
                            userEmail = email,
                            roleLabel = roleLabel,
                            tenantFeatures = features,
                            loading = false,
                            offline = true,
                            error = connection.message,
                        )
                    }
                    return@launch
                }
                else -> Unit
            }

            try {
                val api = ApiClient.create(sessionStore)
                coroutineScope {
                    val dashboardDeferred = async { api.getDashboard(storeId = storeId) }
                    val ordersDeferred = async {
                        if (storeId != null) {
                            api.getOrders(storeId = storeId, pageSize = 5)
                        } else {
                            null
                        }
                    }
                    val report = dashboardDeferred.await()
                    val ordersRes = ordersDeferred.await()

                    if (report.success && report.data != null) {
                        val data = report.data
                        _state.update {
                            it.copy(
                                displayName = displayName,
                                storeName = storeName,
                                userEmail = email,
                                roleLabel = roleLabel,
                                tenantFeatures = features,
                                todaySales = data.todaySales,
                                todayOrders = data.todayOrders,
                                weekSales = data.weekSales,
                                weekOrders = data.weekOrders,
                                topProducts = data.topProducts.take(5),
                                recentOrders = if (ordersRes?.success == true) {
                                    ordersRes.data?.items.orEmpty()
                                } else {
                                    emptyList()
                                },
                                loading = false,
                                offline = false,
                                error = null,
                                lastRefreshedAt = System.currentTimeMillis(),
                            )
                        }
                    } else {
                        _state.update {
                            it.copy(
                                displayName = displayName,
                                storeName = storeName,
                                userEmail = email,
                                roleLabel = roleLabel,
                                loading = false,
                                offline = false,
                                error = report.error ?: "Could not load dashboard",
                            )
                        }
                    }
                }
            } catch (ex: Exception) {
                val offline = ConnectionChecker.isNetworkError(ex)
                _state.update {
                    it.copy(
                        displayName = displayName,
                        storeName = storeName,
                        userEmail = email,
                        roleLabel = roleLabel,
                        loading = false,
                        offline = offline,
                        error = if (offline) ConnectionChecker.toMessage(ex) else (ex.message ?: "Dashboard error"),
                    )
                }
            }
        }
    }
}

private data class QuickAction(
    val title: String,
    val subtitle: String,
    val icon: ImageVector,
    val route: String,
)

@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigate: (String) -> Unit,
) {
    val state by viewModel.state.collectAsState()
    val greetingName = state.displayName.ifBlank { state.userEmail.substringBefore("@") }
    val features = state.tenantFeatures
    val actions = buildList {
        add(QuickAction("POS", if (features.isRetailMode) "Scan & sell" else "New sale", Icons.Default.PointOfSale, "pos"))
        add(QuickAction("Orders", if (features.isRetailMode) "Sales history" else "Order history", Icons.AutoMirrored.Filled.ReceiptLong, "orders"))
        if (features.posTables) {
            add(QuickAction("Tables", "Floor plan", Icons.Default.TableBar, "tables"))
        }
        if (features.posKitchen) {
            add(QuickAction("Kitchen", "Tickets", Icons.Default.Restaurant, "orders"))
        }
    }

    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            DashboardTopBar(
                greetingName = greetingName,
                storeName = state.storeName,
                roleLabel = state.roleLabel,
                businessTypeLabel = features.businessTypeLabel,
                offline = state.offline,
                loading = state.loading,
                lastRefreshedAt = state.lastRefreshedAt,
                onRefresh = viewModel::refresh,
            )

            when {
                state.loading -> LoadingCenter(Modifier.fillMaxSize())
                else -> LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    if (state.error != null) {
                        item {
                            DashboardErrorCard(
                                message = state.error!!,
                                offline = state.offline,
                                onRetry = viewModel::refresh,
                            )
                        }
                    }

                    item {
                        TodayHeroCard(
                            todaySales = state.todaySales,
                            todayOrders = state.todayOrders,
                            avgOrderValue = state.avgOrderValue,
                            onNewSale = { onNavigate("pos") },
                        )
                    }

                    item {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            ShadcnMetricCard(
                                label = "Week sales",
                                value = Formatters.formatMoney(state.weekSales),
                                icon = Icons.Default.TrendingUp,
                                modifier = Modifier.weight(1f),
                            )
                            ShadcnMetricCard(
                                label = "Week orders",
                                value = state.weekOrders.toString(),
                                icon = Icons.AutoMirrored.Filled.ReceiptLong,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }

                    if (state.topProducts.isNotEmpty()) {
                        item {
                            DashboardSectionHeader(
                                title = "Top sellers",
                                subtitle = "This week at ${state.storeName.ifBlank { "your branch" }}",
                            )
                        }
                        items(state.topProducts.size) { index ->
                            TopProductRow(rank = index + 1, product = state.topProducts[index])
                        }
                    }

                    item {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            DashboardSectionHeader(
                                title = "Recent orders",
                                subtitle = null,
                                modifier = Modifier.weight(1f),
                            )
                            if (state.recentOrders.isNotEmpty()) {
                                Text(
                                    "See all",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = BrandBlue,
                                    modifier = Modifier
                                        .clickable { onNavigate("orders") }
                                        .padding(8.dp),
                                )
                            }
                        }
                    }

                    if (state.recentOrders.isEmpty()) {
                        item {
                            ShadcnCard {
                                Text(
                                    "No orders yet today",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = ShadcnMutedForeground,
                                )
                                Spacer(Modifier.height(8.dp))
                                ShadcnButton(
                                    text = "Start first sale",
                                    onClick = { onNavigate("pos") },
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            }
                        }
                    } else {
                        items(state.recentOrders.size) { index ->
                            RecentOrderRow(
                                order = state.recentOrders[index],
                                onClick = { onNavigate("orders") },
                            )
                        }
                    }

                    item {
                        DashboardSectionHeader(title = "Quick actions", subtitle = "Jump to a workspace")
                    }

                    item {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(if (actions.size <= 2) 120.dp else if (actions.size <= 4) 240.dp else 300.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            userScrollEnabled = false,
                        ) {
                            items(actions) { action ->
                                EnhancedActionTile(
                                    title = action.title,
                                    subtitle = action.subtitle,
                                    icon = action.icon,
                                    onClick = { onNavigate(action.route) },
                                )
                            }
                        }
                    }

                    item { Spacer(Modifier.height(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun DashboardTopBar(
    greetingName: String,
    storeName: String,
    roleLabel: String,
    businessTypeLabel: String,
    offline: Boolean,
    loading: Boolean,
    lastRefreshedAt: Long?,
    onRefresh: () -> Unit,
) {
    Column(
        Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 20.dp),
    ) {
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Top,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "${Formatters.timeGreeting()},",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ShadcnMutedForeground,
                )
                Text(
                    greetingName,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    storeName.ifBlank { "Your branch" },
                    style = MaterialTheme.typography.bodyMedium,
                    color = ShadcnMutedForeground,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (roleLabel.isNotBlank()) {
                        ShadcnBadge(roleLabel, tint = ShadcnForeground)
                    }
                    ShadcnBadge(businessTypeLabel, tint = BrandBlue)
                    when {
                        offline -> ShadcnBadge("Offline", tint = BrandWarning)
                        !loading -> ShadcnBadge("Online", tint = ChargeGreen)
                    }
                }
                lastRefreshedAt?.let {
                    Spacer(Modifier.height(6.dp))
                    Text(
                        Formatters.formatRelativeRefresh(it),
                        style = MaterialTheme.typography.labelSmall,
                        color = ShadcnMutedForeground,
                    )
                }
            }
            IconButton(onClick = onRefresh, enabled = !loading) {
                Icon(Icons.Default.Refresh, contentDescription = "Refresh")
            }
        }
        Spacer(Modifier.height(12.dp))
        HorizontalDivider(color = ShadcnBorder)
    }
}

@Composable
private fun TodayHeroCard(
    todaySales: Double,
    todayOrders: Int,
    avgOrderValue: Double,
    onNewSale: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.extraLarge,
        color = Color.Transparent,
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .background(
                    Brush.linearGradient(
                        colors = listOf(BrandNavy, Color(0xFF0D2280), BrandBlue.copy(alpha = 0.85f)),
                    ),
                    shape = MaterialTheme.shapes.extraLarge,
                )
                .padding(20.dp),
        ) {
            Column {
                Text(
                    "Today's sales",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color.White.copy(alpha = 0.75f),
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    Formatters.formatMoney(todaySales),
                    style = MaterialTheme.typography.displaySmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    HeroStatChip("$todayOrders orders")
                    if (avgOrderValue > 0) {
                        HeroStatChip("Avg ${Formatters.formatMoney(avgOrderValue)}")
                    }
                }
                Spacer(Modifier.height(16.dp))
                ShadcnButton(
                    text = "New sale",
                    onClick = onNewSale,
                    modifier = Modifier.fillMaxWidth(),
                    variant = ShadcnButtonVariant.Success,
                )
            }
        }
    }
}

@Composable
private fun HeroStatChip(label: String) {
    Surface(
        shape = MaterialTheme.shapes.small,
        color = Color.White.copy(alpha = 0.12f),
    ) {
        Text(
            label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelMedium,
            color = Color.White.copy(alpha = 0.9f),
        )
    }
}

@Composable
private fun DashboardSectionHeader(
    title: String,
    subtitle: String?,
    modifier: Modifier = Modifier,
) {
    Column(modifier) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        subtitle?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = ShadcnMutedForeground)
        }
    }
}

@Composable
private fun DashboardErrorCard(
    message: String,
    offline: Boolean,
    onRetry: () -> Unit,
) {
    ShadcnCard {
        Text(
            message,
            color = if (offline) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
            style = MaterialTheme.typography.bodySmall,
        )
        Spacer(Modifier.height(12.dp))
        ShadcnButton(
            text = "Retry",
            onClick = onRetry,
            modifier = Modifier.fillMaxWidth(),
            variant = ShadcnButtonVariant.Outline,
        )
    }
}

@Composable
private fun TopProductRow(rank: Int, product: TopProductDto) {
    ShadcnCard {
        Row(
            Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(ShadcnMuted),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    rank.toString(),
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                )
            }
            Column(Modifier.weight(1f)) {
                Text(
                    product.productName,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    "${product.quantitySold} sold",
                    style = MaterialTheme.typography.bodySmall,
                    color = ShadcnMutedForeground,
                )
            }
            Text(
                Formatters.formatMoney(product.revenue),
                fontWeight = FontWeight.SemiBold,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun RecentOrderRow(order: OrderDto, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .border(1.dp, ShadcnForeground.copy(alpha = 0.08f), MaterialTheme.shapes.large),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text(
                    "#${order.orderNumber}",
                    fontWeight = FontWeight.SemiBold,
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    Formatters.formatOrderTime(order.completedAt ?: order.createdAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = ShadcnMutedForeground,
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    Formatters.formatMoney(order.total),
                    fontWeight = FontWeight.SemiBold,
                )
                ShadcnBadge(
                    text = order.status.replaceFirstChar { it.uppercase() },
                    tint = orderStatusColor(order.status),
                )
            }
            Icon(
                Icons.Default.ArrowForward,
                contentDescription = null,
                tint = ShadcnMutedForeground,
                modifier = Modifier
                    .padding(start = 8.dp)
                    .size(16.dp),
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EnhancedActionTile(
    title: String,
    subtitle: String,
    icon: ImageVector,
    onClick: () -> Unit,
) {
    Surface(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(108.dp),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, ShadcnForeground.copy(alpha = 0.1f)),
    ) {
        Column(
            Modifier.padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(MaterialTheme.shapes.small)
                    .background(ShadcnMuted),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = title, modifier = Modifier.size(18.dp), tint = ShadcnForeground)
            }
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(subtitle, style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
            }
        }
    }
}
