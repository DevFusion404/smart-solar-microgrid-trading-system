// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProsumerServiceTests.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: Unit tests for prosumer registration (NIC rules, duplicate NIC rejection) and the
//              account lifecycle: activation, deactivation request, deactivation and reactivation.
// ===============================================

using backend.Middleware;
using backend.Models;
using backend.Services.Implementations;
using backend.Tests.Fakes;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace backend.Tests;

public class ProsumerServiceTests
{
    private readonly InMemoryUserRepository _repo = new();
    private readonly PasswordHasher<UserDetails> _hasher = new();
    private readonly ProsumerService _service;

    // Creates a fresh service over an empty in-memory repository for every test
    public ProsumerServiceTests()
    {
        _service = new ProsumerService(_repo, _hasher);
    }

    // Self-registration stores the prosumer as PendingActivation with an upper-case NIC and hashed password
    [Fact]
    public async Task Register_ValidInput_CreatesPendingActivationAccount()
    {
        var result = await _service.RegisterProsumerAsync(TestData.ValidRegistration(nic: "901234567v"));

        Assert.Equal("901234567V", result.Nic);
        Assert.Equal("PendingActivation", result.Status);
        var stored = Assert.Single(_repo.Users);
        Assert.Equal(UserRole.Prosumer, stored.Role);
        Assert.NotEqual(TestData.ValidPassword, stored.PasswordHash);
    }

    // Both Sri Lankan NIC formats are accepted: old (9 digits + V/X) and new (12 digits)
    [Theory]
    [InlineData("901234567V")]
    [InlineData("901234567X")]
    [InlineData("200012345678")]
    public async Task Register_AcceptsBothNicFormats(string nic)
    {
        var result = await _service.RegisterProsumerAsync(TestData.ValidRegistration(nic: nic));
        Assert.Equal(nic, result.Nic);
    }

