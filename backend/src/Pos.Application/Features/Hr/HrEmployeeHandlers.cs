using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Hr;

// --- Dashboard ---

public record GetHrDashboardQuery : IRequest<HrDashboardDto>;

public class GetHrDashboardQueryHandler(IPosDbContext db, ITenantContext tenant) : IRequestHandler<GetHrDashboardQuery, HrDashboardDto>
{
    public async Task<HrDashboardDto> Handle(GetHrDashboardQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);

        var employees = await db.Employees.Where(e => e.OrganizationId == orgId).ToListAsync(ct);
        var pendingLeave = await db.LeaveRequests
            .Include(r => r.Employee).Include(r => r.LeaveType)
            .Where(r => r.OrganizationId == orgId && r.Status == LeaveRequestStatus.Pending)
            .OrderByDescending(r => r.CreatedAt).Take(5).ToListAsync(ct);
        var openRuns = await db.PayrollRuns
            .CountAsync(r => r.OrganizationId == orgId && r.Status == PayrollRunStatus.Draft, ct);

        return new HrDashboardDto(
            employees.Count,
            employees.Count(e => e.EmploymentStatus == EmploymentStatus.Active),
            await db.LeaveRequests.CountAsync(r => r.OrganizationId == orgId && r.Status == LeaveRequestStatus.Pending, ct),
            openRuns,
            pendingLeave.Select(HrMapper.ToLeaveRequestDto).ToList());
    }
}

// --- Employees ---

public record GetEmployeesQuery(string? Search = null) : IRequest<IList<EmployeeListItemDto>>;

public class GetEmployeesQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeesQuery, IList<EmployeeListItemDto>>
{
    public async Task<IList<EmployeeListItemDto>> Handle(GetEmployeesQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var query = db.Employees
            .Include(e => e.DefaultStore)
            .Where(e => e.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim().ToLower();
            query = query.Where(e =>
                e.FirstName.ToLower().Contains(s) || e.LastName.ToLower().Contains(s) ||
                e.EmployeeNumber.ToLower().Contains(s) ||
                (e.Email != null && e.Email.ToLower().Contains(s)));
        }

        var list = await query.OrderBy(e => e.LastName).ThenBy(e => e.FirstName).ToListAsync(ct);
        return list.Select(HrMapper.ToListItem).ToList();
    }
}

public record GetEmployeeByIdQuery(Guid Id) : IRequest<EmployeeDto>;

public class GetEmployeeByIdQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeByIdQuery, EmployeeDto>
{
    public async Task<EmployeeDto> Handle(GetEmployeeByIdQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var employee = await db.Employees
            .Include(e => e.DefaultStore)
            .FirstOrDefaultAsync(e => e.Id == request.Id && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        return HrMapper.ToDto(employee);
    }
}

public record CreateEmployeeCommand(CreateEmployeeRequest Request) : IRequest<EmployeeDto>;

public class CreateEmployeeCommandValidator : AbstractValidator<CreateEmployeeCommand>
{
    public CreateEmployeeCommandValidator()
    {
        RuleFor(x => x.Request.FirstName).NotEmpty();
        RuleFor(x => x.Request.LastName).NotEmpty();
    }
}

public class CreateEmployeeCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions, IAuditService audit)
    : IRequestHandler<CreateEmployeeCommand, EmployeeDto>
{
    public async Task<EmployeeDto> Handle(CreateEmployeeCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var req = command.Request;
        var number = await HrPayrollCalculator.NextEmployeeNumberAsync(db, orgId, ct);

        var employee = new Employee
        {
            OrganizationId = orgId,
            EmployeeNumber = number,
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Email = req.Email?.Trim(),
            Phone = req.Phone?.Trim(),
            Address = req.Address?.Trim(),
            Nationality = req.Nationality?.Trim(),
            IdDocumentType = HrMapper.ParseIdDocumentType(req.IdDocumentType),
            IdDocumentNumber = req.IdDocumentNumber?.Trim(),
            DateOfBirth = req.DateOfBirth,
            HireDate = req.HireDate ?? DateTime.UtcNow,
            JobTitle = req.JobTitle?.Trim(),
            Department = req.Department?.Trim(),
            DefaultStoreId = req.DefaultStoreId,
            EmploymentStatus = EmploymentStatus.Active
        };

        db.Employees.Add(employee);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("Employee", employee.Id, "Created", cancellationToken: ct);

        employee = await db.Employees.Include(e => e.DefaultStore).FirstAsync(e => e.Id == employee.Id, ct);
        return HrMapper.ToDto(employee);
    }
}

