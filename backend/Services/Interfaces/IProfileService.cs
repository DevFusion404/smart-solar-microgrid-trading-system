// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: IProfileService.cs
// Description: Service interface defining profile management and deactivation request operations.
// ===============================================

using backend.DTOs.Profile;
using backend.Models;

namespace backend.Services.Interfaces;

public interface IProfileService
{
    Task<UserDetails> GetProfileAsync(string username);
    Task<UserDetails> UpdateProfileAsync(string username, UpdateProfileDto request);
    Task SubmitDeactivationRequestAsync(string username, string reason);
    Task ChangePasswordAsync(string username, ChangePasswordDto request);
}
