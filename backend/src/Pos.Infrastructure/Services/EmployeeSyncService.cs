using Microsoft.EntityFrameworkCore;
using Pos.Application.Features.Hr;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class EmployeeSyncService(PosDbContext db)
{
    public async Task SyncFromUserAsync(ApplicationUser user, string? role = null, CancellationToken ct = default)
    {
        if (!user.OrganizationId.HasValue) return;

        var orgId = user.OrganizationId.Value;
        var employee = await db.Employees
            .FirstOrDefaultAsync(e => e.OrganizationId == orgId && e.UserId == user.Id, ct);

        if (employee == null)
        {
            employee = await db.Employees
                .FirstOrDefaultAsync(e => e.OrganizationId == orgId &&
                    e.UserId == null &&
                    e.Email != null &&
                    e.Email.ToLower() == user.Email!.ToLower(), ct);
        }

        if (employee == null)
        {
            var number = await HrPayrollCalculator.NextEmployeeNumberAsync(db, orgId, ct);
            employee = new Employee
            {
                OrganizationId = orgId,
                EmployeeNumber = number,
                UserId = user.Id,
                HireDate = user.CreatedAt
            };
            db.Employees.Add(employee);
        }
        else
        {
            employee.UserId ??= user.Id;
        }

        employee.FirstName = user.FirstName;
        employee.LastName = user.LastName;
        employee.Email = user.Email;
        employee.DefaultStoreId = user.DefaultStoreId;
        employee.EmploymentStatus = user.IsActive ? EmploymentStatus.Active : EmploymentStatus.Terminated;
        if (!user.IsActive && employee.TerminationDate == null)
            employee.TerminationDate = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(role) && string.IsNullOrWhiteSpace(employee.JobTitle))
            employee.JobTitle = role;

        await db.SaveChangesAsync(ct);
    }

    public async Task BackfillOrganizationAsync(Guid orgId, CancellationToken ct = default)
    {
        var users = await db.Users
            .Where(u => u.OrganizationId == orgId)
            .ToListAsync(ct);

        foreach (var user in users)
        {
            var roles = await db.UserRoles
                .Where(ur => ur.UserId == user.Id)
                .Join(db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .FirstOrDefaultAsync(ct);
            await SyncFromUserAsync(user, roles, ct);
        }
    }
}
