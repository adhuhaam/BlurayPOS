package com.bluraypos.terminal.ui.pos

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.TableBar
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.api.CategoryDto
import com.bluraypos.terminal.data.api.CompleteOrderRequest
import com.bluraypos.terminal.data.api.CreateOrderLineRequest
import com.bluraypos.terminal.data.api.CreateOrderRequest
import com.bluraypos.terminal.data.api.PaymentInput
import com.bluraypos.terminal.data.api.ProductDto
import com.bluraypos.terminal.data.api.DiningTableDto
import com.bluraypos.terminal.data.api.OrderDto
import com.bluraypos.terminal.data.prefs.SessionStore
import com.bluraypos.terminal.data.table.TableSession
import com.bluraypos.terminal.ui.components.EmptyState
import com.bluraypos.terminal.ui.components.LoadingCenter
import com.bluraypos.terminal.ui.components.MobileTopBar
import com.bluraypos.terminal.ui.components.ShadcnButton
import com.bluraypos.terminal.ui.components.ShadcnButtonVariant
import com.bluraypos.terminal.ui.components.ShadcnScreen
import com.bluraypos.terminal.ui.theme.ChargeGreen
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
import java.util.UUID

enum class PosStep { Browse, Payment, Receipt }

data class CartLine(
    val product: ProductDto,
    val quantity: Int,
) {
    val unitPrice: Double = product.storePrice ?: product.basePrice
    val lineSubtotal: Double get() = unitPrice * quantity
    val lineTax: Double get() = lineSubtotal * product.taxRate
    val lineTotal: Double get() = lineSubtotal + lineTax
}

data class PosUiState(
    val storeName: String = "",
    val posModeLabel: String = "",
    val showCategories: Boolean = true,
    val searchPlaceholder: String = "Search name, SKU, or barcode…",
    val retailMode: Boolean = false,
    val restaurantMode: Boolean = false,
    val takeawayMode: Boolean = false,
    val tables: List<DiningTableDto> = emptyList(),
    val selectedTableId: String? = null,
    val selectedTableName: String? = null,
    val activeOrderId: String? = null,
    val billRequested: Boolean = false,
    val paymentOrderId: String? = null,
    val paymentTotal: Double = 0.0,
    val search: String = "",
    val categories: List<CategoryDto> = emptyList(),
    val selectedCategoryId: String? = null,
    val products: List<ProductDto> = emptyList(),
    val cart: List<CartLine> = emptyList(),
    val step: PosStep = PosStep.Browse,
    val loading: Boolean = true,
    val charging: Boolean = false,
    val lastOrderNumber: String = "",
    val lastOrderTotal: Double = 0.0,
    val lastAddedProductId: String? = null,
    val message: String? = null,
    val error: String? = null,
) {
    val cartSubtotal: Double get() = cart.sumOf { it.lineSubtotal }
    val cartTax: Double get() = cart.sumOf { it.lineTax }
    val cartTotal: Double get() = cartSubtotal + cartTax
    val cartCount: Int get() = cart.sumOf { it.quantity }
    val showTablePicker: Boolean get() = restaurantMode || (!retailMode && tables.isNotEmpty())
    val dineInMode: Boolean get() = showTablePicker && !takeawayMode

    fun cartQuantity(productId: String): Int =
        cart.firstOrNull { it.product.id == productId }?.quantity ?: 0
}

