using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Pos.Application.Common;
using Pos.Application.Features.Hr;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Platform;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Services;

namespace Pos.Infrastructure.Persistence;

public static class DataSeeder
{
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

        // Fallback if manual migration lacks EF Designer (ensures BusinessType column exists)
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Organizations" ADD COLUMN IF NOT EXISTS "BusinessType" integer NOT NULL DEFAULT 2;
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ('20260709032000_AddOrganizationBusinessType', '9.0.0')
            ON CONFLICT DO NOTHING;
            """);

        await db.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "DiningAreas" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "StoreId" uuid NOT NULL REFERENCES "Stores"("Id") ON DELETE CASCADE,
                "Name" text NOT NULL,
                "SortOrder" integer NOT NULL DEFAULT 0,
                "IsActive" boolean NOT NULL DEFAULT true,
                "OrganizationId" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                "UpdatedAt" timestamp with time zone NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false
            );
            CREATE TABLE IF NOT EXISTS "DiningTables" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "StoreId" uuid NOT NULL REFERENCES "Stores"("Id") ON DELETE CASCADE,
                "DiningAreaId" uuid NULL REFERENCES "DiningAreas"("Id"),
                "Name" text NOT NULL,
                "Code" text NULL,
                "Capacity" integer NOT NULL DEFAULT 4,
                "SortOrder" integer NOT NULL DEFAULT 0,
                "Status" integer NOT NULL DEFAULT 0,
                "QrToken" text NOT NULL DEFAULT '',
                "IsActive" boolean NOT NULL DEFAULT true,
                "OrganizationId" uuid NOT NULL,
                "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
                "UpdatedAt" timestamp with time zone NULL,
                "IsDeleted" boolean NOT NULL DEFAULT false
            );
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "DiningTableId" uuid NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "OrderSource" integer NOT NULL DEFAULT 0;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "ServiceType" integer NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "SentToKitchenAt" timestamp with time zone NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "BillRequestedAt" timestamp with time zone NULL;
            ALTER TABLE "DiningTables" ADD COLUMN IF NOT EXISTS "Size" integer NOT NULL DEFAULT 1;
            ALTER TABLE "Plans" ADD COLUMN IF NOT EXISTS "HasOnlineMenu" boolean NOT NULL DEFAULT false;
            ALTER TABLE "Plans" ADD COLUMN IF NOT EXISTS "HasOnlineOrdering" boolean NOT NULL DEFAULT false;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "PublicTrackingToken" text NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "CustomerName" text NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "CustomerPhone" text NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "DeliveryAddress" text NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "DeliveryNotes" text NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "ScheduledFor" timestamp with time zone NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "OnlinePaymentMethod" integer NULL;
            ALTER TABLE "Orders" ADD COLUMN IF NOT EXISTS "RejectedReason" text NULL;
            ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "IsOnlineVisible" boolean NOT NULL DEFAULT true;
            ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "OnlineDescription" text NULL;
            ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "ImageUrl" text NULL;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "OnlineMenuEnabled" boolean NOT NULL DEFAULT false;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "OnlineOrderingEnabled" boolean NOT NULL DEFAULT false;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "AllowPickup" boolean NOT NULL DEFAULT true;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "AllowDelivery" boolean NOT NULL DEFAULT false;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "AllowDineIn" boolean NOT NULL DEFAULT true;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "AllowCashOnDelivery" boolean NOT NULL DEFAULT true;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "AllowBankTransfer" boolean NOT NULL DEFAULT true;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "MinOrderAmount" numeric NOT NULL DEFAULT 0;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "DeliveryFeeFlat" numeric NOT NULL DEFAULT 0;
            ALTER TABLE "Stores" ADD COLUMN IF NOT EXISTS "OnlineMenuWelcomeText" text NULL;
            UPDATE "Plans" SET "HasOnlineMenu" = true, "HasOnlineOrdering" = true WHERE "Slug" = 'pro';
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ('20260709043000_AddOnlineOrderingModule', '9.0.0')
            ON CONFLICT DO NOTHING;
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ('20260709100000_AddDiningTables', '9.0.0')
            ON CONFLICT DO NOTHING;
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ('20260709120000_AddDiningTableSize', '9.0.0')
            ON CONFLICT DO NOTHING;
            """);

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
        await EnsureDemoUserAccessAsync(userManager, db, cancellationToken);
        await EnsureDemoCatalogAsync(db, cancellationToken);
        await EnsureDemoSalesAsync(db, cancellationToken);
        await EnsureDemoSubscriptionAsync(db, cancellationToken);
        await EnsureDemoSuppliesAsync(db, cancellationToken);
        await EnsureDemoDiningTablesAsync(db, cancellationToken);
        await EnsureDemoHrAsync(db, scope.ServiceProvider, cancellationToken);
        await EnsurePlatformSettingsAsync(db, cancellationToken);
    }

    public static async Task BootstrapPlansAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
        await db.Database.MigrateAsync(cancellationToken);
        await EnsureCanonicalPlansAsync(db, cancellationToken);
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
    }

    private static IEnumerable<Plan> CanonicalPlans() =>
    [
        new Plan
        {
            Name = "Free",
            Slug = "free",
            Description = "Basic POS — 1 branch, 3 users, up to 25 products, sales reports",
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
            HasOnlineMenu = false,
            HasOnlineOrdering = false,
            HasCoupons = false,
            HasHr = false,
            SortOrder = 1,
            IsActive = true
        },
        new Plan
        {
            Name = "Basic",
            Slug = "basic",
            Description = "Growing stores — inventory, kitchen, and core modules with higher limits",
            PriceMonthly = 0,
            PriceYearly = 5999,
            MaxStores = 3,
            MaxUsers = 10,
            MaxTerminals = 3,
            MaxProducts = 500,
            MaxMonthlyOrders = 2000,
            HasInventory = true,
            HasKitchen = true,
            HasDelivery = false,
            HasAccounting = false,
            HasAdvancedReports = false,
            HasApi = false,
            HasPurchases = false,
            HasOnlineMenu = false,
            HasOnlineOrdering = false,
            HasCoupons = false,
            HasHr = false,
            SortOrder = 2,
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
            HasOnlineMenu = true,
            HasOnlineOrdering = true,
            HasCoupons = true,
            HasHr = true,
            SortOrder = 3,
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
        target.HasOnlineMenu = spec.HasOnlineMenu;
        target.HasOnlineOrdering = spec.HasOnlineOrdering;
        target.HasCoupons = spec.HasCoupons;
        target.HasHr = spec.HasHr;
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
            ReceiptFooter = "Thank you for your purchase!",
            BusinessType = BusinessType.Hybrid
        };
        db.Organizations.Add(org);

        var (demoPeriodStart, demoPeriodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
        db.Subscriptions.Add(new Subscription
        {
            OrganizationId = org.Id,
            PlanId = proPlan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = demoPeriodStart,
            CurrentPeriodEnd = demoPeriodEnd,
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
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = "admin@demo.com",
                Email = "admin@demo.com",
                EmailConfirmed = true,
                FirstName = "Super",
                LastName = "Admin",
                OrganizationId = null,
            };
            await userManager.CreateAsync(admin, "Admin123!");
            await userManager.AddToRoleAsync(admin, nameof(UserRole.SuperAdmin));
        }
        else
        {
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

    private static async Task EnsureDemoManagerAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        if (await userManager.FindByEmailAsync("manager@demo.com") != null) return;

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        var manager = new ApplicationUser
        {
            UserName = "manager@demo.com",
            Email = "manager@demo.com",
            EmailConfirmed = true,
            FirstName = "Maya",
            LastName = "Manager",
            OrganizationId = org.Id,
        };

        await userManager.CreateAsync(manager, "Manager123!");
        await userManager.AddToRoleAsync(manager, nameof(UserRole.OrgAdmin));
    }

    private static async Task EnsureDemoCashierAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        if (await userManager.FindByEmailAsync("cashier@demo.com") != null) return;

        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        var store = org == null ? null : await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        if (org == null || store == null) return;

        var cashier = new ApplicationUser
        {
            UserName = "cashier@demo.com",
            Email = "cashier@demo.com",
            EmailConfirmed = true,
            FirstName = "Casey",
            LastName = "Cashier",
            OrganizationId = org.Id,
            DefaultStoreId = store.Id,
        };

        await userManager.CreateAsync(cashier, "Cashier123!");
        await userManager.AddToRoleAsync(cashier, nameof(UserRole.Cashier));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = cashier.Id, StoreId = store.Id });
        await db.SaveChangesAsync(ct);
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

    private static async Task EnsureDemoUserAccessAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        var store = await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        if (store == null) return;

        var demoEmails = new[] { "manager@demo.com", "cashier@demo.com", "waiter@demo.com" };
        foreach (var email in demoEmails)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null) continue;

            if (!user.DefaultStoreId.HasValue)
            {
                user.DefaultStoreId = store.Id;
                await userManager.UpdateAsync(user);
            }

            var hasAssignment = await db.UserStoreAssignments
                .AnyAsync(a => a.UserId == user.Id && a.StoreId == store.Id, ct);
            if (!hasAssignment)
                db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = user.Id, StoreId = store.Id });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoCatalogAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        var store = await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        if (store == null) return;

        var categories = await db.Categories.Where(c => c.OrganizationId == org.Id).ToListAsync(ct);
        Category CategoryByName(string name)
        {
            var existing = categories.FirstOrDefault(c => c.Name == name);
            if (existing != null) return existing;

            var category = new Category { OrganizationId = org.Id, Name = name, SortOrder = categories.Count + 1 };
            db.Categories.Add(category);
            categories.Add(category);
            return category;
        }

        var beverages = CategoryByName("Beverages");
        var snacks = CategoryByName("Snacks");
        var meals = CategoryByName("Meals");
        var desserts = CategoryByName("Desserts");
        await db.SaveChangesAsync(ct);

        var demoProducts = new (string Sku, string Name, string Barcode, Category Category, decimal Price)[]
        {
            ("LIME-12", "Fresh Lime Juice", "100003", beverages, 25.00m),
            ("ICED-COF", "Iced Coffee", "100004", beverages, 35.00m),
            ("MANGO-SM", "Mango Smoothie", "100005", beverages, 45.00m),
            ("KURU-01", "Kurukuru", "200003", snacks, 15.00m),
            ("BIS-01", "Chocolate Biscuits", "200004", snacks, 12.00m),
            ("FISH-RICE", "Fish Curry & Rice", "300001", meals, 85.00m),
            ("CHK-ROLL", "Chicken Roll", "300002", meals, 55.00m),
            ("VEG-NOOD", "Vegetable Noodles", "300003", meals, 65.00m),
            ("ICE-CRM", "Ice Cream Cup", "400001", desserts, 30.00m),
            ("GULAB-01", "Gulab Jamun", "400002", desserts, 25.00m),
        };

        foreach (var spec in demoProducts)
        {
            if (await db.Products.AnyAsync(p => p.OrganizationId == org.Id && p.Sku == spec.Sku, ct))
                continue;

            var product = new Product
            {
                OrganizationId = org.Id,
                CategoryId = spec.Category.Id,
                Name = spec.Name,
                Sku = spec.Sku,
                Barcode = spec.Barcode,
                BasePrice = spec.Price,
                TaxRate = org.DefaultTaxRate,
            };
            db.Products.Add(product);
            await db.SaveChangesAsync(ct);

            db.InventoryItems.Add(new InventoryItem
            {
                OrganizationId = org.Id,
                StoreId = store.Id,
                ProductId = product.Id,
                QuantityOnHand = 100,
                ReorderLevel = 10,
            });
        }

        if (!await db.Terminals.AnyAsync(t => t.OrganizationId == org.Id, ct))
        {
            db.Terminals.Add(new Terminal
            {
                OrganizationId = org.Id,
                StoreId = store.Id,
                Name = "Register 1",
                Code = "REG1",
            });
        }

        if (!await db.Customers.AnyAsync(c => c.OrganizationId == org.Id, ct))
        {
            db.Customers.AddRange(
                new Customer { OrganizationId = org.Id, FirstName = "Ahmed", LastName = "Hassan", Phone = "+960 770-0001", Email = "ahmed@example.mv" },
                new Customer { OrganizationId = org.Id, FirstName = "Aisha", LastName = "Mohamed", Phone = "+960 770-0002", Email = "aisha@example.mv" }
            );
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoSalesAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        var store = await db.Stores.FirstAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        if (await db.Orders.AnyAsync(o => o.OrganizationId == org.Id && o.Status == OrderStatus.Completed, ct))
            return;

        var products = await db.Products.Where(p => p.OrganizationId == org.Id && p.IsActive).ToListAsync(ct);
        if (products.Count == 0) return;

        Product BySku(string sku) => products.First(p => p.Sku == sku);

        var cashier = await db.Users.FirstOrDefaultAsync(u => u.Email == "cashier@demo.com", ct);
        var now = DateTime.UtcNow;

        var seededOrders = new[]
        {
            BuildCompletedOrder(org.Id, store.Id, cashier?.Id, now.AddHours(-2),
                "DEMO-0001", [(BySku("COLA-12"), 2), (BySku("CHIPS-REG"), 1)]),
            BuildCompletedOrder(org.Id, store.Id, cashier?.Id, now.AddHours(-1),
                "DEMO-0002", [(BySku("FISH-RICE"), 1), (BySku("ICED-COF"), 1)]),
            BuildCompletedOrder(org.Id, store.Id, cashier?.Id, now.AddMinutes(-30),
                "DEMO-0003", [(BySku("MANGO-SM"), 2), (BySku("BIS-01"), 1)]),
            BuildCompletedOrder(org.Id, store.Id, cashier?.Id, now.AddDays(-1),
                "DEMO-0004", [(BySku("CHK-ROLL"), 2), (BySku("WATER-16"), 2)]),
            BuildCompletedOrder(org.Id, store.Id, cashier?.Id, now.AddDays(-2),
                "DEMO-0005", [(BySku("VEG-NOOD"), 1), (BySku("ICE-CRM"), 2), (BySku("CHOC-BAR"), 1)]),
        };

        db.Orders.AddRange(seededOrders);
        await db.SaveChangesAsync(ct);
    }

    private static Order BuildCompletedOrder(
        Guid organizationId,
        Guid storeId,
        Guid? cashierUserId,
        DateTime completedAt,
        string orderNumber,
        (Product Product, int Quantity)[] lines)
    {
        var order = new Order
        {
            OrganizationId = organizationId,
            StoreId = storeId,
            CashierUserId = cashierUserId,
            OrderNumber = orderNumber,
            Status = OrderStatus.Completed,
            CompletedAt = completedAt,
            CreatedAt = completedAt.AddMinutes(-5),
            Notes = "Demo seed order",
        };

        foreach (var (product, quantity) in lines)
        {
            var lineSubtotal = product.BasePrice * quantity;
            var lineTax = lineSubtotal * product.TaxRate;
            order.Lines.Add(new OrderLine
            {
                OrganizationId = organizationId,
                ProductId = product.Id,
                ProductName = product.Name,
                Sku = product.Sku,
                Quantity = quantity,
                UnitPrice = product.BasePrice,
                TaxRate = product.TaxRate,
                LineTotal = lineSubtotal + lineTax,
            });
        }

        order.Subtotal = order.Lines.Sum(l => l.UnitPrice * l.Quantity);
        order.TaxAmount = order.Lines.Sum(l => (l.UnitPrice * l.Quantity) * l.TaxRate);
        order.Total = order.Subtotal + order.TaxAmount;

        order.Payments.Add(new Payment
        {
            OrganizationId = organizationId,
            Method = PaymentMethod.Cash,
            Status = PaymentStatus.Completed,
            Amount = order.Total,
            Reference = "DEMO-CASH",
        });

        return order;
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
            var (periodStart, periodEnd) = SubscriptionPeriodCalculator.NewYearlyPeriod(DateTime.UtcNow);
            db.Subscriptions.Add(new Subscription
            {
                OrganizationId = org.Id,
                PlanId = proPlan.Id,
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = periodStart,
                CurrentPeriodEnd = periodEnd,
            });
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

    private static async Task EnsureDemoDiningTablesAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        var mainStore = org == null
            ? null
            : await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id && s.Code == "MAIN", ct);
        if (org == null || mainStore == null) return;

        if (await db.DiningTables.AnyAsync(t => t.StoreId == mainStore.Id, ct)) return;

        var area = new DiningArea
        {
            OrganizationId = org.Id,
            StoreId = mainStore.Id,
            Name = "Main Floor",
            SortOrder = 0,
            IsActive = true,
        };
        db.DiningAreas.Add(area);

        var specs = new (string Name, int Capacity)[]
        {
            ("T1", 2), ("T2", 2), ("T3", 4), ("T4", 4), ("T5", 6), ("T6", 6),
            ("T7", 2), ("T8", 4), ("T9", 8), ("T10", 2), ("T11", 4), ("T12", 6),
        };

        for (var i = 0; i < specs.Length; i++)
        {
            var (name, capacity) = specs[i];
            db.DiningTables.Add(new DiningTable
            {
                OrganizationId = org.Id,
                StoreId = mainStore.Id,
                DiningAreaId = area.Id,
                Name = name,
                Code = name,
                Capacity = capacity,
                SortOrder = i,
                QrToken = Guid.NewGuid().ToString("N")[..12],
                Status = DiningTableStatus.Available,
                IsActive = true,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoHrAsync(PosDbContext db, IServiceProvider sp, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        var store = await db.Stores.FirstOrDefaultAsync(s => s.OrganizationId == org.Id, ct);
        if (store == null) return;

        var manager = await db.Users.FirstOrDefaultAsync(u => u.Email == "manager@demo.com", ct);

        var sync = sp.GetRequiredService<EmployeeSyncService>();
        await sync.BackfillOrganizationAsync(org.Id, ct);

        await EnsureDemoLeaveTypesAsync(db, org.Id, ct);
        await EnsureDemoStandaloneEmployeesAsync(db, org.Id, store.Id, ct);

        var employees = await db.Employees
            .Include(e => e.Compensation)
            .Include(e => e.Adjustments)
            .Where(e => e.OrganizationId == org.Id)
            .ToListAsync(ct);

        foreach (var emp in employees)
        {
            if (emp.Compensation == null)
            {
                db.EmployeeCompensations.Add(new EmployeeCompensation
                {
                    OrganizationId = org.Id,
                    EmployeeId = emp.Id,
                    BasicSalary = DemoSalaryFor(emp),
                    Currency = "MVR",
                    PayFrequency = PayFrequency.Monthly,
                    BankName = "Bank of Maldives",
                    BankAccountNumber = $"BML{emp.EmployeeNumber}",
                    EffectiveFrom = DateTime.UtcNow.AddMonths(-6)
                });
            }

            if (!emp.Adjustments.Any(a => a.Label == "Transport allowance"))
            {
                db.PayrollAdjustments.Add(new PayrollAdjustment
                {
                    OrganizationId = org.Id,
                    EmployeeId = emp.Id,
                    Type = PayrollAdjustmentType.Increment,
                    Label = "Transport allowance",
                    Amount = 500m,
                    IsRecurring = true,
                    EffectiveFrom = DateTime.UtcNow.AddMonths(-3)
                });
            }
        }

        await db.SaveChangesAsync(ct);

        await EnsureDemoLeaveBalancesAsync(db, org.Id, employees, ct);
        await EnsureDemoLeaveRequestsAsync(db, org.Id, employees, manager?.Id, ct);
        await EnsureDemoAttendanceAsync(db, org.Id, store.Id, employees, ct);
        await EnsureDemoSchedulesAsync(db, org.Id, store.Id, employees, ct);
        await EnsureDemoPerformanceReviewsAsync(db, org.Id, employees, manager?.Id, ct);
        await EnsureDemoPayrollRunsAsync(db, org.Id, employees, manager?.Id, ct);
    }

    private static decimal DemoSalaryFor(Employee emp) => emp.JobTitle switch
    {
        "OrgAdmin" => 25000m,
        "StoreManager" => 18000m,
        "Kitchen Staff" => 10000m,
        "Delivery Driver" => 11000m,
        "Part-time Cashier" => 8500m,
        _ => 12000m
    };

    private static async Task EnsureDemoLeaveTypesAsync(PosDbContext db, Guid orgId, CancellationToken ct)
    {
        if (await db.LeaveTypes.AnyAsync(t => t.OrganizationId == orgId, ct)) return;

        db.LeaveTypes.AddRange(
            new LeaveType { OrganizationId = orgId, Name = "Annual Leave", IsPaid = true, DefaultDaysPerYear = 30 },
            new LeaveType { OrganizationId = orgId, Name = "Sick Leave", IsPaid = true, DefaultDaysPerYear = 15 },
            new LeaveType { OrganizationId = orgId, Name = "Unpaid Leave", IsPaid = false, DefaultDaysPerYear = 0 });
        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoStandaloneEmployeesAsync(PosDbContext db, Guid orgId, Guid storeId, CancellationToken ct)
    {
        var standalone = new[]
        {
            new { Number = "EMP-K01", First = "Ahmed", Last = "Hassan", Email = "ahmed.kitchen@demo.local", Phone = "7912345", Title = "Kitchen Staff", Dept = "Kitchen", Nationality = "Maldivian" },
            new { Number = "EMP-D01", First = "Fathimath", Last = "Ali", Email = "fathimath.delivery@demo.local", Phone = "7923456", Title = "Delivery Driver", Dept = "Operations", Nationality = "Maldivian" },
            new { Number = "EMP-P01", First = "Ibrahim", Last = "Rasheed", Email = "ibrahim.parttime@demo.local", Phone = "7934567", Title = "Part-time Cashier", Dept = "Front of house", Nationality = "Maldivian" },
        };

        foreach (var s in standalone)
        {
            if (await db.Employees.AnyAsync(e => e.OrganizationId == orgId && e.EmployeeNumber == s.Number, ct))
                continue;

            db.Employees.Add(new Employee
            {
                OrganizationId = orgId,
                EmployeeNumber = s.Number,
                FirstName = s.First,
                LastName = s.Last,
                Email = s.Email,
                Phone = s.Phone,
                Nationality = s.Nationality,
                JobTitle = s.Title,
                Department = s.Dept,
                DefaultStoreId = storeId,
                HireDate = DateTime.UtcNow.AddMonths(-4),
                EmploymentStatus = EmploymentStatus.Active,
                IdDocumentType = IdDocumentType.Nid,
                IdDocumentNumber = $"A{Random.Shared.Next(100000, 999999)}"
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoLeaveBalancesAsync(PosDbContext db, Guid orgId, List<Employee> employees, CancellationToken ct)
    {
        var year = DateTime.UtcNow.Year;
        var types = await db.LeaveTypes.Where(t => t.OrganizationId == orgId).ToListAsync(ct);
        if (types.Count == 0) return;

        foreach (var emp in employees.Where(e => e.EmploymentStatus == EmploymentStatus.Active))
        {
            foreach (var type in types.Where(t => t.DefaultDaysPerYear > 0))
            {
                if (await db.LeaveBalances.AnyAsync(b => b.OrganizationId == orgId && b.EmployeeId == emp.Id && b.LeaveTypeId == type.Id && b.Year == year, ct))
                    continue;

                db.LeaveBalances.Add(new LeaveBalance
                {
                    OrganizationId = orgId,
                    EmployeeId = emp.Id,
                    LeaveTypeId = type.Id,
                    Year = year,
                    EntitledDays = type.DefaultDaysPerYear,
                    UsedDays = type.Name == "Annual Leave" ? 2 : 0
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoLeaveRequestsAsync(PosDbContext db, Guid orgId, List<Employee> employees, Guid? managerId, CancellationToken ct)
    {
        if (await db.LeaveRequests.AnyAsync(r => r.OrganizationId == orgId, ct)) return;

        var annual = await db.LeaveTypes.FirstOrDefaultAsync(t => t.OrganizationId == orgId && t.Name == "Annual Leave", ct);
        var sick = await db.LeaveTypes.FirstOrDefaultAsync(t => t.OrganizationId == orgId && t.Name == "Sick Leave", ct);
        if (annual == null || sick == null) return;

        var kitchen = employees.FirstOrDefault(e => e.JobTitle == "Kitchen Staff");
        var cashier = employees.FirstOrDefault(e => e.Email == "cashier@demo.com");

        if (kitchen != null)
        {
            db.LeaveRequests.Add(new LeaveRequest
            {
                OrganizationId = orgId,
                EmployeeId = kitchen.Id,
                LeaveTypeId = annual.Id,
                StartDate = DateTime.UtcNow.Date.AddDays(14),
                EndDate = DateTime.UtcNow.Date.AddDays(16),
                Status = LeaveRequestStatus.Pending,
                Reason = "Family visit to another island"
            });
        }

        if (cashier != null)
        {
            db.LeaveRequests.Add(new LeaveRequest
            {
                OrganizationId = orgId,
                EmployeeId = cashier.Id,
                LeaveTypeId = sick.Id,
                StartDate = DateTime.UtcNow.Date.AddDays(-10),
                EndDate = DateTime.UtcNow.Date.AddDays(-9),
                Status = LeaveRequestStatus.Approved,
                Reason = "Flu",
                ApprovedByUserId = managerId,
                ReviewedAt = DateTime.UtcNow.AddDays(-11)
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoAttendanceAsync(PosDbContext db, Guid orgId, Guid storeId, List<Employee> employees, CancellationToken ct)
    {
        if (await db.AttendanceRecords.AnyAsync(a => a.OrganizationId == orgId, ct)) return;

        var active = employees.Where(e => e.EmploymentStatus == EmploymentStatus.Active).Take(5).ToList();
        for (var day = 1; day <= 5; day++)
        {
            foreach (var emp in active)
            {
                var date = DateTime.UtcNow.Date.AddDays(-day);
                var clockIn = date.AddHours(9);
                var clockOut = date.AddHours(17);
                db.AttendanceRecords.Add(new AttendanceRecord
                {
                    OrganizationId = orgId,
                    EmployeeId = emp.Id,
                    StoreId = storeId,
                    ClockInAt = clockIn,
                    ClockOutAt = clockOut,
                    Source = AttendanceSource.Manual,
                    Notes = day == 1 ? "Demo seed" : null
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoSchedulesAsync(PosDbContext db, Guid orgId, Guid storeId, List<Employee> employees, CancellationToken ct)
    {
        if (await db.WorkSchedules.AnyAsync(s => s.OrganizationId == orgId, ct)) return;

        var workDays = new[] { DayOfWeekSchedule.Monday, DayOfWeekSchedule.Tuesday, DayOfWeekSchedule.Wednesday, DayOfWeekSchedule.Thursday, DayOfWeekSchedule.Friday, DayOfWeekSchedule.Saturday };

        foreach (var emp in employees.Where(e => e.EmploymentStatus == EmploymentStatus.Active).Take(4))
        {
            foreach (var day in workDays)
            {
                db.WorkSchedules.Add(new WorkSchedule
                {
                    OrganizationId = orgId,
                    EmployeeId = emp.Id,
                    DayOfWeek = day,
                    StartTime = new TimeOnly(9, 0),
                    EndTime = new TimeOnly(17, 0),
                    StoreId = storeId
                });
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoPerformanceReviewsAsync(PosDbContext db, Guid orgId, List<Employee> employees, Guid? managerId, CancellationToken ct)
    {
        if (managerId == null || await db.PerformanceReviews.AnyAsync(r => r.OrganizationId == orgId, ct)) return;

        var targets = employees.Where(e => e.EmploymentStatus == EmploymentStatus.Active).Take(3).ToList();
        foreach (var emp in targets)
        {
            db.PerformanceReviews.Add(new PerformanceReview
            {
                OrganizationId = orgId,
                EmployeeId = emp.Id,
                ReviewPeriod = "Q2 2026",
                Rating = emp.JobTitle == "Kitchen Staff" ? 4 : 5,
                Summary = emp.JobTitle == "Kitchen Staff"
                    ? "Reliable kitchen support; punctual and team-oriented."
                    : "Strong performance; meets expectations consistently.",
                ReviewedByUserId = managerId.Value,
                ReviewedAt = DateTime.UtcNow.AddDays(-14)
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureDemoPayrollRunsAsync(PosDbContext db, Guid orgId, List<Employee> employees, Guid? managerId, CancellationToken ct)
    {
        if (managerId == null || await db.PayrollRuns.AnyAsync(r => r.OrganizationId == orgId, ct)) return;

        var lastMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-1);
        var lastMonthEnd = lastMonthStart.AddMonths(1).AddDays(-1);
        var thisMonthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var thisMonthEnd = thisMonthStart.AddMonths(1).AddDays(-1);

        var finalizedRun = new PayrollRun
        {
            OrganizationId = orgId,
            PeriodStart = lastMonthStart,
            PeriodEnd = lastMonthEnd,
            Status = PayrollRunStatus.Finalized,
            FinalizedAt = lastMonthEnd.AddDays(2),
            CreatedByUserId = managerId.Value
        };
        db.PayrollRuns.Add(finalizedRun);

        var draftRun = new PayrollRun
        {
            OrganizationId = orgId,
            PeriodStart = thisMonthStart,
            PeriodEnd = thisMonthEnd,
            Status = PayrollRunStatus.Draft,
            CreatedByUserId = managerId.Value
        };
        db.PayrollRuns.Add(draftRun);
        await db.SaveChangesAsync(ct);

        var activeEmployees = await db.Employees
            .Include(e => e.Compensation)
            .Include(e => e.Adjustments)
            .Where(e => e.OrganizationId == orgId && e.EmploymentStatus == EmploymentStatus.Active)
            .ToListAsync(ct);

        foreach (var employee in activeEmployees)
        {
            var (gross, deductions, net, lines) = HrPayrollCalculator.Calculate(employee, finalizedRun.PeriodStart, finalizedRun.PeriodEnd);
            var slip = new PaySlip
            {
                OrganizationId = orgId,
                PayrollRunId = finalizedRun.Id,
                EmployeeId = employee.Id,
                GrossPay = gross,
                TotalDeductions = deductions,
                NetPay = net
            };
            foreach (var line in lines)
            {
                slip.Lines.Add(new PaySlipLine
                {
                    OrganizationId = orgId,
                    LineType = line.type,
                    Label = line.label,
                    Amount = line.amount
                });
            }
            db.PaySlips.Add(slip);
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
