using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Hr;

// --- Attendance ---

public record GetAttendanceQuery(Guid? EmployeeId = null, DateTime? From = null, DateTime? To = null)
    : IRequest<IList<AttendanceRecordDto>>;

public class GetAttendanceQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetAttendanceQuery, IList<AttendanceRecordDto>>
{
    public async Task<IList<AttendanceRecordDto>> Handle(GetAttendanceQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var query = db.AttendanceRecords
            .Include(a => a.Employee)
            .Include(a => a.Store)
            .Where(a => a.OrganizationId == orgId);

        if (request.EmployeeId.HasValue)
            query = query.Where(a => a.EmployeeId == request.EmployeeId.Value);
        if (request.From.HasValue)
            query = query.Where(a => a.ClockInAt >= request.From.Value);
        if (request.To.HasValue)
            query = query.Where(a => a.ClockInAt <= request.To.Value);

        var list = await query.OrderByDescending(a => a.ClockInAt).Take(500).ToListAsync(ct);
        return list.Select(HrMapper.ToAttendanceDto).ToList();
    }
}

public record ClockInCommand(ClockInRequest Request) : IRequest<AttendanceRecordDto>;

public class ClockInCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<ClockInCommand, AttendanceRecordDto>
{
    public async Task<AttendanceRecordDto> Handle(ClockInCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Attendance.Manage");

        var req = command.Request;
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var open = await db.AttendanceRecords
            .AnyAsync(a => a.EmployeeId == employee.Id && a.ClockOutAt == null && a.OrganizationId == orgId, ct);
        if (open)
            throw new InvalidOperationException("Employee already clocked in.");

        var record = new AttendanceRecord
        {
            OrganizationId = orgId,
            EmployeeId = employee.Id,
            StoreId = req.StoreId,
            ClockInAt = DateTime.UtcNow,
            Source = AttendanceSource.Manual,
            Notes = req.Notes?.Trim()
        };
        db.AttendanceRecords.Add(record);
        await db.SaveChangesAsync(ct);

        await db.AttendanceRecords.Include(a => a.Employee).Include(a => a.Store)
            .FirstAsync(a => a.Id == record.Id, ct);
        return HrMapper.ToAttendanceDto(record);
    }
}

public record ClockOutCommand(ClockOutRequest Request) : IRequest<AttendanceRecordDto>;

public class ClockOutCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<ClockOutCommand, AttendanceRecordDto>
{
    public async Task<AttendanceRecordDto> Handle(ClockOutCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Attendance.Manage");

        var record = await db.AttendanceRecords
            .Include(a => a.Employee)
            .Include(a => a.Store)
            .Where(a => a.EmployeeId == command.Request.EmployeeId && a.OrganizationId == orgId && a.ClockOutAt == null)
            .OrderByDescending(a => a.ClockInAt)
            .FirstOrDefaultAsync(ct)
            ?? throw new InvalidOperationException("No open clock-in found.");

        record.ClockOutAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(command.Request.Notes))
            record.Notes = command.Request.Notes.Trim();
        await db.SaveChangesAsync(ct);
        return HrMapper.ToAttendanceDto(record);
    }
}

public record ManualAttendanceCommand(ManualAttendanceRequest Request) : IRequest<AttendanceRecordDto>;

public class ManualAttendanceCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<ManualAttendanceCommand, AttendanceRecordDto>
{
    public async Task<AttendanceRecordDto> Handle(ManualAttendanceCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Attendance.Manage");

        var req = command.Request;
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var record = new AttendanceRecord
        {
            OrganizationId = orgId,
            EmployeeId = employee.Id,
            StoreId = req.StoreId,
            ClockInAt = req.ClockInAt,
            ClockOutAt = req.ClockOutAt,
            Source = AttendanceSource.Manual,
            Notes = req.Notes?.Trim()
        };
        db.AttendanceRecords.Add(record);
        await db.SaveChangesAsync(ct);

        await db.AttendanceRecords.Include(a => a.Employee).Include(a => a.Store)
            .FirstAsync(a => a.Id == record.Id, ct);
        return HrMapper.ToAttendanceDto(record);
    }
}

