package com.bluraypos.terminal.data.tenant

import com.bluraypos.terminal.data.api.ApiClient
import com.bluraypos.terminal.data.prefs.SessionStore

object TenantSync {
    suspend fun refresh(sessionStore: SessionStore) {
        try {
            val api = ApiClient.create(sessionStore)
            val response = api.getMe()
            if (response.success && response.data != null) {
                val me = response.data
                val features = me.tenantFeatures?.let(TenantFeatures::fromDto)
                    ?: TenantFeatures.resolve(
                        businessType = me.businessType,
                        hasInventory = me.subscription?.hasInventory ?: true,
                        hasKitchen = me.subscription?.hasKitchen ?: false,
                        hasDelivery = me.subscription?.hasDelivery ?: false,
                    )
                sessionStore.saveTenantFeatures(features)
            }
        } catch (_: Exception) {
            // Keep cached features if refresh fails
        }
    }
}
