using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace backend.Models;

/// <summary>
/// A prosumer's confirmed booking against one energy slot.
/// </summary>
[BsonIgnoreExtraElements]
public class EnergyReservation
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string ReservationId { get; set; } = string.Empty;
    public string StationId { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string SlotId { get; set; } = string.Empty;

    // Kept for future ownership support; the current reservation module is not user-scoped.
    public string UserId { get; set; } = string.Empty;
    public string? ProsumerNic { get; set; }
    public string ProsumerName { get; set; } = string.Empty;

    // Snapshot the schedule so booking history remains meaningful if a slot changes later.
    public DateTime SlotDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public double ReservedCapacity { get; set; }

    public string Status { get; set; } = "Confirmed";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // A token is issued only when Backoffice approves the reservation.
    [JsonIgnore]
    public string? QrToken { get; set; }
    public DateTime? QrGeneratedAt { get; set; }
    public bool QrIsActive { get; set; }
}
