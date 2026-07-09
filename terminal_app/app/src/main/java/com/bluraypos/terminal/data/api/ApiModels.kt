package com.bluraypos.terminal.data.api

data class ApiResponse<T>(
    val success: Boolean,
    val data: T?,
    val error: String?,
)

data class PagedResult<T>(
    val items: List<T>,
    val totalCount: Int,
    val page: Int,
    val pageSize: Int,
)

data class LoginRequest(
    val email: String,
    val password: String,
    val storeId: String? = null,
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresAt: String,
    val user: UserDto,
    val roles: List<String>,
    val permissions: List<String>,
    val stores: List<StoreDto>,
)

data class MeResponse(
    val user: UserDto,
    val roles: List<String>,
    val permissions: List<String>,
    val subscription: SubscriptionDto?,
    val businessType: String?,
    val tenantFeatures: TenantFeaturesDto?,
)

data class SubscriptionDto(
    val planName: String? = null,
    val hasInventory: Boolean = true,
    val hasKitchen: Boolean = false,
    val hasDelivery: Boolean = false,
)

data class TenantFeaturesDto(
    val businessType: String,
    val catalogIngredients: Boolean,
    val catalogRecipes: Boolean,
    val catalogInventory: Boolean,
    val posBarcodeRetail: Boolean,
    val posTables: Boolean,
    val posKitchen: Boolean,
    val posDelivery: Boolean,
)

data class UserDto(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val organizationId: String?,
    val defaultStoreId: String?,
)

data class StoreDto(
    val id: String,
    val name: String,
    val code: String,
    val address: String?,
    val phone: String?,
    val isActive: Boolean,
)

data class ProductDto(
    val id: String,
    val categoryId: String?,
    val name: String,
    val sku: String,
    val barcode: String?,
    val description: String?,
    val basePrice: Double,
    val taxRate: Double,
    val isActive: Boolean,
    val trackInventory: Boolean,
    val inventoryMode: String,
    val categoryName: String?,
    val storePrice: Double?,
    val stockOnHand: Int?,
)

data class CreateOrderLineRequest(
    val productId: String,
    val productVariantId: String? = null,
    val quantity: Int,
    val unitPrice: Double? = null,
    val discountAmount: Double = 0.0,
)

data class CreateOrderRequest(
    val lines: List<CreateOrderLineRequest>,
    val discountAmount: Double = 0.0,
    val notes: String? = null,
    val customerId: String? = null,
    val diningTableId: String? = null,
    val serviceType: String? = null,
)

data class PaymentInput(
    val method: String,
    val amount: Double,
    val reference: String? = null,
    val slipImagePath: String? = null,
)

data class CompleteOrderRequest(
    val payments: List<PaymentInput>,
)

data class OrderLineDto(
    val id: String,
    val productId: String,
    val productName: String,
    val sku: String,
    val quantity: Int,
    val unitPrice: Double,
    val taxRate: Double,
    val discountAmount: Double,
    val lineTotal: Double,
)

data class PaymentDto(
    val id: String,
    val method: String,
    val status: String,
    val amount: Double,
    val reference: String? = null,
)

data class OrderDto(
    val id: String,
    val orderNumber: String,
    val status: String,
    val subtotal: Double,
    val taxAmount: Double,
    val discountAmount: Double,
    val total: Double,
    val createdAt: String? = null,
    val completedAt: String? = null,
    val lines: List<OrderLineDto> = emptyList(),
    val payments: List<PaymentDto> = emptyList(),
    val diningTableId: String? = null,
    val diningTableName: String? = null,
    val serviceType: String? = null,
    val sentToKitchenAt: String? = null,
    val billRequestedAt: String? = null,
)

data class DiningTableDto(
    val id: String,
    val name: String,
    val code: String?,
    val capacity: Int,
    val diningAreaId: String? = null,
    val areaName: String?,
    val status: String,
    val activeOrderId: String?,
    val activeOrderNumber: String?,
    val activeOrderTotal: Double?,
    val sentToKitchen: Boolean,
    val billRequested: Boolean,
)

data class CategoryDto(
    val id: String,
    val name: String,
    val description: String?,
    val sortOrder: Int,
    val productCount: Int,
)

data class DashboardReportDto(
    val todaySales: Double,
    val todayOrders: Int,
    val weekSales: Double,
    val weekOrders: Int,
    val topProducts: List<TopProductDto> = emptyList(),
    val storeSales: List<StoreSalesDto> = emptyList(),
)

data class TopProductDto(
    val productId: String,
    val productName: String,
    val quantitySold: Int,
    val revenue: Double,
)

data class StoreSalesDto(
    val storeId: String,
    val storeName: String,
    val totalSales: Double,
    val orderCount: Int,
)

data class HealthDto(
    val status: String,
    val timestamp: String? = null,
)
