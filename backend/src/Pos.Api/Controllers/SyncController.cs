using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Sync;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/sync")]
public class SyncController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpPost("push")]
    public async Task<ActionResult<ApiResponse<SyncPushResponse>>> Push([FromBody] SyncPushRequest request) =>
        OkResponse(await Mediator.Send(new SyncPushCommand(request)));

    [HttpGet("pull")]
    public async Task<ActionResult<ApiResponse<SyncPullResponse>>> Pull(
        [FromQuery] Guid storeId, [FromQuery] long sinceSequence = 0, [FromQuery] int limit = 100) =>
        OkResponse(await Mediator.Send(new SyncPullQuery(storeId, sinceSequence, limit)));
}
