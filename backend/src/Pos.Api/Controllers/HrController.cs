using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Hr;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/hr")]
public class HrController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<HrDashboardDto>>> GetDashboard() =>
        OkResponse(await Mediator.Send(new GetHrDashboardQuery()));

    // Employees
    [HttpGet("employees")]
    public async Task<ActionResult<ApiResponse<IList<EmployeeListItemDto>>>> GetEmployees([FromQuery] string? search) =>
        OkResponse(await Mediator.Send(new GetEmployeesQuery(search)));

    [HttpGet("employees/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> GetEmployee(Guid id) =>
        OkResponse(await Mediator.Send(new GetEmployeeByIdQuery(id)));

    [HttpPost("employees")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> CreateEmployee([FromBody] CreateEmployeeRequest request) =>
        OkResponse(await Mediator.Send(new CreateEmployeeCommand(request)));

    [HttpPut("employees/{id:guid}")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> UpdateEmployee(Guid id, [FromBody] UpdateEmployeeRequest request) =>
        OkResponse(await Mediator.Send(new UpdateEmployeeCommand(id, request)));

    [HttpPost("employees/{id:guid}/document")]
    public async Task<ActionResult<ApiResponse<EmployeeDto>>> UpdateEmployeeDocument(Guid id, [FromBody] UpdateEmployeeDocumentRequest request) =>
        OkResponse(await Mediator.Send(new UpdateEmployeeDocumentCommand(id, request.FilePath)));

    // Compensation
    [HttpGet("employees/{employeeId:guid}/compensation")]
    public async Task<ActionResult<ApiResponse<EmployeeCompensationDto?>>> GetCompensation(Guid employeeId) =>
        OkResponse(await Mediator.Send(new GetEmployeeCompensationQuery(employeeId)));

    [HttpPut("employees/{employeeId:guid}/compensation")]
    public async Task<ActionResult<ApiResponse<EmployeeCompensationDto>>> UpsertCompensation(
        Guid employeeId, [FromBody] UpsertEmployeeCompensationRequest request) =>
        OkResponse(await Mediator.Send(new UpsertEmployeeCompensationCommand(employeeId, request)));

    // Adjustments
    [HttpGet("employees/{employeeId:guid}/adjustments")]
    public async Task<ActionResult<ApiResponse<IList<PayrollAdjustmentDto>>>> GetAdjustments(Guid employeeId) =>
        OkResponse(await Mediator.Send(new GetEmployeeAdjustmentsQuery(employeeId)));

    [HttpPost("employees/{employeeId:guid}/adjustments")]
    public async Task<ActionResult<ApiResponse<PayrollAdjustmentDto>>> CreateAdjustment(
        Guid employeeId, [FromBody] UpsertPayrollAdjustmentRequest request) =>
        OkResponse(await Mediator.Send(new CreatePayrollAdjustmentCommand(employeeId, request)));

    [HttpPut("employees/{employeeId:guid}/adjustments/{adjustmentId:guid}")]
    public async Task<ActionResult<ApiResponse<PayrollAdjustmentDto>>> UpdateAdjustment(
        Guid employeeId, Guid adjustmentId, [FromBody] UpsertPayrollAdjustmentRequest request) =>
        OkResponse(await Mediator.Send(new UpdatePayrollAdjustmentCommand(employeeId, adjustmentId, request)));

    [HttpDelete("employees/{employeeId:guid}/adjustments/{adjustmentId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteAdjustment(Guid employeeId, Guid adjustmentId) =>
        OkResponse(await Mediator.Send(new DeletePayrollAdjustmentCommand(employeeId, adjustmentId)));

    // Payroll
    [HttpGet("payroll-runs")]
    public async Task<ActionResult<ApiResponse<IList<PayrollRunDto>>>> GetPayrollRuns() =>
        OkResponse(await Mediator.Send(new GetPayrollRunsQuery()));

    [HttpPost("payroll-runs")]
    public async Task<ActionResult<ApiResponse<PayrollRunDto>>> CreatePayrollRun([FromBody] CreatePayrollRunRequest request) =>
        OkResponse(await Mediator.Send(new CreatePayrollRunCommand(request)));

    [HttpPost("payroll-runs/{id:guid}/generate")]
    public async Task<ActionResult<ApiResponse<PayrollRunDto>>> GeneratePayrollRun(Guid id) =>
        OkResponse(await Mediator.Send(new GeneratePayrollRunCommand(id)));

    [HttpPost("payroll-runs/{id:guid}/finalize")]
    public async Task<ActionResult<ApiResponse<PayrollRunDto>>> FinalizePayrollRun(Guid id) =>
        OkResponse(await Mediator.Send(new FinalizePayrollRunCommand(id)));

    [HttpGet("payroll-runs/{id:guid}/payslips")]
    public async Task<ActionResult<ApiResponse<IList<PaySlipDto>>>> GetPayrollRunPaySlips(Guid id) =>
        OkResponse(await Mediator.Send(new GetPayrollRunPaySlipsQuery(id)));

    [HttpGet("payslips/{id:guid}")]
    public async Task<ActionResult<ApiResponse<PaySlipDto>>> GetPaySlip(Guid id) =>
        OkResponse(await Mediator.Send(new GetPaySlipByIdQuery(id)));

    [HttpGet("employees/{employeeId:guid}/payslips")]
    public async Task<ActionResult<ApiResponse<IList<PaySlipDto>>>> GetEmployeePaySlips(Guid employeeId) =>
        OkResponse(await Mediator.Send(new GetEmployeePaySlipsQuery(employeeId)));

    // Attendance
    [HttpGet("attendance")]
    public async Task<ActionResult<ApiResponse<IList<AttendanceRecordDto>>>> GetAttendance(
        [FromQuery] Guid? employeeId, [FromQuery] DateTime? from, [FromQuery] DateTime? to) =>
        OkResponse(await Mediator.Send(new GetAttendanceQuery(employeeId, from, to)));

    [HttpPost("attendance/clock-in")]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> ClockIn([FromBody] ClockInRequest request) =>
        OkResponse(await Mediator.Send(new ClockInCommand(request)));

    [HttpPost("attendance/clock-out")]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> ClockOut([FromBody] ClockOutRequest request) =>
        OkResponse(await Mediator.Send(new ClockOutCommand(request)));

    [HttpPost("attendance/manual")]
    public async Task<ActionResult<ApiResponse<AttendanceRecordDto>>> ManualAttendance([FromBody] ManualAttendanceRequest request) =>
        OkResponse(await Mediator.Send(new ManualAttendanceCommand(request)));

    // Leave
    [HttpGet("leave-types")]
    public async Task<ActionResult<ApiResponse<IList<LeaveTypeDto>>>> GetLeaveTypes() =>
        OkResponse(await Mediator.Send(new GetLeaveTypesQuery()));

    [HttpPost("leave-types")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> CreateLeaveType([FromBody] UpsertLeaveTypeRequest request) =>
        OkResponse(await Mediator.Send(new CreateLeaveTypeCommand(request)));

    [HttpGet("leave-requests")]
    public async Task<ActionResult<ApiResponse<IList<LeaveRequestDto>>>> GetLeaveRequests([FromQuery] string? status) =>
        OkResponse(await Mediator.Send(new GetLeaveRequestsQuery(status)));

    [HttpPost("leave-requests")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> CreateLeaveRequest([FromBody] CreateLeaveRequestRequest request) =>
        OkResponse(await Mediator.Send(new CreateLeaveRequestCommand(request)));

    [HttpPost("leave-requests/{id:guid}/approve")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> ApproveLeaveRequest(Guid id) =>
        OkResponse(await Mediator.Send(new ApproveLeaveRequestCommand(id)));

    [HttpPost("leave-requests/{id:guid}/reject")]
    public async Task<ActionResult<ApiResponse<LeaveRequestDto>>> RejectLeaveRequest(Guid id) =>
        OkResponse(await Mediator.Send(new RejectLeaveRequestCommand(id)));

    [HttpGet("employees/{employeeId:guid}/leave-balances")]
    public async Task<ActionResult<ApiResponse<IList<LeaveBalanceDto>>>> GetLeaveBalances(
        Guid employeeId, [FromQuery] int? year) =>
        OkResponse(await Mediator.Send(new GetEmployeeLeaveBalancesQuery(employeeId, year)));

    // Scheduling
    [HttpGet("scheduling")]
    public async Task<ActionResult<ApiResponse<IList<WorkScheduleDto>>>> GetSchedulingOverview() =>
        OkResponse(await Mediator.Send(new GetSchedulingOverviewQuery()));

    [HttpGet("employees/{employeeId:guid}/schedule")]
    public async Task<ActionResult<ApiResponse<IList<WorkScheduleDto>>>> GetEmployeeSchedule(Guid employeeId) =>
        OkResponse(await Mediator.Send(new GetEmployeeScheduleQuery(employeeId)));

    [HttpPut("employees/{employeeId:guid}/schedule")]
    public async Task<ActionResult<ApiResponse<IList<WorkScheduleDto>>>> UpsertEmployeeSchedule(
        Guid employeeId, [FromBody] IList<UpsertWorkScheduleItemRequest> items) =>
        OkResponse(await Mediator.Send(new UpsertEmployeeScheduleCommand(employeeId, items)));

    // Performance
    [HttpGet("employees/{employeeId:guid}/reviews")]
    public async Task<ActionResult<ApiResponse<IList<PerformanceReviewDto>>>> GetReviews(Guid employeeId) =>
        OkResponse(await Mediator.Send(new GetEmployeeReviewsQuery(employeeId)));

    [HttpPost("employees/{employeeId:guid}/reviews")]
    public async Task<ActionResult<ApiResponse<PerformanceReviewDto>>> CreateReview(
        Guid employeeId, [FromBody] CreatePerformanceReviewRequest request) =>
        OkResponse(await Mediator.Send(new CreatePerformanceReviewCommand(employeeId, request)));
}
