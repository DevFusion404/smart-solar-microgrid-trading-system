/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : ReservationLookupRepository.cs
Description   : Reads Component 3's EnergyReservations documents as
                raw BSON and projects them into ReservationSnapshot,
                so this component consumes reservations without
                owning or redeclaring their schema.
Author        : Malmi
=====================================================
*/

using backend.Data;
using backend.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Repositories;

/// <summary>
/// MongoDB implementation of <see cref="IReservationLookupRepository"/>.
/// <para>
/// Documents are read as <see cref="BsonDocument"/> rather than through a typed
/// entity on purpose. Component 3 owns the reservation schema; binding to a
/// duplicate C# class here would mean two components defining the same
/// collection, and any field they add would break deserialization on this side.
/// Reading raw BSON and picking out the handful of fields this workflow needs
/// keeps the two components independent.
/// </para>
/// </summary>
public class ReservationLookupRepository : IReservationLookupRepository
{
    /// <summary>Collection written by Component 3's reservation service.</summary>
    private const string CollectionName = "EnergyReservations";

    private readonly IMongoCollection<BsonDocument> _reservations;

    /// <summary>Initializes the repository with the EnergyReservations collection handle.</summary>
    /// <param name="context">Shared MongoDB context.</param>
    public ReservationLookupRepository(MongoDbContext context)
    {
        _reservations = context.Database.GetCollection<BsonDocument>(CollectionName);
    }

    /// <inheritdoc />
    public async Task<ReservationSnapshot?> GetByReservationIdAsync(string reservationId)
    {
        if (string.IsNullOrWhiteSpace(reservationId))
        {
            return null;
        }

        var filter = Builders<BsonDocument>.Filter.Eq("ReservationId", reservationId);

        // Accept the document id too, so callers holding either key succeed.
        if (ObjectId.TryParse(reservationId, out var objectId))
        {
            filter |= Builders<BsonDocument>.Filter.Eq("_id", objectId);
        }

        var document = await _reservations.Find(filter).FirstOrDefaultAsync();

        return document is null ? null : Map(document);
    }

    /// <inheritdoc />
    public async Task<List<ReservationSnapshot>> GetApprovedFromDateAsync(string? prosumerNic, string? username, DateTime fromDate)
    {
        // Without any owner key there is nothing safe to return.
        if (string.IsNullOrWhiteSpace(prosumerNic) && string.IsNullOrWhiteSpace(username))
        {
            return new List<ReservationSnapshot>();
        }

        var ownerFilters = new List<FilterDefinition<BsonDocument>>();

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            ownerFilters.Add(Builders<BsonDocument>.Filter.Regex(
                "ProsumerNic",
                new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(prosumerNic)}$", "i")));
        }

        if (!string.IsNullOrWhiteSpace(username))
        {
            ownerFilters.Add(Builders<BsonDocument>.Filter.Eq("UserId", username));
        }

        var filter = Builders<BsonDocument>.Filter.Or(ownerFilters)
                     & Builders<BsonDocument>.Filter.In("Status", ReservationStatus.Approved.Select(s => (BsonValue)s))
                     & Builders<BsonDocument>.Filter.Gte("SlotDate", fromDate.Date);

        var documents = await _reservations
            .Find(filter)
            .Sort(Builders<BsonDocument>.Sort.Ascending("SlotDate").Ascending("StartTime"))
            .Limit(50)
            .ToListAsync();

        return documents.Select(Map).ToList();
    }

    /// <inheritdoc />
    public async Task<bool> MarkCompletedAsync(string reservationId, DateTime completedAt)
    {
        if (string.IsNullOrWhiteSpace(reservationId))
        {
            return false;
        }

        var filter = Builders<BsonDocument>.Filter.Eq("ReservationId", reservationId);

        if (ObjectId.TryParse(reservationId, out var objectId))
        {
            filter |= Builders<BsonDocument>.Filter.Eq("_id", objectId);
        }

        // Only the status and a completion timestamp are touched. Every other
        // field on the reservation stays exactly as Component 3 wrote it.
        var update = Builders<BsonDocument>.Update
            .Set("Status", ReservationStatus.Completed)
            .Set("CompletedAt", completedAt);

        var result = await _reservations.UpdateOneAsync(filter, update);

        return result.ModifiedCount > 0;
    }

