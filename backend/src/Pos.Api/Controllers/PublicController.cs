using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Public;

namespace Pos.Api.Controllers;

[Route("api/public")]
public partial class PublicController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet("marketing")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<PublicMarketingDto>>> GetMarketing() =>
        OkResponse(await Mediator.Send(new GetPublicMarketingQuery()));
}
