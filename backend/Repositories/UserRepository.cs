// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: UserRepository.cs
// Description: MongoDB data access repository implementation for UserDetails queries and persistence operations.
// ===============================================

using backend.Data;
using backend.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly IMongoCollection<UserDetails> _users;

    // Initializes repository with MongoDB UserDetails collection handle
    public UserRepository(MongoDbContext context)
    {
        _users = context.Users;
    }

    // Fetches user record by unique MongoDB document ID
    public async Task<UserDetails?> GetByIdAsync(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        try
        {
            return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        }
        catch (FormatException)
        {
            return null;
        }
    }

    // Fetches user record by username using case-insensitive lookup
    public async Task<UserDetails?> GetByUsernameAsync(string username)
    {
        var filter = Builders<UserDetails>.Filter.Eq(u => u.Username, username);
        // Case-insensitive regex matching for username lookup
        var caseInsensitiveFilter = Builders<UserDetails>.Filter.Regex(u => u.Username, new BsonRegularExpression($"^{RegexEscape(username)}$", "i"));
        return await _users.Find(caseInsensitiveFilter).FirstOrDefaultAsync();
    }

    // Fetches user record by email address using case-insensitive lookup
    public async Task<UserDetails?> GetByEmailAsync(string email)
    {
        var filter = Builders<UserDetails>.Filter.Regex(u => u.Email, new BsonRegularExpression($"^{RegexEscape(email)}$", "i"));
        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    // Fetches prosumer record by Sri Lankan NIC primary identifier
    public async Task<UserDetails?> GetByNicAsync(string nic)
    {
        var filter = Builders<UserDetails>.Filter.Regex(u => u.Nic, new BsonRegularExpression($"^{RegexEscape(nic)}$", "i"));
        return await _users.Find(filter).FirstOrDefaultAsync();
    }

    // Inserts a new UserDetails document into MongoDB
    public async Task CreateAsync(UserDetails user)
    {
        await _users.InsertOneAsync(user);
    }

    // Replaces existing UserDetails document in MongoDB and increments version
    public async Task UpdateAsync(UserDetails user)
    {
        user.UpdatedAt = DateTime.UtcNow;
        user.Version += 1;
        var filter = Builders<UserDetails>.Filter.Eq(u => u.Id, user.Id);
        await _users.ReplaceOneAsync(filter, user);
    }

    // Retrieves paginated list of Web Application users (Backoffice & Grid Operators)
    public async Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize)
    {
        var builder = Builders<UserDetails>.Filter;
        var filter = builder.In(u => u.Role, new[] { UserRole.Backoffice, UserRole.GridOperator });

        if (role.HasValue)
        {
            filter &= builder.Eq(u => u.Role, role.Value);
        }

        if (status.HasValue)
        {
            filter &= builder.Eq(u => u.Status, status.Value);
        }

        var totalCount = await _users.CountDocumentsAsync(filter);
        var items = await _users.Find(filter)
            .SortByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // Retrieves paginated list of Prosumers filtered by optional account status
    public async Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListProsumersAsync(AccountStatus? status, int page, int pageSize)
    {
        var builder = Builders<UserDetails>.Filter;
        var filter = builder.Eq(u => u.Role, UserRole.Prosumer);

        if (status.HasValue)
        {
            filter &= builder.Eq(u => u.Status, status.Value);
        }

        var totalCount = await _users.CountDocumentsAsync(filter);
        var items = await _users.Find(filter)
            .SortByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // Searches prosumer records across FullName, NIC, Email, and Username fields
    public async Task<(IEnumerable<UserDetails> Items, long TotalCount)> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize)
    {
        var builder = Builders<UserDetails>.Filter;
        var filter = builder.Eq(u => u.Role, UserRole.Prosumer);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var regex = new BsonRegularExpression(RegexEscape(query), "i");
            var searchFilter = builder.Or(
                builder.Regex(u => u.FullName, regex),
                builder.Regex(u => u.Nic, regex),
                builder.Regex(u => u.Email, regex),
                builder.Regex(u => u.Username, regex)
            );
            filter &= searchFilter;
        }

        if (status.HasValue)
        {
            filter &= builder.Eq(u => u.Status, status.Value);
        }

        var totalCount = await _users.CountDocumentsAsync(filter);
        var items = await _users.Find(filter)
            .SortByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // Lists prosumers pending account activation review by Backoffice officers
    public async Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListPendingActivationsAsync(int page, int pageSize)
    {
        var builder = Builders<UserDetails>.Filter;
        var filter = builder.Eq(u => u.Role, UserRole.Prosumer) & builder.Eq(u => u.Status, AccountStatus.PendingActivation);

        var totalCount = await _users.CountDocumentsAsync(filter);
        var items = await _users.Find(filter)
            .SortBy(u => u.ActivationRequestedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // Lists prosumers that submitted deactivation requests needing Backoffice approval
    public async Task<(IEnumerable<UserDetails> Items, long TotalCount)> ListDeactivationRequestsAsync(int page, int pageSize)
    {
        var builder = Builders<UserDetails>.Filter;
        var filter = builder.Eq(u => u.Role, UserRole.Prosumer) & builder.Eq(u => u.Status, AccountStatus.DeactivationRequested);

        var totalCount = await _users.CountDocumentsAsync(filter);
        var items = await _users.Find(filter)
            .SortBy(u => u.DeactivationRequestedAt)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    // Helper method to safely escape regex special characters
    private static string RegexEscape(string text)
    {
        return System.Text.RegularExpressions.Regex.Escape(text);
    }
}
