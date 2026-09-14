// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: MongoDbSettings.cs
// Description: Strongly-typed settings model for MongoDB connection string and database configuration.
// ===============================================

namespace backend.Configuration;

/// <summary>
/// Strongly-typed settings that map to the "MongoDbSettings" section
/// in appsettings.json / appsettings.Local.json.
/// </summary>
public class MongoDbSettings
{
    public const string SectionName = "MongoDbSettings";

    /// <summary>
    /// Full MongoDB connection string.
    /// Keep the real value in appsettings.Local.json (gitignored) or
    /// use User Secrets / environment variable MONGODBSETTINGS__CONNECTIONSTRING.
    /// </summary>
    public string ConnectionString { get; set; } = string.Empty;

    /// <summary>
    /// The database to connect to inside the MongoDB cluster.
    /// </summary>
    public string DatabaseName { get; set; } = string.Empty;
}
