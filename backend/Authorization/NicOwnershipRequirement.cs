// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: NicOwnershipRequirement.cs
// Description: Custom authorization requirement for verifying NIC ownership.
// ===============================================

using Microsoft.AspNetCore.Authorization;

namespace backend.Authorization;

public class NicOwnershipRequirement : IAuthorizationRequirement
{
}