public record UpdateEmployeeCommand(Guid Id, UpdateEmployeeRequest Request) : IRequest<EmployeeDto>;

public class UpdateEmployeeCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions, IAuditService audit)
    : IRequestHandler<UpdateEmployeeCommand, EmployeeDto>
{
    public async Task<EmployeeDto> Handle(UpdateEmployeeCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .Include(e => e.DefaultStore)
            .FirstOrDefaultAsync(e => e.Id == command.Id && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var req = command.Request;
        employee.FirstName = req.FirstName.Trim();
        employee.LastName = req.LastName.Trim();
        employee.Email = req.Email?.Trim();
        employee.Phone = req.Phone?.Trim();
        employee.Address = req.Address?.Trim();
        employee.Nationality = req.Nationality?.Trim();
        employee.IdDocumentType = HrMapper.ParseIdDocumentType(req.IdDocumentType);
        employee.IdDocumentNumber = req.IdDocumentNumber?.Trim();
        employee.DateOfBirth = req.DateOfBirth;
        employee.HireDate = req.HireDate;
        employee.TerminationDate = req.TerminationDate;
        employee.JobTitle = req.JobTitle?.Trim();
        employee.Department = req.Department?.Trim();
        employee.EmploymentStatus = HrMapper.ParseEmploymentStatus(req.EmploymentStatus);
        employee.DefaultStoreId = req.DefaultStoreId;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync("Employee", employee.Id, "Updated", cancellationToken: ct);
        return HrMapper.ToDto(employee);
    }
}

public record UpdateEmployeeDocumentCommand(Guid Id, string FilePath) : IRequest<EmployeeDto>;

public class UpdateEmployeeDocumentCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<UpdateEmployeeDocumentCommand, EmployeeDto>
{
    public async Task<EmployeeDto> Handle(UpdateEmployeeDocumentCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .Include(e => e.DefaultStore)
            .FirstOrDefaultAsync(e => e.Id == command.Id && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        employee.IdDocumentFilePath = command.FilePath;
        await db.SaveChangesAsync(ct);
        return HrMapper.ToDto(employee);
    }
}

// --- Compensation ---

public record GetEmployeeCompensationQuery(Guid EmployeeId) : IRequest<EmployeeCompensationDto?>;

public class GetEmployeeCompensationQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeCompensationQuery, EmployeeCompensationDto?>
{
    public async Task<EmployeeCompensationDto?> Handle(GetEmployeeCompensationQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var comp = await db.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.EmployeeId == request.EmployeeId && c.OrganizationId == orgId, ct);
        return comp == null ? null : HrMapper.ToCompensationDto(comp);
    }
}

public record UpsertEmployeeCompensationCommand(Guid EmployeeId, UpsertEmployeeCompensationRequest Request)
    : IRequest<EmployeeCompensationDto>;

public class UpsertEmployeeCompensationCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions, IAuditService audit)
    : IRequestHandler<UpsertEmployeeCompensationCommand, EmployeeCompensationDto>
{
    public async Task<EmployeeCompensationDto> Handle(UpsertEmployeeCompensationCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == command.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var req = command.Request;
        var comp = await db.EmployeeCompensations
            .FirstOrDefaultAsync(c => c.EmployeeId == employee.Id && c.OrganizationId == orgId, ct);

        if (comp == null)
        {
            comp = new EmployeeCompensation { OrganizationId = orgId, EmployeeId = employee.Id };
            db.EmployeeCompensations.Add(comp);
        }

        comp.BasicSalary = req.BasicSalary;
        comp.Currency = string.IsNullOrWhiteSpace(req.Currency) ? "MVR" : req.Currency.Trim();
        comp.PayFrequency = HrMapper.ParsePayFrequency(req.PayFrequency);
        comp.BankName = req.BankName?.Trim();
        comp.BankAccountNumber = req.BankAccountNumber?.Trim();
        comp.EffectiveFrom = req.EffectiveFrom;

        await db.SaveChangesAsync(ct);
        await audit.LogAsync("EmployeeCompensation", comp.Id, "Upserted", cancellationToken: ct);
        return HrMapper.ToCompensationDto(comp);
    }
}

