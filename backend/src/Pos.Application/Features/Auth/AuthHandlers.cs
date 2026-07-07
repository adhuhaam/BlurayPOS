using FluentValidation;
using MediatR;
using Pos.Application.Common;
using Pos.Application.DTOs;

namespace Pos.Application.Features.Auth;

public record LoginCommand(LoginRequest Request) : IRequest<LoginResponse>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Request.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Request.Password).NotEmpty();
    }
}

public class LoginCommandHandler(IAuthService authService) : IRequestHandler<LoginCommand, LoginResponse>
{
    public Task<LoginResponse> Handle(LoginCommand command, CancellationToken cancellationToken) =>
        authService.LoginAsync(command.Request, cancellationToken);
}

public record RegisterCommand(RegisterRequest Request) : IRequest<LoginResponse>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Request.BusinessName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.OwnerFirstName).NotEmpty();
        RuleFor(x => x.Request.OwnerLastName).NotEmpty();
        RuleFor(x => x.Request.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Request.Password).MinimumLength(8);
    }
}

public class RegisterCommandHandler(IAuthService authService) : IRequestHandler<RegisterCommand, LoginResponse>
{
    public Task<LoginResponse> Handle(RegisterCommand command, CancellationToken cancellationToken) =>
        authService.RegisterAsync(command.Request, cancellationToken);
}

public record GetCurrentUserQuery : IRequest<MeResponse>;

public class GetCurrentUserQueryHandler(IAuthService authService) : IRequestHandler<GetCurrentUserQuery, MeResponse>
{
    public Task<MeResponse> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken) =>
        authService.GetCurrentUserAsync(cancellationToken);
}

public record RefreshCommand(RefreshTokenRequest Request) : IRequest<LoginResponse>;

public class RefreshCommandHandler(IAuthService authService) : IRequestHandler<RefreshCommand, LoginResponse>
{
    public Task<LoginResponse> Handle(RefreshCommand command, CancellationToken cancellationToken) =>
        authService.RefreshAsync(command.Request, cancellationToken);
}
