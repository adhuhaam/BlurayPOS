using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;

namespace Pos.Application.Features.Coupons;

public static class CouponModuleGuard
{
    public static async Task EnsureCouponsEnabledAsync(IPosDbContext db, Guid organizationId, CancellationToken ct)
    {
        var hasCoupons = await db.Subscriptions
            .Where(s => s.OrganizationId == organizationId)
            .Select(s => s.Plan.HasCoupons)
            .FirstOrDefaultAsync(ct);

        if (!hasCoupons)
            throw new InvalidOperationException("Coupons module requires a Pro plan. Upgrade in Billing.");
    }
}

public static class CouponCodeGenerator
{
    public static string NewInternalCode() => Guid.NewGuid().ToString("N")[..26].ToUpperInvariant();

    public static string NewDisplayCode(string prefix)
    {
        prefix = string.IsNullOrWhiteSpace(prefix) ? "CP-" : prefix.Trim().ToUpperInvariant();
        if (!prefix.EndsWith('-')) prefix += "-";
        var random = Random.Shared.Next(100000, 999999);
        return prefix + Convert.ToBase64String(BitConverter.GetBytes(random))[..5].Replace('+', 'X').Replace('/', 'Y').ToUpperInvariant();
    }

    public static string NormalizePhone(string phone)
    {
        var digits = new string(phone.Where(c => char.IsDigit(c) || c == '+').ToArray());
        if (string.IsNullOrWhiteSpace(digits)) return phone.Trim();

        if (digits.StartsWith('+')) return digits;
        if (digits.StartsWith("960")) return "+" + digits;
        return "+960" + digits.TrimStart('0');
    }
}

public static class CouponMapper
{
    public static CouponCampaignDto ToListDto(CouponCampaign c, int codes, int scans, int entries) => new(
        c.Id, c.Name, c.Description, c.CampaignType.ToString(), c.Status.ToString(),
        c.RewardTitle, c.RewardValue, c.RewardValueType.ToString(),
        c.ProductId, c.Product?.Name, c.StoreId, c.Store?.Name,
        c.StartsAt, c.EndsAt, c.ContactUrl,
        codes, scans, entries, c.CreatedAt);
}

public static class PublicCouponLoader
{
    public static async Task<CouponCode> LoadActiveCodeAsync(IPosDbContext db, string internalCode, CancellationToken ct)
    {
        var normalized = internalCode.Trim().ToUpperInvariant();
        var code = await db.CouponCodes
            .IgnoreQueryFilters()
            .Include(c => c.Campaign)
            .Include(c => c.Entries)
            .FirstOrDefaultAsync(c => c.InternalCode == normalized && !c.IsDeleted, ct)
            ?? throw new KeyNotFoundException("QR code not found or inactive.");

        if (code.Status is CouponCodeStatus.Voided or CouponCodeStatus.Expired)
            throw new KeyNotFoundException("QR code not found or inactive.");

        if (code.Campaign.Status != CouponCampaignStatus.Active)
            throw new KeyNotFoundException("This campaign is not active.");

        if (code.ExpiresAt.HasValue && code.ExpiresAt.Value < DateTime.UtcNow)
            throw new KeyNotFoundException("This coupon has expired.");

        var planActive = await db.Subscriptions
            .IgnoreQueryFilters()
            .Where(s => s.OrganizationId == code.OrganizationId)
            .Select(s => s.Plan.HasCoupons)
            .FirstOrDefaultAsync(ct);
        if (!planActive)
            throw new KeyNotFoundException("QR code not found or inactive.");

        return code;
    }
}
