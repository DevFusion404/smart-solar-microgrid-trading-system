// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: IAuthService.cs
// Description: Service interface defining authentication and current user retrieval operations.
// ===============================================

using backend.DTOs.Auth;
using backend.Models;

namespace backend.Services.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserDetails> GetCurrentUserAsync(string username);
}
