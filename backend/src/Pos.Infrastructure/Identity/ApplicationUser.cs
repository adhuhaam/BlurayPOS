using Microsoft.AspNetCore.Identity;

namespace Pos.Infrastructure.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public Guid OrganizationId { get; set; }
    public Guid? DefaultStoreId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Pin { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UserStoreAssignment> StoreAssignments { get; set; } = [];
}

public class UserStoreAssignment
{
    public Guid UserId { get; set; }
    public Guid StoreId { get; set; }
    public ApplicationUser User { get; set; } = null!;
}
