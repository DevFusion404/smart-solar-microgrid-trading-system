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
    // Verifies credentials and account status, then issues a JWT for the user
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);

    // Loads the logged-in user by the username in the JWT
    Task<UserDetails> GetCurrentUserAsync(string username);
}
