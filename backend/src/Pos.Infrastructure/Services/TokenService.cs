using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Pos.Application.Common;
using Pos.Domain.Entities;
using Pos.Infrastructure.Identity;
using Pos.Infrastructure.Persistence;

namespace Pos.Infrastructure.Services;

public class JwtSettings
{
    public const string SectionName = "Jwt";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "PosApi";
    public string Audience { get; set; } = "PosClients";
    public int ExpiryMinutes { get; set; } = 60;
    public int RefreshExpiryDays { get; set; } = 7;
}

public record TokenResponse(
    string AccessToken, string RefreshToken, DateTime ExpiresAt,
    Guid UserId, Guid? OrganizationId, Guid? StoreId,
    IList<string> Roles, IReadOnlyList<string> Permissions);

public class TokenService(
    IConfiguration configuration,
    UserManager<ApplicationUser> userManager,
    PosDbContext db,
    IPermissionService permissionService)
{
    private readonly JwtSettings _settings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();

    public async Task<TokenResponse> GenerateTokensAsync(
        ApplicationUser user, Guid? storeId, IReadOnlyList<string> permissions, CancellationToken cancellationToken = default)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = BuildAccessToken(user, storeId, roles, permissions);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var expires = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_settings.RefreshExpiryDays),
            StoreId = storeId
        });
        await db.SaveChangesAsync(cancellationToken);

        return new TokenResponse(accessToken, refreshToken, expires, user.Id, user.OrganizationId, storeId, roles, permissions);
    }

    public async Task<TokenResponse> RefreshAsync(string refreshToken, Guid? storeId, CancellationToken cancellationToken = default)
    {
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && !t.IsRevoked, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid refresh token.");

        if (stored.ExpiresAt < DateTime.UtcNow)
        {
            stored.IsRevoked = true;
            await db.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token expired.");
        }

        var user = await userManager.FindByIdAsync(stored.UserId.ToString())
            ?? throw new UnauthorizedAccessException("User not found.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("Account is disabled.");

        stored.IsRevoked = true;
        var effectiveStoreId = storeId ?? stored.StoreId ?? user.DefaultStoreId;
        var roles = await userManager.GetRolesAsync(user);
        var permissions = await permissionService.GetPermissionsForRolesAsync(roles, user.OrganizationId, cancellationToken);
        return await GenerateTokensAsync(user, effectiveStoreId, permissions, cancellationToken);
    }

    private string BuildAccessToken(ApplicationUser user, Guid? storeId, IList<string> roles, IReadOnlyList<string> permissions)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
        };

        if (user.OrganizationId.HasValue)
            claims.Add(new Claim("organizationId", user.OrganizationId.Value.ToString()));

        if (storeId.HasValue)
            claims.Add(new Claim("storeId", storeId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        foreach (var permission in permissions)
            claims.Add(new Claim("permission", permission));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
