namespace Pos.Domain.Enums;

public enum OrderStatus
{
    Draft = 0,
    Completed = 1,
    Refunded = 2,
    Voided = 3,
    Held = 4,
    Submitted = 5,
    Accepted = 6,
    Ready = 7
}

public enum OrderSource
{
    Pos = 0,
    Online = 1,
    QrTable = 2
}

public enum ServiceType
{
    DineIn = 0,
    Pickup = 1,
    Delivery = 2
}

public enum DiningTableStatus
{
    Available = 0,
    Occupied = 1,
    BillRequested = 2,
    Reserved = 3,
    Cleaning = 4
}

public enum PaymentMethod
{
    Cash = 0,
    Card = 1,
    StoreCredit = 2,
    BankTransfer = 3
}

public enum PaymentStatus
{
    Pending = 0,
    Completed = 1,
    Failed = 2,
    Refunded = 3
}

public enum ShiftStatus
{
    Open = 0,
    Closed = 1
}

public enum InventoryAdjustmentType
{
    Sale = 0,
    Return = 1,
    TransferIn = 2,
    TransferOut = 3,
    Manual = 4
}

public enum StockTransferStatus
{
    Pending = 0,
    InTransit = 1,
    Completed = 2,
    Cancelled = 3
}

public enum UserRole
{
    SuperAdmin = 0,
    OrgAdmin = 1,      // Manager (tenant-wide)
    StoreManager = 2,  // Branch manager
    Cashier = 3,
    Kitchen = 4,
    Delivery = 5,
    Accountant = 6,
    Waiter = 7
}
