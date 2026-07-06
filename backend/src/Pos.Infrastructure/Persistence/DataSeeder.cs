using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<PosDbContext>>();

        await db.Database.MigrateAsync(cancellationToken);

        foreach (var role in Enum.GetNames<UserRole>())
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole<Guid>(role));
        }

        await SeedPlansAsync(db, cancellationToken);

        if (!await db.Organizations.AnyAsync(cancellationToken))
        {
            await SeedDemoOrganizationAsync(db, userManager, cancellationToken);
            logger.LogInformation("Seeded demo organization and users.");
        }

        await EnsureSuperAdminAsync(userManager, db, cancellationToken);
        await EnsureDemoSubscriptionAsync(db, cancellationToken);
        await EnsureDemoSuppliesAsync(db, cancellationToken);
    }

    private static async Task SeedPlansAsync(PosDbContext db, CancellationToken ct)
    {
        if (await db.Plans.AnyAsync(ct)) return;

        db.Plans.AddRange(
            new Plan { Name = "Starter", Slug = "starter", Description = "For single-location businesses", PriceMonthly = 29m, MaxStores = 1, MaxUsers = 5, MaxTerminals = 2, SortOrder = 1 },
            new Plan { Name = "Professional", Slug = "professional", Description = "Growing multi-store retailers", PriceMonthly = 79m, MaxStores = 5, MaxUsers = 25, MaxTerminals = 10, SortOrder = 2 },
            new Plan { Name = "Enterprise", Slug = "enterprise", Description = "Unlimited scale for large chains", PriceMonthly = 199m, MaxStores = 50, MaxUsers = 200, MaxTerminals = 100, SortOrder = 3 }
        );
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedDemoOrganizationAsync(PosDbContext db, UserManager<ApplicationUser> userManager, CancellationToken ct)
    {
        var professionalPlan = await db.Plans.FirstAsync(p => p.Slug == "professional", ct);

        var org = new Organization
        {
            Name = "Demo POS",
            Slug = "demo",
            DefaultTaxRate = 0.08m,
            Currency = "USD",
            ReceiptHeader = "Demo POS Store",
            ReceiptFooter = "Thank you for your purchase!"
        };
        db.Organizations.Add(org);

        db.Subscriptions.Add(new Subscription
        {
            OrganizationId = org.Id,
            PlanId = professionalPlan.Id,
            Status = SubscriptionStatus.Active,
            CurrentPeriodStart = DateTime.UtcNow,
            CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1)
        });

        var mainStore = new Store { OrganizationId = org.Id, Name = "Main Street", Code = "MAIN", Address = "100 Main Street", Phone = "555-0100" };
        var westStore = new Store { OrganizationId = org.Id, Name = "West Side", Code = "WEST", Address = "200 West Avenue", Phone = "555-0200" };
        db.Stores.AddRange(mainStore, westStore);

        var beverages = new Category { OrganizationId = org.Id, Name = "Beverages", SortOrder = 1 };
        var snacks = new Category { OrganizationId = org.Id, Name = "Snacks", SortOrder = 2 };
        db.Categories.AddRange(beverages, snacks);

        var products = new[]
        {
            new Product { OrganizationId = org.Id, CategoryId = beverages.Id, Name = "Cola 12oz", Sku = "COLA-12", Barcode = "100001", BasePrice = 1.99m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = beverages.Id, Name = "Bottled Water", Sku = "WATER-16", Barcode = "100002", BasePrice = 1.49m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = snacks.Id, Name = "Potato Chips", Sku = "CHIPS-REG", Barcode = "200001", BasePrice = 2.49m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = snacks.Id, Name = "Chocolate Bar", Sku = "CHOC-BAR", Barcode = "200002", BasePrice = 1.79m, TaxRate = 0.08m },
            new Product { OrganizationId = org.Id, CategoryId = snacks.Id, Name = "Granola Bar", Sku = "GRANOLA", Barcode = "200003", BasePrice = 1.29m, TaxRate = 0.08m }
        };
        db.Products.AddRange(products);
        await db.SaveChangesAsync(ct);

        foreach (var store in new[] { mainStore, westStore })
        {
            db.Terminals.Add(new Terminal { OrganizationId = org.Id, StoreId = store.Id, Name = "Register 1", Code = "REG1" });
            foreach (var product in products)
            {
                db.InventoryItems.Add(new InventoryItem { OrganizationId = org.Id, StoreId = store.Id, ProductId = product.Id, QuantityOnHand = 100, ReorderLevel = 10 });
            }
        }

        await db.SaveChangesAsync(ct);

        var superAdmin = new ApplicationUser
        {
            UserName = "admin@demo.com",
            Email = "admin@demo.com",
            EmailConfirmed = true,
            FirstName = "Super",
            LastName = "Admin",
            OrganizationId = org.Id
        };

        var orgAdmin = new ApplicationUser
        {
            UserName = "orgadmin@demo.com",
            Email = "orgadmin@demo.com",
            EmailConfirmed = true,
            FirstName = "Olivia",
            LastName = "OrgAdmin",
            OrganizationId = org.Id
        };

        var storeManager = new ApplicationUser
        {
            UserName = "manager@demo.com",
            Email = "manager@demo.com",
            EmailConfirmed = true,
            FirstName = "Sam",
            LastName = "Manager",
            OrganizationId = org.Id,
            DefaultStoreId = mainStore.Id
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

        await userManager.CreateAsync(orgAdmin, "OrgAdmin123!");
        await userManager.AddToRoleAsync(orgAdmin, nameof(UserRole.OrgAdmin));

        await userManager.CreateAsync(storeManager, "Manager123!");
        await userManager.AddToRoleAsync(storeManager, nameof(UserRole.StoreManager));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = storeManager.Id, StoreId = mainStore.Id });

        await userManager.CreateAsync(cashier, "Cashier123!");
        await userManager.AddToRoleAsync(cashier, nameof(UserRole.Cashier));
        db.UserStoreAssignments.Add(new UserStoreAssignment { UserId = cashier.Id, StoreId = mainStore.Id });

        await db.SaveChangesAsync(ct);
    }

    private static async Task EnsureSuperAdminAsync(UserManager<ApplicationUser> userManager, PosDbContext db, CancellationToken ct)
    {
        var admin = await userManager.FindByEmailAsync("admin@demo.com");
        if (admin == null) return;

        var roles = await userManager.GetRolesAsync(admin);
        if (!roles.Contains(nameof(UserRole.SuperAdmin)))
        {
            if (roles.Contains(nameof(UserRole.OrgAdmin)))
                await userManager.RemoveFromRoleAsync(admin, nameof(UserRole.OrgAdmin));
            await userManager.AddToRoleAsync(admin, nameof(UserRole.SuperAdmin));
        }

        if (!await userManager.Users.AnyAsync(u => u.Email == "orgadmin@demo.com", ct))
        {
            var org = await db.Organizations.FirstAsync(o => o.Slug == "demo", ct);
            var orgAdmin = new ApplicationUser
            {
                UserName = "orgadmin@demo.com",
                Email = "orgadmin@demo.com",
                EmailConfirmed = true,
                FirstName = "Olivia",
                LastName = "OrgAdmin",
                OrganizationId = org.Id
            };
            await userManager.CreateAsync(orgAdmin, "OrgAdmin123!");
            await userManager.AddToRoleAsync(orgAdmin, nameof(UserRole.OrgAdmin));
        }
    }

    private static async Task EnsureDemoSubscriptionAsync(PosDbContext db, CancellationToken ct)
    {
        var org = await db.Organizations.FirstOrDefaultAsync(o => o.Slug == "demo", ct);
        if (org == null) return;

        if (!await db.Subscriptions.AnyAsync(s => s.OrganizationId == org.Id, ct))
        {
            var plan = await db.Plans.FirstAsync(p => p.Slug == "professional", ct);
            db.Subscriptions.Add(new Subscription
            {
                OrganizationId = org.Id,
                PlanId = plan.Id,
                Status = SubscriptionStatus.Active,
                CurrentPeriodStart = DateTime.UtcNow,
                CurrentPeriodEnd = DateTime.UtcNow.AddMonths(1)
            });
            await db.SaveChangesAsync(ct);
        }
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
}
