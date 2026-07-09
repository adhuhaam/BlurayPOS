using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class Order : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid? ShiftId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? CashierUserId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; } = OrderStatus.Draft;
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal Total { get; set; }
    public string? Notes { get; set; }
    public string? IdempotencyKey { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? SentToKitchenAt { get; set; }
    public DateTime? BillRequestedAt { get; set; }
    public OrderSource OrderSource { get; set; } = OrderSource.Pos;
    public ServiceType? ServiceType { get; set; }
    public string? PublicTrackingToken { get; set; }
    public Guid? DiningTableId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? DeliveryNotes { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public PaymentMethod? OnlinePaymentMethod { get; set; }
    public string? RejectedReason { get; set; }

    public Store Store { get; set; } = null!;
    public DiningTable? DiningTable { get; set; }
    public Shift? Shift { get; set; }
    public Customer? Customer { get; set; }
    public ICollection<OrderLine> Lines { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}

public class OrderLine : TenantEntity
{
    public Guid OrderId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? ProductVariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal LineTotal { get; set; }

    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public class Payment : TenantEntity
{
    public Guid OrderId { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public decimal Amount { get; set; }
    public string? Reference { get; set; }
    public string? ProviderTransactionId { get; set; }
    public string? SlipImagePath { get; set; }

    public Order Order { get; set; } = null!;
}

public class Shift : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid OpenedByUserId { get; set; }
    public Guid? ClosedByUserId { get; set; }
    public ShiftStatus Status { get; set; } = ShiftStatus.Open;
    public decimal OpeningFloat { get; set; }
    public decimal? ClosingCash { get; set; }
    public decimal ExpectedCash { get; set; }
    public decimal TotalSales { get; set; }
    public decimal TotalCash { get; set; }
    public decimal TotalCard { get; set; }
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public Store Store { get; set; } = null!;
    public ICollection<Order> Orders { get; set; } = [];
}

public class Customer : TenantEntity
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public int LoyaltyPoints { get; set; }

    public ICollection<Order> Orders { get; set; } = [];
}
