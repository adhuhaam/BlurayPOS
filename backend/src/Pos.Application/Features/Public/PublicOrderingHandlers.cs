using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Sales;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Public;

public record GetPublicStoreProfileQuery(string Slug) : IRequest<PublicStoreProfileDto>;
public record GetPublicMenuQuery(string Slug, Guid? StoreId = null) : IRequest<IList<PublicMenuCategoryDto>>;
public record GetPublicTableQuery(string QrToken) : IRequest<PublicTableDto>;
public record PlacePublicOrderCommand(string Slug, PublicPlaceOrderRequest Request) : IRequest<PublicPlaceOrderResponse>;
public record TrackPublicOrderQuery(string Token) : IRequest<PublicOrderTrackDto>;
public record AttachPublicOrderSlipCommand(string Token, string SlipImagePath) : IRequest<PublicOrderTrackDto>;

internal static class PublicOrderingGuard
{
    public static async Task<(Organization Org, Plan Plan)> RequireOrgWithPlanAsync(
        IPosDbContext db, string slug, CancellationToken ct)
    {
        var org = await db.Organizations.IgnoreQueryFilters()
            .Include(o => o.Subscription!)
            .ThenInclude(s => s.Plan)
            .FirstOrDefaultAsync(o => o.Slug == slug && !o.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Store not found.");

        if (org.IsSuspended || org.IsReadOnly)
            throw new KeyNotFoundException("Store not available.");

        var plan = org.Subscription?.Plan ?? throw new KeyNotFoundException("Store not found.");
        return (org, plan);
    }

    public static void RequireOnlineMenu(Organization org, Plan plan)
    {
        if (!plan.HasOnlineMenu)
            throw new KeyNotFoundException("Online menu not available.");
        if (org.BusinessType == BusinessType.Retail)
            throw new KeyNotFoundException("Online menu not available.");
    }

    public static void RequireOnlineOrdering(Plan plan)
    {
        if (!plan.HasOnlineOrdering)
            throw new KeyNotFoundException("Online ordering not available.");
    }
}

public class GetPublicStoreProfileQueryHandler(IPosDbContext db) : IRequestHandler<GetPublicStoreProfileQuery, PublicStoreProfileDto>
{
    public async Task<PublicStoreProfileDto> Handle(GetPublicStoreProfileQuery request, CancellationToken ct)
    {
        var (org, plan) = await PublicOrderingGuard.RequireOrgWithPlanAsync(db, request.Slug, ct);
        PublicOrderingGuard.RequireOnlineOrdering(plan);

        var stores = await db.Stores.IgnoreQueryFilters()
            .Where(s => s.OrganizationId == org.Id && s.IsActive && !s.IsDeleted)
            .OrderBy(s => s.Name)
            .ToListAsync(ct);

        var primary = stores.FirstOrDefault();
        return new PublicStoreProfileDto(
            org.Slug,
            org.Name,
            org.BusinessType.ToString(),
            org.Currency,
            org.DefaultTaxRate,
            org.PaymentQrPayload,
            org.PaymentInstructions,
            plan.HasOnlineMenu && org.BusinessType != BusinessType.Retail && (primary?.OnlineMenuEnabled ?? false),
            primary?.OnlineOrderingEnabled ?? false,
            primary?.AllowPickup ?? true,
            primary?.AllowDelivery ?? false,
            primary?.AllowDineIn ?? true,
            primary?.AllowCashOnDelivery ?? true,
            primary?.AllowBankTransfer ?? true,
            primary?.MinOrderAmount ?? 0,
            primary?.DeliveryFeeFlat ?? 0,
            primary?.OnlineMenuWelcomeText,
            stores.Select(s => new PublicStoreBranchDto(s.Id, s.Name, s.Address, s.Phone)).ToList());
    }
}

public class GetPublicMenuQueryHandler(IPosDbContext db) : IRequestHandler<GetPublicMenuQuery, IList<PublicMenuCategoryDto>>
{
    public async Task<IList<PublicMenuCategoryDto>> Handle(GetPublicMenuQuery request, CancellationToken ct)
    {
        var (org, plan) = await PublicOrderingGuard.RequireOrgWithPlanAsync(db, request.Slug, ct);
        if (org.BusinessType == BusinessType.Retail)
            PublicOrderingGuard.RequireOnlineOrdering(plan);
        else
            PublicOrderingGuard.RequireOnlineMenu(org, plan);

        var store = await ResolveStoreAsync(db, org.Id, request.StoreId, requireMenu: true, ct);

        var products = await db.Products.IgnoreQueryFilters()
            .Include(p => p.Category)
            .Where(p => p.OrganizationId == org.Id && !p.IsDeleted && p.IsActive && p.IsOnlineVisible)
            .OrderBy(p => p.Category != null ? p.Category.SortOrder : 999)
            .ThenBy(p => p.Name)
            .ToListAsync(ct);

        var prices = await db.StoreProductPrices.IgnoreQueryFilters()
            .Where(sp => sp.StoreId == store.Id)
            .ToDictionaryAsync(sp => sp.ProductId, sp => sp.Price, ct);

        var grouped = products
            .GroupBy(p => p.Category)
            .OrderBy(g => g.Key?.SortOrder ?? 999)
            .Select(g => new PublicMenuCategoryDto(
                g.Key?.Id ?? Guid.Empty,
                g.Key?.Name ?? "Other",
                g.Key?.SortOrder ?? 999,
                g.Select(p => new PublicMenuProductDto(
                    p.Id,
                    p.Name,
                    p.OnlineDescription ?? p.Description,
                    prices.GetValueOrDefault(p.Id, p.BasePrice),
                    p.TaxRate,
                    p.ImageUrl,
                    p.Category?.Name)).ToList()))
            .ToList();

        return grouped;
    }

