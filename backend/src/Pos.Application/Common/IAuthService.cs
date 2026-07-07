using Pos.Application.DTOs;

namespace Pos.Application.Common;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<LoginResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    Task<MeResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}

public interface IUserService
{
    Task<UserDto> CreateUserAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<IList<UserListItemDto>> ListUsersAsync(CancellationToken cancellationToken = default);
    Task<UserListItemDto> UpdateUserAsync(Guid userId, UpdateUserRequest request, CancellationToken cancellationToken = default);
}
