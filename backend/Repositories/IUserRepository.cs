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
    // Finds a user by MongoDB document id
    Task<UserDetails?> GetByIdAsync(string id);

    // Finds a user by username (case-insensitive)
    Task<UserDetails?> GetByUsernameAsync(string username);

    // Finds a user by email (case-insensitive)
    Task<UserDetails?> GetByEmailAsync(string email);

    // Finds a prosumer by NIC (case-insensitive)
    Task<UserDetails?> GetByNicAsync(string nic);

    // Inserts a new user document
    Task CreateAsync(UserDetails user);

    // Replaces an existing user document and bumps its version
    Task UpdateAsync(UserDetails user);

    // Pages Backoffice/GridOperator users with optional filters
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize);

    // Pages prosumers with an optional status filter
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListProsumersAsync(AccountStatus? status, int page, int pageSize);

    // Text search over prosumer name, NIC, email and username
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize);

    // Pages prosumers in PendingActivation status
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListPendingActivationsAsync(int page, int pageSize);

    // Pages prosumers in DeactivationRequested status
    Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListDeactivationRequestsAsync(int page, int pageSize);
}
