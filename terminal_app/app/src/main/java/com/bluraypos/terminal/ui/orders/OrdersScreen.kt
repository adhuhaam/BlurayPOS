package com.bluraypos.terminal.ui.orders

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.api.OrderDto
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.tenant.TenantFeatures
import com.bluraypos.terminal.ui.components.EmptyState
import com.bluraypos.terminal.ui.components.LoadingCenter
import com.bluraypos.terminal.ui.components.MobileTopBar
import com.bluraypos.terminal.ui.components.ShadcnBadge
import com.bluraypos.terminal.ui.components.ShadcnCard
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.components.orderStatusColor
import com.bluraypos.terminal.ui.theme.BrandBlue
import com.bluraypos.terminal.ui.theme.BrandNavy
import com.bluraypos.terminal.ui.theme.ShadcnBorder
import com.bluraypos.terminal.ui.theme.ShadcnForeground
import com.bluraypos.terminal.ui.theme.ShadcnMuted
import com.bluraypos.terminal.ui.theme.ShadcnMutedForeground
import com.bluraypos.terminal.ui.theme.ShadcnPrimary
import com.bluraypos.terminal.ui.theme.ShadcnRing
import com.bluraypos.terminal.util.Formatters
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class OrderFilter(val label: String, val statuses: Set<String>?) {
    All("All", null),
    Completed("Completed", setOf("completed", "paid")),
    Open("Open", setOf("draft", "held", "open")),
}

data class OrdersUiState(
    val orders: List<OrderDto> = emptyList(),
    val filter: OrderFilter = OrderFilter.All,
    val search: String = "",
    val storeName: String = "",
    val loading: Boolean = true,
    val detailLoading: Boolean = false,
    val selectedOrder: OrderDto? = null,
    val error: String? = null,
) {
    val filteredOrders: List<OrderDto>
        get() {
            var list = orders
            filter.statuses?.let { allowed ->
                list = list.filter { it.status.lowercase() in allowed }
            }
            val query = search.trim()
            if (query.isNotBlank()) {
                list = list.filter {
                    it.orderNumber.contains(query, ignoreCase = true) ||
                        it.lines.any { line -> line.productName.contains(query, ignoreCase = true) }
                }
            }
            return list
        }

    val completedTotal: Double
        get() = orders
            .filter { it.status.equals("completed", ignoreCase = true) || it.status.equals("paid", ignoreCase = true) }
            .sumOf { it.total }

    val completedCount: Int
        get() = orders.count {
            it.status.equals("completed", ignoreCase = true) || it.status.equals("paid", ignoreCase = true)
        }
}