    internal static async Task<Store> ResolveStoreAsync(
        IPosDbContext db, Guid orgId, Guid? storeId, bool requireMenu, bool requireOrdering, CancellationToken ct)
    {
        var query = db.Stores.IgnoreQueryFilters()
            .Where(s => s.OrganizationId == orgId && s.IsActive && !s.IsDeleted);

        if (storeId.HasValue)
            query = query.Where(s => s.Id == storeId.Value);

        var store = await query.OrderBy(s => s.Name).FirstOrDefaultAsync(ct)
            ?? throw new KeyNotFoundException("Branch not found.");

        var org = await db.Organizations.IgnoreQueryFilters().FirstAsync(o => o.Id == orgId, ct);
        if (requireMenu && org.BusinessType != BusinessType.Retail && !store.OnlineMenuEnabled)
            throw new KeyNotFoundException("Online menu not enabled.");
        if (requireOrdering && !store.OnlineOrderingEnabled)
            throw new KeyNotFoundException("Online ordering not enabled.");

        return store;
    }

    private static Task<Store> ResolveStoreAsync(IPosDbContext db, Guid orgId, Guid? storeId, bool requireMenu, CancellationToken ct) =>
        ResolveStoreAsync(db, orgId, storeId, requireMenu, false, ct);
}

public class GetPublicTableQueryHandler(IPosDbContext db) : IRequestHandler<GetPublicTableQuery, PublicTableDto>
{
    public async Task<PublicTableDto> Handle(GetPublicTableQuery request, CancellationToken ct)
    {
        var table = await db.DiningTables.IgnoreQueryFilters()
            .Include(t => t.DiningArea)
            .Include(t => t.Store)
            .ThenInclude(s => s.Organization)
            .ThenInclude(o => o.Subscription!)
            .ThenInclude(s => s.Plan)
            .FirstOrDefaultAsync(t => t.QrToken == request.QrToken && t.IsActive && !t.IsDeleted, ct)
            ?? throw new KeyNotFoundException("Table not found.");

        var org = table.Store.Organization;
        var plan = org.Subscription?.Plan;
        if (plan == null || !plan.HasOnlineMenu || org.BusinessType == BusinessType.Retail)
            throw new KeyNotFoundException("Table not found.");

        return new PublicTableDto(org.Slug, table.Name, table.Id, table.DiningArea?.Name);
    }
}

public class PlacePublicOrderCommandHandler(
    IPosDbContext db,
    IPosRealtimeNotifier notifier) : IRequestHandler<PlacePublicOrderCommand, PublicPlaceOrderResponse>
{
    public async Task<PublicPlaceOrderResponse> Handle(PlacePublicOrderCommand command, CancellationToken ct)
    {
        var (org, plan) = await PublicOrderingGuard.RequireOrgWithPlanAsync(db, command.Slug, ct);
        PublicOrderingGuard.RequireOnlineOrdering(plan);

        var store = await GetPublicMenuQueryHandler.ResolveStoreAsync(
            db, org.Id, command.Request.StoreId, false, true, ct);

        if (!Enum.TryParse<ServiceType>(command.Request.ServiceType, true, out var serviceType))
            throw new InvalidOperationException("Invalid service type.");

        ValidateServiceType(store, serviceType);

        if (!Enum.TryParse<PaymentMethod>(command.Request.PaymentMethod, true, out var paymentMethod)
            || (paymentMethod != PaymentMethod.Cash && paymentMethod != PaymentMethod.BankTransfer))
            throw new InvalidOperationException("Invalid payment method.");

        if (paymentMethod == PaymentMethod.Cash && !store.AllowCashOnDelivery)
            throw new InvalidOperationException("Cash payment not available.");
        if (paymentMethod == PaymentMethod.BankTransfer && !store.AllowBankTransfer)
            throw new InvalidOperationException("Bank transfer not available.");
        if (paymentMethod == PaymentMethod.BankTransfer && string.IsNullOrWhiteSpace(command.Request.SlipImagePath))
            throw new InvalidOperationException("Transfer slip is required.");

        DiningTable? table = null;
        if (command.Request.DiningTableId.HasValue)
        {
            table = await db.DiningTables.IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == command.Request.DiningTableId && t.StoreId == store.Id, ct)
                ?? throw new KeyNotFoundException("Table not found.");
        }

        var orderSource = table != null ? OrderSource.QrTable : OrderSource.Online;
        var trackingToken = Guid.NewGuid().ToString("N");

        var order = new Order
        {
            OrganizationId = org.Id,
            StoreId = store.Id,
            OrderNumber = await CreateOrderCommandHandler.GenerateOrderNumber(db, store.Id, ct),
            Status = OrderStatus.Submitted,
            OrderSource = orderSource,
            ServiceType = serviceType,
            PublicTrackingToken = trackingToken,
            DiningTableId = table?.Id,
            CustomerName = command.Request.CustomerName.Trim(),
            CustomerPhone = command.Request.CustomerPhone.Trim(),
            DeliveryAddress = command.Request.DeliveryAddress,
            DeliveryNotes = command.Request.DeliveryNotes,
            Notes = command.Request.Notes,
            OnlinePaymentMethod = paymentMethod
        };

        await CreateOrderCommandHandler.BuildLines(db, order, store.Id, command.Request.Lines, ct);

        if (serviceType == ServiceType.Delivery && store.DeliveryFeeFlat > 0)
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? $"Delivery fee: {store.DeliveryFeeFlat}"
                : $"{order.Notes}\nDelivery fee: {store.DeliveryFeeFlat}";

        CreateOrderCommandHandler.RecalculateTotals(order);

        if (serviceType == ServiceType.Delivery)
            order.Total += store.DeliveryFeeFlat;

        if (store.MinOrderAmount > 0 && order.Total < store.MinOrderAmount)
            throw new InvalidOperationException($"Minimum order is {store.MinOrderAmount:0.00} {org.Currency}.");

        var payment = new Payment
        {
            OrganizationId = org.Id,
            OrderId = order.Id,
            Method = paymentMethod,
            Status = PaymentStatus.Pending,
            Amount = order.Total,
            SlipImagePath = command.Request.SlipImagePath
        };
        order.Payments.Add(payment);

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        await notifier.NotifyOnlineOrderSubmittedAsync(
            store.Id, order.Id, order.OrderNumber, order.Total,
            order.CustomerName ?? "", serviceType.ToString(), paymentMethod.ToString(), ct);

        return new PublicPlaceOrderResponse(
            trackingToken,
            order.OrderNumber,
            order.Total,
            order.Status.ToString(),
            paymentMethod == PaymentMethod.Cash
                ? "Order placed. The store will confirm shortly."
                : "Order placed. The store will verify your payment.");
    }

