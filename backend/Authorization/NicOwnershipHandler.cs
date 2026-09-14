// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: NicOwnershipHandler.cs
// Description: Authorization handler ensuring prosumers can only access resources matching their own NIC.
// ===============================================

using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Authorization;

public class NicOwnershipHandler : AuthorizationHandler<NicOwnershipRequirement, string>
{
    // Evaluates whether the authenticated user has permission for the specified target NIC
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        NicOwnershipRequirement requirement,
        string targetNic)
    {
        var roleClaim = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (roleClaim == UserRole.Backoffice.ToString() || roleClaim == UserRole.GridOperator.ToString())
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (roleClaim == UserRole.Prosumer.ToString())
        {
            var userNicClaim = context.User.FindFirst("nic")?.Value;
            if (!string.IsNullOrEmpty(userNicClaim) &&
                string.Equals(userNicClaim, targetNic, StringComparison.OrdinalIgnoreCase))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        return Task.CompletedTask;
    }
}
