using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Coupons;

public record GetCouponDashboardQuery : IRequest<CouponDashboardDto>;
public record GetCouponCampaignsQuery(int Page = 1, int PageSize = 50) : IRequest<PagedResult<CouponCampaignDto>>;
public record GetCouponCampaignByIdQuery(Guid Id) : IRequest<CouponCampaignDetailDto>;
public record CreateCouponCampaignCommand(CreateCouponCampaignRequest Request) : IRequest<CouponCampaignDto>;
public record UpdateCouponCampaignCommand(Guid Id, UpdateCouponCampaignRequest Request) : IRequest<CouponCampaignDto>;
public record CreateCouponBatchCommand(Guid CampaignId, CreateCouponBatchRequest Request) : IRequest<CouponBatchDto>;
public record GetCouponBatchPrintQuery(Guid CampaignId, Guid BatchId) : IRequest<CouponBatchPrintDto>;
public record GetCouponEntriesQuery(Guid CampaignId, int Page = 1, int PageSize = 50) : IRequest<PagedResult<CouponEntryDto>>;
public record GetCouponCodesQuery(
    Guid CampaignId, Guid? BatchId, string? Status, string? Search, int Page = 1, int PageSize = 100) : IRequest<PagedResult<CouponCodeDto>>;
public record VoidCouponCodeCommand(Guid CodeId) : IRequest<CouponCodeDto>;
public record GetCampaignWinnersQuery(Guid CampaignId) : IRequest<IList<CampaignWinnerDto>>;
public record ExportCouponBatchCsvQuery(Guid CampaignId, Guid BatchId) : IRequest<byte[]>;
public record AssignCampaignWinnerCommand(AssignCampaignWinnerRequest Request) : IRequest<bool>;

public class GetCouponDashboardQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<GetCouponDashboardQuery, CouponDashboardDto>
{
    public async Task<CouponDashboardDto> Handle(GetCouponDashboardQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var campaigns = db.CouponCampaigns.AsQueryable();
        var totalCampaigns = await campaigns.CountAsync(cancellationToken);
        var activeCampaigns = await campaigns.CountAsync(c => c.Status == CouponCampaignStatus.Active, cancellationToken);
        var totalCodes = await db.CouponCodes.CountAsync(cancellationToken);
        var totalScans = await db.CouponLookupEvents.CountAsync(cancellationToken);
        var totalEntries = await db.CouponEntries.CountAsync(cancellationToken);
        var today = DateTime.UtcNow.Date;
        var todayScans = await db.CouponLookupEvents.CountAsync(e => e.CreatedAt >= today, cancellationToken);
        var todayEntries = await db.CouponEntries.CountAsync(e => e.CreatedAt >= today, cancellationToken);

        var recentCampaigns = await campaigns
            .OrderByDescending(c => c.CreatedAt)
            .Take(5)
            .ToListAsync(cancellationToken);

        var recent = new List<CouponCampaignDto>();
        foreach (var c in recentCampaigns)
        {
            var codes = await db.CouponCodes.CountAsync(x => x.CampaignId == c.Id, cancellationToken);
            var scans = await db.CouponLookupEvents.CountAsync(x => x.CouponCode.CampaignId == c.Id, cancellationToken);
            var entries = await db.CouponEntries.CountAsync(x => x.CampaignId == c.Id, cancellationToken);
            recent.Add(CouponMapper.ToListDto(c, codes, scans, entries));
        }

        return new CouponDashboardDto(
            totalCampaigns, activeCampaigns, totalCodes, totalScans, totalEntries, todayScans, todayEntries,
            recent);
    }
}