    private static void ValidateServiceType(Store store, ServiceType serviceType)
    {
        if (serviceType == ServiceType.DineIn && !store.AllowDineIn)
            throw new InvalidOperationException("Dine-in not available.");
        if (serviceType == ServiceType.Pickup && !store.AllowPickup)
            throw new InvalidOperationException("Pickup not available.");
        if (serviceType == ServiceType.Delivery && !store.AllowDelivery)
            throw new InvalidOperationException("Delivery not available.");
    }
}

public class TrackPublicOrderQueryHandler(IPosDbContext db) : IRequestHandler<TrackPublicOrderQuery, PublicOrderTrackDto>
{
    public async Task<PublicOrderTrackDto> Handle(TrackPublicOrderQuery request, CancellationToken ct)
    {
        var order = await db.Orders.IgnoreQueryFilters()
            .Include(o => o.Lines)
            .Include(o => o.Payments)
            .Include(o => o.Store)
            .ThenInclude(s => s.Organization)
            .FirstOrDefaultAsync(o => o.PublicTrackingToken == request.Token, ct)
            ?? throw new KeyNotFoundException("Order not found.");

        var org = order.Store.Organization;
        var payment = order.Payments.FirstOrDefault();

        return new PublicOrderTrackDto(
            order.OrderNumber,
            order.Status.ToString(),
            MapStatusLabel(order.Status),
            order.Total,
            org.Currency,
            order.CustomerName,
            order.ServiceType?.ToString(),
            order.OnlinePaymentMethod?.ToString() ?? payment?.Method.ToString(),
            payment?.Status.ToString(),
            order.RejectedReason,
            order.CreatedAt,
            order.Lines.Select(l => new OrderLineDto(l.Id, l.ProductId, l.ProductName, l.Sku, l.Quantity, l.UnitPrice, l.TaxRate, l.DiscountAmount, l.LineTotal)).ToList());
    }

