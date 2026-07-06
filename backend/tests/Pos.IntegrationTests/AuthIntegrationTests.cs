using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Pos.Application.Common;

namespace Pos.IntegrationTests;

public class AuthIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public AuthIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_WithDemoAdmin_ReturnsToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "admin@demo.com",
            password = "Admin123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiResponse<LoginResult>>();
        Assert.NotNull(body);
        Assert.True(body!.Success);
        Assert.False(string.IsNullOrEmpty(body.Data?.AccessToken));
    }

    private record LoginResult(string AccessToken, string RefreshToken);
}
