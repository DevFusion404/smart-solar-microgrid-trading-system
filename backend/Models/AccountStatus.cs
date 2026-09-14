// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: AccountStatus.cs
// Description: Enum representing account lifecycle statuses (PendingActivation, Active, DeactivationRequested, Deactivated).
// ===============================================

namespace backend.Models;

public enum AccountStatus
{
    PendingActivation,
    Active,
    DeactivationRequested,
    Deactivated
}
