// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProfileController.cs
// Description: Controller providing endpoints for self-service profile viewing, editing, and deactivation requests.
// ===============================================

using backend.DTOs.Profile;
using backend.DTOs.Prosumers;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profileService;

    // Initializes controller with IProfileService dependency injection
    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    // Fetches profile details of the currently authenticated user
    [HttpGet]
    public async Task<IActionResult> GetProfile()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized();
        }

        var user = await _profileService.GetProfileAsync(username);
        return Ok(new
        {
            username = user.Username,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            role = user.Role.ToString(),
            status = user.Status.ToString(),
            nic = user.Nic,
            address = user.Address,
            createdAt = user.CreatedAt,
            updatedAt = user.UpdatedAt,
            lastLoginAt = user.LastLoginAt
        });
    }

    // Updates profile details (FullName, PhoneNumber, Address) for active account
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized();
        }

        var user = await _profileService.UpdateProfileAsync(username, request);
        return Ok(new
        {
            username = user.Username,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            role = user.Role.ToString(),
            status = user.Status.ToString(),
            nic = user.Nic,
            address = user.Address,
            updatedAt = user.UpdatedAt
        });
    }

    // Submits voluntary account deactivation request for prosumers to be reviewed by Backoffice
    [HttpPost("request-deactivation")]
    [Authorize(Roles = "Prosumer")]
    public async Task<IActionResult> SubmitDeactivationRequest([FromBody] DeactivationRequestDto request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized();
        }

        await _profileService.SubmitDeactivationRequestAsync(username, request.Reason);
        return Ok(new { message = "Deactivation request submitted successfully. Awaiting Backoffice review." });
    }
}
