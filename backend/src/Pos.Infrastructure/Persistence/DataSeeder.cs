using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Pos.Application.Common;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Platform;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Persistence;

public static class DataSeeder
{
    private static readonly string[] CanonicalPlanSlugs = ["free", "pro"];
    private const int UnlimitedThreshold = 100_000;

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<PosDbContext>>();

        await db.Database.MigrateAsync(cancellationToken);

        foreach (var role in Enum.GetNames<UserRole>())
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        await permissionService.SeedAsync(cancellationToken);
        await permissionService.SyncAsync(cancellationToken);
        await EnsureCanonicalPlansAsync(db, cancellationToken);

        if (!await db.Organizations.AnyAsync(cancellationToken))
        {
            await SeedDemoOrganizationAsync(db, userManager, cancellationToken);
            logger.LogInformation("Seeded demo store and users.");
        }

        await EnsureSuperAdminAsync(userManager, db, cancellationToken);
        await EnsureDemoWaiterAsync(userManager, db, cancellationToken);
        await EnsureDemoSubscriptionAsync(db, cancellationToken);
        await EnsureDemoSuppliesAsync(db, cancellationToken);
        await EnsurePlatformSettingsAsync(db, cancellationToken);
    }

    private static async Task EnsureCanonicalPlansAsync(PosDbContext db, CancellationToken ct)
    {
        foreach (var spec in CanonicalPlans())
        {
            var plan = await db.Plans.FirstOrDefaultAsync(p => p.Slug == spec.Slug, ct);
            if (plan == null)
            {
                db.Plans.Add(spec);
                continue;
            }

            ApplyPlanSpec(plan, spec);
        }

        await db.SaveChangesAsync(ct);

        var freePlan = await db.Plans.FirstAsync(p => p.Slug == "free", ct);
        var proPlan = await db.Plans.FirstOrDefaultAsync(p => p.Slug == "pro", ct);
        var junkPlans = await db.Plans.Where(p => !CanonicalPlanSlugs.Contains(p.Slug)).ToListAsync(ct);

        foreach (var junk in junkPlans)
        {
            var targetPlanId = junk.Slug == "basic" && proPlan != null ? proPlan.Id : freePlan.Id;

            var subs = await db.Subscriptions.IgnoreQueryFilters()
                .Where(s => s.PlanId == junk.Id)
                .ToListAsync(ct);
            foreach (var sub in subs)
                sub.PlanId = targetPlanId;

            var payments = await db.SubscriptionPayments.IgnoreQueryFilters()
                .Where(p => p.PlanId == junk.Id)
                .ToListAsync(ct);
            foreach (var payment in payments)
                payment.PlanId = targetPlanId;

            db.Plans.Remove(junk);
        }

        if (junkPlans.Count > 0)
            await db.SaveChangesAsync(ct);
    }

    private static IEnumerable<Plan> CanonicalPlans() =>
    [
        new Plan
        {
            Name = "Free",
            Slug = "free",
            Description = "Get started — 1 branch, 3 users, up to 25 products, basic reports",
            PriceMonthly = 0,
            PriceYearly = 0,
            MaxStores = 1,
            MaxUsers = 3,
            MaxTerminals = 1,
            MaxProducts = 25,
            MaxMonthlyOrders = 200,
            HasInventory = false,
            HasKitchen = false,
            HasDelivery = false,
            HasAccounting = false,
            HasAdvancedReports = false,
            HasApi = false,
            HasPurchases = false,
            SortOrder = 1,
            IsActive = true
        },
        new Plan
        {
            Name = "Pro",
            Slug = "pro",
            Description = "Unlimited everything — all modules, API access, and priority support",
            PriceMonthly = 0,
            PriceYearly = 14999,
            MaxStores = UnlimitedThreshold,
            MaxUsers = UnlimitedThreshold,
            MaxTerminals = UnlimitedThreshold,
            MaxProducts = UnlimitedThreshold,
            MaxMonthlyOrders = UnlimitedThreshold,
            HasInventory = true,
            HasKitchen = true,
            HasDelivery = true,
            HasAccounting = true,
            HasAdvancedReports = true,
            HasApi = true,
            HasPurchases = true,
            SortOrder = 2,
            IsActive = true
        }
    ];

    private static void ApplyPlanSpec(Plan target, Plan spec)
    {
        target.Name = spec.Name;
        target.Description = spec.Description;
        target.PriceMonthly = spec.PriceMonthly;
        target.PriceYearly = spec.PriceYearly;
        target.MaxStores = spec.MaxStores;
        target.MaxUsers = spec.MaxUsers;
        target.MaxTerminals = spec.MaxTerminals;
        target.MaxProducts = spec.MaxProducts;
        target.MaxMonthlyOrders = spec.MaxMonthlyOrders;
        target.HasInventory = spec.HasInventory;
        target.HasKitchen = spec.HasKitchen;
        target.HasDelivery = spec.HasDelivery;
        target.HasAccounting = spec.HasAccounting;
        target.HasAdvancedReports = spec.HasAdvancedReports;
        target.HasApi = spec.HasApi;
        target.HasPurchases = spec.HasPurchases;
        target.SortOrder = spec.SortOrder;
        target.IsActive = true;
    }

    private static async Task SeedDemoOrganizationAsync(PosDbContext db, UserManager<ApplicationUser> userManager, CancellationToken ct)
    {
        var proPlan = await db.Plans.FirstAsync(p => p.Slug == "pro", ct);

        var org = new Organization
        {
            Name = "Demo Store",
            Slug = "demo",
            DefaultTaxRate = 0.08m,
            Currency = "MVR",
            Timezone = "Indian/Maldives",
            ReceiptHeader = "Demo Store",
            ReceiptFooter = "Thank you for your purchase!"
        };
        db.Organizations.Add(org);

        db.Subscriptions.Add(new Subscription
        {
            OrganizationId = org.Id,
            PlanId = proPlan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = DateTime.UtcNow,
            CurrentPeriodEnd = DateTime.UtcNow.AddYears(1)
        });

        var mainStore = new Store { OrganizationId = org.Id, Name = "Main Branch", Code = "MAIN", Address = "100 Main Street", Phone = "555-0100" };
        db.Stores.Add(mainStore);

        var beverages = new Category { OrganizationId = org.Id, Name = "Beverages", SortOrder = 1 };
        var snacks = new Category { OrganizationId = org.Id, Name = "Snacks", SortOrder = 2 };
        db.Categories.AddRange(beverages, snacks);

        var products = new[]
        {
            new Product { OrganizationId = org.Id, CategoryId = beverages.Id, Name = "Cola 12oz", Sku = "COLA-12", Barcode = "100001", BasePrice = 1.99m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = beverages.Id, Name = "Bottled Water", Sku = "WATER-16", Barcode = "100002", BasePrice = 1.49m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = snacks.Id, Name = "Potato Chips", Sku = "CHIPS-REG", Barcode = "200001", BasePrice = 2.49m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = snacks.Id, Name = "Chocolate Bar", Sku = "CHOC-BAR", Barcode = "200002", BasePrice = 1.79m, TaxRate = 0.08m },
        };
        db.Products.AddRange(products);
        await db.SaveChangesAsync(ct);

        db.Terminals.Add(new Terminal { OrganizationId = org.Id, StoreId = mainStore.Id, Name = "Register 1", Code = "REG1" });
        foreach (var product in products)
        {
            db.InventoryItems.Add(new InventoryItem { OrganizationId = org.Id, StoreId = mainStore.Id, ProductId = product.Id, QuantityOnHand = 100, ReorderLevel = 10 });
        }

        await db.SaveChangesAsync(ct);

        var superAdmin = new ApplicationUser
        {
            UserName = "admin@demo.com",
            Email = "admin@demo.com",
            EmailConfirmed = true,
            FirstName = "Super",
            LastName = "Admin",
            OrganizationId = null
        };

        var manager = new ApplicationUser
        {
            UserName = "manager@demo.com",
            Email = "manager@demo.com",
            EmailConfirmed = true,
            FirstName = "Maya",
            LastName = "Manager",
            OrganizationId = org.Id
        };

        var cashier = new ApplicationUser
        {
            UserName = "cashier@demo.com",
            Email = "cashier@demo.com",
            EmailConfirmed = true,
            FirstName = "Casey",
            LastName = "Cashier",
            OrganizationId = org.Id,
            DefaultStoreId = mainStore.Id
        };

        await userManager.CreateAsync(superAdmin, "Admin123!");
        await userManager.AddToRoleAsync(superAdmin, nameof(UserRole.SuperAdmin));

        await userManager.CreateAsync(manager, "Manager123!");
        await userManager.AddToRoleAsync(manager, nameof(UserRole.OrgAdmin));

        await userManager.CreateAsync(cashier, "Cashier123!");
        await userManager.AddToRoleAsync(cashier, nameof(UserRole.Cashier));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = cashier.Id, StoreId = mainStore.Id });

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureSuperAdminAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        var admin = await userManager.FindByEmailAsync("admin@demo.com");
        if (admin == null) return;

        if (admin.OrganizationId.HasValue)
        {
            admin.OrganizationId = null;
            await userManager.UpdateAsync(admin);
        }

        var roles = await userManager.GetRolesAsync(admin);
        if (!roles.Contains(nameof(UserRole.SuperAdmin)))
        {
            if (roles.Contains(nameof(UserRole.OrgAdmin)))
                await userManager.RemoveFromRoleAsync(admin, nameof(UserRole.OrgAdmin));
            await userManager.AddToRoleAsync(admin, nameof(UserRole.SuperAdmin));
        }

        // Migrate legacy orgadmin@demo.com to manager@demo.com
        var legacyOrgAdmin = await userManager.FindByEmailAsync("orgadmin@demo.com");
        if (legacyOrgAdmin != null)
        {
            var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
            if (org != null && !await userManager.Users.AnyAsync(u => u.Email == "manager@demo.com", ct))
            {
                legacyOrgAdmin.Email = "manager@demo.com";
                legacyOrgAdmin.UserName = "manager@demo.com";
                legacyOrgAdmin.FirstName = "Maya";
                legacyOrgAdmin.LastName = "Manager";
                await userManager.UpdateAsync(legacyOrgAdmin);
            }
            else
            {
                await userManager.DeleteAsync(legacyOrgAdmin);
            }
        }
    }

    private static async Task EnsureDemoWaiterAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        if (await userManager.FindByEmailAsync("waiter@demo.com") != null) return;

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        var store = org == null ? null : await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id, ct);
        if (org == null || store == null) return;

        var waiter = new ApplicationUser
        {
            UserName = "waiter@demo.com",
            Email = "waiter@demo.com",
            EmailConfirmed = true,
            FirstName = "Wendy",
            LastName = "Waiter",
            OrganizationId = org.Id,
            DefaultStoreId = store.Id
        };

        await userManager.CreateAsync(waiter, "Waiter123!");
        await userManager.AddToRoleAsync(waiter, nameof(UserRole.Waiter));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = waiter.Id, StoreId = store.Id });
        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoSubscriptionAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        org.Currency = "MVR";
        org.Timezone = "Indian/Maldives";

        var proPlan = await db.Plans.FirstAsync(p => p.Slug == "pro", ct);
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.OrganizationId == org.Id, ct);

        if (sub == null)
        {
            db.Subscriptions.Add(new Subscription
            {
                OrganizationId = org.Id,
                PlanId = proPlan.Id,
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = DateTime.UtcNow,
                CurrentPeriodEnd = DateTime.UtcNow.AddYears(1)
            });
        }
        else if (sub.PlanId != proPlan.Id && sub.PlanId != (await db.Plans.FirstAsync(p => p.Slug == "free", ct)).Id)
        {
            sub.PlanId = proPlan.Id;
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoSuppliesAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null || await db.SupplyItems.AnyAsync(ct)) return;

        var mainStore = await db.Stores.FirstAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        org.PaymentQrPayload = "00020101021229370016A000000677010112011300668000000005802TH530376454031005802TH6304";
        org.PaymentInstructions = "Scan QR to pay via bank transfer, then upload your slip at checkout.";

        var flour = new SupplyItem { OrganizationId = org.Id, Name = "Flour", Unit = "kg", Category = "Dry Goods", };
        var cheese = new SupplyItem { OrganizationId = org.Id, Name = "Cheese", Unit = "g", Category = "Dairy" };
        db.SupplyItems.AddRange(flour, cheese);

        db.StoreSupplyStocks.AddRange(
            new StoreSupplyStock { OrganizationId = org.Id, StoreId = mainStore.Id, SupplyItemId = flour.Id, CurrentStock = 50, CostPerUnit = 1.2m, LowStockThreshold = 5 },
            new StoreSupplyStock { OrganizationId = org.Id, StoreId = mainStore.Id, SupplyItemId = cheese.Id, CurrentStock = 5000, CostPerUnit = 0.02m, LowStockThreshold = 500 }
        );

        var sandwich = await db.Products.FirstOrDefaultAsync(p => p.OrganizationId == org.Id && p.Sku == "CHIPS-REG", ct);
        if (sandwich != null)
        {
            sandwich.InventoryMode = ProductInventoryMode.RecipeBased;
            db.ProductRecipes.AddRange(
                new ProductRecipe { OrganizationId = org.Id, ProductId = sandwich.Id, SupplyItemId = flour.Id, Quantity = 0.05m },
                new ProductRecipe { OrganizationId = org.Id, ProductId = sandwich.Id, SupplyItemId = cheese.Id, Quantity = 10m }
            );
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsurePlatformSettingsAsync(PosDbContext db, CancellationToken ct)
    {
        foreach (var (key, value) in PlatformSettingsKeys.Defaults)
        {
            if (await db.PlatformSettings.AnyAsync(s => s.Key == key, ct)) continue;
            db.PlatformSettings.Add(new PlatformSettings { Key = key, Value = value });
        }
        await db.SaveChangesAsync(ct);
    }
}
