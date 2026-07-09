using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Public;

public record GetPublicMarketingQuery : IRequest<PublicMarketingDto>;

public class GetPublicMarketingQueryHandler(IPublicMarketingService marketingService)
    : IRequestHandler<GetPublicMarketingQuery, PublicMarketingDto>
{
    public Task<PublicMarketingDto> Handle(GetPublicMarketingQuery request, CancellationToken cancellationToken) =>
        marketingService.GetMarketingDataAsync(cancellationToken);
}