// --- Leave ---

public record GetLeaveTypesQuery : IRequest<IList<LeaveTypeDto>>;

public class GetLeaveTypesQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetLeaveTypesQuery, IList<LeaveTypeDto>>
{
    public async Task<IList<LeaveTypeDto>> Handle(GetLeaveTypesQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var types = await db.LeaveTypes
            .Where(t => t.OrganizationId == orgId)
            .OrderBy(t => t.Name)
            .ToListAsync(ct);
        return types.Select(HrMapper.ToLeaveTypeDto).ToList();
    }
}

public record CreateLeaveTypeCommand(UpsertLeaveTypeRequest Request) : IRequest<LeaveTypeDto>;

public class CreateLeaveTypeCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<CreateLeaveTypeCommand, LeaveTypeDto>
{
    public async Task<LeaveTypeDto> Handle(CreateLeaveTypeCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var req = command.Request;
        var leaveType = new LeaveType
        {
            OrganizationId = orgId,
            Name = req.Name.Trim(),
            IsPaid = req.IsPaid,
            DefaultDaysPerYear = req.DefaultDaysPerYear
        };
        db.LeaveTypes.Add(leaveType);
        await db.SaveChangesAsync(ct);
        return HrMapper.ToLeaveTypeDto(leaveType);
    }
}

public record GetLeaveRequestsQuery(string? Status = null) : IRequest<IList<LeaveRequestDto>>;

public class GetLeaveRequestsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetLeaveRequestsQuery, IList<LeaveRequestDto>>
{
    public async Task<IList<LeaveRequestDto>> Handle(GetLeaveRequestsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var query = db.LeaveRequests
            .Include(r => r.Employee)
            .Include(r => r.LeaveType)
            .Where(r => r.OrganizationId == orgId);

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<LeaveRequestStatus>(request.Status, ignoreCase: true, out var status))
            query = query.Where(r => r.Status == status);

        var list = await query.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        return list.Select(HrMapper.ToLeaveRequestDto).ToList();
    }
}

public record CreateLeaveRequestCommand(CreateLeaveRequestRequest Request) : IRequest<LeaveRequestDto>;

