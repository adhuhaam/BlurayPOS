using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
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

public record TokenResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt, Guid UserId, Guid OrganizationId, Guid? StoreId, IList<string> Roles);

public class TokenService(
    IConfiguration configuration,
    UserManager<ApplicationUser> userManager,
    PosDbContext db)
{
    private readonly JwtSettings _settings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>() ?? new JwtSettings();

    public async Task<TokenResponse> GenerateTokensAsync(ApplicationUser user, Guid? storeId, CancellationToken cancellationToken = default)
    {
        var roles = await userManager.GetRolesAsync(user);
        var accessToken = BuildAccessToken(user, storeId, roles);
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

        return new TokenResponse(accessToken, refreshToken, expires, user.Id, user.OrganizationId, storeId, roles);
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
        return await GenerateTokensAsync(user, effectiveStoreId, cancellationToken);
    }

    private string BuildAccessToken(ApplicationUser user, Guid? storeId, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new("organizationId", user.OrganizationId.ToString()),
        };

        if (storeId.HasValue)
            claims.Add(new Claim("storeId", storeId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

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
