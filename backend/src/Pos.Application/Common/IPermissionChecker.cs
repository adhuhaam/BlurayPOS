namespace Pos.Application.Common;

public interface IPermissionChecker
{
    bool HasPermission(string code);
    void RequirePermission(string code);
    IReadOnlyList<string> Permissions { get; }
}
