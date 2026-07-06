using MediatR;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;

namespace Pos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    protected readonly IMediator Mediator;

    protected ApiControllerBase(IMediator mediator) => Mediator = mediator;

    protected ActionResult<ApiResponse<T>> OkResponse<T>(T data) => Ok(ApiResponse<T>.Ok(data));

    protected ActionResult<ApiResponse<T>> FailResponse<T>(string error, int statusCode = 400) =>
        StatusCode(statusCode, ApiResponse<T>.Fail(error));
}
