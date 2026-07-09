using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Enums;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Catalog;

public record GetCategoriesQuery : IRequest<IList<CategoryDto>>;
public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<CategoryDto>;
public record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<CategoryDto>;
public record DeleteCategoryCommand(Guid Id) : IRequest;

public record GetProductsQuery(string? Search, Guid? CategoryId, Guid? StoreId, int Page = 1, int PageSize = 50) : IRequest<PagedResult<ProductDto>>;
public record GetProductByIdQuery(Guid Id, Guid? StoreId) : IRequest<ProductDto>;
public record CreateProductCommand(CreateProductRequest Request, Guid? StoreId) : IRequest<ProductDto>;
public record UpdateProductCommand(Guid Id, UpdateProductRequest Request) : IRequest<ProductDto>;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.Sku).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.BasePrice).GreaterThanOrEqualTo(0);
    }
}

public class GetCategoriesQueryHandler(IPosDbContext db) : IRequestHandler<GetCategoriesQuery, IList<CategoryDto>>
{
    public async Task<IList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken) =>
        await db.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.SortOrder))
            .ToListAsync(cancellationToken);
}

public class CreateCategoryCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    public async Task<CategoryDto> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var category = new Category
        {
            OrganizationId = tenant.OrganizationId.Value,
            Name = command.Request.Name,
            Description = command.Request.Description,
            SortOrder = command.Request.SortOrder
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Category", category.Id, "Created", cancellationToken: cancellationToken);
        return new CategoryDto(category.Id, category.Name, category.Description, category.SortOrder);
    }
}

public class UpdateCategoryCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    public async Task<CategoryDto> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");
        category.Name = command.Request.Name;
        category.Description = command.Request.Description;
        category.SortOrder = command.Request.SortOrder;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Category", category.Id, "Updated", cancellationToken: cancellationToken);
        return new CategoryDto(category.Id, category.Name, category.Description, category.SortOrder);
    }
}

public class DeleteCategoryCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<DeleteCategoryCommand>
{
    public async Task Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await db.Categories.FindAsync([command.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Category not found.");
        category.IsDeleted = true;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Category", category.Id, "Deleted", cancellationToken: cancellationToken);
    }
}

public class GetProductsQueryHandler(IPosDbContext db) : IRequestHandler<GetProductsQuery, PagedResult<ProductDto>>
{
    public async Task<PagedResult<ProductDto>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Products.Include(p => p.Category).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) || p.Sku.ToLower().Contains(search) || (p.Barcode != null && p.Barcode.Contains(search)));
        }

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId);

        var total = await query.CountAsync(cancellationToken);
        var products = await query.OrderBy(p => p.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        var items = new List<ProductDto>();
        foreach (var p in products)
        {
            decimal? storePrice = null;
            int? stock = null;
            if (request.StoreId.HasValue)
            {
                storePrice = await db.StoreProductPrices
                    .Where(sp => sp.StoreId == request.StoreId && sp.ProductId == p.Id)
                    .Select(sp => (decimal?)sp.Price)
                    .FirstOrDefaultAsync(cancellationToken) ?? p.BasePrice;

                stock = await db.InventoryItems
                    .Where(i => i.StoreId == request.StoreId && i.ProductId == p.Id)
                    .Select(i => (int?)i.QuantityOnHand)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            items.Add(new ProductDto(p.Id, p.CategoryId, p.Name, p.Sku, p.Barcode, p.Description, p.BasePrice, p.TaxRate, p.IsActive, p.TrackInventory, p.InventoryMode.ToString(), p.Category?.Name, storePrice, stock, p.IsOnlineVisible, p.OnlineDescription, p.ImageUrl));
        }

        return new PagedResult<ProductDto> { Items = items, TotalCount = total, Page = request.Page, PageSize = request.PageSize };
    }
}

