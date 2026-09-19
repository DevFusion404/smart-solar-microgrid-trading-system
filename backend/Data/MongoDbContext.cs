// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: MongoDbContext.cs
// Description: MongoDB context class managing database connection pool and collection index initializations.
// ===============================================

using backend.Configuration;
using backend.Models;
using MongoDB.Driver;

namespace backend.Data;

/// <summary>
/// MongoDB context — a thin wrapper around <see cref="IMongoDatabase"/>.
/// Register it as a singleton so the underlying MongoClient connection pool
/// is shared across the whole application lifetime.
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    // Initializes MongoDB client connection and ensures unique index constraints
    public MongoDbContext(MongoDbSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        _database = client.GetDatabase(settings.DatabaseName);

        // Initialize Users collection indexes
        EnsureIndexes();
    }

    /// <summary>
    /// Gets the UserDetails collection.
    /// </summary>
    public IMongoCollection<UserDetails> Users => _database.GetCollection<UserDetails>("UserDetails");

    /// <summary>
    /// Gets the energy reservations collection used by the mobile booking flow.
    /// </summary>
    public IMongoCollection<EnergyReservation> Reservations => _database.GetCollection<EnergyReservation>("EnergyReservations");

    /// <summary>
    /// Protected constructor for unit testing only.
    /// Injects a pre-built IMongoDatabase so no real MongoDB
    /// connection is opened during tests.
    /// </summary>
    protected MongoDbContext(IMongoDatabase database)
    {
        _database = database;
    }

    /// <summary>
    /// Returns a typed collection handle.
    /// Convention: collection name defaults to the lowercase plural of <typeparamref name="T"/>.
    /// </summary>
    public IMongoCollection<T> GetCollection<T>(string collectionName)
        => _database.GetCollection<T>(collectionName);

    /// <summary>
    /// Exposes the raw <see cref="IMongoDatabase"/> for advanced scenarios.
    /// </summary>
    public IMongoDatabase Database => _database;

    // Creates required unique and compound database indexes for UserDetails collection
    private void EnsureIndexes()
    {
        try
        {
            var users = Users;

            // Username unique index
            var usernameKeys = Builders<UserDetails>.IndexKeys.Ascending(u => u.Username);
            users.Indexes.CreateOne(new CreateIndexModel<UserDetails>(
                usernameKeys, new CreateIndexOptions { Unique = true, Name = "idx_username_unique" }));

            // Email unique index
            var emailKeys = Builders<UserDetails>.IndexKeys.Ascending(u => u.Email);
            users.Indexes.CreateOne(new CreateIndexModel<UserDetails>(
                emailKeys, new CreateIndexOptions { Unique = true, Name = "idx_email_unique" }));

            // NIC sparse unique index
            var nicKeys = Builders<UserDetails>.IndexKeys.Ascending(u => u.Nic);
            users.Indexes.CreateOne(new CreateIndexModel<UserDetails>(
                nicKeys, new CreateIndexOptions { Unique = true, Sparse = true, Name = "idx_nic_unique" }));

            // Role + Status compound index
            var roleStatusKeys = Builders<UserDetails>.IndexKeys
                .Ascending(u => u.Role)
                .Ascending(u => u.Status);
            users.Indexes.CreateOne(new CreateIndexModel<UserDetails>(
                roleStatusKeys, new CreateIndexOptions { Name = "idx_role_status" }));

            var reservations = Reservations;
            var reservationIdKeys = Builders<EnergyReservation>.IndexKeys.Ascending(r => r.ReservationId);
            reservations.Indexes.CreateOne(new CreateIndexModel<EnergyReservation>(
                reservationIdKeys, new CreateIndexOptions { Unique = true, Name = "idx_reservation_id_unique" }));

            var userScheduleKeys = Builders<EnergyReservation>.IndexKeys
                .Ascending(r => r.UserId)
                .Descending(r => r.SlotDate)
                .Ascending(r => r.StartTime);
            reservations.Indexes.CreateOne(new CreateIndexModel<EnergyReservation>(
                userScheduleKeys, new CreateIndexOptions { Name = "idx_user_schedule" }));
        }
        catch
        {
            // Ignore index initialization errors if database connection is pending startup
        }
    }
}
