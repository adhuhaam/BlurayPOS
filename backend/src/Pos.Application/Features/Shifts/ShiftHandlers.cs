using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Shifts;

public record GetCurrentShiftQuery(Guid StoreId) : IRequest<ShiftDto?>;
public record GetShiftsQuery(Guid StoreId, int Page = 1, int PageSize = 20) : IRequest<IList<ShiftDto>>;
public record OpenShiftCommand(Guid StoreId, OpenShiftRequest Request) : IRequest<ShiftDto>;
public record CloseShiftCommand(Guid Id, CloseShiftRequest Request) : IRequest<ShiftDto>;
public record GetZReportQuery(Guid ShiftId) : IRequest<ZReportDto>;

public class OpenShiftCommandValidator : AbstractValidator<OpenShiftCommand>
{
    public OpenShiftCommandValidator()
    {
        RuleFor(x => x.Request.OpeningFloat).GreaterThanOrEqualTo(0);
    }
}

public class CloseShiftCommandValidator : AbstractValidator<CloseShiftCommand>
{
    public CloseShiftCommandValidator()
    {
        RuleFor(x => x.Request.ClosingCash).GreaterThanOrEqualTo(0);
    }
}

public class GetCurrentShiftQueryHandler(IPosDbContext db) : IRequestHandler<GetCurrentShiftQuery, ShiftDto?>
{
    public async Task<ShiftDto?> Handle(GetCurrentShiftQuery request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts
            .FirstOrDefaultAsync(s => s.StoreId == request.StoreId && s.Status == ShiftStatus.Open, cancellationToken);

        return shift == null ? null : ShiftMapper.ToDto(shift);
    }
}

public class GetShiftsQueryHandler(IPosDbContext db) : IRequestHandler<GetShiftsQuery, IList<ShiftDto>>
{
    public async Task<IList<ShiftDto>> Handle(GetShiftsQuery request, CancellationToken cancellationToken)
    {
        var shifts = await db.Shifts
            .Where(s => s.StoreId == request.StoreId)
            .OrderByDescending(s => s.OpenedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return shifts.Select(ShiftMapper.ToDto).ToList();
    }
}

public class OpenShiftCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<OpenShiftCommand, ShiftDto>
{
    public async Task<ShiftDto> Handle(OpenShiftCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue || !tenant.UserId.HasValue)
            throw new InvalidOperationException("User context required.");

        var existing = await db.Shifts
            .AnyAsync(s => s.StoreId == command.StoreId && s.Status == ShiftStatus.Open, cancellationToken);

        if (existing)
            throw new InvalidOperationException("A shift is already open for this store.");

        var shift = new Shift
        {
            OrganizationId = tenant.OrganizationId.Value,
            StoreId = command.StoreId,
            OpenedByUserId = tenant.UserId.Value,
            OpeningFloat = command.Request.OpeningFloat,
            ExpectedCash = command.Request.OpeningFloat,
            OpenedAt = DateTime.UtcNow
        };

        db.Shifts.Add(shift);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Shift", shift.Id, "Opened", cancellationToken: cancellationToken);

        return ShiftMapper.ToDto(shift);
    }
}

public class CloseShiftCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CloseShiftCommand, ShiftDto>
{
    public async Task<ShiftDto> Handle(CloseShiftCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.UserId.HasValue)
            throw new InvalidOperationException("User context required.");

        var shift = await db.Shifts.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Shift not found.");

        if (shift.Status == ShiftStatus.Closed)
            return ShiftMapper.ToDto(shift);

        shift.Status = ShiftStatus.Closed;
        shift.ClosingCash = command.Request.ClosingCash;
        shift.ClosedByUserId = tenant.UserId.Value;
        shift.ClosedAt = DateTime.UtcNow;
        shift.ExpectedCash = shift.OpeningFloat + shift.TotalCash;

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Shift", shift.Id, "Closed", cancellationToken: cancellationToken);

        return ShiftMapper.ToDto(shift);
    }
}

public class GetZReportQueryHandler(IPosDbContext db) : IRequestHandler<GetZReportQuery, ZReportDto>
{
    public async Task<ZReportDto> Handle(GetZReportQuery request, CancellationToken cancellationToken)
    {
        var shift = await db.Shifts
            .Include(s => s.Store)
            .FirstOrDefaultAsync(s => s.Id == request.ShiftId, cancellationToken)
            ?? throw new KeyNotFoundException("Shift not found.");

        var orderCount = await db.Orders
            .CountAsync(o => o.ShiftId == shift.Id && o.Status == OrderStatus.Completed, cancellationToken);

        var closingCash = shift.ClosingCash ?? 0;
        var variance = closingCash - shift.ExpectedCash;

        return new ZReportDto(
            shift.Id,
            shift.Store.Name,
            shift.OpenedAt,
            shift.ClosedAt,
            shift.OpeningFloat,
            closingCash,
            shift.ExpectedCash,
            variance,
            shift.TotalSales,
            shift.TotalCash,
            shift.TotalCard,
            orderCount);
    }
}

internal static class ShiftMapper
{
    public static ShiftDto ToDto(Shift shift) => new(
        shift.Id,
        shift.StoreId,
        shift.Status.ToString(),
        shift.OpeningFloat,
        shift.ClosingCash,
        shift.TotalSales,
        shift.TotalCash,
        shift.TotalCard,
        shift.OpenedAt,
        shift.ClosedAt);
}
