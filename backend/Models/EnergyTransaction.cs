/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : EnergyTransaction.cs
Description   : MongoDB entity representing one energy transfer
                between a prosumer's approved reservation and a
                microgrid station, including its single-use QR token.
Author        : Malmi
=====================================================
*/

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

/// <summary>
/// One row of the <c>EnergyTransactions</c> collection.
/// Created when a prosumer requests a QR for an approved reservation and
/// closed when the grid operator confirms the physical energy transfer.
/// </summary>
public class EnergyTransaction
{
    /// <summary>MongoDB document identifier.</summary>
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    /// <summary>Human readable business key, e.g. <c>TRX-20260918103045-A1B2C3</c>.</summary>
    [BsonElement("TransactionId")]
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Business key of the reservation this transfer settles (Component 3).</summary>
    [BsonElement("ReservationId")]
    public string ReservationId { get; set; } = string.Empty;

    /// <summary>NIC of the prosumer collecting the energy. Primary identity key across the system.</summary>
    [BsonElement("ProsumerNIC")]
    public string ProsumerNIC { get; set; } = string.Empty;

    /// <summary>Display name snapshot so history stays readable if the profile changes later.</summary>
    [BsonElement("ProsumerName")]
    [BsonIgnoreIfNull]
    public string? ProsumerName { get; set; }

    /// <summary>Microgrid station where the transfer takes place (Component 2).</summary>
    [BsonElement("StationId")]
    public string StationId { get; set; } = string.Empty;

    /// <summary>Station display name snapshot, used by dashboards and history screens.</summary>
    [BsonElement("StationName")]
    [BsonIgnoreIfNull]
    public string? StationName { get; set; }

    /// <summary>Booking slot the reservation was made against.</summary>
    [BsonElement("SlotId")]
    [BsonIgnoreIfNull]
    public string? SlotId { get; set; }

    /// <summary>Energy to be transferred, in kWh, copied from the reservation.</summary>
    [BsonElement("EnergyAmount")]
    public double EnergyAmount { get; set; }

    /// <summary>Scheduled date of the booked slot.</summary>
    [BsonElement("SlotDate")]
    public DateTime SlotDate { get; set; }

    /// <summary>Scheduled start of the booked slot.</summary>
    [BsonElement("StartTime")]
    public TimeSpan StartTime { get; set; }

    /// <summary>Scheduled end of the booked slot.</summary>
    [BsonElement("EndTime")]
    public TimeSpan EndTime { get; set; }

    /// <summary>When the transaction (and its QR) was created.</summary>
    [BsonElement("TransactionDate")]
    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Opaque single-use token embedded in the QR image.
    /// Deliberately carries no personal data — it is only a lookup key.
    /// </summary>
    [BsonElement("QRToken")]
    public string QRToken { get; set; } = string.Empty;

    /// <summary>Token lifecycle: Active, Used, Expired or Cancelled. See <see cref="QrStatus"/>.</summary>
    [BsonElement("QRStatus")]
    public string QRStatus { get; set; } = Models.QrStatus.Active;

    /// <summary>Moment after which the token may no longer be scanned.</summary>
    [BsonElement("QRExpiryDate")]
    public DateTime QRExpiryDate { get; set; }

    /// <summary>Scan outcome: Pending, Verified or Failed. See <see cref="Models.VerificationStatus"/>.</summary>
    [BsonElement("VerificationStatus")]
    public string VerificationStatus { get; set; } = Models.VerificationStatus.Pending;

    /// <summary>Transfer lifecycle: Pending, Verified, Completed, Failed or Rejected. See <see cref="Models.TransferStatus"/>.</summary>
    [BsonElement("TransferStatus")]
    public string TransferStatus { get; set; } = Models.TransferStatus.Pending;

    /// <summary>Username of the grid operator who scanned the QR. Null until verified.</summary>
    [BsonElement("OperatorId")]
    [BsonIgnoreIfNull]
    public string? OperatorId { get; set; }

    /// <summary>Grid operator display name snapshot.</summary>
    [BsonElement("OperatorName")]
    [BsonIgnoreIfNull]
    public string? OperatorName { get; set; }

    /// <summary>When the QR was successfully verified.</summary>
    [BsonElement("VerifiedDate")]
    [BsonIgnoreIfNull]
    public DateTime? VerifiedDate { get; set; }

    /// <summary>When the energy transfer was confirmed complete.</summary>
    [BsonElement("CompletedDate")]
    [BsonIgnoreIfNull]
    public DateTime? CompletedDate { get; set; }

    /// <summary>Reason captured when a transfer is rejected or fails.</summary>
    [BsonElement("FailureReason")]
    [BsonIgnoreIfNull]
    public string? FailureReason { get; set; }

    /// <summary>Free-text note the grid operator recorded when completing the transfer.</summary>
    [BsonElement("Remarks")]
    [BsonIgnoreIfNull]
    public string? Remarks { get; set; }

    /// <summary>Audit timestamp of the last write.</summary>
    [BsonElement("UpdatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
