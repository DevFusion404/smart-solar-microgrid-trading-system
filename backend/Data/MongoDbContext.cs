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
    /// Gets the EnergyTransactions collection used by the energy transfer workflow.
    /// </summary>
    public IMongoCollection<EnergyTransaction> EnergyTransactions =>
        _database.GetCollection<EnergyTransaction>("EnergyTransactions");
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

            // ─── Energy Transfer and Transaction Management indexes ──────────
            var transactions = EnergyTransactions;

            // TransactionId is the business key exposed by every transfer endpoint
            var transactionIdKeys = Builders<EnergyTransaction>.IndexKeys.Ascending(t => t.TransactionId);
            transactions.Indexes.CreateOne(new CreateIndexModel<EnergyTransaction>(
                transactionIdKeys, new CreateIndexOptions { Unique = true, Name = "idx_transaction_id_unique" }));

            // QR tokens are single-use credentials, so uniqueness is enforced by the database
            var qrTokenKeys = Builders<EnergyTransaction>.IndexKeys.Ascending(t => t.QRToken);
            transactions.Indexes.CreateOne(new CreateIndexModel<EnergyTransaction>(
                qrTokenKeys, new CreateIndexOptions { Unique = true, Name = "idx_qr_token_unique" }));

            // Prosumer history is always read newest-first for one NIC
            var prosumerHistoryKeys = Builders<EnergyTransaction>.IndexKeys
                .Ascending(t => t.ProsumerNIC)
                .Descending(t => t.TransactionDate);
            transactions.Indexes.CreateOne(new CreateIndexModel<EnergyTransaction>(
                prosumerHistoryKeys, new CreateIndexOptions { Name = "idx_prosumer_history" }));

            // Dashboard counters and the operator queue filter on status and slot date
            var statusDateKeys = Builders<EnergyTransaction>.IndexKeys
                .Ascending(t => t.TransferStatus)
                .Descending(t => t.SlotDate);
            transactions.Indexes.CreateOne(new CreateIndexModel<EnergyTransaction>(
                statusDateKeys, new CreateIndexOptions { Name = "idx_transfer_status_slot_date" }));

            // Re-issuing a QR looks the reservation up before minting a new token
            var reservationKeys = Builders<EnergyTransaction>.IndexKeys.Ascending(t => t.ReservationId);
            transactions.Indexes.CreateOne(new CreateIndexModel<EnergyTransaction>(
                reservationKeys, new CreateIndexOptions { Name = "idx_transaction_reservation" }));
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