public class GetCouponCampaignsQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<GetCouponCampaignsQuery, PagedResult<CouponCampaignDto>>
{
    public async Task<PagedResult<CouponCampaignDto>> Handle(GetCouponCampaignsQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var query = db.CouponCampaigns
            .Include(c => c.Product)
            .Include(c => c.Store)
            .OrderByDescending(c => c.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new
            {
                Campaign = c,
                Codes = c.Codes.Count,
                Scans = c.Codes.SelectMany(x => x.LookupEvents).Count(),
                Entries = c.Entries.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<CouponCampaignDto>
        {
            Items = items.Select(i => CouponMapper.ToListDto(i.Campaign, i.Codes, i.Scans, i.Entries)).ToList(),
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetCouponCampaignByIdQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<GetCouponCampaignByIdQuery, CouponCampaignDetailDto>
{
    public async Task<CouponCampaignDetailDto> Handle(GetCouponCampaignByIdQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var c = await db.CouponCampaigns
            .Include(x => x.Product)
            .Include(x => x.Store)
            .Include(x => x.Batches)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        var codes = await db.CouponCodes.CountAsync(x => x.CampaignId == c.Id, cancellationToken);
        var scans = await db.CouponLookupEvents.CountAsync(x => x.CouponCode.CampaignId == c.Id, cancellationToken);
        var entries = await db.CouponEntries.CountAsync(x => x.CampaignId == c.Id, cancellationToken);
        var winners = await db.CampaignWinners.CountAsync(x => x.CampaignId == c.Id, cancellationToken);

        var batches = c.Batches.OrderByDescending(b => b.CreatedAt).Select(b => new CouponBatchDto(
            b.Id, b.CampaignId, b.Name, b.Prefix, b.Quantity, b.LocationHint, b.StoreId,
            b.Codes.Count, b.CreatedAt)).ToList();

        return new CouponCampaignDetailDto(
            c.Id, c.Name, c.Description, c.CampaignType.ToString(), c.Status.ToString(),
            c.RewardTitle, c.RewardValue, c.RewardValueType.ToString(),
            c.ProductId, c.Product?.Name, c.StoreId, c.Store?.Name,
            c.StartsAt, c.EndsAt, c.ContactUrl,
            codes, scans, entries, winners, c.CreatedAt, batches);
    }
}

public class CreateCouponCampaignCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit)
    : IRequestHandler<CreateCouponCampaignCommand, CouponCampaignDto>
{
    public async Task<CouponCampaignDto> Handle(CreateCouponCampaignCommand command, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        var userId = tenant.UserId ?? throw new InvalidOperationException("User context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        if (!Enum.TryParse<CouponCampaignType>(command.Request.CampaignType, true, out var campaignType))
            throw new InvalidOperationException("Invalid campaign type.");

        var valueType = CouponRewardValueType.None;
        if (!string.IsNullOrWhiteSpace(command.Request.RewardValueType))
        {
            if (!Enum.TryParse<CouponRewardValueType>(command.Request.RewardValueType, true, out valueType))
                throw new InvalidOperationException("Invalid reward value type.");
        }

        var campaign = new CouponCampaign
        {
            OrganizationId = orgId,
            Name = command.Request.Name.Trim(),
            Description = command.Request.Description,
            CampaignType = campaignType,
            Status = CouponCampaignStatus.Draft,
            RewardTitle = command.Request.RewardTitle.Trim(),
            RewardValue = command.Request.RewardValue,
            RewardValueType = valueType,
            ProductId = command.Request.ProductId,
            StoreId = command.Request.StoreId,
            StartsAt = command.Request.StartsAt,
            EndsAt = command.Request.EndsAt,
            ContactUrl = command.Request.ContactUrl,
            CreatedByUserId = userId
        };

        db.CouponCampaigns.Add(campaign);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CouponCampaign", campaign.Id, "Created", cancellationToken: cancellationToken);

        return CouponMapper.ToListDto(campaign, 0, 0, 0);
    }
}

public class UpdateCouponCampaignCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit)
    : IRequestHandler<UpdateCouponCampaignCommand, CouponCampaignDto>
{
    public async Task<CouponCampaignDto> Handle(UpdateCouponCampaignCommand command, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var campaign = await db.CouponCampaigns
            .Include(c => c.Product)
            .Include(c => c.Store)
            .FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        if (!Enum.TryParse<CouponCampaignType>(command.Request.CampaignType, true, out var campaignType))
            throw new InvalidOperationException("Invalid campaign type.");
        if (!Enum.TryParse<CouponCampaignStatus>(command.Request.Status, true, out var status))
            throw new InvalidOperationException("Invalid status.");

        var valueType = CouponRewardValueType.None;
        if (!string.IsNullOrWhiteSpace(command.Request.RewardValueType))
        {
            if (!Enum.TryParse<CouponRewardValueType>(command.Request.RewardValueType, true, out valueType))
                throw new InvalidOperationException("Invalid reward value type.");
        }

        campaign.Name = command.Request.Name.Trim();
        campaign.Description = command.Request.Description;
        campaign.CampaignType = campaignType;
        campaign.Status = status;
        campaign.RewardTitle = command.Request.RewardTitle.Trim();
        campaign.RewardValue = command.Request.RewardValue;
        campaign.RewardValueType = valueType;
        campaign.ProductId = command.Request.ProductId;
        campaign.StoreId = command.Request.StoreId;
        campaign.StartsAt = command.Request.StartsAt;
        campaign.EndsAt = command.Request.EndsAt;
        campaign.ContactUrl = command.Request.ContactUrl;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CouponCampaign", campaign.Id, "Updated", cancellationToken: cancellationToken);

        var codes = await db.CouponCodes.CountAsync(x => x.CampaignId == campaign.Id, cancellationToken);
        var scans = await db.CouponLookupEvents.CountAsync(x => x.CouponCode.CampaignId == campaign.Id, cancellationToken);
        var entries = await db.CouponEntries.CountAsync(x => x.CampaignId == campaign.Id, cancellationToken);

        return CouponMapper.ToListDto(campaign, codes, scans, entries);
    }
}

public class CreateCouponBatchCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit)
    : IRequestHandler<CreateCouponBatchCommand, CouponBatchDto>
{
    public async Task<CouponBatchDto> Handle(CreateCouponBatchCommand command, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        if (command.Request.Quantity is < 1 or > 5000)
            throw new InvalidOperationException("Quantity must be between 1 and 5000.");

        var campaign = await db.CouponCampaigns.FirstOrDefaultAsync(c => c.Id == command.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Campaign not found.");

        var org = await db.Organizations.FirstAsync(o => o.Id == orgId, cancellationToken);
        var prefix = string.IsNullOrWhiteSpace(command.Request.Prefix)
            ? org.Slug.ToUpperInvariant() + "-"
            : command.Request.Prefix.Trim().ToUpperInvariant();
        if (!prefix.EndsWith('-')) prefix += "-";

        var batch = new CouponBatch
        {
            OrganizationId = orgId,
            CampaignId = campaign.Id,
            Name = command.Request.Name.Trim(),
            Prefix = prefix,
            Quantity = command.Request.Quantity,
            LocationHint = command.Request.LocationHint,
            StoreId = command.Request.StoreId
        };

        db.CouponBatches.Add(batch);

        var existingDisplay = await db.CouponCodes
            .Where(c => c.OrganizationId == orgId)
            .Select(c => c.DisplayCode)
            .ToListAsync(cancellationToken);
        var displaySet = existingDisplay.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var expiresAt = campaign.EndsAt;
        for (var i = 0; i < command.Request.Quantity; i++)
        {
            string displayCode;
            do displayCode = CouponCodeGenerator.NewDisplayCode(prefix);
            while (!displaySet.Add(displayCode));

            db.CouponCodes.Add(new CouponCode
            {
                OrganizationId = orgId,
                CampaignId = campaign.Id,
                BatchId = batch.Id,
                InternalCode = CouponCodeGenerator.NewInternalCode(),
                DisplayCode = displayCode,
                Status = CouponCodeStatus.Active,
                MaxUses = 1,
                ExpiresAt = expiresAt
            });
        }

        if (campaign.Status == CouponCampaignStatus.Draft)
            campaign.Status = CouponCampaignStatus.Active;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CouponBatch", batch.Id, "Generated", cancellationToken: cancellationToken);

        return new CouponBatchDto(batch.Id, batch.CampaignId, batch.Name, batch.Prefix, batch.Quantity,
            batch.LocationHint, batch.StoreId, command.Request.Quantity, batch.CreatedAt);
    }
}

public class GetCouponBatchPrintQueryHandler(IPosDbContext db, ITenantContext tenant, ICouponPublicUrlService urls)
    : IRequestHandler<GetCouponBatchPrintQuery, CouponBatchPrintDto>
{
    public async Task<CouponBatchPrintDto> Handle(GetCouponBatchPrintQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var batch = await db.CouponBatches
            .Include(b => b.Campaign)
            .FirstOrDefaultAsync(b => b.Id == request.BatchId && b.CampaignId == request.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Batch not found.");

        var org = await db.Organizations.FirstAsync(o => o.Id == orgId, cancellationToken);
        var codes = await db.CouponCodes
            .Where(c => c.BatchId == batch.Id)
            .OrderBy(c => c.DisplayCode)
            .ToListAsync(cancellationToken);

        var items = codes.Select(c => new CouponPrintItemDto(
            c.Id, c.InternalCode, c.DisplayCode,
            urls.GetQrImageApiUrl(c.InternalCode), c.ExpiresAt)).ToList();

        return new CouponBatchPrintDto(
            batch.Id, batch.Campaign.Name, org.Name, batch.Campaign.RewardTitle,
            batch.LocationHint, items);
    }
}

public class GetCouponEntriesQueryHandler(IPosDbContext db, ITenantContext tenant)
    : IRequestHandler<GetCouponEntriesQuery, PagedResult<CouponEntryDto>>
{
    public async Task<PagedResult<CouponEntryDto>> Handle(GetCouponEntriesQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var query = db.CouponEntries
            .Include(e => e.CouponCode)
            .Where(e => e.CampaignId == request.CampaignId)
            .OrderByDescending(e => e.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(e => new CouponEntryDto(e.Id, e.CampaignId, e.CouponCodeId, e.CouponCode.DisplayCode, e.Name, e.Phone, e.CreatedAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<CouponEntryDto> { Items = items, TotalCount = total, Page = request.Page, PageSize = request.PageSize };
    }
}

public class AssignCampaignWinnerCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit)
    : IRequestHandler<AssignCampaignWinnerCommand, bool>
{
    public async Task<bool> Handle(AssignCampaignWinnerCommand command, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var req = command.Request;
        var code = await db.CouponCodes.FirstOrDefaultAsync(c => c.Id == req.CouponCodeId && c.CampaignId == req.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Coupon code not found.");

        db.CampaignWinners.Add(new CampaignWinner
        {
            OrganizationId = orgId,
            CampaignId = req.CampaignId,
            CouponCodeId = req.CouponCodeId,
            EntryId = req.EntryId,
            AnnouncedAt = DateTime.UtcNow,
            Notes = req.Notes
        });

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CampaignWinner", code.Id, "Assigned", cancellationToken: cancellationToken);
        return true;
    }
}

public class GetCouponCodesQueryHandler(IPosDbContext db, ITenantContext tenant)
    : IRequestHandler<GetCouponCodesQuery, PagedResult<CouponCodeDto>>
{
    public async Task<PagedResult<CouponCodeDto>> Handle(GetCouponCodesQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var query = db.CouponCodes
            .Include(c => c.Entries)
            .Include(c => c.LookupEvents)
            .Where(c => c.CampaignId == request.CampaignId);

        if (request.BatchId.HasValue)
            query = query.Where(c => c.BatchId == request.BatchId.Value);

        if (!string.IsNullOrWhiteSpace(request.Status)
            && Enum.TryParse<CouponCodeStatus>(request.Status, true, out var status))
            query = query.Where(c => c.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(c => c.DisplayCode.Contains(term) || c.InternalCode.Contains(term));
        }

        var total = await query.CountAsync(cancellationToken);
        var codes = await query
            .OrderBy(c => c.DisplayCode)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = codes.Select(c =>
        {
            var entry = c.Entries.OrderByDescending(e => e.CreatedAt).FirstOrDefault();
            return new CouponCodeDto(
                c.Id, c.CampaignId, c.BatchId, c.InternalCode, c.DisplayCode,
                c.Status.ToString(), c.LookupEvents.Count, c.UsedCount, c.MaxUses,
                c.ExpiresAt, c.ClaimedAt, entry?.Name, entry?.Phone);
        }).ToList();

        return new PagedResult<CouponCodeDto> { Items = items, TotalCount = total, Page = request.Page, PageSize = request.PageSize };
    }
}

public class VoidCouponCodeCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit)
    : IRequestHandler<VoidCouponCodeCommand, CouponCodeDto>
{
    public async Task<CouponCodeDto> Handle(VoidCouponCodeCommand command, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var code = await db.CouponCodes
            .Include(c => c.Entries)
            .Include(c => c.LookupEvents)
            .FirstOrDefaultAsync(c => c.Id == command.CodeId, cancellationToken)
            ?? throw new KeyNotFoundException("Coupon code not found.");

        if (code.Status == CouponCodeStatus.Redeemed)
            throw new InvalidOperationException("Cannot void a redeemed coupon.");

        code.Status = CouponCodeStatus.Voided;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("CouponCode", code.Id, "Voided", cancellationToken: cancellationToken);

        var entry = code.Entries.OrderByDescending(e => e.CreatedAt).FirstOrDefault();
        return new CouponCodeDto(
            code.Id, code.CampaignId, code.BatchId, code.InternalCode, code.DisplayCode,
            code.Status.ToString(), code.LookupEvents.Count, code.UsedCount, code.MaxUses,
            code.ExpiresAt, code.ClaimedAt, entry?.Name, entry?.Phone);
    }
}

public class GetCampaignWinnersQueryHandler(IPosDbContext db, ITenantContext tenant)
    : IRequestHandler<GetCampaignWinnersQuery, IList<CampaignWinnerDto>>
{
    public async Task<IList<CampaignWinnerDto>> Handle(GetCampaignWinnersQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var winners = await db.CampaignWinners
            .Include(w => w.CouponCode)
            .Include(w => w.Entry)
            .Where(w => w.CampaignId == request.CampaignId)
            .OrderByDescending(w => w.AnnouncedAt)
            .ToListAsync(cancellationToken);

        return winners.Select(w => new CampaignWinnerDto(
            w.Id, w.CampaignId, w.CouponCodeId, w.CouponCode.DisplayCode,
            w.EntryId, w.Entry?.Name, w.Entry?.Phone, w.AnnouncedAt, w.Notes)).ToList();
    }
}

public class ExportCouponBatchCsvQueryHandler(IPosDbContext db, ITenantContext tenant, ICouponPublicUrlService urls)
    : IRequestHandler<ExportCouponBatchCsvQuery, byte[]>
{
    public async Task<byte[]> Handle(ExportCouponBatchCsvQuery request, CancellationToken cancellationToken)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await CouponModuleGuard.EnsureCouponsEnabledAsync(db, orgId, cancellationToken);

        var batch = await db.CouponBatches
            .FirstOrDefaultAsync(b => b.Id == request.BatchId && b.CampaignId == request.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Batch not found.");

        var codes = await db.CouponCodes
            .Where(c => c.BatchId == batch.Id)
            .OrderBy(c => c.DisplayCode)
            .ToListAsync(cancellationToken);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("display_code,internal_code,scan_url,status,expires_at");
        foreach (var c in codes)
        {
            var scanUrl = urls.GetScanUrl(c.InternalCode);
            var expires = c.ExpiresAt?.ToString("O") ?? "";
            sb.AppendLine($"{CsvEscape(c.DisplayCode)},{CsvEscape(c.InternalCode)},{CsvEscape(scanUrl)},{c.Status},{CsvEscape(expires)}");
        }

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
