namespace Pos.Domain.Enums;

public enum GstType
{
    None = 0,
    GGST = 1,
    TGST = 2
}

public enum SubscriptionBillingCycle
{
    Monthly = 0,
    Yearly = 1
}

public enum SubscriptionPaymentMethod
{
    BankTransfer = 0,
    Cash = 1
}

public enum SubscriptionPaymentStatus
{
    Pending = 0,
    Verified = 1,
    Rejected = 2
}
