namespace Pos.Domain.Enums;

/// <summary>
/// Primary industry vertical for a tenant. Drives default modules and POS UX.
/// See memory-plan/INDUSTRY_MODES.md.
/// </summary>
public enum BusinessType
{
    Restaurant = 0,
    Retail = 1,
    Hybrid = 2
}