    // Malformed NICs are rejected with a field-level validation error on "nic"
    [Theory]
    [InlineData("")]
    [InlineData("12345")]
    [InlineData("90123456V")]
    [InlineData("901234567A")]
    [InlineData("20001234567")]
    [InlineData("ABCDEFGHIJKL")]
    public async Task Register_InvalidNic_ThrowsValidationError(string nic)
    {
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.RegisterProsumerAsync(TestData.ValidRegistration(nic: nic)));
        Assert.Equal("VALIDATION_FAILED", ex.ErrorCode);
        Assert.NotNull(ex.ValidationErrors);
        Assert.True(ex.ValidationErrors!.ContainsKey("nic"));
    }

    // A NIC can only be registered once, even if the letter case differs
    [Fact]
    public async Task Register_DuplicateNic_ThrowsConflict()
    {
        await _service.RegisterProsumerAsync(TestData.ValidRegistration(nic: "901234567V"));

        var ex = await Assert.ThrowsAsync<ConflictException>(() => _service.RegisterProsumerAsync(
            TestData.ValidRegistration(nic: "901234567v", username: "other_user", email: "other@example.com")));

        Assert.Equal("DUPLICATE_NIC", ex.ErrorCode);
        Assert.Single(_repo.Users);
    }

    // Username and email must also be unique
    [Fact]
    public async Task Register_DuplicateUsernameOrEmail_ThrowsConflict()
    {
        await _service.RegisterProsumerAsync(TestData.ValidRegistration());

        var dupUser = await Assert.ThrowsAsync<ConflictException>(() => _service.RegisterProsumerAsync(
            TestData.ValidRegistration(nic: "199912345678", email: "new@example.com")));
        Assert.Equal("DUPLICATE_USERNAME", dupUser.ErrorCode);

        var dupEmail = await Assert.ThrowsAsync<ConflictException>(() => _service.RegisterProsumerAsync(
            TestData.ValidRegistration(nic: "199912345678", username: "new_user")));
        Assert.Equal("DUPLICATE_EMAIL", dupEmail.ErrorCode);
    }

    // Weak passwords, bad phone numbers and short addresses are rejected
    [Fact]
    public async Task Register_InvalidFields_ReportsEachField()
    {
        var request = TestData.ValidRegistration();
        request.Password = "weak";
        request.PhoneNumber = "12345";
        request.Address = "x";

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.RegisterProsumerAsync(request));

        Assert.True(ex.ValidationErrors!.ContainsKey("password"));
        Assert.True(ex.ValidationErrors.ContainsKey("phoneNumber"));
        Assert.True(ex.ValidationErrors.ContainsKey("address"));
    }

    // A prosumer created by a Backoffice officer is Active immediately and records who created it
    [Fact]
    public async Task CreateByBackoffice_AccountIsActive()
    {
        var result = await _service.CreateProsumerByBackofficeAsync(TestData.ValidRegistration(), "officer1");

        Assert.Equal("Active", result.Status);
        Assert.Equal("officer1", result.ActivatedBy);
    }

    // Lifecycle: PendingActivation -> Active -> DeactivationRequested -> Deactivated -> Active
    [Fact]
    public async Task Lifecycle_FullHappyPath()
    {
        var nic = (await _service.RegisterProsumerAsync(TestData.ValidRegistration())).Nic;

        Assert.Equal("Active", (await _service.ActivateProsumerAsync(nic, "officer1")).Status);
        Assert.Equal("DeactivationRequested", (await _service.RequestDeactivationAsync(nic, "Moving to another city")).Status);
        Assert.Equal("Deactivated", (await _service.ApproveDeactivationAsync(nic, "officer1")).Status);

        var reactivated = await _service.ReactivateProsumerAsync(nic, "officer1");
        Assert.Equal("Active", reactivated.Status);
        Assert.Null(reactivated.DeactivationReason);
    }

    // Reactivation is only for deactivated accounts, not for new registrations or active accounts
    [Theory]
    [InlineData(AccountStatus.PendingActivation)]
    [InlineData(AccountStatus.Active)]
    public async Task Reactivate_WrongStatus_ThrowsConflict(AccountStatus status)
    {
        _repo.Users.Add(TestData.User(_hasher, "p1", UserRole.Prosumer, status, nic: "901234567V"));

        await Assert.ThrowsAsync<ConflictException>(() => _service.ReactivateProsumerAsync("901234567V", "officer1"));
    }

    // Directly deactivating an Active prosumer (no request from them) needs a reason
    [Fact]
    public async Task Deactivate_ActiveWithoutReason_ThrowsBadRequest()
    {
        _repo.Users.Add(TestData.User(_hasher, "p1", UserRole.Prosumer, AccountStatus.Active, nic: "901234567V"));

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.ApproveDeactivationAsync("901234567V", "officer1"));
        Assert.Equal("REASON_REQUIRED", ex.ErrorCode);

        var ok = await _service.ApproveDeactivationAsync("901234567V", "officer1", "Repeated payment failures");
        Assert.Equal("Deactivated", ok.Status);
        Assert.Equal("Repeated payment failures", ok.DeactivationReason);
    }

    // A deactivation request needs a 10-500 character reason and an Active account
    [Fact]
    public async Task RequestDeactivation_Validation()
    {
        _repo.Users.Add(TestData.User(_hasher, "p1", UserRole.Prosumer, AccountStatus.PendingActivation, nic: "901234567V"));

        await Assert.ThrowsAsync<BadRequestException>(() => _service.RequestDeactivationAsync("901234567V", "short"));
        await Assert.ThrowsAsync<ConflictException>(() => _service.RequestDeactivationAsync("901234567V", "A long enough reason"));
    }

    // Rejecting a registration needs a reason of at least 10 characters
    [Fact]
    public async Task RejectActivation_RequiresReason()
    {
        _repo.Users.Add(TestData.User(_hasher, "p1", UserRole.Prosumer, AccountStatus.PendingActivation, nic: "901234567V"));

        await Assert.ThrowsAsync<BadRequestException>(() => _service.RejectProsumerActivationAsync("901234567V", "", "officer1"));

        var rejected = await _service.RejectProsumerActivationAsync("901234567V", "NIC does not match documents", "officer1");
        Assert.Equal("Deactivated", rejected.Status);
    }
}
