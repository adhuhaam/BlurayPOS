using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Application.Features.Catalog;

namespace Pos.Api.Controllers;

[Authorize]
[Route("api/categories")]
public class CategoriesController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IList<CategoryDto>>>> GetCategories() =>
        OkResponse(await Mediator.Send(new GetCategoriesQuery()));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory([FromBody] CreateCategoryRequest request) =>
        OkResponse(await Mediator.Send(new CreateCategoryCommand(request)));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest request) =>
        OkResponse(await Mediator.Send(new UpdateCategoryCommand(id, request)));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(Guid id)
    {
        await Mediator.Send(new DeleteCategoryCommand(id));
        return OkResponse<object>(new { });
    }
}

[Authorize]
[Route("api/products")]
public class ProductsController(IMediator mediator) : ApiControllerBase(mediator)
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ProductDto>>>> GetProducts(
        [FromQuery] string? search, [FromQuery] Guid? categoryId, [FromQuery] Guid? storeId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 50) =>
        OkResponse(await Mediator.Send(new GetProductsQuery(search, categoryId, storeId, page, pageSize)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> GetProduct(Guid id, [FromQuery] Guid? storeId) =>
        OkResponse(await Mediator.Send(new GetProductByIdQuery(id, storeId)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ProductDto>>> CreateProduct(
        [FromBody] CreateProductRequest request, [FromQuery] Guid? storeId) =>
        OkResponse(await Mediator.Send(new CreateProductCommand(request, storeId)));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> UpdateProduct(Guid id, [FromBody] UpdateProductRequest request) =>
        OkResponse(await Mediator.Send(new UpdateProductCommand(id, request)));
}
