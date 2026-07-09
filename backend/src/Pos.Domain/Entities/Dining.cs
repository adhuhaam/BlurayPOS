using Pos.Domain.Common;
using Pos.Domain.Enums;

namespace Pos.Domain.Entities;

public class DiningArea : TenantEntity
{
    public Guid StoreId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public Store Store { get; set; } = null!;
    public ICollection<DiningTable> Tables { get; set; } = [];
}

public class DiningTable : TenantEntity
{
    public Guid StoreId { get; set; }
    public Guid? DiningAreaId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public int Capacity { get; set; } = 4;
    public int SortOrder { get; set; }
    public DiningTableStatus Status { get; set; } = DiningTableStatus.Available;
    public string QrToken { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Store Store { get; set; } = null!;
    public DiningArea? DiningArea { get; set; }
}
