// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: RoleAuthorizationTests.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: Verifies role-based authorization: the [Authorize(Roles=...)] rules on the account
//              controllers (e.g. only Backoffice can reactivate a prosumer) and the NIC ownership
//              policy that stops a prosumer from reading another prosumer's data.
// ===============================================

using backend.Authorization;
using backend.Controllers;
using Microsoft.AspNetCore.Authorization;
using System.Reflection;
using System.Security.Claims;
using Xunit;

namespace backend.Tests;

public class RoleAuthorizationTests
{
    // Returns the Roles value of the [Authorize] attribute on a controller action
    private static string? RolesOf(Type controller, string action)
    {
        var method = controller.GetMethod(action, BindingFlags.Public | BindingFlags.Instance)
                     ?? throw new InvalidOperationException($"{controller.Name}.{action} not found");
        return method.GetCustomAttribute<AuthorizeAttribute>()?.Roles;
    }

    // Every prosumer administration action is limited to Backoffice officers
    [Theory]
    [InlineData(nameof(ProsumersController.CreateProsumer))]
    [InlineData(nameof(ProsumersController.UpdateProsumer))]
    [InlineData(nameof(ProsumersController.ActivateProsumer))]
    [InlineData(nameof(ProsumersController.RejectProsumerActivation))]
    [InlineData(nameof(ProsumersController.ApproveDeactivation))]
    [InlineData(nameof(ProsumersController.ReactivateProsumer))]
    [InlineData(nameof(ProsumersController.ListPendingActivations))]
    [InlineData(nameof(ProsumersController.ListDeactivationRequests))]
    public void ProsumerAdminActions_AreBackofficeOnly(string action)
    {
        Assert.Equal("Backoffice", RolesOf(typeof(ProsumersController), action));
    }

    // Grid Operators may view prosumers but not change them
    [Fact]
    public void ProsumerListing_AllowsBackofficeAndGridOperator()
    {
        Assert.Equal("Backoffice,GridOperator", RolesOf(typeof(ProsumersController), nameof(ProsumersController.ListProsumers)));
        Assert.Equal("Backoffice,GridOperator", RolesOf(typeof(ProsumersController), nameof(ProsumersController.SearchProsumers)));
    }

    // Registration is public; the deactivation request is for prosumers only
    [Fact]
    public void RegisterIsAnonymous_RequestDeactivationIsProsumerOnly()
    {
        var register = typeof(ProsumersController).GetMethod(nameof(ProsumersController.RegisterProsumer))!;
        Assert.NotNull(register.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.Equal("Prosumer", RolesOf(typeof(ProsumersController), nameof(ProsumersController.RequestDeactivation)));
        Assert.Equal("Prosumer", RolesOf(typeof(ProfileController), nameof(ProfileController.SubmitDeactivationRequest)));
    }

    // The whole web-user controller (create Backoffice / Grid Operator accounts) is Backoffice-only
    [Fact]
    public void WebUsersController_IsBackofficeOnly()
    {
        Assert.Equal("Backoffice", typeof(WebUsersController).GetCustomAttribute<AuthorizeAttribute>()?.Roles);
    }

    // Runs the NIC ownership handler for a user with the given role/NIC against a target NIC
    private static async Task<bool> OwnershipSucceeds(string role, string? userNic, string targetNic)
    {
        var claims = new List<Claim> { new(ClaimTypes.Role, role) };
        if (userNic != null) claims.Add(new Claim("nic", userNic));
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        var requirement = new NicOwnershipRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, targetNic);
        await new NicOwnershipHandler().HandleAsync(context);
        return context.HasSucceeded;
    }

    // A prosumer can only access their own NIC; staff can access any NIC
    [Fact]
    public async Task NicOwnership_ProsumerLimitedToOwnNic()
    {
        Assert.True(await OwnershipSucceeds("Prosumer", "901234567V", "901234567v"));
        Assert.False(await OwnershipSucceeds("Prosumer", "901234567V", "199912345678"));
        Assert.True(await OwnershipSucceeds("Backoffice", null, "199912345678"));
        Assert.True(await OwnershipSucceeds("GridOperator", null, "199912345678"));
    }
}