public class CreateLeaveRequestCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<CreateLeaveRequestCommand, LeaveRequestDto>
{
    public async Task<LeaveRequestDto> Handle(CreateLeaveRequestCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var req = command.Request;
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == req.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var leaveType = await db.LeaveTypes
            .FirstOrDefaultAsync(t => t.Id == req.LeaveTypeId && t.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Leave type not found.");

        var leaveRequest = new LeaveRequest
        {
            OrganizationId = orgId,
            EmployeeId = employee.Id,
            LeaveTypeId = leaveType.Id,
            StartDate = req.StartDate.Date,
            EndDate = req.EndDate.Date,
            Reason = req.Reason?.Trim(),
            Status = LeaveRequestStatus.Pending
        };
        db.LeaveRequests.Add(leaveRequest);
        await db.SaveChangesAsync(ct);

        await db.LeaveRequests.Include(r => r.Employee).Include(r => r.LeaveType)
            .FirstAsync(r => r.Id == leaveRequest.Id, ct);
        return HrMapper.ToLeaveRequestDto(leaveRequest);
    }
}

public record ApproveLeaveRequestCommand(Guid Id) : IRequest<LeaveRequestDto>;

public class ApproveLeaveRequestCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<ApproveLeaveRequestCommand, LeaveRequestDto>
{
    public async Task<LeaveRequestDto> Handle(ApproveLeaveRequestCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        var userId = tenant.UserId ?? throw new InvalidOperationException("User context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Leave.Approve");

        var leaveRequest = await db.LeaveRequests
            .Include(r => r.Employee)
            .Include(r => r.LeaveType)
            .FirstOrDefaultAsync(r => r.Id == command.Id && r.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Leave request not found.");

        if (leaveRequest.Status != LeaveRequestStatus.Pending)
            throw new InvalidOperationException("Leave request is not pending.");

        var days = (decimal)(leaveRequest.EndDate.Date - leaveRequest.StartDate.Date).TotalDays + 1;
        var year = leaveRequest.StartDate.Year;

        var balance = await db.LeaveBalances
            .FirstOrDefaultAsync(b => b.EmployeeId == leaveRequest.EmployeeId &&
                b.LeaveTypeId == leaveRequest.LeaveTypeId && b.Year == year && b.OrganizationId == orgId, ct);

        if (balance == null)
        {
            balance = new LeaveBalance
            {
                OrganizationId = orgId,
                EmployeeId = leaveRequest.EmployeeId,
                LeaveTypeId = leaveRequest.LeaveTypeId,
                Year = year,
                EntitledDays = leaveRequest.LeaveType.DefaultDaysPerYear,
                UsedDays = 0
            };
            db.LeaveBalances.Add(balance);
        }

        if (balance.EntitledDays - balance.UsedDays < days)
            throw new InvalidOperationException("Insufficient leave balance.");

        balance.UsedDays += days;
        leaveRequest.Status = LeaveRequestStatus.Approved;
        leaveRequest.ApprovedByUserId = userId;
        leaveRequest.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return HrMapper.ToLeaveRequestDto(leaveRequest);
    }
}

public record RejectLeaveRequestCommand(Guid Id) : IRequest<LeaveRequestDto>;

public class RejectLeaveRequestCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<RejectLeaveRequestCommand, LeaveRequestDto>
{
    public async Task<LeaveRequestDto> Handle(RejectLeaveRequestCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        var userId = tenant.UserId ?? throw new InvalidOperationException("User context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Leave.Approve");

        var leaveRequest = await db.LeaveRequests
            .Include(r => r.Employee)
            .Include(r => r.LeaveType)
            .FirstOrDefaultAsync(r => r.Id == command.Id && r.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Leave request not found.");

        if (leaveRequest.Status != LeaveRequestStatus.Pending)
            throw new InvalidOperationException("Leave request is not pending.");

        leaveRequest.Status = LeaveRequestStatus.Rejected;
        leaveRequest.ApprovedByUserId = userId;
        leaveRequest.ReviewedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return HrMapper.ToLeaveRequestDto(leaveRequest);
    }
}

public record GetEmployeeLeaveBalancesQuery(Guid EmployeeId, int? Year = null) : IRequest<IList<LeaveBalanceDto>>;

public class GetEmployeeLeaveBalancesQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeLeaveBalancesQuery, IList<LeaveBalanceDto>>
{
    public async Task<IList<LeaveBalanceDto>> Handle(GetEmployeeLeaveBalancesQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var year = request.Year ?? DateTime.UtcNow.Year;
        var balances = await db.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.EmployeeId == request.EmployeeId && b.Year == year && b.OrganizationId == orgId)
            .ToListAsync(ct);
        return balances.Select(HrMapper.ToLeaveBalanceDto).ToList();
    }
}

// --- Scheduling & Performance ---

public record GetEmployeeScheduleQuery(Guid EmployeeId) : IRequest<IList<WorkScheduleDto>>;

public class GetEmployeeScheduleQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeScheduleQuery, IList<WorkScheduleDto>>
{
    public async Task<IList<WorkScheduleDto>> Handle(GetEmployeeScheduleQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var schedules = await db.WorkSchedules
            .Include(s => s.Employee)
            .Include(s => s.Store)
            .Where(s => s.EmployeeId == request.EmployeeId && s.OrganizationId == orgId)
            .OrderBy(s => s.DayOfWeek)
            .ToListAsync(ct);
        return schedules.Select(HrMapper.ToScheduleDto).ToList();
    }
}

public record UpsertEmployeeScheduleCommand(Guid EmployeeId, IList<UpsertWorkScheduleItemRequest> Items)
    : IRequest<IList<WorkScheduleDto>>;

public class UpsertEmployeeScheduleCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<UpsertEmployeeScheduleCommand, IList<WorkScheduleDto>>
{
    public async Task<IList<WorkScheduleDto>> Handle(UpsertEmployeeScheduleCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == command.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var existing = await db.WorkSchedules
            .Where(s => s.EmployeeId == employee.Id && s.OrganizationId == orgId)
            .ToListAsync(ct);
        db.WorkSchedules.RemoveRange(existing);

        foreach (var item in command.Items)
        {
            db.WorkSchedules.Add(new WorkSchedule
            {
                OrganizationId = orgId,
                EmployeeId = employee.Id,
                DayOfWeek = HrMapper.ParseDayOfWeek(item.DayOfWeek),
                StartTime = TimeOnly.Parse(item.StartTime),
                EndTime = TimeOnly.Parse(item.EndTime),
                StoreId = item.StoreId
            });
        }

        await db.SaveChangesAsync(ct);
        return await new GetEmployeeScheduleQueryHandler(db, tenant, permissions)
            .Handle(new GetEmployeeScheduleQuery(employee.Id), ct);
    }
}

public record GetEmployeeReviewsQuery(Guid EmployeeId) : IRequest<IList<PerformanceReviewDto>>;

public class GetEmployeeReviewsQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetEmployeeReviewsQuery, IList<PerformanceReviewDto>>
{
    public async Task<IList<PerformanceReviewDto>> Handle(GetEmployeeReviewsQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var reviews = await db.PerformanceReviews
            .Where(r => r.EmployeeId == request.EmployeeId && r.OrganizationId == orgId)
            .OrderByDescending(r => r.ReviewedAt)
            .ToListAsync(ct);
        return reviews.Select(HrMapper.ToReviewDto).ToList();
    }
}

public record CreatePerformanceReviewCommand(Guid EmployeeId, CreatePerformanceReviewRequest Request)
    : IRequest<PerformanceReviewDto>;

public class CreatePerformanceReviewCommandHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<CreatePerformanceReviewCommand, PerformanceReviewDto>
{
    public async Task<PerformanceReviewDto> Handle(CreatePerformanceReviewCommand command, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        var userId = tenant.UserId ?? throw new InvalidOperationException("User context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.Manage");

        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.Id == command.EmployeeId && e.OrganizationId == orgId, ct)
            ?? throw new KeyNotFoundException("Employee not found.");

