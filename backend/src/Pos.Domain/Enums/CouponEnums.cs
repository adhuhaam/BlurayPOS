namespace Pos.Domain.Enums;

public enum CouponCampaignType
{
    LuckyDraw = 0,
    DiscountCoupon = 1,
    FreeProduct = 2,
    CashGift = 3
}

public enum CouponCampaignStatus
{
    Draft = 0,
    Active = 1,
    Paused = 2,
    Ended = 3
}

public enum CouponRewardValueType
{
    None = 0,
    Percentage = 1,
    FixedAmount = 2
}

public enum CouponCodeStatus
{
    Active = 0,
    Claimed = 1,
    Redeemed = 2,
    Expired = 3,
    Voided = 4
}

public enum CouponLookupSource
{
    PublicQr = 0,
    PosValidate = 1,
    AdminPreview = 2
}