class PosViewModel(
    private val sessionStore: SessionStore,
    private val tableSession: TableSession,
) : ViewModel() {
    private val _state = MutableStateFlow(PosUiState())
    val state: StateFlow<PosUiState> = _state.asStateFlow()

    init {
        load()
        viewModelScope.launch {
            tableSession.selectedTableId.collect { id ->
                val name = tableSession.selectedTableName.value
                _state.update { it.copy(selectedTableId = id, selectedTableName = name) }
                if (id != null) loadActiveOrderForTable(id)
            }
        }
        viewModelScope.launch {
            tableSession.activeOrderId.collect { orderId ->
                if (orderId != null) loadOrderIntoState(orderId)
            }
        }
    }

    fun load() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            try {
                val storeName = sessionStore.storeName.first().orEmpty()
                val storeId = sessionStore.storeId.first()
                val features = sessionStore.tenantFeatures.first()
                val api = ApiClient.create(sessionStore)
                val productsRes = api.getProducts(storeId = storeId, pageSize = 200)
                val categoriesRes = api.getCategories()
                val tablesRes = if (features.showTablesTab && storeId != null) {
                    api.getTables(storeId)
                } else null
                val items = if (productsRes.success) productsRes.data?.items.orEmpty() else emptyList()
                val categories = if (categoriesRes.success) {
                    categoriesRes.data.orEmpty().sortedBy { it.sortOrder }
                } else emptyList()
                val tables = if (tablesRes?.success == true) tablesRes.data.orEmpty() else emptyList()
                _state.update {
                    it.copy(
                        storeName = storeName,
                        posModeLabel = features.posModeLabel,
                        showCategories = !features.isRetailMode,
                        retailMode = features.isRetailMode,
                        restaurantMode = features.isRestaurantMode || features.showTablesTab,
                        tables = tables,
                        selectedTableId = tableSession.selectedTableId.value,
                        selectedTableName = tableSession.selectedTableName.value,
                        searchPlaceholder = when {
                            features.isRetailMode -> "Scan barcode or search SKU…"
                            features.isRestaurantMode -> "Search menu items…"
                            else -> "Search name, SKU, or barcode…"
                        },
                        products = items.filter { p -> p.isActive },
                        categories = categories,
                        loading = false,
                        error = if (!productsRes.success) productsRes.error else null,
                    )
                }
            } catch (ex: Exception) {
                _state.update { it.copy(loading = false, error = ex.message) }
            }
        }
    }

    fun setTakeawayMode(enabled: Boolean) {
        _state.update {
            it.copy(
                takeawayMode = enabled,
                selectedTableId = if (enabled) null else it.selectedTableId,
                selectedTableName = if (enabled) null else it.selectedTableName,
                message = if (enabled) "Takeaway mode" else null,
            )
        }
        if (enabled) tableSession.clear()
    }

    fun selectTable(table: DiningTableDto) {
        tableSession.selectTable(table.id, table.name)
        _state.update {
            it.copy(
                takeawayMode = false,
                selectedTableId = table.id,
                selectedTableName = table.name,
                message = "Table ${table.name} selected",
                error = null,
            )
        }
        table.activeOrderId?.let { loadOrderIntoState(it) }
    }

    private fun loadActiveOrderForTable(tableId: String) {
        val table = _state.value.tables.firstOrNull { it.id == tableId } ?: return
        table.activeOrderId?.let { loadOrderIntoState(it) }
    }

    private fun loadOrderIntoState(orderId: String) {
        viewModelScope.launch {
            try {
                val res = ApiClient.create(sessionStore).getOrder(orderId)
                if (!res.success || res.data == null) return@launch
                applyOrderToState(res.data)
            } catch (_: Exception) { }
        }
    }

    private fun applyOrderToState(order: OrderDto) {
        val cart = order.lines.mapNotNull { line ->
            val product = _state.value.products.firstOrNull { it.id == line.productId }
                ?: ProductDto(
                    id = line.productId,
                    categoryId = null,
                    name = line.productName,
                    sku = line.sku,
                    barcode = null,
                    description = null,
                    basePrice = line.unitPrice,
                    taxRate = line.taxRate,
                    isActive = true,
                    trackInventory = false,
                    inventoryMode = "FinishedGood",
                    categoryName = null,
                    storePrice = line.unitPrice,
                    stockOnHand = null,
                )
            CartLine(product, line.quantity)
        }
        tableSession.setActiveOrder(order.id, order.diningTableId, order.diningTableName)
        _state.update {
            it.copy(
                activeOrderId = order.id,
                billRequested = order.billRequestedAt != null,
                cart = cart,
                selectedTableId = order.diningTableId ?: it.selectedTableId,
                selectedTableName = order.diningTableName ?: it.selectedTableName,
                paymentOrderId = order.id,
                paymentTotal = order.total,
            )
        }
    }

    fun onSearchChange(value: String) {
        _state.update { it.copy(search = value, message = null) }
        val trimmed = value.trim()
        if (trimmed.length < 4) return
        val byBarcode = _state.value.products.firstOrNull { product ->
            !product.barcode.isNullOrBlank() && product.barcode == trimmed
        }
        if (byBarcode != null) {
            addProduct(byBarcode)
            _state.update { it.copy(search = "", message = "Added ${byBarcode.name}") }
        }
    }

    fun clearSearch() = _state.update { it.copy(search = "") }

    fun onCategorySelected(id: String?) = _state.update { it.copy(selectedCategoryId = id, message = null) }

    fun addProduct(product: ProductDto) {
        _state.update { current ->
            val existing = current.cart.indexOfFirst { it.product.id == product.id }
            val cart = current.cart.toMutableList()
            if (existing >= 0) {
                val line = cart[existing]
                cart[existing] = line.copy(quantity = line.quantity + 1)
            } else {
                cart.add(CartLine(product, 1))
            }
            current.copy(cart = cart, lastAddedProductId = product.id, message = "Added ${product.name}", error = null)
        }
    }

    fun decreaseProduct(productId: String) {
        _state.update { current ->
            val cart = current.cart.toMutableList()
            val index = cart.indexOfFirst { it.product.id == productId }
            if (index < 0) return@update current
            val line = cart[index]
            if (line.quantity <= 1) cart.removeAt(index) else cart[index] = line.copy(quantity = line.quantity - 1)
            current.copy(cart = cart)
        }
    }

    fun goToPayment() {
        val current = _state.value
        if (current.dineInMode && current.paymentOrderId != null && current.billRequested) {
            _state.update { it.copy(step = PosStep.Payment, paymentTotal = it.paymentTotal, error = null) }
            return
        }
        if (current.cart.isEmpty()) {
            _state.update { it.copy(error = "Add items to cart first") }
            return
        }
        _state.update { it.copy(step = PosStep.Payment, paymentOrderId = null, paymentTotal = it.cartTotal, error = null) }
    }

    fun backToBrowse() = _state.update { it.copy(step = PosStep.Browse, error = null) }

    fun payCash() = completeSale("Cash")
    fun payCard() = completeSale("Card")

    fun saveAndSendToKitchen() {
        val current = _state.value
        if (current.dineInMode && current.selectedTableId == null) {
            _state.update { it.copy(error = "Select a table first") }
            return
        }
        if (current.cart.isEmpty()) {
            _state.update { it.copy(error = "Add items to cart first") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(charging = true, error = null) }
            try {
                val api = ApiClient.create(sessionStore)
                val request = buildOrderRequest(current)
                val orderId = current.activeOrderId
                val orderRes = if (orderId != null) {
                    api.updateOrder(orderId, request)
                } else {
                    api.createOrder(request, idempotencyKey = UUID.randomUUID().toString())
                }
                if (!orderRes.success || orderRes.data == null) {
                    throw IllegalStateException(orderRes.error ?: "Failed to save order")
                }
                val kitchenRes = api.sendToKitchen(orderRes.data.id)
                if (!kitchenRes.success || kitchenRes.data == null) {
                    throw IllegalStateException(kitchenRes.error ?: "Failed to send to kitchen")
                }
                val order = kitchenRes.data
                tableSession.setActiveOrder(order.id, order.diningTableId, order.diningTableName)
                _state.update {
                    it.copy(
                        charging = false,
                        cart = emptyList(),
                        activeOrderId = order.id,
                        paymentOrderId = order.id,
                        paymentTotal = order.total,
                        billRequested = false,
                        message = buildString {
                            append("Sent to kitchen")
                            order.diningTableName?.let { name -> append(" · Table $name") }
                        },
                    )
                }
                load()
            } catch (ex: Exception) {
                _state.update { it.copy(charging = false, error = ex.message) }
            }
        }
    }

    fun requestBill() {
        val orderId = _state.value.activeOrderId ?: _state.value.paymentOrderId
        if (orderId == null) {
            _state.update { it.copy(error = "No open table order") }
            return
        }
        viewModelScope.launch {
            _state.update { it.copy(charging = true, error = null) }
            try {
                val res = ApiClient.create(sessionStore).requestBill(orderId)
                if (!res.success || res.data == null) {
                    throw IllegalStateException(res.error ?: "Failed to request bill")
                }
                _state.update {
                    it.copy(
                        charging = false,
                        billRequested = true,
                        paymentOrderId = res.data.id,
                        paymentTotal = res.data.total,
                        message = "Bill ready — take payment when customer is ready",
                    )
                }
                load()
            } catch (ex: Exception) {
                _state.update { it.copy(charging = false, error = ex.message) }
            }
        }
    }

    private fun buildOrderRequest(state: PosUiState) = CreateOrderRequest(
        lines = state.cart.map {
            CreateOrderLineRequest(productId = it.product.id, quantity = it.quantity, unitPrice = it.unitPrice)
        },
        diningTableId = if (state.dineInMode) state.selectedTableId else null,
        serviceType = when {
            state.takeawayMode -> "Pickup"
            state.dineInMode -> "DineIn"
            else -> null
        },
    )

    private fun completeSale(method: String) {
        val current = _state.value
        viewModelScope.launch {
            _state.update { it.copy(charging = true, error = null) }
            try {
                val api = ApiClient.create(sessionStore)
                val orderId = current.paymentOrderId
                val total = if (orderId != null) current.paymentTotal else current.cartTotal
                val targetId = if (orderId != null) {
                    orderId
                } else {
                    val create = api.createOrder(
                        buildOrderRequest(current),
                        idempotencyKey = UUID.randomUUID().toString(),
                    )
                    if (!create.success || create.data == null) {
                        throw IllegalStateException(create.error ?: "Failed to create order")
                    }
                    create.data.id
                }
                val complete = api.completeOrder(
                    targetId,
                    CompleteOrderRequest(payments = listOf(PaymentInput(method = method, amount = total))),
                )
                if (!complete.success || complete.data == null) {
                    throw IllegalStateException(complete.error ?: "Failed to complete sale")
                }
                tableSession.clear()
                _state.update {
                    it.copy(
                        charging = false,
                        cart = emptyList(),
                        step = PosStep.Receipt,
                        lastOrderNumber = complete.data.orderNumber,
                        lastOrderTotal = complete.data.total,
                        activeOrderId = null,
                        paymentOrderId = null,
                        billRequested = false,
                        selectedTableId = null,
                        selectedTableName = null,
                    )
                }
                load()
            } catch (ex: Exception) {
                _state.update { it.copy(charging = false, error = ex.message) }
            }
        }
    }

    fun newSale() {
        tableSession.clear()
        _state.update {
            it.copy(
                step = PosStep.Browse,
                lastOrderNumber = "",
                lastOrderTotal = 0.0,
                message = null,
                error = null,
                lastAddedProductId = null,
                activeOrderId = null,
                paymentOrderId = null,
                billRequested = false,
                cart = emptyList(),
                takeawayMode = false,
            )
        }
    }
}

