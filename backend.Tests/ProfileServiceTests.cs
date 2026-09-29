// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProfileServiceTests.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: Unit tests for self-service profile update validation, password change rules and
//              the prosumer deactivation request.
// ===============================================

using backend.DTOs.Profile;
using backend.Middleware;
using backend.Models;
using backend.Services.Implementations;
using backend.Tests.Fakes;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace backend.Tests;

public class ProfileServiceTests
{
    private readonly InMemoryUserRepository _repo = new();
    private readonly PasswordHasher<UserDetails> _hasher = new();
    private readonly ProfileService _service;

    // Creates the service and one Active prosumer "p1" for each test
    public ProfileServiceTests()
    {
        _service = new ProfileService(_repo, _hasher);
        _repo.Users.Add(TestData.User(_hasher, "p1", UserRole.Prosumer, AccountStatus.Active, "901234567V"));
    }

    // Valid changes are saved and trimmed
    [Fact]
    public async Task UpdateProfile_ValidInput_Saves()
    {
        var user = await _service.UpdateProfileAsync("p1", new UpdateProfileDto
        {
            FullName = "  Nimal Silva ",
            PhoneNumber = "+94771234567",
            Address = "45 Temple Road, Kandy"
        });

        Assert.Equal("Nimal Silva", user.FullName);
        Assert.Equal("+94771234567", user.PhoneNumber);
        Assert.Equal("45 Temple Road, Kandy", user.Address);
    }

    // Each invalid field is rejected with its own error code
    [Theory]
    [InlineData("A", null, null, "INVALID_FULLNAME_FORMAT")]
    [InlineData(null, "0771234", null, "INVALID_PHONE_FORMAT")]
    [InlineData(null, "+1 555 1234", null, "INVALID_PHONE_FORMAT")]
    [InlineData(null, null, "abc", "INVALID_ADDRESS_FORMAT")]
    public async Task UpdateProfile_InvalidInput_ThrowsBadRequest(string? name, string? phone, string? address, string expectedCode)
    {
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.UpdateProfileAsync("p1",
            new UpdateProfileDto { FullName = name, PhoneNumber = phone, Address = address }));

        Assert.Equal(expectedCode, ex.ErrorCode);
    }

    // Only Active accounts may edit their profile
    [Fact]
    public async Task UpdateProfile_NotActive_ThrowsForbidden()
    {
        _repo.Users.Add(TestData.User(_hasher, "p2", UserRole.Prosumer, AccountStatus.DeactivationRequested, "199912345678"));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.UpdateProfileAsync("p2", new UpdateProfileDto { FullName = "New Name" }));
    }

    // Password change needs the right current password, a matching confirmation and a strong new password
    [Fact]
    public async Task ChangePassword_Rules()
    {
        await Assert.ThrowsAsync<BadRequestException>(() => _service.ChangePasswordAsync("p1",
            new ChangePasswordDto { CurrentPassword = "WrongPass1", NewPassword = "NewSolar99", ConfirmPassword = "NewSolar99" }));

        await Assert.ThrowsAsync<BadRequestException>(() => _service.ChangePasswordAsync("p1",
            new ChangePasswordDto { CurrentPassword = TestData.ValidPassword, NewPassword = "NewSolar99", ConfirmPassword = "Different9" }));

        var weak = await Assert.ThrowsAsync<BadRequestException>(() => _service.ChangePasswordAsync("p1",
            new ChangePasswordDto { CurrentPassword = TestData.ValidPassword, NewPassword = "abcdefgh", ConfirmPassword = "abcdefgh" }));
        Assert.Equal("WEAK_PASSWORD", weak.ErrorCode);

        await _service.ChangePasswordAsync("p1",
            new ChangePasswordDto { CurrentPassword = TestData.ValidPassword, NewPassword = "NewSolar99", ConfirmPassword = "NewSolar99" });

        var user = _repo.Users.Single(u => u.Username == "p1");
        Assert.Equal(PasswordVerificationResult.Success, _hasher.VerifyHashedPassword(user, user.PasswordHash, "NewSolar99"));
    }

    // Only prosumers can ask to be deactivated; web users are refused
    [Fact]
    public async Task DeactivationRequest_WebUser_ThrowsForbidden()
    {
        _repo.Users.Add(TestData.User(_hasher, "officer1", UserRole.Backoffice, AccountStatus.Active));

        await Assert.ThrowsAsync<ForbiddenException>(() =>
            _service.SubmitDeactivationRequestAsync("officer1", "I would like to leave"));
    }

    // A valid prosumer request moves the account to DeactivationRequested
    [Fact]
    public async Task DeactivationRequest_Prosumer_ChangesStatus()
    {
        await _service.SubmitDeactivationRequestAsync("p1", "No longer producing solar energy");

        Assert.Equal(AccountStatus.DeactivationRequested, _repo.Users.Single(u => u.Username == "p1").Status);
    }
}
