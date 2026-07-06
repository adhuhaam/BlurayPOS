using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Recipes;

public record GetProductRecipeQuery(Guid ProductId) : IRequest<IList<ProductRecipeDto>>;
public record UpsertProductRecipeCommand(Guid ProductId, UpsertProductRecipeRequest Request) : IRequest<ProductRecipeDto>;
public record DeleteProductRecipeCommand(Guid ProductId, Guid RecipeId) : IRequest<Unit>;

public class GetProductRecipeQueryHandler(IPosDbContext db) : IRequestHandler<GetProductRecipeQuery, IList<ProductRecipeDto>>
{
    public async Task<IList<ProductRecipeDto>> Handle(GetProductRecipeQuery request, CancellationToken cancellationToken)
    {
        var recipes = await db.ProductRecipes
            .Where(r => r.ProductId == request.ProductId)
            .ToListAsync(cancellationToken);

        var result = new List<ProductRecipeDto>();
        foreach (var r in recipes)
        {
            var supply = await db.SupplyItems.FindAsync([r.SupplyItemId], cancellationToken);
            if (supply == null) continue;

            var avgCost = await db.StoreSupplyStocks
                .Where(s => s.SupplyItemId == r.SupplyItemId)
                .AverageAsync(s => (decimal?)s.CostPerUnit, cancellationToken) ?? 0;

            result.Add(new ProductRecipeDto(r.Id, supply.Id, supply.Name, supply.Unit, r.Quantity, avgCost));
        }
        return result;
    }
}

public class UpsertProductRecipeCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<UpsertProductRecipeCommand, ProductRecipeDto>
{
    public async Task<ProductRecipeDto> Handle(UpsertProductRecipeCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue) throw new InvalidOperationException("Organization required.");

        var existing = await db.ProductRecipes
            .FirstOrDefaultAsync(r => r.ProductId == command.ProductId && r.SupplyItemId == command.Request.SupplyItemId, cancellationToken);

        if (existing != null)
            db.ProductRecipes.Remove(existing);

        var recipe = new ProductRecipe
        {
            OrganizationId = tenant.OrganizationId.Value,
            ProductId = command.ProductId,
            SupplyItemId = command.Request.SupplyItemId,
            Quantity = command.Request.Quantity
        };
        db.ProductRecipes.Add(recipe);

        var supply = await db.SupplyItems.FindAsync([command.Request.SupplyItemId], cancellationToken)
            ?? throw new KeyNotFoundException("Supply item not found.");

        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("ProductRecipe", recipe.Id, "Upserted", cancellationToken: cancellationToken);

        var avgCost = await db.StoreSupplyStocks
            .Where(s => s.SupplyItemId == supply.Id)
            .AverageAsync(s => (decimal?)s.CostPerUnit, cancellationToken) ?? 0;

        return new ProductRecipeDto(recipe.Id, supply.Id, supply.Name, supply.Unit, recipe.Quantity, avgCost);
    }
}

public class DeleteProductRecipeCommandHandler(IPosDbContext db, IAuditService audit) : IRequestHandler<DeleteProductRecipeCommand, Unit>
{
    public async Task<Unit> Handle(DeleteProductRecipeCommand command, CancellationToken cancellationToken)
    {
        var recipe = await db.ProductRecipes
            .FirstOrDefaultAsync(r => r.Id == command.RecipeId && r.ProductId == command.ProductId, cancellationToken)
            ?? throw new KeyNotFoundException("Recipe line not found.");

        db.ProductRecipes.Remove(recipe);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("ProductRecipe", recipe.Id, "Deleted", cancellationToken: cancellationToken);
        return Unit.Value;
    }
}
