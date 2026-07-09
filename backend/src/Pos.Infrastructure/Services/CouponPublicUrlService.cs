using Microsoft.Extensions.Configuration;
using Pos.Application.Features.Coupons;

namespace Pos.Infrastructure.Services;

public class CouponPublicUrlService(IConfiguration configuration) : ICouponPublicUrlService
{
    private string PublicScanBase => configuration["Coupons:PublicBaseUrl"]?.TrimEnd('/')
        ?? "http://localhost:5176";

    private string ApiPublicBase => configuration["Coupons:ApiPublicBaseUrl"]?.TrimEnd('/')
        ?? "http://localhost:5147";

    public string GetScanUrl(string internalCode) => $"{PublicScanBase}/s/{internalCode}";

    public string GetQrImageApiUrl(string internalCode) =>
        $"{ApiPublicBase}/api/public/coupons/qr/{internalCode}.png";
}