@Composable
fun PosScreen(viewModel: PosViewModel, tableSession: TableSession) {
    val state by viewModel.state.collectAsState()
    val tableId by tableSession.selectedTableId.collectAsState()
    val activeOrderId by tableSession.activeOrderId.collectAsState()

    androidx.compose.runtime.LaunchedEffect(tableId, activeOrderId) {
        // Table session changes are handled in ViewModel collectors.
    }

    when (state.step) {
        PosStep.Browse -> PosBrowseScreen(state, viewModel)
        PosStep.Payment -> PaymentScreen(state, viewModel)
        PosStep.Receipt -> ReceiptScreen(state, viewModel)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PosBrowseScreen(state: PosUiState, viewModel: PosViewModel) {
    var showCart by remember { mutableStateOf(false) }
    var showTablePicker by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)
    val query = state.search.trim()
    val filtered = state.products.filter { product ->
        val matchesSearch = query.isBlank() ||
            product.name.contains(query, ignoreCase = true) ||
            product.sku.contains(query, ignoreCase = true) ||
            product.barcode?.contains(query, ignoreCase = true) == true ||
            product.categoryName?.contains(query, ignoreCase = true) == true
        val matchesCategory = state.selectedCategoryId == null || product.categoryId == state.selectedCategoryId
        matchesSearch && matchesCategory
    }
    val selectedCategoryName = state.categories.firstOrNull { it.id == state.selectedCategoryId }?.name
    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = ShadcnRing,
        unfocusedBorderColor = ShadcnBorder,
    )

    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            MobileTopBar(
                title = "POS",
                subtitle = if (state.posModeLabel.isNotBlank()) state.posModeLabel else state.storeName,
                trailing = {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = if (state.cartCount > 0) ShadcnPrimary else ShadcnMuted,
                        modifier = Modifier
                            .size(48.dp)
                            .clickable { showCart = true },
                    ) {
                        Row(
                            Modifier.fillMaxSize(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                        ) {
                            Icon(
                                Icons.Default.ShoppingCart,
                                contentDescription = "Cart",
                                modifier = Modifier.size(20.dp),
                                tint = if (state.cartCount > 0) Color.White else ShadcnForeground,
                            )
                            if (state.cartCount > 0) {
                                Spacer(Modifier.size(4.dp))
                                Text(
                                    "${state.cartCount}",
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelMedium,
                                )
                            }
                        }
                    }
                },
            )
            HorizontalDivider(color = ShadcnBorder)

            if (state.showTablePicker) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    FilterChip(
                        selected = state.takeawayMode,
                        onClick = { viewModel.setTakeawayMode(true) },
                        label = { Text("Takeaway") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = ShadcnPrimary,
                            selectedLabelColor = Color.White,
                        ),
                    )
                    FilterChip(
                        selected = state.dineInMode && state.selectedTableId != null,
                        onClick = { showTablePicker = true },
                        label = {
                            Text(
                                when {
                                    state.selectedTableName != null -> "Table ${state.selectedTableName}"
                                    state.dineInMode -> "Select table"
                                    else -> "Table"
                                },
                                maxLines = 1,
                            )
                        },
                        leadingIcon = if (state.dineInMode) {
                            { Icon(Icons.Default.TableBar, contentDescription = null, modifier = Modifier.size(16.dp)) }
                        } else null,
                    )
                    if (state.activeOrderId != null && state.billRequested) {
                        FilterChip(
                            selected = true,
                            onClick = {},
                            enabled = false,
                            label = { Text("Bill requested") },
                        )
                    }
                }
            }

            // Search + categories
            Column(
                Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(bottom = 6.dp),
            ) {
                OutlinedTextField(
                    value = state.search,
                    onValueChange = viewModel::onSearchChange,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    placeholder = { Text(state.searchPlaceholder, color = ShadcnMutedForeground) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = ShadcnMutedForeground)
                    },
                    trailingIcon = {
                        if (state.search.isNotEmpty()) {
                            IconButton(onClick = viewModel::clearSearch) {
                                Icon(Icons.Default.Close, contentDescription = "Clear search", modifier = Modifier.size(18.dp))
                            }
                        }
                    },
                    singleLine = true,
                    shape = MaterialTheme.shapes.medium,
                    colors = fieldColors,
                )

                Spacer(Modifier.height(10.dp))

                if (state.showCategories) {
                    Text(
                        "Categories",
                        style = MaterialTheme.typography.labelMedium,
                        color = ShadcnMutedForeground,
                        modifier = Modifier.padding(horizontal = 16.dp),
                    )
                    Spacer(Modifier.height(6.dp))
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState())
                            .padding(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        CategoryChip("All", state.selectedCategoryId == null) { viewModel.onCategorySelected(null) }
                        state.categories.forEach { cat ->
                            CategoryChip(cat.name, state.selectedCategoryId == cat.id) {
                                viewModel.onCategorySelected(cat.id)
                            }
                        }
                    }
                    Spacer(Modifier.height(8.dp))
                }

                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = when {
                            selectedCategoryName != null && query.isNotBlank() ->
                                "$selectedCategoryName · ${filtered.size} results"
                            selectedCategoryName != null -> selectedCategoryName
                            query.isNotBlank() -> "${filtered.size} results for \"$query\""
                            state.retailMode -> "${filtered.size} products · scan or tap"
                            else -> "${filtered.size} products · tap to add"
                        },
                        style = MaterialTheme.typography.labelSmall,
                        color = ShadcnMutedForeground,
                    )
                }
            }

            state.message?.let {
                Text(
                    it,
                    color = ChargeGreen,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                )
            }
            state.error?.let {
                Text(
                    it,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp),
                )
            }

            when {
                state.loading -> LoadingCenter(Modifier.weight(1f))
                filtered.isEmpty() -> EmptyState(
                    title = if (query.isNotBlank() || state.selectedCategoryId != null) "No products found" else "No products",
                    message = if (query.isNotBlank()) "Try another search or category" else "Pull to refresh by leaving and re-opening POS",
                    icon = Icons.Default.Search,
                    modifier = Modifier.weight(1f),
                )
                else -> LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(filtered, key = { it.id }) { product ->
                        ProductTile(
                            product = product,
                            cartQuantity = state.cartQuantity(product.id),
                            highlighted = state.lastAddedProductId == product.id,
                            onClick = { viewModel.addProduct(product) },
                        )
                    }
                }
            }

            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp,
            ) {
                Column(Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
                    if (state.cartCount > 0) {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            Text("${state.cartCount} items", style = MaterialTheme.typography.bodySmall)
                            Text(
                                Formatters.formatMoney(state.cartTotal),
                                fontWeight = FontWeight.SemiBold,
                                style = MaterialTheme.typography.bodyMedium,
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                    }
                    when {
                        state.dineInMode -> {
                            ShadcnButton(
                                text = if (state.charging) "Saving…" else "Save & send to kitchen",
                                onClick = viewModel::saveAndSendToKitchen,
                                modifier = Modifier.fillMaxWidth(),
                                enabled = state.cartCount > 0 && !state.charging,
                                loading = state.charging,
                            )
                            if (state.activeOrderId != null) {
                                Spacer(Modifier.height(8.dp))
                                ShadcnButton(
                                    text = "Request bill",
                                    onClick = viewModel::requestBill,
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !state.billRequested && !state.charging,
                                    variant = ShadcnButtonVariant.Outline,
                                )
                            }
                            if (state.billRequested) {
                                Spacer(Modifier.height(8.dp))
                                ShadcnButton(
                                    text = "Take payment · ${Formatters.formatMoney(state.paymentTotal)}",
                                    onClick = viewModel::goToPayment,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            }
                        }
                        else -> {
                            ShadcnButton(
                                text = if (state.cartCount == 0) {
                                    "Add products to cart"
                                } else {
                                    "Checkout · ${Formatters.formatMoney(state.cartTotal)}"
                                },
                                onClick = { if (state.cartCount > 0) viewModel.goToPayment() },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = state.cartCount > 0,
                            )
                        }
                    }
                }
            }
        }
    }

    if (showTablePicker) {
        val tableSheet = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        ModalBottomSheet(
            onDismissRequest = { showTablePicker = false },
            sheetState = tableSheet,
            containerColor = MaterialTheme.colorScheme.background,
        ) {
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
                Text("Select table", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(12.dp))
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.height(360.dp),
                ) {
                    items(state.tables, key = { it.id }) { table ->
                        Surface(
                            onClick = {
                                viewModel.selectTable(table)
                                viewModel.setTakeawayMode(false)
                                showTablePicker = false
                            },
                            shape = MaterialTheme.shapes.large,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (state.selectedTableId == table.id) ShadcnPrimary else ShadcnBorder,
                            ),
                        ) {
                            Column(Modifier.padding(12.dp)) {
                                Text(table.name, fontWeight = FontWeight.Bold)
                                Text(
                                    table.status,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = ShadcnMutedForeground,
                                )
                                Text("${table.capacity} seats", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
            }
        }
    }

    if (showCart) {
        ModalBottomSheet(
            onDismissRequest = { showCart = false },
            sheetState = sheetState,
            shape = MaterialTheme.shapes.extraLarge,
            containerColor = MaterialTheme.colorScheme.background,
        ) {
            Column(Modifier.padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text("Current order", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
                Text(
                    "${state.cartCount} items · ${Formatters.formatMoney(state.cartTotal)}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = ShadcnMutedForeground,
                )
                Spacer(Modifier.height(12.dp))
                if (state.cart.isEmpty()) {
                    Text("Tap products to add them here", style = MaterialTheme.typography.bodyMedium)
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.height(280.dp),
                    ) {
                        items(state.cart, key = { it.product.id }) { line ->
                            CartRow(
                                line,
                                { viewModel.addProduct(line.product) },
                                { viewModel.decreaseProduct(line.product.id) },
                            )
                        }
                    }
                }
                Spacer(Modifier.height(16.dp))
                ShadcnButton(
                    text = "Checkout · ${Formatters.formatMoney(state.cartTotal)}",
                    onClick = { showCart = false; viewModel.goToPayment() },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = state.cart.isNotEmpty(),
                )
                Spacer(Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun CategoryChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = ShadcnPrimary,
            selectedLabelColor = Color.White,
            containerColor = ShadcnMuted,
            labelColor = ShadcnForeground,
        ),
        border = FilterChipDefaults.filterChipBorder(
            enabled = true,
            selected = selected,
            borderColor = ShadcnBorder,
            selectedBorderColor = ShadcnPrimary,
        ),
    )
}

@Composable
private fun PaymentScreen(state: PosUiState, viewModel: PosViewModel) {
    ShadcnScreen {
        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = viewModel::backToBrowse) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                }
                Text("Payment", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.SemiBold)
            }

            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .border(1.dp, ShadcnForeground.copy(alpha = 0.1f), MaterialTheme.shapes.large),
                shape = MaterialTheme.shapes.large,
                color = MaterialTheme.colorScheme.surface,
            ) {
                Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Total due", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        Formatters.formatMoney(
                            if (state.paymentOrderId != null) state.paymentTotal else state.cartTotal,
                        ),
                        style = MaterialTheme.typography.displaySmall,
                        fontWeight = FontWeight.Bold,
                    )
                    if (state.cartTax > 0) {
                        Spacer(Modifier.height(8.dp))
                        Text(
                            String.format("Subtotal %.2f · Tax %.2f", state.cartSubtotal, state.cartTax),
                            style = MaterialTheme.typography.bodySmall,
                            color = ShadcnMutedForeground,
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            if (state.charging) {
                LoadingCenter(Modifier.fillMaxWidth().padding(32.dp))
            } else {
                Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    ShadcnButton(text = "Pay with Cash", onClick = viewModel::payCash, modifier = Modifier.fillMaxWidth())
                    ShadcnButton(
                        text = "Pay with Card",
                        onClick = viewModel::payCard,
                        modifier = Modifier.fillMaxWidth(),
                        variant = ShadcnButtonVariant.Outline,
                    )
                }
            }
        }
    }
}

