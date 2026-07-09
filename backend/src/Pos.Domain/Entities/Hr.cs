using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class Employee : TenantEntity
{
    public string EmployeeNumber { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Nationality { get; set; }
    public IdDocumentType? IdDocumentType { get; set; }
    public string? IdDocumentNumber { get; set; }
    public string? IdDocumentFilePath { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? HireDate { get; set; }
    public DateTime? TerminationDate { get; set; }
    public string? JobTitle { get; set; }
    public string? Department { get; set; }
    public EmploymentStatus EmploymentStatus { get; set; } = EmploymentStatus.Active;
    public Guid? DefaultStoreId { get; set; }
    public Guid? UserId { get; set; }

    public Store? DefaultStore { get; set; }
    public EmployeeCompensation? Compensation { get; set; }
    public ICollection<PayrollAdjustment> Adjustments { get; set; } = [];
    public ICollection<PaySlip> PaySlips { get; set; } = [];
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = [];
    public ICollection<LeaveBalance> LeaveBalances { get; set; } = [];
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = [];
    public ICollection<WorkSchedule> WorkSchedules { get; set; } = [];
    public ICollection<PerformanceReview> PerformanceReviews { get; set; } = [];
}

public class EmployeeCompensation : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public decimal BasicSalary { get; set; }
    public string Currency { get; set; } = "MVR";
    public PayFrequency PayFrequency { get; set; } = PayFrequency.Monthly;
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;

    public Employee Employee { get; set; } = null!;
}

public class PayrollAdjustment : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public PayrollAdjustmentType Type { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal? Percent { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public Employee Employee { get; set; } = null!;
}

public class PayrollRun : TenantEntity
{
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public PayrollRunStatus Status { get; set; } = PayrollRunStatus.Draft;
    public DateTime? FinalizedAt { get; set; }
    public Guid CreatedByUserId { get; set; }

    public ICollection<PaySlip> PaySlips { get; set; } = [];
}

public class PaySlip : TenantEntity
{
    public Guid PayrollRunId { get; set; }
    public Guid EmployeeId { get; set; }
    public decimal GrossPay { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetPay { get; set; }
    public string? Notes { get; set; }

    public PayrollRun PayrollRun { get; set; } = null!;
    public Employee Employee { get; set; } = null!;
    public ICollection<PaySlipLine> Lines { get; set; } = [];
}

public class PaySlipLine : TenantEntity
{
    public Guid PaySlipId { get; set; }
    public PaySlipLineType LineType { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    public PaySlip PaySlip { get; set; } = null!;
}

public class AttendanceRecord : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Guid StoreId { get; set; }
    public DateTime ClockInAt { get; set; }
    public DateTime? ClockOutAt { get; set; }
    public AttendanceSource Source { get; set; } = AttendanceSource.Manual;
    public string? Notes { get; set; }

    public Employee Employee { get; set; } = null!;
    public Store Store { get; set; } = null!;
}

public class LeaveType : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public bool IsPaid { get; set; } = true;
    public decimal DefaultDaysPerYear { get; set; } = 30;

    public ICollection<LeaveBalance> Balances { get; set; } = [];
    public ICollection<LeaveRequest> Requests { get; set; } = [];
}

public class LeaveBalance : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal EntitledDays { get; set; }
    public decimal UsedDays { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}

public class LeaveRequest : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public LeaveRequestStatus Status { get; set; } = LeaveRequestStatus.Pending;
    public string? Reason { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; } = null!;
}

public class WorkSchedule : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public DayOfWeekSchedule DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public Guid StoreId { get; set; }

    public Employee Employee { get; set; } = null!;
    public Store Store { get; set; } = null!;
}

public class PerformanceReview : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public string ReviewPeriod { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Summary { get; set; }
    public Guid ReviewedByUserId { get; set; }
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;

    public Employee Employee { get; set; } = null!;
}
