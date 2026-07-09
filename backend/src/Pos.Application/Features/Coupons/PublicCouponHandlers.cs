using System.Collections.Concurrent;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Coupons;

public record GetPublicCouponScanQuery(string InternalCode, string? Ip, string? UserAgent, string? Referrer) : IRequest<PublicCouponScanDto>;
public record SubmitPublicCouponEntryCommand(string InternalCode, PublicCouponEnterRequest Request, string? Ip) : IRequest<PublicCouponEnterResponse>;

public class CouponRateLimiter
{
    private readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _attempts = new();
    private const int MaxAttempts = 3;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(15);

    public bool IsRateLimited(string key)
    {
        var now = DateTime.UtcNow;
        var entry = _attempts.AddOrUpdate(key, (1, now), (_, existing) =>
        {
            if (now - existing.WindowStart > Window) return (1, now);
            return (existing.Count + 1, existing.WindowStart);
        });
        return entry.Count > MaxAttempts && now - entry.WindowStart <= Window;
    }
}

public class GetPublicCouponScanQueryHandler(IPosDbContext db) : IRequestHandler<GetPublicCouponScanQuery, PublicCouponScanDto>
{
    public async Task<PublicCouponScanDto> Handle(GetPublicCouponScanQuery request, CancellationToken cancellationToken)
    {
        var code = await PublicCouponLoader.LoadActiveCodeAsync(db, request.InternalCode, cancellationToken);

        var orgName = await db.Organizations
            .IgnoreQueryFilters()
            .Where(o => o.Id == code.OrganizationId)
            .Select(o => o.Name)
            .FirstAsync(cancellationToken);

        db.CouponLookupEvents.Add(new CouponLookupEvent
        {
            OrganizationId = code.OrganizationId,
            CouponCodeId = code.Id,
            Source = CouponLookupSource.PublicQr,
            IpAddress = request.Ip,
            UserAgent = request.UserAgent,
            Referrer = request.Referrer
        });
        await db.SaveChangesAsync(cancellationToken);

        var existingEntry = code.Entries.OrderByDescending(e => e.CreatedAt).FirstOrDefault();

        return new PublicCouponScanDto(
            code.DisplayCode,
            orgName,
            code.Campaign.Name,
            code.Campaign.CampaignType.ToString(),
            code.Campaign.RewardTitle,
            code.Campaign.RewardValue,
            code.Campaign.RewardValueType.ToString(),
            code.Campaign.ContactUrl,
            existingEntry != null,
            existingEntry?.Name);
    }
}

public class SubmitPublicCouponEntryCommandHandler(IPosDbContext db, CouponRateLimiter rateLimiter)
    : IRequestHandler<SubmitPublicCouponEntryCommand, PublicCouponEnterResponse>
{
    public async Task<PublicCouponEnterResponse> Handle(SubmitPublicCouponEntryCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;
        if (!string.IsNullOrEmpty(req.Honeypot))
            throw new InvalidOperationException("Invalid submission.");

        var code = await PublicCouponLoader.LoadActiveCodeAsync(db, command.InternalCode, cancellationToken);

        var rateKey = $"entry:{command.Ip}:{code.Id}";
        if (rateLimiter.IsRateLimited(rateKey))
            throw new InvalidOperationException("Please try again later.");

        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Trim().Length < 2)
            throw new InvalidOperationException("Name is required.");
        if (string.IsNullOrWhiteSpace(req.Phone))
            throw new InvalidOperationException("Phone is required.");
        if (!req.Consent)
            throw new InvalidOperationException("You must agree to the terms.");

        var phone = CouponCodeGenerator.NormalizePhone(req.Phone);

        var duplicate = await db.CouponEntries
            .IgnoreQueryFilters()
            .AnyAsync(e => e.CouponCodeId == code.Id && e.Phone == phone, cancellationToken);
        if (duplicate)
            throw new InvalidOperationException("You have already entered with this phone number.");

        var customer = await db.Customers
            .FirstOrDefaultAsync(c => c.OrganizationId == code.OrganizationId && c.Phone == phone, cancellationToken);

        if (customer == null)
        {
            customer = new Customer
            {
                OrganizationId = code.OrganizationId,
                FirstName = req.Name.Trim(),
                Phone = phone
            };
            db.Customers.Add(customer);
        }

        var entry = new CouponEntry
        {
            OrganizationId = code.OrganizationId,
            CampaignId = code.CampaignId,
            CouponCodeId = code.Id,
            Name = req.Name.Trim(),
            Phone = phone,
            Consent = true,
            CustomerId = customer.Id == Guid.Empty ? null : customer.Id
        };
        db.CouponEntries.Add(entry);

        code.Status = CouponCodeStatus.Claimed;
        code.ClaimedAt = DateTime.UtcNow;
        code.CustomerId = customer.Id == Guid.Empty ? null : customer.Id;

        await db.SaveChangesAsync(cancellationToken);

        var message = code.Campaign.CampaignType switch
        {
            CouponCampaignType.LuckyDraw => "Your entry has been submitted to the lucky draw.",
            CouponCampaignType.DiscountCoupon => $"Show code {code.DisplayCode} at checkout for your discount.",
            CouponCampaignType.FreeProduct => $"Show code {code.DisplayCode} at the store to claim your free item.",
            CouponCampaignType.CashGift => $"Show code {code.DisplayCode} to claim your cash gift.",
            _ => "Thank you for participating."
        };

        return new PublicCouponEnterResponse(code.DisplayCode, message, code.Campaign.CampaignType.ToString());
    }
}
