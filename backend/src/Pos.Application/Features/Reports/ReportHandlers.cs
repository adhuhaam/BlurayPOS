using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Enums;

namespace Pos.Application.Features.Reports;

public record GetDashboardQuery(Guid? StoreId = null) : IRequest<DashboardReportDto>;
public record GetAuditLogsQuery(int Page = 1, int PageSize = 50, string? EntityType = null) : IRequest<PagedResult<AuditLogDto>>;

public class GetDashboardQueryHandler(IPosDbContext db) : IRequestHandler<GetDashboardQuery, DashboardReportDto>
{
    public async Task<DashboardReportDto> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);

        var ordersQuery = db.Orders.Where(o => o.Status == OrderStatus.Completed);
        if (request.StoreId.HasValue)
            ordersQuery = ordersQuery.Where(o => o.StoreId == request.StoreId.Value);

        var todayOrders = await ordersQuery.Where(o => o.CompletedAt >= today).ToListAsync(cancellationToken);
        var weekOrders = await ordersQuery.Where(o => o.CompletedAt >= weekStart).ToListAsync(cancellationToken);

        var topProducts = await db.OrderLines
            .Where(l => l.Order.Status == OrderStatus.Completed && l.Order.CompletedAt >= weekStart)
            .Where(l => !request.StoreId.HasValue || l.Order.StoreId == request.StoreId.Value)
            .GroupBy(l => new { l.ProductId, l.ProductName })
            .Select(g => new TopProductDto(g.Key.ProductId, g.Key.ProductName, g.Sum(l => l.Quantity), g.Sum(l => l.LineTotal)))
            .OrderByDescending(p => p.Revenue)
            .Take(10)
            .ToListAsync(cancellationToken);

        var storeSales = await (
            from o in db.Orders
            join s in db.Stores on o.StoreId equals s.Id
            where o.Status == OrderStatus.Completed && o.CompletedAt >= weekStart
            group o by new { o.StoreId, s.Name } into g
            select new StoreSalesDto(g.Key.StoreId, g.Key.Name, g.Sum(o => o.Total), g.Count())
        ).OrderByDescending(s => s.TotalSales).ToListAsync(cancellationToken);

        return new DashboardReportDto(
            todayOrders.Sum(o => o.Total),
            todayOrders.Count,
            weekOrders.Sum(o => o.Total),
            weekOrders.Count,
            topProducts,
            storeSales);
    }
}

public class GetAuditLogsQueryHandler(IPosDbContext db) : IRequestHandler<GetAuditLogsQuery, PagedResult<AuditLogDto>>
{
    public async Task<PagedResult<AuditLogDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var query = db.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.EntityType))
            query = query.Where(a => a.EntityType == request.EntityType);

        var total = await query.CountAsync(cancellationToken);
        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new AuditLogDto(a.Id, a.EntityType, a.EntityId, a.Action, a.Changes, a.CreatedAt, a.UserId))
            .ToListAsync(cancellationToken);

        return new PagedResult<AuditLogDto>
        {
            Items = logs,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
