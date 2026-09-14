using backend.Configuration;
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

    public MongoDbContext(MongoDbSettings settings)
    {
        var client = new MongoClient(settings.ConnectionString);
        _database = client.GetDatabase(settings.DatabaseName);
    }

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
}
