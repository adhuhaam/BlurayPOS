namespace Pos.Domain.Enums;

public enum IdDocumentType
{
    Nid = 0,
    Passport = 1
}

public enum EmploymentStatus
{
    Active = 0,
    OnLeave = 1,
    Terminated = 2
}

public enum PayFrequency
{
    Monthly = 0,
    BiWeekly = 1
}

public enum PayrollAdjustmentType
{
    Increment = 0,
    Deduction = 1
}

public enum PayrollRunStatus
{
    Draft = 0,
    Finalized = 1
}

public enum PaySlipLineType
{
    BasicSalary = 0,
    Increment = 1,
    Deduction = 2
}

public enum AttendanceSource
{
    Manual = 0,
    Pos = 1
}

public enum LeaveRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum DayOfWeekSchedule
{
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}
