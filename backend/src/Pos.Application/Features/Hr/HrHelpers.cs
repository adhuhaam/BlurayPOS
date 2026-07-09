using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;

namespace Pos.Application.Features.Hr;

public static class HrModuleGuard
{
    public static async Task EnsureHrEnabledAsync(IPosDbContext db, Guid organizationId, CancellationToken ct)
    {
        var hasHr = await db.Subscriptions
            .Where(s => s.OrganizationId == organizationId)
            .Select(s => s.Plan.HasHr)
            .FirstOrDefaultAsync(ct);

        if (!hasHr)
            throw new InvalidOperationException("HR module requires a plan with HR enabled. Upgrade in Billing.");
    }
}

public static class HrMapper
{
    public static EmployeeListItemDto ToListItem(Employee e) => new(
        e.Id, e.EmployeeNumber, e.FirstName, e.LastName, e.Email,
        e.JobTitle, e.Department, e.EmploymentStatus.ToString(), e.DefaultStoreId,
        e.DefaultStore?.Name, e.UserId);

    public static EmployeeDto ToDto(Employee e) => new(
        e.Id, e.EmployeeNumber, e.FirstName, e.LastName, e.Email, e.Phone,
        e.Address, e.Nationality, e.IdDocumentType?.ToString(), e.IdDocumentNumber,
        e.IdDocumentFilePath, e.DateOfBirth, e.HireDate, e.TerminationDate,
        e.JobTitle, e.Department, e.EmploymentStatus.ToString(), e.DefaultStoreId,
        e.DefaultStore?.Name, e.UserId, e.CreatedAt);

    public static EmployeeCompensationDto ToCompensationDto(EmployeeCompensation c) => new(
        c.Id, c.EmployeeId, c.BasicSalary, c.Currency, c.PayFrequency.ToString(),
        c.BankName, c.BankAccountNumber, c.EffectiveFrom);

    public static PayrollAdjustmentDto ToAdjustmentDto(PayrollAdjustment a) => new(
        a.Id, a.EmployeeId, a.Type.ToString(), a.Label, a.Amount, a.Percent,
        a.IsRecurring, a.EffectiveFrom, a.EffectiveTo);

    public static PayrollRunDto ToPayrollRunDto(PayrollRun r) => new(
        r.Id, r.PeriodStart, r.PeriodEnd, r.Status.ToString(),
        r.FinalizedAt, r.PaySlips.Count, r.CreatedAt);

    public static PaySlipDto ToPaySlipDto(PaySlip p) => new(
        p.Id, p.PayrollRunId, p.PayrollRun.PeriodStart, p.PayrollRun.PeriodEnd,
        p.EmployeeId,
        $"{p.Employee.FirstName} {p.Employee.LastName}".Trim(),
        p.Employee.EmployeeNumber,
        p.GrossPay, p.TotalDeductions, p.NetPay, p.Notes,
        p.Lines.Select(l => new PaySlipLineDto(l.Id, l.LineType.ToString(), l.Label, l.Amount)).ToList());

    public static AttendanceRecordDto ToAttendanceDto(AttendanceRecord a) => new(
        a.Id, a.EmployeeId, $"{a.Employee.FirstName} {a.Employee.LastName}".Trim(),
        a.StoreId, a.Store.Name, a.ClockInAt, a.ClockOutAt,
        a.Source.ToString(), a.Notes);

    public static LeaveTypeDto ToLeaveTypeDto(LeaveType t) => new(
        t.Id, t.Name, t.IsPaid, t.DefaultDaysPerYear);

    public static LeaveBalanceDto ToLeaveBalanceDto(LeaveBalance b) => new(
        b.Id, b.EmployeeId, b.LeaveTypeId, b.LeaveType.Name,
        b.Year, b.EntitledDays, b.UsedDays, b.EntitledDays - b.UsedDays);

