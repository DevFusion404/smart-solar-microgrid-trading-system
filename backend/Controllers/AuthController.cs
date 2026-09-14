// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: AuthController.cs
// Description: Controller handling user authentication, session termination, and profile information retrieval.
// ===============================================

using backend.DTOs.Auth;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    // Initializes controller with IAuthService dependency injection
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // Authenticates user credentials and returns JWT access token
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    // Invalidates active client session and returns logout confirmation
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully." });
    }

    // Retrieves profile details for the currently authenticated user based on JWT claim identity
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            return Unauthorized();
        }

        var user = await _authService.GetCurrentUserAsync(username);
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
            lastLoginAt = user.LastLoginAt,
            createdAt = user.CreatedAt
        });
    }
}
