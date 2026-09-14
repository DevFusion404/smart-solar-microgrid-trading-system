// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: WebUsersController.cs
// Description: API Controller for managing Web Application users (Backoffice officers and Grid Operators).
// ===============================================

using backend.DTOs.WebUsers;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/web-users")]
[Authorize(Roles = "Backoffice")]
public class WebUsersController : ControllerBase
{
    private readonly IWebUserService _webUserService;

    // Initializes controller with IWebUserService dependency injection
    public WebUsersController(IWebUserService webUserService)
    {
        _webUserService = webUserService;
    }

    // Creates a new Web Application user (Backoffice or GridOperator role)
    [HttpPost]
    public async Task<IActionResult> CreateWebUser([FromBody] CreateWebUserDto request)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _webUserService.CreateWebUserAsync(request, actingUsername);
        return CreatedAtAction(nameof(GetWebUser), new { username = result.Username }, result);
    }

    // Retrieves paginated list of Web Application users with optional role and status filters
    [HttpGet]
    public async Task<IActionResult> ListWebUsers(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        UserRole? roleEnum = null;
        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            roleEnum = parsedRole;
        }

        AccountStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AccountStatus>(status, true, out var parsedStatus))
        {
            statusEnum = parsedStatus;
        }

        var (items, totalCount) = await _webUserService.ListWebUsersAsync(roleEnum, statusEnum, page, pageSize);
        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    // Fetches Web Application user profile by username
    [HttpGet("{username}")]
    public async Task<IActionResult> GetWebUser(string username)
    {
        var result = await _webUserService.GetWebUserByUsernameAsync(username);
        return Ok(result);
    }

    // Updates Web Application user profile details (FullName, Email, PhoneNumber)
    [HttpPut("{username}")]
    public async Task<IActionResult> UpdateWebUser(string username, [FromBody] UpdateWebUserDto request)
    {
        var result = await _webUserService.UpdateWebUserAsync(username, request);
        return Ok(result);
    }

    // Deactivates a Web Application user account with mandatory reason
    [HttpPost("{username}/deactivate")]
    public async Task<IActionResult> DeactivateWebUser(string username, [FromBody] DeactivateUserDto request)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _webUserService.DeactivateWebUserAsync(username, request.Reason, actingUsername);
        return Ok(result);
    }

    // Reactivates a previously deactivated Web Application user account
    [HttpPost("{username}/reactivate")]
    public async Task<IActionResult> ReactivateWebUser(string username)
    {
        var actingUsername = User.Identity?.Name ?? "system";
        var result = await _webUserService.ReactivateWebUserAsync(username, actingUsername);
        return Ok(result);
    }
}
