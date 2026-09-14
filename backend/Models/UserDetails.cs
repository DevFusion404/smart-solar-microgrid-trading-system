// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: UserDetails.cs
// Description: MongoDB entity model representing user accounts and prosumer profile details.
// ===============================================

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class UserDetails
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonElement("Nic")]
    [BsonIgnoreIfNull]
    public string? Nic { get; set; }

    [BsonElement("FullName")]
    public string FullName { get; set; } = string.Empty;

    [BsonElement("Email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("PhoneNumber")]
    public string PhoneNumber { get; set; } = string.Empty;

    [BsonElement("Address")]
    [BsonIgnoreIfNull]
    public string? Address { get; set; }

    [BsonElement("Username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("PasswordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("Role")]
    [BsonRepresentation(BsonType.String)]
    public UserRole Role { get; set; }

    [BsonElement("Status")]
    [BsonRepresentation(BsonType.String)]
    public AccountStatus Status { get; set; }

    [BsonElement("DeactivationReason")]
    [BsonIgnoreIfNull]
    public string? DeactivationReason { get; set; }

    [BsonElement("ActivationRequestedAt")]
    [BsonIgnoreIfNull]
    public DateTime? ActivationRequestedAt { get; set; }

    [BsonElement("ActivatedAt")]
    [BsonIgnoreIfNull]
    public DateTime? ActivatedAt { get; set; }

    [BsonElement("ActivatedBy")]
    [BsonIgnoreIfNull]
    public string? ActivatedBy { get; set; }

    [BsonElement("DeactivationRequestedAt")]
    [BsonIgnoreIfNull]
    public DateTime? DeactivationRequestedAt { get; set; }

    [BsonElement("DeactivatedAt")]
    [BsonIgnoreIfNull]
    public DateTime? DeactivatedAt { get; set; }

    [BsonElement("DeactivatedBy")]
    [BsonIgnoreIfNull]
    public string? DeactivatedBy { get; set; }

    [BsonElement("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonElement("LastLoginAt")]
    [BsonIgnoreIfNull]
    public DateTime? LastLoginAt { get; set; }

    [BsonElement("Version")]
    public long Version { get; set; } = 1;
}
