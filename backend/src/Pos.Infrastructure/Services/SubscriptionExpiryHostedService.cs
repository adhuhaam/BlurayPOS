using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Pos.Application.Common;

namespace Pos.Infrastructure.Services;

public class SubscriptionExpiryHostedService(
    IServiceScopeFactory scopeFactory,
    ILogger<SubscriptionExpiryHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RunOnceAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await RunOnceAsync(stoppingToken);
    }

    private async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var lifecycle = scope.ServiceProvider.GetRequiredService<ISubscriptionLifecycleService>();
            var count = await lifecycle.ProcessExpiriesAsync(cancellationToken);
            if (count > 0)
                logger.LogInformation("Subscription expiry job updated {Count} subscription(s)", count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Subscription expiry job failed");
        }
    }
}
