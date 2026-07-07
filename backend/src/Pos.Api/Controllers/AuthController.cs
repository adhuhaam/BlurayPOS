using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Auth;

namespace Pos.Api.Controllers;

public class AuthController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request) =>
        OkResponse(await Mediator.Send(new LoginCommand(request)));

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Register([FromBody] RegisterRequest request) =>
        OkResponse(await Mediator.Send(new RegisterCommand(request)));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Refresh([FromBody] RefreshTokenRequest request) =>
        OkResponse(await Mediator.Send(new RefreshCommand(request)));

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<MeResponse>>> Me() =>
        OkResponse(await Mediator.Send(new GetCurrentUserQuery()));
}
