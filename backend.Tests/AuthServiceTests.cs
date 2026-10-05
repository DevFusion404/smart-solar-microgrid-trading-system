// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: AuthServiceTests.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: Unit tests for login: wrong password handling, pending/deactivated account
//              restrictions, and the role/NIC claims placed in the issued JWT.
// ===============================================

using backend.Configuration;
using backend.DTOs.Auth;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Services.Implementations;
using backend.Tests.Fakes;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace backend.Tests;

public class AuthServiceTests
{
    private readonly InMemoryUserRepository _repo = new();
    private readonly PasswordHasher<UserDetails> _hasher = new();
    private readonly AuthService _service;

    // Wires AuthService with a real password hasher and JWT generator over the in-memory repository
    public AuthServiceTests()
    {
        var jwt = new JwtTokenGenerator(new JwtSettings
        {
            SecretKey = "UnitTestSecretKey_ThatIsLongEnough_ForHmacSha256_2026!",
            Issuer = "tests",
            Audience = "tests",
            ExpiryMinutes = 5,
            MobileExpiryMinutes = 10080
        });
        _service = new AuthService(_repo, _hasher, jwt);
    }

    // A wrong password returns 401 with a generic message (does not reveal that the user exists)
    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        _repo.Users.Add(TestData.User(_hasher, "officer1", UserRole.Backoffice, AccountStatus.Active));

        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _service.LoginAsync(new LoginRequestDto { Username = "officer1", Password = "WrongPass1" }));

        Assert.Equal("INVALID_CREDENTIALS", ex.ErrorCode);
        Assert.Equal("Invalid username or password.", ex.Message);
    }

    // An unknown username gives the same error as a wrong password
    [Fact]
    public async Task Login_UnknownUser_ThrowsSameUnauthorized()
    {
        var ex = await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _service.LoginAsync(new LoginRequestDto { Username = "nobody", Password = TestData.ValidPassword }));

        Assert.Equal("Invalid username or password.", ex.Message);
    }

    // Empty credentials are rejected before any lookup
    [Fact]
    public async Task Login_EmptyCredentials_ThrowsBadRequest()
    {
        await Assert.ThrowsAsync<BadRequestException>(() =>
            _service.LoginAsync(new LoginRequestDto { Username = "", Password = "" }));
    }

    // A prosumer whose registration is not yet approved cannot log in (403 ACCOUNT_PENDING_ACTIVATION)
    [Fact]
    public async Task Login_PendingActivation_ThrowsForbidden()
    {
        _repo.Users.Add(TestData.User(_hasher, "newprosumer", UserRole.Prosumer, AccountStatus.PendingActivation, "901234567V"));

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.LoginAsync(new LoginRequestDto { Username = "newprosumer", Password = TestData.ValidPassword }));

        Assert.Equal("ACCOUNT_PENDING_ACTIVATION", ex.ErrorCode);
    }

    // A deactivated account cannot log in (403 ACCOUNT_DEACTIVATED)
    [Fact]
    public async Task Login_Deactivated_ThrowsForbidden()
    {
        _repo.Users.Add(TestData.User(_hasher, "oldprosumer", UserRole.Prosumer, AccountStatus.Deactivated, "901234567V"));

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.LoginAsync(new LoginRequestDto { Username = "oldprosumer", Password = TestData.ValidPassword }));

        Assert.Equal("ACCOUNT_DEACTIVATED", ex.ErrorCode);
    }

    // A successful login returns a JWT carrying the user's role and NIC, and records the login time
    [Fact]
    public async Task Login_Active_ReturnsTokenWithRoleAndNic()
    {
        var user = TestData.User(_hasher, "prosumer1", UserRole.Prosumer, AccountStatus.Active, "901234567V");
        _repo.Users.Add(user);

        var result = await _service.LoginAsync(new LoginRequestDto { Username = "prosumer1", Password = TestData.ValidPassword });

        Assert.False(string.IsNullOrEmpty(result.Token));
        Assert.Equal("Prosumer", result.User.Role);
        Assert.NotNull(user.LastLoginAt);

        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        Assert.Contains(token.Claims, c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == "Prosumer");
        Assert.Contains(token.Claims, c => c.Type == "nic" && c.Value == "901234567V");
    }

    // Users can also log in with their email address
    [Fact]
    public async Task Login_WithEmail_Succeeds()
    {
        _repo.Users.Add(TestData.User(_hasher, "operator1", UserRole.GridOperator, AccountStatus.Active));

        var result = await _service.LoginAsync(new LoginRequestDto { Username = "operator1@example.com", Password = TestData.ValidPassword });

        Assert.Equal("GridOperator", result.User.Role);
    }

    // A login from the Android app gets the week-long mobile session
    [Fact]
    public async Task Login_FromMobileClient_ReturnsWeekLongToken()
    {
        _repo.Users.Add(TestData.User(_hasher, "prosumer1", UserRole.Prosumer, AccountStatus.Active, "901234567V"));

        var result = await _service.LoginAsync(new LoginRequestDto
        {
            Username = "prosumer1",
            Password = TestData.ValidPassword,
            ClientType = LoginRequestDto.MobileClient
        });

        var lifetime = result.ExpiresAt - DateTime.UtcNow;
        Assert.InRange(lifetime, TimeSpan.FromDays(7) - TimeSpan.FromMinutes(1), TimeSpan.FromDays(7));
    }

    // A login without a client type (the web portal) keeps the standard short expiry
    [Fact]
    public async Task Login_WithoutClientType_UsesStandardExpiry()
    {
        _repo.Users.Add(TestData.User(_hasher, "prosumer1", UserRole.Prosumer, AccountStatus.Active, "901234567V"));

        var result = await _service.LoginAsync(new LoginRequestDto { Username = "prosumer1", Password = TestData.ValidPassword });

        Assert.True(result.ExpiresAt - DateTime.UtcNow <= TimeSpan.FromMinutes(5));
    }

    // Backoffice is web-only, so it never gets the long mobile session even if it asks for one
    [Fact]
    public async Task Login_BackofficeFromMobileClient_UsesStandardExpiry()
    {
        _repo.Users.Add(TestData.User(_hasher, "officer1", UserRole.Backoffice, AccountStatus.Active));

        var result = await _service.LoginAsync(new LoginRequestDto
        {
            Username = "officer1",
            Password = TestData.ValidPassword,
            ClientType = LoginRequestDto.MobileClient
        });

        Assert.True(result.ExpiresAt - DateTime.UtcNow <= TimeSpan.FromMinutes(5));
    }
}
