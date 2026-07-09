package com.bluraypos.terminal.data.prefs

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.bluraypos.terminal.data.ApiConfig
import com.bluraypos.terminal.data.tenant.TenantFeatures
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore("bluray_session")

class SessionStore(private val context: Context) {
    private val accessTokenKey = stringPreferencesKey("access_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")
    private val storeIdKey = stringPreferencesKey("store_id")
    private val storeNameKey = stringPreferencesKey("store_name")
    private val userIdKey = stringPreferencesKey("user_id")
    private val userEmailKey = stringPreferencesKey("user_email")
    private val userDisplayNameKey = stringPreferencesKey("user_display_name")
    private val userRolesKey = stringPreferencesKey("user_roles")
    private val businessTypeKey = stringPreferencesKey("business_type")
    private val catalogIngredientsKey = booleanPreferencesKey("tf_catalog_ingredients")
    private val catalogRecipesKey = booleanPreferencesKey("tf_catalog_recipes")
    private val catalogInventoryKey = booleanPreferencesKey("tf_catalog_inventory")
    private val posBarcodeRetailKey = booleanPreferencesKey("tf_pos_barcode")
    private val posTablesKey = booleanPreferencesKey("tf_pos_tables")
    private val posKitchenKey = booleanPreferencesKey("tf_pos_kitchen")
    private val posDeliveryKey = booleanPreferencesKey("tf_pos_delivery")

    /** Fixed at build time — production in release, LAN API in debug. */
    val apiBaseUrl: Flow<String> = kotlinx.coroutines.flow.flowOf(ApiConfig.baseUrl)

    val accessToken: Flow<String?> = context.dataStore.data.map { it[accessTokenKey] }
    val storeId: Flow<String?> = context.dataStore.data.map { it[storeIdKey] }
    val storeName: Flow<String?> = context.dataStore.data.map { it[storeNameKey] }
    val userId: Flow<String?> = context.dataStore.data.map { it[userIdKey] }
    val userEmail: Flow<String?> = context.dataStore.data.map { it[userEmailKey] }
    val userDisplayName: Flow<String?> = context.dataStore.data.map { it[userDisplayNameKey] }
    val userRoles: Flow<List<String>> = context.dataStore.data.map { prefs ->
        prefs[userRolesKey]
            ?.split(',')
            ?.map { it.trim() }
            ?.filter { it.isNotEmpty() }
            ?: emptyList()
    }

    val tenantFeatures: Flow<TenantFeatures> = context.dataStore.data.map { prefs ->
        TenantFeatures(
            businessType = prefs[businessTypeKey] ?: "Hybrid",
            catalogIngredients = prefs[catalogIngredientsKey] ?: true,
            catalogRecipes = prefs[catalogRecipesKey] ?: true,
            catalogInventory = prefs[catalogInventoryKey] ?: true,
            posBarcodeRetail = prefs[posBarcodeRetailKey] ?: true,
            posTables = prefs[posTablesKey] ?: true,
            posKitchen = prefs[posKitchenKey] ?: false,
            posDelivery = prefs[posDeliveryKey] ?: false,
        )
    }

    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { !it[accessTokenKey].isNullOrBlank() }

    suspend fun saveLogin(
        accessToken: String,
        refreshToken: String,
        storeId: String,
        storeName: String,
        userId: String,
        email: String,
        displayName: String,
        roles: List<String>,
    ) {
        context.dataStore.edit { prefs ->
            prefs[accessTokenKey] = accessToken
            prefs[refreshTokenKey] = refreshToken
            prefs[storeIdKey] = storeId
            prefs[storeNameKey] = storeName
            prefs[userIdKey] = userId
            prefs[userEmailKey] = email
            prefs[userDisplayNameKey] = displayName
            prefs[userRolesKey] = roles.joinToString(",")
        }
    }

    suspend fun saveTenantFeatures(features: TenantFeatures) {
        context.dataStore.edit { prefs ->
            prefs[businessTypeKey] = features.businessType
            prefs[catalogIngredientsKey] = features.catalogIngredients
            prefs[catalogRecipesKey] = features.catalogRecipes
            prefs[catalogInventoryKey] = features.catalogInventory
            prefs[posBarcodeRetailKey] = features.posBarcodeRetail
            prefs[posTablesKey] = features.posTables
            prefs[posKitchenKey] = features.posKitchen
            prefs[posDeliveryKey] = features.posDelivery
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }
}