// --- Adjustments ---

public record GetEmployeeAdjustmentsQuery(Guid EmployeeId) : IRequest<IList<PayrollAdjustmentDto>>;

public class GetEmployeeAdjustmentsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeAdjustmentsQuery, IList<PayrollAdjustmentDto>>
{
    public async Task<IList<PayrollAdjustmentDto>> Handle(GetEmployeeAdjustmentsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var list = await db.PayrollAdjustments
            .Where(a => a.EmployeeId == request.EmployeeId && a.OrganizationId == orgId)
            .OrderByDescending(a => a.EffectiveFrom)
            .ToListAsync(ct);
        return list.Select(HrMapper.ToAdjustmentDto).ToList();
    }
}

public record CreatePayrollAdjustmentCommand(Guid EmployeeId, UpsertPayrollAdjustmentRequest Request)
    : IRequest<PayrollAdjustmentDto>;

public class CreatePayrollAdjustmentCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<CreatePayrollAdjustmentCommand, PayrollAdjustmentDto>
{
    public async Task<PayrollAdjustmentDto> Handle(CreatePayrollAdjustmentCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == command.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var req = command.Request;
        var adj = new PayrollAdjustment
        {
            OrganizationId = orgId,
            EmployeeId = employee.Id,
            Type = HrMapper.ParseAdjustmentType(req.Type),
            Label = req.Label.Trim(),
            Amount = req.Amount,
            Percent = req.Percent,
            IsRecurring = req.IsRecurring,
            EffectiveFrom = req.EffectiveFrom,
            EffectiveTo = req.EffectiveTo
        };
        db.PayrollAdjustments.Add(adj);
        await db.SaveChangesAsync(ct);
        return HrMapper.ToAdjustmentDto(adj);
    }
}

public record UpdatePayrollAdjustmentCommand(Guid EmployeeId, Guid AdjustmentId, UpsertPayrollAdjustmentRequest Request)
    : IRequest<PayrollAdjustmentDto>;

public class UpdatePayrollAdjustmentCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<UpdatePayrollAdjustmentCommand, PayrollAdjustmentDto>
{
    public async Task<PayrollAdjustmentDto> Handle(UpdatePayrollAdjustmentCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var adj = await db.PayrollAdjustments
            .FirstOrDefaultAsync(a => a.Id == command.AdjustmentId && a.EmployeeId == command.EmployeeId && a.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Adjustment not found.");

        var req = command.Request;
        adj.Type = HrMapper.ParseAdjustmentType(req.Type);
        adj.Label = req.Label.Trim();
        adj.Amount = req.Amount;
        adj.Percent = req.Percent;
        adj.IsRecurring = req.IsRecurring;
        adj.EffectiveFrom = req.EffectiveFrom;
        adj.EffectiveTo = req.EffectiveTo;
        await db.SaveChangesAsync(ct);
        return HrMapper.ToAdjustmentDto(adj);
    }
}

public record DeletePayrollAdjustmentCommand(Guid EmployeeId, Guid AdjustmentId) : IRequest<bool>;

public class DeletePayrollAdjustmentCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<DeletePayrollAdjustmentCommand, bool>
{
    public async Task<bool> Handle(DeletePayrollAdjustmentCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var adj = await db.PayrollAdjustments
            .FirstOrDefaultAsync(a => a.Id == command.AdjustmentId && a.EmployeeId == command.EmployeeId && a.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Adjustment not found.");

        adj.IsDeleted = true;
        await db.SaveChangesAsync(ct);
        return true;
    }
}