@Composable
private fun ReceiptScreen(state: PosUiState, viewModel: PosViewModel) {
    ShadcnScreen {
        Column(
            Modifier.fillMaxSize().padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Box(
                modifier = Modifier.size(72.dp).clip(CircleShape).background(ChargeGreen.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = ChargeGreen, modifier = Modifier.size(40.dp))
            }
            Spacer(Modifier.height(16.dp))
            Text("Payment successful", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.SemiBold)
            Text("#${state.lastOrderNumber}", style = MaterialTheme.typography.titleLarge, color = ShadcnMutedForeground)
            if (state.lastOrderTotal > 0) {
                Text(
                    Formatters.formatMoney(state.lastOrderTotal),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
            Spacer(Modifier.height(28.dp))
            ShadcnButton(
                text = "Print receipt — coming soon",
                onClick = {},
                modifier = Modifier.fillMaxWidth(),
                enabled = false,
                variant = ShadcnButtonVariant.Outline,
            )
            Spacer(Modifier.height(10.dp))
            ShadcnButton(text = "New sale", onClick = viewModel::newSale, modifier = Modifier.fillMaxWidth())
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductTile(
    product: ProductDto,
    cartQuantity: Int,
    highlighted: Boolean,
    onClick: () -> Unit,
) {
    val price = product.storePrice ?: product.basePrice
    val borderColor by animateColorAsState(
        if (highlighted) ShadcnPrimary else ShadcnForeground.copy(alpha = 0.1f),
        label = "productBorder",
    )
    val bgColor by animateColorAsState(
        if (highlighted) ShadcnPrimary.copy(alpha = 0.06f) else MaterialTheme.colorScheme.surface,
        label = "productBg",
    )

    Surface(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().height(128.dp),
        shape = MaterialTheme.shapes.large,
        color = bgColor,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
    ) {
        Box(Modifier.fillMaxSize()) {
            Column(
                Modifier
                    .fillMaxSize()
                    .padding(12.dp),
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Column {
                    if (!product.categoryName.isNullOrBlank()) {
                        Text(
                            product.categoryName,
                            style = MaterialTheme.typography.labelSmall,
                            color = ShadcnMutedForeground,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                        Spacer(Modifier.height(2.dp))
                    }
                    Text(
                        product.name,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 18.sp,
                    )
                }
                Row(
                    Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column {
                        Text(
                            Formatters.formatMoney(price),
                            fontWeight = FontWeight.SemiBold,
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        product.stockOnHand?.let { stock ->
                            Text("Stock $stock", style = MaterialTheme.typography.labelSmall, color = ShadcnMutedForeground)
                        }
                    }
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(ShadcnPrimary),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add to order", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }

            if (cartQuantity > 0) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(ShadcnPrimary),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        cartQuantity.toString(),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}

@Composable
private fun CartRow(line: CartLine, onIncrease: () -> Unit, onDecrease: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().border(1.dp, ShadcnBorder, MaterialTheme.shapes.medium),
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            Modifier.fillMaxWidth().padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(Modifier.weight(1f)) {
                Text(line.product.name, maxLines = 1, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.Medium)
                Text(Formatters.formatMoney(line.lineTotal), style = MaterialTheme.typography.bodySmall)
            }
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clip(MaterialTheme.shapes.small).background(ShadcnMuted),
            ) {
                IconButton(onClick = onDecrease, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Remove, contentDescription = null, modifier = Modifier.size(16.dp))
                }
                Text(line.quantity.toString(), fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 4.dp))
                IconButton(onClick = onIncrease, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
