using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;

namespace Pos.Application.Common;

/// <summary>
/// Resolves enabled modules from org industry + subscription plan.
/// Industry sets UX defaults; plan flags are billing gates.
/// </summary>
public static class TenantFeatureResolver
{
    public static TenantFeaturesDto Resolve(BusinessType businessType, Plan? plan)
    {
        var hasInventory = plan?.HasInventory ?? true;
        var hasKitchen = plan?.HasKitchen ?? false;
        var hasDelivery = plan?.HasDelivery ?? false;
        var hasOnlineMenu = plan?.HasOnlineMenu ?? false;
        var hasOnlineOrdering = plan?.HasOnlineOrdering ?? false;
        var hasCoupons = plan?.HasCoupons ?? false;
        var hasHr = plan?.HasHr ?? false;
        var isRestaurant = businessType is BusinessType.Restaurant or BusinessType.Hybrid;

        return businessType switch
        {
            BusinessType.Retail => new TenantFeaturesDto(
                BusinessType: businessType.ToString(),
                CatalogIngredients: false,
                CatalogRecipes: false,
                CatalogInventory: hasInventory,
                PosBarcodeRetail: true,
                PosTables: false,
                PosKitchen: false,
                PosDelivery: false,
                OnlineMenu: false,
                OnlineOrdering: hasOnlineOrdering,
                OfficeCoupons: hasCoupons,
                OfficeHr: hasHr),
            BusinessType.Restaurant => new TenantFeaturesDto(
                BusinessType: businessType.ToString(),
                CatalogIngredients: true,
                CatalogRecipes: true,
                CatalogInventory: hasInventory,
                PosBarcodeRetail: false,
                PosTables: true,
                PosKitchen: hasKitchen,
                PosDelivery: hasDelivery,
                OnlineMenu: hasOnlineMenu,
                OnlineOrdering: hasOnlineOrdering,
                OfficeCoupons: hasCoupons,
                OfficeHr: hasHr),
            _ => new TenantFeaturesDto(
                BusinessType: BusinessType.Hybrid.ToString(),
                CatalogIngredients: true,
                CatalogRecipes: true,
                CatalogInventory: hasInventory,
                PosBarcodeRetail: true,
                PosTables: true,
                PosKitchen: hasKitchen,
                PosDelivery: hasDelivery,
                OnlineMenu: hasOnlineMenu && isRestaurant,
                OnlineOrdering: hasOnlineOrdering,
                OfficeCoupons: hasCoupons,
                OfficeHr: hasHr)
        };
    }

    public static TenantFeaturesDto Resolve(Organization org, Plan? plan) =>
        Resolve(org.BusinessType, plan);
}
