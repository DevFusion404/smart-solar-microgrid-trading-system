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
    Task<WebUserResponseDto> CreateWebUserAsync(CreateWebUserDto request, string actingUsername);
    Task<(IEnumerable<WebUserResponseDto> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize);
    Task<WebUserResponseDto> GetWebUserByUsernameAsync(string username);
    Task<WebUserResponseDto> UpdateWebUserAsync(string username, UpdateWebUserDto request);
    Task<WebUserResponseDto> DeactivateWebUserAsync(string username, string reason, string actingUsername);
    Task<WebUserResponseDto> ReactivateWebUserAsync(string username, string actingUsername);
}
