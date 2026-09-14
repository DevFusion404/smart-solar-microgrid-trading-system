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
    Task<ProsumerResponseDto> RegisterProsumerAsync(RegisterProsumerDto request);
    Task<ProsumerListResponseDto> ListProsumersAsync(AccountStatus? status, int page, int pageSize);
    Task<ProsumerListResponseDto> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize);
    Task<ProsumerResponseDto> GetProsumerByNicAsync(string nic);
    Task<ProsumerResponseDto> UpdateProsumerAsync(string nic, UpdateProsumerDto request);
    Task<ProsumerListResponseDto> ListPendingActivationsAsync(int page, int pageSize);
    Task<ProsumerResponseDto> ActivateProsumerAsync(string nic, string actingUsername);
    Task<ProsumerResponseDto> RejectProsumerActivationAsync(string nic, string reason, string actingUsername);
    Task<ProsumerResponseDto> RequestDeactivationAsync(string nic, string reason);
    Task<ProsumerListResponseDto> ListDeactivationRequestsAsync(int page, int pageSize);
    Task<ProsumerResponseDto> ApproveDeactivationAsync(string nic, string actingUsername);
    Task<ProsumerResponseDto> ReactivateProsumerAsync(string nic, string actingUsername);
    Task<ProsumerStatusDto> CheckProsumerStatusAsync(string nic);
}
