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
    // Returns the profile of the logged-in user
    Task<UserDetails> GetProfileAsync(string username);

    // Updates own name, phone and address (Active accounts only)
    Task<UserDetails> UpdateProfileAsync(string username, UpdateProfileDto request);

    // Records a prosumer's own request to deactivate their account
    Task SubmitDeactivationRequestAsync(string username, string reason);

    // Changes own password after verifying the current one
    Task ChangePasswordAsync(string username, ChangePasswordDto request);
}
