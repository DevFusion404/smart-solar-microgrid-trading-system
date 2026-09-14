// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: IUserRepository.cs
// Description: Repository interface defining MongoDB data access contracts for UserDetails entities.
// ===============================================

using backend.Models;

namespace backend.Repositories;

public interface IUserRepository
{
    Task<UserDetails?> GetByIdAsync(string id);
    Task<UserDetails?> GetByUsernameAsync(string username);
    Task<UserDetails?> GetByEmailAsync(string email);
    Task<UserDetails?> GetByNicAsync(string nic);
    Task CreateAsync(UserDetails user);
    Task UpdateAsync(UserDetails user);

    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize);
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListProsumersAsync(AccountStatus? status, int page, int pageSize);
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize);
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListPendingActivationsAsync(int page, int pageSize);
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListDeactivationRequestsAsync(int page, int pageSize);
}