class OrdersViewModel(
    private val sessionStore: SessionStore,
) : ViewModel() {
    private val _state = MutableStateFlow(OrdersUiState())
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val storeId = sessionStore.storeId.first() ?: return@launch
                val storeName = sessionStore.storeName.first().orEmpty()
                val api = ApiClient.create(sessionStore)
                val response = api.getOrders(storeId = storeId, pageSize = 100)
                _state.update {
                    it.copy(
                        storeName = storeName,
                        orders = if (response.success) response.data?.items.orEmpty() else emptyList(),
                        loading = false,
                        error = if (!response.success) response.error else null,
                    )
                }
            } catch (ex: Exception) {
                _state.update { it.copy(loading = false, error = ex.message) }
            }
        }
    }

    fun setFilter(filter: OrderFilter) = _state.update { it.copy(filter = filter) }

    fun setSearch(value: String) = _state.update { it.copy(search = value) }

    fun clearSearch() = _state.update { it.copy(search = "") }

    fun openOrder(orderId: String) {
        viewModelScope.launch {
            _state.update { it.copy(detailLoading = true, selectedOrder = null) }
            try {
                val api = ApiClient.create(sessionStore)
                val response = api.getOrder(orderId)
                _state.update {
                    it.copy(
                        detailLoading = false,
                        selectedOrder = if (response.success) response.data else null,
                        error = if (!response.success) response.error else it.error,
                    )
                }
            } catch (ex: Exception) {
                _state.update { it.copy(detailLoading = false, error = ex.message) }
            }
        }
    }

    fun clearSelection() = _state.update { it.copy(selectedOrder = null, detailLoading = false) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(
    viewModel: OrdersViewModel,
    tenantFeatures: TenantFeatures,
) {
    val state by viewModel.state.collectAsState()
    var showDetail by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val title = if (tenantFeatures.isRetailMode) "Sales" else "Orders"
    val subtitle = if (tenantFeatures.isRetailMode) {
        "Retail transactions at ${state.storeName.ifBlank { "your branch" }}"
    } else {
        "Orders at ${state.storeName.ifBlank { "your branch" }}"
    }
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = ShadcnRing,
        unfocusedBorderColor = ShadcnBorder,
    )

    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            MobileTopBar(
                title = title,
                subtitle = subtitle,
                trailing = {
                    IconButton(
                        onClick = viewModel::load,
                        enabled = !state.loading,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                },
            )
            HorizontalDivider(color = ShadcnBorder)

            when {
                state.loading -> LoadingCenter(Modifier.fillMaxSize())
                state.orders.isEmpty() -> EmptyState(
                    title = if (tenantFeatures.isRetailMode) "No sales yet" else "No orders yet",
                    message = state.error ?: "Completed transactions will appear here",
                    icon = Icons.AutoMirrored.Filled.ReceiptLong,
                    modifier = Modifier.fillMaxSize(),
                )
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        item {
                            OrdersSummaryCard(
                                total = state.completedTotal,
                                count = state.completedCount,
                                retailMode = tenantFeatures.isRetailMode,
                            )
                        }

                        item {
                            OutlinedTextField(
                                value = state.search,
                                onValueChange = viewModel::setSearch,
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = {
                                    Text(
                                        if (tenantFeatures.isRetailMode) "Search receipt # or product…" else "Search order # or item…",
                                        color = ShadcnMutedForeground,
                                    )
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Search, contentDescription = null, tint = ShadcnMutedForeground)
                                },
                                trailingIcon = {
                                    if (state.search.isNotEmpty()) {
                                        IconButton(onClick = viewModel::clearSearch) {
                                            Icon(Icons.Default.Close, contentDescription = "Clear", modifier = Modifier.size(18.dp))
                                        }
                                    }
                                },
                                singleLine = true,
                                shape = MaterialTheme.shapes.medium,
                                colors = fieldColors,
                            )
                        }

                        item {
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                OrderFilter.entries.forEach { filter ->
                                    FilterChip(
                                        selected = state.filter == filter,
                                        onClick = { viewModel.setFilter(filter) },
                                        label = { Text(filter.label) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = ShadcnPrimary,
                                            selectedLabelColor = Color.White,
                                            containerColor = ShadcnMuted,
                                        ),
                                    )
                                }
                            }
                        }

                        state.error?.let { error ->
                            item {
                                Text(error, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                            }
                        }

                        if (state.filteredOrders.isEmpty()) {
                            item {
                                Text(
                                    "No matches for this filter",
                                    color = ShadcnMutedForeground,
                                    modifier = Modifier.padding(vertical = 24.dp),
                                )
                            }
                        } else {
                            items(state.filteredOrders, key = { it.id }) { order ->
                                OrderRow(order) {
                                    showDetail = true
                                    viewModel.openOrder(order.id)
                                }
                            }
                        }

                        item { Spacer(Modifier.height(16.dp)) }
                    }
                }
            }
        }
    }

    if (showDetail && (state.selectedOrder != null || state.detailLoading)) {
        ModalBottomSheet(
            onDismissRequest = {
                showDetail = false
                viewModel.clearSelection()
            },
            sheetState = sheetState,
            shape = MaterialTheme.shapes.extraLarge,
            containerColor = MaterialTheme.colorScheme.background,
        ) {
            when {
                state.detailLoading -> LoadingCenter(Modifier.fillMaxWidth().height(200.dp))
                state.selectedOrder != null -> OrderDetailSheet(state.selectedOrder!!)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun OrdersSummaryCard(total: Double, count: Int, retailMode: Boolean) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.extraLarge,
        color = Color.Transparent,
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .background(
                    androidx.compose.ui.graphics.Brush.linearGradient(
                        listOf(BrandNavy, BrandBlue.copy(alpha = 0.85f)),
                    ),
                    shape = MaterialTheme.shapes.extraLarge,
                )
                .padding(18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column {
                Text(
                    if (retailMode) "Listed sales total" else "Listed orders total",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color.White.copy(alpha = 0.75f),
                )
                Text(
                    Formatters.formatMoney(total),
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
            Surface(shape = MaterialTheme.shapes.small, color = Color.White.copy(alpha = 0.15f)) {
                Text(
                    "$count ${if (retailMode) "sales" else "orders"}",
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    color = Color.White,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
    }
}

@Composable
private fun OrderRow(order: OrderDto, onClick: () -> Unit) {
    val itemCount = order.lines.sumOf { it.quantity }
    val paymentMethod = order.payments.firstOrNull()?.method

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .border(1.dp, ShadcnForeground.copy(alpha = 0.1f), MaterialTheme.shapes.large),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f)) {
                Text("#${order.orderNumber}", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
                if (!order.diningTableName.isNullOrBlank()) {
                    Text(
                        "Table ${order.diningTableName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = ShadcnPrimary,
                    )
                }
                Text(
                    Formatters.formatMoney(order.total),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    val time = Formatters.formatOrderTime(order.completedAt ?: order.createdAt)
                    if (time.isNotBlank()) {
                        Text(time, style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
                    }
                    if (itemCount > 0) {
                        Text("· $itemCount items", style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
                    }
                    paymentMethod?.let {
                        Text("· $it", style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
                    }
                }
            }
            ShadcnBadge(
                text = order.status.replaceFirstChar { it.uppercase() },
                tint = orderStatusColor(order.status),
            )
        }
    }
}

@Composable
private fun OrderDetailSheet(order: OrderDto) {
    Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
        Text("Order #${order.orderNumber}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                Formatters.formatOrderTime(order.completedAt ?: order.createdAt),
                style = MaterialTheme.typography.bodySmall,
                color = ShadcnMutedForeground,
            )
            ShadcnBadge(
                text = order.status.replaceFirstChar { it.uppercase() },
                tint = orderStatusColor(order.status),
            )
        }
        Spacer(Modifier.height(16.dp))
        if (order.lines.isEmpty()) {
            Text("No line items", color = ShadcnMutedForeground)
        } else {
            order.lines.forEach { line ->
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(line.productName, fontWeight = FontWeight.Medium)
                        Text("${line.quantity} × ${Formatters.formatMoney(line.unitPrice)}", style = MaterialTheme.typography.bodySmall)
                    }
                    Text(Formatters.formatMoney(line.lineTotal), fontWeight = FontWeight.Medium)
                }
            }
        }
        HorizontalDivider(color = ShadcnBorder, modifier = Modifier.padding(vertical = 12.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Subtotal")
            Text(Formatters.formatMoney(order.subtotal))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Tax")
            Text(Formatters.formatMoney(order.taxAmount))
        }
        if (order.discountAmount > 0) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Discount")
                Text("-${Formatters.formatMoney(order.discountAmount)}")
            }
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Total", fontWeight = FontWeight.SemiBold)
            Text(Formatters.formatMoney(order.total), fontWeight = FontWeight.Bold)
        }
        if (order.payments.isNotEmpty()) {
            Spacer(Modifier.height(12.dp))
            Text("Payments", style = MaterialTheme.typography.labelMedium, color = ShadcnMutedForeground)
            order.payments.forEach { payment ->
                Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(payment.method)
                    Text(Formatters.formatMoney(payment.amount), fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}
