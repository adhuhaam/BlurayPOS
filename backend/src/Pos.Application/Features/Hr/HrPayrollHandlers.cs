using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Hr;

// --- Payroll ---

public record GetPayrollRunsQuery : IRequest<IList<PayrollRunDto>>;

public class GetPayrollRunsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetPayrollRunsQuery, IList<PayrollRunDto>>
{
    public async Task<IList<PayrollRunDto>> Handle(GetPayrollRunsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var runs = await db.PayrollRuns
            .Include(r => r.PaySlips)
            .Where(r => r.OrganizationId == orgId)
            .OrderByDescending(r => r.PeriodStart)
            .ToListAsync(ct);
        return runs.Select(HrMapper.ToPayrollRunDto).ToList();
    }
}

public record CreatePayrollRunCommand(CreatePayrollRunRequest Request) : IRequest<PayrollRunDto>;

public class CreatePayrollRunCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions, IAuditService audit)
    : IRequestHandler<CreatePayrollRunCommand, PayrollRunDto>
{
    public async Task<PayrollRunDto> Handle(CreatePayrollRunCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        var userId = tenant.UserId ?? throw new InvalidOperationException("User context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Payroll.Run");

        var run = new PayrollRun
        {
            OrganizationId = orgId,
            PeriodStart = command.Request.PeriodStart.Date,
            PeriodEnd = command.Request.PeriodEnd.Date,
            Status = PayrollRunStatus.Draft,
            CreatedByUserId = userId
        };
        db.PayrollRuns.Add(run);
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("PayrollRun", run.Id, "Created", cancellationToken: ct);
        return HrMapper.ToPayrollRunDto(run);
    }
}

public record GeneratePayrollRunCommand(Guid PayrollRunId) : IRequest<PayrollRunDto>;

public class GeneratePayrollRunCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GeneratePayrollRunCommand, PayrollRunDto>
{
    public async Task<PayrollRunDto> Handle(GeneratePayrollRunCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Payroll.Run");

        var run = await db.PayrollRuns
            .Include(r => r.PaySlips).ThenInclude(p => p.Lines)
            .FirstOrDefaultAsync(r => r.Id == command.PayrollRunId && r.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Payroll run not found.");

        if (run.Status == PayrollRunStatus.Finalized)
            throw new InvalidOperationException("Cannot regenerate a finalized payroll run.");

        foreach (var slip in run.PaySlips.ToList())
        {
            db.PaySlipLines.RemoveRange(slip.Lines);
            db.PaySlips.Remove(slip);
        }
        await db.SaveChangesAsync(ct);

        var employees = await db.Employees
            .Include(e => e.Compensation)
            .Include(e => e.Adjustments)
            .Where(e => e.OrganizationId == orgId && e.EmploymentStatus == EmploymentStatus.Active)
            .ToListAsync(ct);

        foreach (var employee in employees)
        {
            var (gross, deductions, net, lines) = HrPayrollCalculator.Calculate(employee, run.PeriodStart, run.PeriodEnd);
            var slip = new PaySlip
            {
                OrganizationId = orgId,
                PayrollRunId = run.Id,
                EmployeeId = employee.Id,
                GrossPay = gross,
                TotalDeductions = deductions,
                NetPay = net
            };
            foreach (var line in lines)
            {
                slip.Lines.Add(new PaySlipLine
                {
                    OrganizationId = orgId,
                    LineType = line.type,
                    Label = line.label,
                    Amount = line.amount
                });
            }
            db.PaySlips.Add(slip);
        }

        await db.SaveChangesAsync(ct);
        await db.PayrollRuns.Include(r => r.PaySlips).FirstAsync(r => r.Id == run.Id, ct);
        return HrMapper.ToPayrollRunDto(run);
    }
}

public record FinalizePayrollRunCommand(Guid PayrollRunId) : IRequest<PayrollRunDto>;

public class FinalizePayrollRunCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions, IAuditService audit)
    : IRequestHandler<FinalizePayrollRunCommand, PayrollRunDto>
{
    public async Task<PayrollRunDto> Handle(FinalizePayrollRunCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Payroll.Approve");

        var run = await db.PayrollRuns
            .Include(r => r.PaySlips)
            .FirstOrDefaultAsync(r => r.Id == command.PayrollRunId && r.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Payroll run not found.");

        if (run.Status == PayrollRunStatus.Finalized)
            throw new InvalidOperationException("Payroll run is already finalized.");
        if (run.PaySlips.Count == 0)
            throw new InvalidOperationException("Generate payslips before finalizing.");

        run.Status = PayrollRunStatus.Finalized;
        run.FinalizedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        await audit.LogAsync("PayrollRun", run.Id, "Finalized", cancellationToken: ct);
        return HrMapper.ToPayrollRunDto(run);
    }
}

public record GetPayrollRunPaySlipsQuery(Guid PayrollRunId) : IRequest<IList<PaySlipDto>>;

public class GetPayrollRunPaySlipsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetPayrollRunPaySlipsQuery, IList<PaySlipDto>>
{
    public async Task<IList<PaySlipDto>> Handle(GetPayrollRunPaySlipsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var slips = await db.PaySlips
            .Include(p => p.Employee)
            .Include(p => p.PayrollRun)
            .Include(p => p.Lines)
            .Where(p => p.PayrollRunId == request.PayrollRunId && p.OrganizationId == orgId)
            .ToListAsync(ct);
        return slips.Select(HrMapper.ToPaySlipDto).ToList();
    }
}

public record GetPaySlipByIdQuery(Guid Id) : IRequest<PaySlipDto>;

public class GetPaySlipByIdQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetPaySlipByIdQuery, PaySlipDto>
{
    public async Task<PaySlipDto> Handle(GetPaySlipByIdQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var slip = await db.PaySlips
            .Include(p => p.Employee)
            .Include(p => p.PayrollRun)
            .Include(p => p.Lines)
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Pay slip not found.");

        return HrMapper.ToPaySlipDto(slip);
    }
}

public record GetEmployeePaySlipsQuery(Guid EmployeeId) : IRequest<IList<PaySlipDto>>;

public class GetEmployeePaySlipsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeePaySlipsQuery, IList<PaySlipDto>>
{
    public async Task<IList<PaySlipDto>> Handle(GetEmployeePaySlipsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var slips = await db.PaySlips
            .Include(p => p.Employee)
            .Include(p => p.PayrollRun)
            .Include(p => p.Lines)
            .Where(p => p.EmployeeId == request.EmployeeId && p.OrganizationId == orgId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(ct);
        return slips.Select(HrMapper.ToPaySlipDto).ToList();
    }
}
