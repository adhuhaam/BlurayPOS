using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Entities;
using Pos.Domain.Interfaces;

namespace Pos.Application.Features.Customers;

public record GetCustomersQuery(string? Search = null, int Page = 1, int PageSize = 50) : IRequest<PagedResult<CustomerDto>>;
public record GetCustomerByIdQuery(Guid Id) : IRequest<CustomerDto>;
public record CreateCustomerCommand(CreateCustomerRequest Request) : IRequest<CustomerDto>;

public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.Request).Must(r => !string.IsNullOrWhiteSpace(r.Email) || !string.IsNullOrWhiteSpace(r.Phone) || !string.IsNullOrWhiteSpace(r.FirstName))
            .WithMessage("At least one of first name, email, or phone is required.");
    }
}

public class GetCustomersQueryHandler(IPosDbContext db) : IRequestHandler<GetCustomersQuery, PagedResult<CustomerDto>>
{
    public async Task<PagedResult<CustomerDto>> Handle(GetCustomersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(c =>
                (c.FirstName != null && c.FirstName.ToLower().Contains(search)) ||
                (c.LastName != null && c.LastName.ToLower().Contains(search)) ||
                (c.Email != null && c.Email.ToLower().Contains(search)) ||
                (c.Phone != null && c.Phone.Contains(search)));
        }

        var total = await query.CountAsync(cancellationToken);
        var customers = await query
            .OrderBy(c => c.LastName).ThenBy(c => c.FirstName)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CustomerDto(c.Id, c.FirstName, c.LastName, c.Email, c.Phone, c.LoyaltyPoints))
            .ToListAsync(cancellationToken);

        return new PagedResult<CustomerDto>
        {
            Items = customers,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetCustomerByIdQueryHandler(IPosDbContext db) : IRequestHandler<GetCustomerByIdQuery, CustomerDto>
{
    public async Task<CustomerDto> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customer = await db.Customers.FindAsync([request.Id], cancellationToken)
            ?? throw new KeyNotFoundException("Customer not found.");

        return new CustomerDto(customer.Id, customer.FirstName, customer.LastName, customer.Email, customer.Phone, customer.LoyaltyPoints);
    }
}

public class CreateCustomerCommandHandler(IPosDbContext db, ITenantContext tenant, IAuditService audit) : IRequestHandler<CreateCustomerCommand, CustomerDto>
{
    public async Task<CustomerDto> Handle(CreateCustomerCommand command, CancellationToken cancellationToken)
    {
        if (!tenant.OrganizationId.HasValue)
            throw new InvalidOperationException("Organization context required.");

        var customer = new Customer
        {
            OrganizationId = tenant.OrganizationId.Value,
            FirstName = command.Request.FirstName,
            LastName = command.Request.LastName,
            Email = command.Request.Email,
            Phone = command.Request.Phone
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync(cancellationToken);
        await audit.LogAsync("Customer", customer.Id, "Created", cancellationToken: cancellationToken);

        return new CustomerDto(customer.Id, customer.FirstName, customer.LastName, customer.Email, customer.Phone, customer.LoyaltyPoints);
    }
}
