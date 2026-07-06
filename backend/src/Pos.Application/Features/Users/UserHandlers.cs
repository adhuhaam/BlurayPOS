using FluentValidation;
using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Users;

public record CreateUserCommand(CreateUserRequest Request) : IRequest<UserDto>;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Request.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Request.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Request.FirstName).NotEmpty();
        RuleFor(x => x.Request.LastName).NotEmpty();
        RuleFor(x => x.Request.Role).NotEmpty();
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
