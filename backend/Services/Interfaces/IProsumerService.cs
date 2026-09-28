// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: IProsumerService.cs
// Description: Service interface defining prosumer account lifecycle and administrative management contracts.
// ===============================================

using backend.DTOs.Prosumers;
using backend.Models;

namespace backend.Services.Interfaces;

public interface IProsumerService
{
    // Self-registers a prosumer using NIC as the business key; account starts as PendingActivation
    Task<ProsumerResponseDto> RegisterProsumerAsync(RegisterProsumerDto request);

    // Creates a prosumer account from the Backoffice; account is Active immediately
    Task<ProsumerResponseDto> CreateProsumerByBackofficeAsync(RegisterProsumerDto request, string actingUsername);

    // Returns a page of prosumers, optionally filtered by account status
    Task<ProsumerListResponseDto> ListProsumersAsync(AccountStatus? status, int page, int pageSize);

    // Searches prosumers by name, NIC, email or username
    Task<ProsumerListResponseDto> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize);

    // Returns full prosumer details for the given NIC
    Task<ProsumerResponseDto> GetProsumerByNicAsync(string nic);

    // Updates prosumer contact details (Backoffice only)
    Task<ProsumerResponseDto> UpdateProsumerAsync(string nic, UpdateProsumerDto request);

    // Lists registrations waiting for Backoffice approval
    Task<ProsumerListResponseDto> ListPendingActivationsAsync(int page, int pageSize);

    // Approves a pending registration (PendingActivation -> Active)
    Task<ProsumerResponseDto> ActivateProsumerAsync(string nic, string actingUsername);

    // Rejects a pending registration with a reason (PendingActivation -> Deactivated)
    Task<ProsumerResponseDto> RejectProsumerActivationAsync(string nic, string reason, string actingUsername);

    // Records a prosumer's own deactivation request (Active -> DeactivationRequested)
    Task<ProsumerResponseDto> RequestDeactivationAsync(string nic, string reason);

    // Lists prosumers who have requested deactivation
    Task<ProsumerListResponseDto> ListDeactivationRequestsAsync(int page, int pageSize);

    // Deactivates a prosumer (approves a request, or direct deactivation of an Active account with a reason)
    Task<ProsumerResponseDto> ApproveDeactivationAsync(string nic, string actingUsername, string? reason = null);

    // Reactivates a deactivated prosumer (Backoffice only)
    Task<ProsumerResponseDto> ReactivateProsumerAsync(string nic, string actingUsername);

    // Returns the current account status and an IsActive flag for a NIC
    Task<ProsumerStatusDto> CheckProsumerStatusAsync(string nic);
}