    /// <summary>
    /// Projects a raw reservation document onto <see cref="ReservationSnapshot"/>.
    /// Missing fields fall back to sensible defaults rather than throwing, so a
    /// schema change on Component 3's side degrades gracefully instead of
    /// taking the transfer workflow down.
    /// </summary>
    /// <param name="document">The raw reservation document.</param>
    private static ReservationSnapshot Map(BsonDocument document) => new()
    {
        Id = document.TryGetValue("_id", out var id) ? id.ToString() : null,
        ReservationId = ReadString(document, "ReservationId") ?? string.Empty,
        StationId = ReadString(document, "StationId") ?? string.Empty,
        SlotId = ReadString(document, "SlotId") ?? string.Empty,
        UserId = ReadString(document, "UserId"),
        ProsumerNic = ReadString(document, "ProsumerNic"),
        ProsumerName = ReadString(document, "ProsumerName"),
        SlotDate = ReadDateTime(document, "SlotDate") ?? DateTime.MinValue,
        StartTime = ReadTimeSpan(document, "StartTime"),
        EndTime = ReadTimeSpan(document, "EndTime"),
        ReservedCapacity = ReadDouble(document, "ReservedCapacity"),
        Status = ReadString(document, "Status") ?? string.Empty,
        CreatedAt = ReadDateTime(document, "CreatedAt") ?? DateTime.MinValue
    };

    /// <summary>Reads a string field, returning null when absent or null in BSON.</summary>
    /// <param name="document">Source document.</param>
    /// <param name="name">Field name.</param>
    private static string? ReadString(BsonDocument document, string name)
    {
        if (!document.TryGetValue(name, out var value) || value.IsBsonNull)
        {
            return null;
        }

        return value.IsString ? value.AsString : value.ToString();
    }

    /// <summary>Reads a numeric field as a double, returning zero when absent or non-numeric.</summary>
    /// <param name="document">Source document.</param>
    /// <param name="name">Field name.</param>
    private static double ReadDouble(BsonDocument document, string name)
    {
        if (!document.TryGetValue(name, out var value) || value.IsBsonNull)
        {
            return 0d;
        }

        return value.IsNumeric ? value.ToDouble() : 0d;
    }

    /// <summary>Reads a date field, returning null when absent or not a date.</summary>
    /// <param name="document">Source document.</param>
    /// <param name="name">Field name.</param>
    private static DateTime? ReadDateTime(BsonDocument document, string name)
    {
        if (!document.TryGetValue(name, out var value) || value.IsBsonNull)
        {
            return null;
        }

        return value.IsValidDateTime ? value.ToUniversalTime() : null;
    }

    /// <summary>
    /// Reads a slot time. The MongoDB driver stores a <see cref="TimeSpan"/> as
    /// ticks by default, but a document written by another tool may hold it as
    /// an "HH:mm:ss" string, so both shapes are handled.
    /// </summary>
    /// <param name="document">Source document.</param>
    /// <param name="name">Field name.</param>
    private static TimeSpan ReadTimeSpan(BsonDocument document, string name)
    {
        if (!document.TryGetValue(name, out var value) || value.IsBsonNull)
        {
            return TimeSpan.Zero;
        }

        if (value.IsNumeric)
        {
            return TimeSpan.FromTicks(value.ToInt64());
        }

        if (value.IsString && TimeSpan.TryParse(value.AsString, out var parsed))
        {
            return parsed;
        }

        return TimeSpan.Zero;
    }
}