    internal static string MapStatusLabel(OrderStatus status) => status switch
    {
        OrderStatus.Submitted => "Waiting for the restaurant",
        OrderStatus.Accepted => "Confirmed",
        OrderStatus.Held => "Being prepared",
        OrderStatus.Ready => "Ready for pickup",
        OrderStatus.Completed => "Done",
        OrderStatus.Voided => "Cancelled",
        _ => status.ToString()
    };
}

public class AttachPublicOrderSlipCommandHandler(IPosDbContext db) : IRequestHandler<AttachPublicOrderSlipCommand, PublicOrderTrackDto>
{
    public async Task<PublicOrderTrackDto> Handle(AttachPublicOrderSlipCommand command, CancellationToken ct)
    {
        var order = await db.Orders.IgnoreQueryFilters()
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.PublicTrackingToken == command.Token, ct)
            ?? throw new KeyNotFoundException("Order not found.");

        if (order.Status != OrderStatus.Submitted)
            throw new InvalidOperationException("Cannot attach slip to this order.");

        var payment = order.Payments.FirstOrDefault()
            ?? throw new InvalidOperationException("No payment on order.");

        payment.SlipImagePath = command.SlipImagePath;
        await db.SaveChangesAsync(ct);

        return await new TrackPublicOrderQueryHandler(db).Handle(new TrackPublicOrderQuery(command.Token), ct);
    }
}