    public static LeaveRequestDto ToLeaveRequestDto(LeaveRequest r)
    {
        var days = (decimal)(r.EndDate.Date - r.StartDate.Date).TotalDays + 1;
        return new LeaveRequestDto(
            r.Id, r.EmployeeId, $"{r.Employee.FirstName} {r.Employee.LastName}".Trim(),
            r.LeaveTypeId, r.LeaveType.Name, r.StartDate, r.EndDate,
            r.Status.ToString(), r.Reason, r.ReviewedAt, days);
    }

    public static WorkScheduleDto ToScheduleDto(WorkSchedule s) => new(
        s.Id, s.EmployeeId, $"{s.Employee.FirstName} {s.Employee.LastName}".Trim(),
        s.DayOfWeek.ToString(),
        s.StartTime.ToString("HH:mm"), s.EndTime.ToString("HH:mm"),
        s.StoreId, s.Store.Name);

    public static PerformanceReviewDto ToReviewDto(PerformanceReview r) => new(
        r.Id, r.EmployeeId, r.ReviewPeriod, r.Rating, r.Summary,
        r.ReviewedByUserId, r.ReviewedAt);

    public static IdDocumentType? ParseIdDocumentType(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null :
        Enum.TryParse<IdDocumentType>(value, ignoreCase: true, out var parsed) ? parsed : null;

    public static EmploymentStatus ParseEmploymentStatus(string value) =>
        Enum.TryParse<EmploymentStatus>(value, ignoreCase: true, out var parsed)
            ? parsed : EmploymentStatus.Active;

    public static PayFrequency ParsePayFrequency(string value) =>
        Enum.TryParse<PayFrequency>(value, ignoreCase: true, out var parsed)
            ? parsed : PayFrequency.Monthly;

    public static PayrollAdjustmentType ParseAdjustmentType(string value) =>
        Enum.TryParse<PayrollAdjustmentType>(value, ignoreCase: true, out var parsed)
            ? parsed : PayrollAdjustmentType.Increment;

    public static DayOfWeekSchedule ParseDayOfWeek(string value) =>
        Enum.TryParse<DayOfWeekSchedule>(value, ignoreCase: true, out var parsed)
            ? parsed : DayOfWeekSchedule.Monday;
}

public static class HrPayrollCalculator
{
    public static (decimal gross, decimal deductions, decimal net, List<(PaySlipLineType type, string label, decimal amount)> lines)
        Calculate(Employee employee, DateTime periodStart, DateTime periodEnd)
    {
        var lines = new List<(PaySlipLineType type, string label, decimal amount)>();
        var basic = employee.Compensation?.BasicSalary ?? 0;
        if (basic > 0)
            lines.Add((PaySlipLineType.BasicSalary, "Basic Salary", basic));

        var gross = basic;
        var deductions = 0m;

        foreach (var adj in employee.Adjustments)
        {
            if (!IsEffective(adj, periodStart, periodEnd)) continue;

            var amount = adj.Percent.HasValue && adj.Percent.Value > 0
                ? Math.Round(basic * adj.Percent.Value / 100m, 2)
                : adj.Amount;

            if (amount <= 0) continue;

            if (adj.Type == PayrollAdjustmentType.Increment)
            {
                gross += amount;
                lines.Add((PaySlipLineType.Increment, adj.Label, amount));
            }
            else
            {
                deductions += amount;
                lines.Add((PaySlipLineType.Deduction, adj.Label, amount));
            }
        }

        var net = gross - deductions;
        return (gross, deductions, net, lines);
    }

    public static async Task<string> NextEmployeeNumberAsync(IPosDbContext db, Guid orgId, CancellationToken ct)
    {
        var count = await db.Employees.CountAsync(e => e.OrganizationId == orgId, ct);
        return $"EMP{(count + 1):D4}";
    }

    private static bool IsEffective(PayrollAdjustment adj, DateTime periodStart, DateTime periodEnd)
    {
        if (adj.EffectiveFrom.Date > periodEnd.Date) return false;
        if (adj.EffectiveTo.HasValue && adj.EffectiveTo.Value.Date < periodStart.Date) return false;
        if (adj.IsRecurring) return true;
        return adj.EffectiveFrom.Date >= periodStart.Date && adj.EffectiveFrom.Date <= periodEnd.Date;
    }
}