public class CreateProductCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit, ISyncService sync) : IRequestHandler<CreateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(CreateProductCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var product = new Product
        {
            OrganizationId = tenant.OrganizationId.Value,
            CategoryId = command.Request.CategoryId,
            Name = command.Request.Name,
            Sku = command.Request.Sku.ToUpperInvariant(),
            Barcode = command.Request.Barcode,
            Description = command.Request.Description,
            BasePrice = command.Request.BasePrice,
            TaxRate = command.Request.TaxRate,
            TrackInventory = command.Request.TrackInventory,
            InventoryMode = Enum.TryParse<ProductInventoryMode>(command.Request.InventoryMode, true, out var mode)
                ? mode : ProductInventoryMode.FinishedGood
        };
        db.Products.Add(product);
        await db.SaveChangesAsync(cancellationToken);

        if (command.StoreId.HasValue && command.Request.TrackInventory)
        {
            db.InventoryItems.Add(new InventoryItem
            {
                OrganizationId = tenant.OrganizationId.Value,
                StoreId = command.StoreId.Value,
                ProductId = product.Id,
                QuantityOnHand = command.Request.InitialStock
            });
            await db.SaveChangesAsync(cancellationToken);
            await sync.PublishEventAsync(command.StoreId.Value, "Product", product.Id, "Created", product.Name, cancellationToken);
        }

        await audit.LogAsync("Product", product.Id, "Created", cancellationToken: cancellationToken);
        return new ProductDto(product.Id, product.CategoryId, product.Name, product.Sku, product.Barcode, product.Description, product.BasePrice, product.TaxRate, product.IsActive, product.TrackInventory, product.InventoryMode.ToString(), null, product.BasePrice, command.Request.InitialStock);
    }
}

public class UpdateProductCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<UpdateProductCommand, ProductDto>
{
    public async Task<ProductDto> Handle(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == command.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Product not found.");

        product.CategoryId = command.Request.CategoryId;
        product.Name = command.Request.Name;
        product.Barcode = command.Request.Barcode;
        product.Description = command.Request.Description;
        product.BasePrice = command.Request.BasePrice;
        product.TaxRate = command.Request.TaxRate;
        product.IsActive = command.Request.IsActive;
        product.TrackInventory = command.Request.TrackInventory;
        product.InventoryMode = Enum.TryParse<ProductInventoryMode>(command.Request.InventoryMode, true, out var mode)
            ? mode : product.InventoryMode;
        if (command.Request.IsOnlineVisible.HasValue) product.IsOnlineVisible = command.Request.IsOnlineVisible.Value;
        if (command.Request.OnlineDescription != null) product.OnlineDescription = command.Request.OnlineDescription;
        if (command.Request.ImageUrl != null) product.ImageUrl = command.Request.ImageUrl;
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Product", product.Id, "Updated", cancellationToken: cancellationToken);

        return new ProductDto(product.Id, product.CategoryId, product.Name, product.Sku, product.Barcode, product.Description, product.BasePrice, product.TaxRate, product.IsActive, product.TrackInventory, product.InventoryMode.ToString(), product.Category?.Name, null, null, product.IsOnlineVisible, product.OnlineDescription, product.ImageUrl);
    }
}

public class GetProductByIdQueryHandler(IPosDbContext db) : IRequestHandler<GetProductByIdQuery, ProductDto>
{
    public async Task<ProductDto> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Product not found.");

        decimal? storePrice = null;
        int? stock = null;
        if (request.StoreId.HasValue)
        {
            storePrice = await db.StoreProductPrices.Where(sp => sp.StoreId == request.StoreId && sp.ProductId == product.Id).Select(sp => (decimal?)sp.Price).FirstOrDefaultAsync(cancellationToken) ?? product.BasePrice;
            stock = await db.InventoryItems.Where(i => i.StoreId == request.StoreId && i.ProductId == product.Id).Select(i => (int?)i.QuantityOnHand).FirstOrDefaultAsync(cancellationToken);
        }

        return new ProductDto(product.Id, product.CategoryId, product.Name, product.Sku, product.Barcode, product.Description, product.BasePrice, product.TaxRate, product.IsActive, product.TrackInventory, product.InventoryMode.ToString(), product.Category?.Name, storePrice, stock, product.IsOnlineVisible, product.OnlineDescription, product.ImageUrl);
    }
}
