using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Pos.Infrastructure.Persistence;

namespace Pos.Api.Middleware;

public class SubscriptionEnforcementMiddleware(
    RequestDelegate next,
    IServiceScopeFactory scopeFactory)
{
    private static readonly HashSet<string> MutationMethods = new(StringComparer.OrdinalIgnoreCase)
    {
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete,
    };

    public async Task InvokeAsync(HttpContext context)
    {
        if (!ShouldEnforce(context))
        {
            await next(context);
            return;
        }

        var orgId = context.User.FindFirstValue("organizationId");
        if (!Guid.TryParse(orgId, out var organizationId))
        {
            await next(context);
            return;
        }

        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PosDbContext>();
        var org = await db.Organizations
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (org is not { IsReadOnly: true })
        {
            await next(context);
            return;
        }

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            success = false,
            error = "Subscription expired. Renew to continue.",
            code = "SUBSCRIPTION_READ_ONLY",
        });
    }

    private static bool ShouldEnforce(HttpContext context)
    {
        if (!MutationMethods.Contains(context.Request.Method))
            return false;

        if (context.User.Identity?.IsAuthenticated != true)
            return false;

        if (context.User.IsInRole("SuperAdmin"))
            return false;

        if (!context.User.HasClaim(c => c.Type == "organizationId"))
            return false;

        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/auth/", StringComparison.OrdinalIgnoreCase))
            return false;
        if (path.StartsWith("/api/subscription", StringComparison.OrdinalIgnoreCase))
            return false;
        if (path.Equals("/api/storage/upload", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }
}
