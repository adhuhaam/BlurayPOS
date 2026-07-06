using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.DTOs;
using Pos.Application.Features.Recipes;
using Pos.Application.Features.Supply;

namespace Pos.Api.Controllers;

[Authorize(Roles = "OrgAdmin,SuperAdmin,StoreManager")]
[Route("api/supplies")]
public class SuppliesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<SupplyItemDto>>>> GetItems([FromQuery] Guid storeId) =>
        OkResponse(await Mediator.Send(new GetSupplyItemsQuery(storeId)));

    [HttpPost]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<SupplyItemDto>>> Create([FromBody] CreateSupplyItemRequest request) =>
        OkResponse(await Mediator.Send(new CreateSupplyItemCommand(request)));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<SupplyItemDto>>> Update(Guid id, [FromQuery] Guid storeId, [FromBody] UpdateSupplyItemRequest request) =>
        OkResponse(await Mediator.Send(new UpdateSupplyItemCommand(id, storeId, request)));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "OrgAdmin,SuperAdmin")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id)
    {
        await Mediator.Send(new DeleteSupplyItemCommand(id));
        return OkResponse<object>(null!);
    }

    [HttpPost("receive")]
    public async Task<ActionResult<ApiResponse<SupplyLogDto>>> Receive([FromBody] RecordSupplyRequest request) =>
        OkResponse(await Mediator.Send(new RecordSupplyCommand(request)));

    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponse<IList<SupplyLogDto>>>> Logs([FromQuery] Guid storeId, [FromQuery] int limit = 50) =>
        OkResponse(await Mediator.Send(new GetSupplyLogsQuery(storeId, limit)));
}

[Authorize(Roles = "OrgAdmin,SuperAdmin,StoreManager")]
[Route("api/products/{productId:guid}/recipe")]
public class RecipesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<ProductRecipeDto>>>> Get(Guid productId) =>
        OkResponse(await Mediator.Send(new GetProductRecipeQuery(productId)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductRecipeDto>>> Upsert(Guid productId, [FromBody] UpsertProductRecipeRequest request) =>
        OkResponse(await Mediator.Send(new UpsertProductRecipeCommand(productId, request)));

    [HttpDelete("{recipeId:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid productId, Guid recipeId)
    {
        await Mediator.Send(new DeleteProductRecipeCommand(productId, recipeId));
        return OkResponse<object>(null!);
    }
}
