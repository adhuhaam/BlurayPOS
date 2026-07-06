using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Users;

namespace Pos.Api.Controllers;

[Authorize(Roles = "OrgAdmin,SuperAdmin")]
[Route("api/users")]
public class UsersController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<UserListItemDto>>>> ListUsers() =>
        OkResponse(await Mediator.Send(new ListUsersQuery()));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> CreateUser([FromBody] CreateUserRequest request) =>
        OkResponse(await Mediator.Send(new CreateUserCommand(request)));
}
