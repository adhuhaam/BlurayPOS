using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Pos.Application.Common;
using Pos.Domain.Interfaces;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;
using Pos.Infrastructure.Services;

namespace Pos.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ISyncService, SyncService>();
        services.AddScoped<IPosRealtimeNotifier, PosRealtimeNotifier>();
        services.AddScoped<TokenService>();
        services.AddScoped<PaymentProviderFactory>();
        services.AddScoped<IPaymentProviderResolver>(sp => sp.GetRequiredService<PaymentProviderFactory>());
        services.AddScoped<IPermissionService, PermissionService>();
        services.AddScoped<IPermissionChecker, PermissionChecker>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IStoreService, StoreService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IPlatformService, PlatformService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IPaymentProvider, CashPaymentProvider>();
        services.AddScoped<IPaymentProvider, ManualCardPaymentProvider>();
        services.AddScoped<IPaymentProvider, BankTransferPaymentProvider>();

        services.AddDbContext<PosDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IPosDbContext>(sp => sp.GetRequiredService<PosDbContext>());

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireUppercase = true;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<PosDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        return services;
    }
}
