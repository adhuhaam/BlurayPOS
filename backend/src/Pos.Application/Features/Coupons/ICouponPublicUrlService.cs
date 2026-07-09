namespace Pos.Application.Features.Coupons;

public interface ICouponPublicUrlService
{
    string GetScanUrl(string internalCode);
    string GetQrImageApiUrl(string internalCode);
}
