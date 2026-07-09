package com.bluraypos.terminal.data.tenant

import com.bluraypos.terminal.data.api.TenantFeaturesDto

data class TenantFeatures(
    val businessType: String = "Hybrid",
    val catalogIngredients: Boolean = true,
    val catalogRecipes: Boolean = true,
    val catalogInventory: Boolean = true,
    val posBarcodeRetail: Boolean = true,
    val posTables: Boolean = true,
    val posKitchen: Boolean = false,
    val posDelivery: Boolean = false,
) {
    val isRetailMode: Boolean get() = posBarcodeRetail && !posTables
    val isRestaurantMode: Boolean get() = posTables && !posBarcodeRetail
    val isHybridMode: Boolean get() = !isRetailMode && !isRestaurantMode

    /** Bottom nav: Tables tab for restaurant, café, and hybrid stores. */
    val showTablesTab: Boolean get() = posTables

    val businessTypeLabel: String
        get() = when (businessType.lowercase()) {
            "retail" -> "Retail store"
            "restaurant" -> "Restaurant"
            else -> "Restaurant & retail"
        }

    val posModeLabel: String
        get() = when {
            isRetailMode -> "Retail — scan barcode to sell"
            isRestaurantMode -> "Restaurant — tap menu items"
            else -> "Hybrid — barcode scan & menu"
        }

    companion object {
        fun fromDto(dto: TenantFeaturesDto?): TenantFeatures {
            if (dto == null) return TenantFeatures()
            return TenantFeatures(
                businessType = dto.businessType,
                catalogIngredients = dto.catalogIngredients,
                catalogRecipes = dto.catalogRecipes,
                catalogInventory = dto.catalogInventory,
                posBarcodeRetail = dto.posBarcodeRetail,
                posTables = dto.posTables,
                posKitchen = dto.posKitchen,
                posDelivery = dto.posDelivery,
            )
        }

        fun resolve(
            businessType: String?,
            hasInventory: Boolean = true,
            hasKitchen: Boolean = false,
            hasDelivery: Boolean = false,
        ): TenantFeatures = when (businessType?.lowercase()) {
            "retail" -> TenantFeatures(
                businessType = "Retail",
                catalogIngredients = false,
                catalogRecipes = false,
                catalogInventory = hasInventory,
                posBarcodeRetail = true,
                posTables = false,
                posKitchen = false,
                posDelivery = false,
            )
            "restaurant" -> TenantFeatures(
                businessType = "Restaurant",
                catalogIngredients = true,
                catalogRecipes = true,
                catalogInventory = hasInventory,
                posBarcodeRetail = false,
                posTables = true,
                posKitchen = hasKitchen,
                posDelivery = hasDelivery,
            )
            else -> TenantFeatures(
                businessType = "Hybrid",
                catalogIngredients = true,
                catalogRecipes = true,
                catalogInventory = hasInventory,
                posBarcodeRetail = true,
                posTables = true,
                posKitchen = hasKitchen,
                posDelivery = hasDelivery,
            )
        }
    }
}
