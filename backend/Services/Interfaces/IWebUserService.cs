// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: IWebUserService.cs
// Description: Service interface defining Web Application user (Backoffice & Grid Operator) administration contracts.
// ===============================================

using backend.DTOs.WebUsers;
using backend.Models;

namespace backend.Services.Interfaces;

public interface IWebUserService
{
    // Creates a Backoffice or GridOperator account (Active immediately)
    Task<WebUserResponseDto> CreateWebUserAsync(CreateWebUserDto request, string actingUsername);

    // Returns a page of web users filtered by role and status
    Task<(IEnumerable<WebUserResponseDto> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize);

    // Returns one web user by username
    Task<WebUserResponseDto> GetWebUserByUsernameAsync(string username);

    // Updates a web user's name, email and phone
    Task<WebUserResponseDto> UpdateWebUserAsync(string username, UpdateWebUserDto request);

    // Deactivates a web user with a reason (cannot deactivate self)
    Task<WebUserResponseDto> DeactivateWebUserAsync(string username, string reason, string actingUsername);

    // Reactivates a deactivated web user
    Task<WebUserResponseDto> ReactivateWebUserAsync(string username, string actingUsername);
}
