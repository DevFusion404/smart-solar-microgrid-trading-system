// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: InMemoryUserRepository.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: In-memory IUserRepository used by unit tests so the account services can be
//              tested without a running MongoDB server. Lookups are case-insensitive like the
//              real UserRepository.
// ===============================================

using backend.Models;
using backend.Repositories;

namespace backend.Tests.Fakes;

public class InMemoryUserRepository : IUserRepository
{
    public List<UserDetails> Users { get; } = new();

    // Finds a user by generated id
    public Task<UserDetails?> GetByIdAsync(string id) =>
        Task.FromResult(Users.FirstOrDefault(u => u.Id == id));

    // Finds a user by username, ignoring case
    public Task<UserDetails?> GetByUsernameAsync(string username) =>
        Task.FromResult(Users.FirstOrDefault(u => string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase)));

    // Finds a user by email, ignoring case
    public Task<UserDetails?> GetByEmailAsync(string email) =>
        Task.FromResult(Users.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)));

    // Finds a user by NIC, ignoring case (e.g. 123456789v == 123456789V)
    public Task<UserDetails?> GetByNicAsync(string nic) =>
        Task.FromResult(Users.FirstOrDefault(u => string.Equals(u.Nic, nic, StringComparison.OrdinalIgnoreCase)));

    // Stores a new user and assigns it an id
    public Task CreateAsync(UserDetails user)
    {
        user.Id = Guid.NewGuid().ToString("N");
        Users.Add(user);
        return Task.CompletedTask;
    }

    // Objects are held by reference, so an update only needs the timestamp/version bump
    public Task UpdateAsync(UserDetails user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        user.Version++;
        return Task.CompletedTask;
    }

    // Pages Backoffice/GridOperator users with optional filters
    public Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize) =>
        Page(Users.Where(u => (u.Role == UserRole.Backoffice || u.Role == UserRole.GridOperator)
                              && (role == null || u.Role == role)
                              && (status == null || u.Status == status)), page, pageSize);

    // Pages prosumers with an optional status filter
    public Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListProsumersAsync(AccountStatus? status, int page, int pageSize) =>
        Page(Users.Where(u => u.Role == UserRole.Prosumer && (status == null || u.Status == status)), page, pageSize);

    // Simple contains-search over name, NIC, email and username
    public Task<(IEnumerable<UserDetails> Items, long TotalCount)> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize) =>
        Page(Users.Where(u => u.Role == UserRole.Prosumer
                              && (status == null || u.Status == status)
                              && new[] { u.FullName, u.Nic, u.Email, u.Username }.Any(v => v != null && v.Contains(query, StringComparison.OrdinalIgnoreCase))),
            page, pageSize);

    // Pages prosumers waiting for activation
    public Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListPendingActivationsAsync(int page, int pageSize) =>
        ListProsumersAsync(AccountStatus.PendingActivation, page, pageSize);

    // Pages prosumers who asked to be deactivated
    public Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListDeactivationRequestsAsync(int page, int pageSize) =>
        ListProsumersAsync(AccountStatus.DeactivationRequested, page, pageSize);

    // Applies paging to a filtered sequence
    private static Task<(IEnumerable<UserDetails> Items, long TotalCount)> Page(IEnumerable<UserDetails> source, int page, int pageSize)
    {
        var list = source.ToList();
        IEnumerable<UserDetails> items = list.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Task.FromResult((items, (long)list.Count));
    }
}