        var review = new PerformanceReview
        {
            OrganizationId = orgId,
            EmployeeId = employee.Id,
            ReviewPeriod = command.Request.ReviewPeriod.Trim(),
            Rating = Math.Clamp(command.Request.Rating, 1, 5),
            Summary = command.Request.Summary?.Trim(),
            ReviewedByUserId = userId,
            ReviewedAt = DateTime.UtcNow
        };
        db.PerformanceReviews.Add(review);
        await db.SaveChangesAsync(ct);
        return HrMapper.ToReviewDto(review);
    }
}

public record GetSchedulingOverviewQuery : IRequest<IList<WorkScheduleDto>>;

public class GetSchedulingOverviewQueryHandler(IPosDbContext db, ITenantContext tenant, IPermissionChecker permissions)
    : IRequestHandler<GetSchedulingOverviewQuery, IList<WorkScheduleDto>>
{
    public async Task<IList<WorkScheduleDto>> Handle(GetSchedulingOverviewQuery request, CancellationToken ct)
    {
        var orgId = tenant.OrganizationId ?? throw new InvalidOperationException("Organization context required.");
        await HrModuleGuard.EnsureHrEnabledAsync(db, orgId, ct);
        permissions.RequirePermission("Hr.View");

        var schedules = await db.WorkSchedules
            .Include(s => s.Employee)
            .Include(s => s.Store)
            .Where(s => s.OrganizationId == orgId)
            .OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
            .ToListAsync(ct);
        return schedules.Select(HrMapper.ToScheduleDto).ToList();
    }
}
