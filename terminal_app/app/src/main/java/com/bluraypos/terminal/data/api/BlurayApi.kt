package com.bluraypos.terminal.data.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface BlurayApi {
    @GET("health")
    suspend fun healthCheck(): HealthDto

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>

    @GET("api/auth/me")
    suspend fun getMe(): ApiResponse<MeResponse>

    @GET("api/categories")
    suspend fun getCategories(): ApiResponse<List<CategoryDto>>

    @GET("api/reports/dashboard")
    suspend fun getDashboard(
        @Query("storeId") storeId: String? = null,
    ): ApiResponse<DashboardReportDto>

    @GET("api/orders")
    suspend fun getOrders(
        @Query("storeId") storeId: String,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 50,
    ): ApiResponse<PagedResult<OrderDto>>

    @GET("api/orders/{id}")
    suspend fun getOrder(@Path("id") orderId: String): ApiResponse<OrderDto>

    @GET("api/products")
    suspend fun getProducts(
        @Query("search") search: String? = null,
        @Query("storeId") storeId: String? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 200,
    ): ApiResponse<PagedResult<ProductDto>>

    @GET("api/tables")
    suspend fun getTables(@Query("storeId") storeId: String): ApiResponse<List<DiningTableDto>>

    @GET("api/tables/{id}")
    suspend fun getTable(@Path("id") tableId: String): ApiResponse<DiningTableDto>

    @POST("api/orders")
    suspend fun createOrder(
        @Body request: CreateOrderRequest,
        @Header("Idempotency-Key") idempotencyKey: String,
    ): ApiResponse<OrderDto>

    @PUT("api/orders/{id}")
    suspend fun updateOrder(
        @Path("id") orderId: String,
        @Body request: CreateOrderRequest,
    ): ApiResponse<OrderDto>

    @POST("api/orders/{id}/send-to-kitchen")
    suspend fun sendToKitchen(@Path("id") orderId: String): ApiResponse<OrderDto>

    @POST("api/orders/{id}/request-bill")
    suspend fun requestBill(@Path("id") orderId: String): ApiResponse<OrderDto>

    @POST("api/orders/{id}/complete")
    suspend fun completeOrder(
        @Path("id") orderId: String,
        @Body request: CompleteOrderRequest,
    ): ApiResponse<OrderDto>
}
