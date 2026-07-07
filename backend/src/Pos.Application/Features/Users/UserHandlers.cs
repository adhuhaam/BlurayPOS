using FluentValidation;
using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;
using Pos.Domain.Enums;

namespace Pos.Application.Features.Users;

public record CreateUserCommand(CreateUserRequest Request) : IRequest<UserDto>;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    private static readonly string[] AllowedRoles =
    [
        nameof(UserRole.OrgAdmin),
        nameof(UserRole.StoreManager),
        nameof(UserRole.Cashier),
        nameof(UserRole.Waiter),
        nameof(UserRole.Kitchen),
        nameof(UserRole.Delivery),
        nameof(UserRole.Accountant),
    ];

    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Request.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Request.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Request.FirstName).NotEmpty();
        RuleFor(x => x.Request.LastName).NotEmpty();
        RuleFor(x => x.Request.Role).NotEmpty().Must(r => AllowedRoles.Contains(r))
            .WithMessage("Invalid role for store user.");
    }
}

public class CreateUserCommandHandler(IUserService userService) : IRequestHandler<CreateUserCommand, UserDto>
{
    public Task<UserDto> Handle(CreateUserCommand command, CancellationToken cancellationToken) =>
        userService.CreateUserAsync(command.Request, cancellationToken);
}

public record ListUsersQuery : IRequest<IList<UserListItemDto>>;

public class ListUsersQueryHandler(IUserService userService) : IRequestHandler<ListUsersQuery, IList<UserListItemDto>>
{
    public Task<IList<UserListItemDto>> Handle(ListUsersQuery request, CancellationToken cancellationToken) =>
        userService.ListUsersAsync(cancellationToken);
}

public record UpdateUserCommand(Guid UserId, UpdateUserRequest Request) : IRequest<UserListItemDto>;

public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    private static readonly string[] AllowedRoles =
    [
        nameof(UserRole.OrgAdmin),
        nameof(UserRole.StoreManager),
        nameof(UserRole.Cashier),
        nameof(UserRole.Waiter),
        nameof(UserRole.Kitchen),
        nameof(UserRole.Delivery),
        nameof(UserRole.Accountant),
    ];

    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.Request.FirstName).NotEmpty();
        RuleFor(x => x.Request.LastName).NotEmpty();
        RuleFor(x => x.Request.Role).NotEmpty().Must(r => AllowedRoles.Contains(r))
            .WithMessage("Invalid role for store user.");
        RuleFor(x => x.Request.NewPassword).MinimumLength(8).When(x => !string.IsNullOrWhiteSpace(x.Request.NewPassword));
    }
}

public class UpdateUserCommandHandler(IUserService userService) : IRequestHandler<UpdateUserCommand, UserListItemDto>
{
    public Task<UserListItemDto> Handle(UpdateUserCommand command, CancellationToken cancellationToken) =>
        userService.UpdateUserAsync(command.UserId, command.Request, cancellationToken);
}
