/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : EnergyTransactionRepository.cs
Description   : MongoDB data access implementation for the
                EnergyTransactions collection.
Author        : Malmi
=====================================================
*/

using backend.Data;
using backend.Models;
using MongoDB.Bson;
using MongoDB.Driver;

namespace backend.Repositories;

/// <summary>
/// MongoDB implementation of <see cref="IEnergyTransactionRepository"/>.
/// </summary>
public class EnergyTransactionRepository : IEnergyTransactionRepository
{
    private readonly IMongoCollection<EnergyTransaction> _transactions;

    /// <summary>Shorthand for the filter builder, used heavily below.</summary>
    private static FilterDefinitionBuilder<EnergyTransaction> Filter => Builders<EnergyTransaction>.Filter;

    /// <summary>Initializes the repository with the EnergyTransactions collection handle.</summary>
    /// <param name="context">Shared MongoDB context.</param>
    public EnergyTransactionRepository(MongoDbContext context)
    {
        _transactions = context.EnergyTransactions;
    }

    /// <inheritdoc />
    public async Task CreateAsync(EnergyTransaction transaction)
    {
        transaction.UpdatedAt = DateTime.UtcNow;
        await _transactions.InsertOneAsync(transaction);
    }

    /// <inheritdoc />
    public async Task<bool> UpdateAsync(EnergyTransaction transaction)
    {
        transaction.UpdatedAt = DateTime.UtcNow;

        var result = await _transactions.ReplaceOneAsync(
            Filter.Eq(x => x.Id, transaction.Id),
            transaction);

        return result.ModifiedCount > 0;
    }

    /// <inheritdoc />
    public async Task<EnergyTransaction?> GetByTransactionIdAsync(string transactionId)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
        {
            return null;
        }

        var filter = Filter.Eq(x => x.TransactionId, transactionId);

        // Callers may hold either the business key or the raw document id.
        if (ObjectId.TryParse(transactionId, out _))
        {
            filter |= Filter.Eq(x => x.Id, transactionId);
        }

        return await _transactions.Find(filter).FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<EnergyTransaction?> GetByQrTokenAsync(string qrToken)
    {
        if (string.IsNullOrWhiteSpace(qrToken))
        {
            return null;
        }

        // Tokens are compared byte for byte — no case-insensitive matching,
        // because that would shrink the effective key space.
        return await _transactions
            .Find(Filter.Eq(x => x.QRToken, qrToken))
            .FirstOrDefaultAsync();
    }

    /// <inheritdoc />
    public async Task<List<EnergyTransaction>> GetByReservationIdAsync(string reservationId)
    {
        if (string.IsNullOrWhiteSpace(reservationId))
        {
            return new List<EnergyTransaction>();
        }

        return await _transactions
            .Find(Filter.Eq(x => x.ReservationId, reservationId))
            .SortByDescending(x => x.TransactionDate)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<List<EnergyTransaction>> GetByProsumerAsync(string prosumerNic, string? transferStatus = null)
    {
        if (string.IsNullOrWhiteSpace(prosumerNic))
        {
            return new List<EnergyTransaction>();
        }

        var filter = NicFilter(prosumerNic);

        if (!string.IsNullOrWhiteSpace(transferStatus))
        {
            filter &= Filter.Eq(x => x.TransferStatus, transferStatus);
        }

        return await _transactions
            .Find(filter)
            .SortByDescending(x => x.TransactionDate)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<(List<EnergyTransaction> Items, long TotalCount)> SearchAsync(
        string? status,
        DateTime? date,
        string? stationId,
        string? prosumerNic,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize)
    {
        var filter = Filter.Empty;

        if (!string.IsNullOrWhiteSpace(status))
        {
            filter &= Filter.Eq(x => x.TransferStatus, status);
        }

        if (!string.IsNullOrWhiteSpace(stationId))
        {
            filter &= Filter.Eq(x => x.StationId, stationId);
        }

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            filter &= NicFilter(prosumerNic);
        }

        // An exact date wins over a range, so "?date=" behaves predictably
        // even if a caller also supplies from/to.
        if (date.HasValue)
        {
            var day = date.Value.Date;
            filter &= Filter.Gte(x => x.SlotDate, day) & Filter.Lt(x => x.SlotDate, day.AddDays(1));
        }
        else
        {
            if (fromDate.HasValue)
            {
                filter &= Filter.Gte(x => x.SlotDate, fromDate.Value.Date);
            }

            if (toDate.HasValue)
            {
                filter &= Filter.Lt(x => x.SlotDate, toDate.Value.Date.AddDays(1));
            }
        }

        var totalCount = await _transactions.CountDocumentsAsync(filter);

        var items = await _transactions
            .Find(filter)
            .SortByDescending(x => x.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Limit(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    /// <inheritdoc />
    public async Task<long> CountByStatusAsync(string transferStatus, string? prosumerNic = null)
    {
        var filter = Filter.Eq(x => x.TransferStatus, transferStatus);

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            filter &= NicFilter(prosumerNic);
        }

        return await _transactions.CountDocumentsAsync(filter);
    }

    /// <inheritdoc />
    public async Task<long> CountCreatedBetweenAsync(DateTime fromInclusive, DateTime toExclusive, string? prosumerNic = null)
    {
        var filter = Filter.Gte(x => x.TransactionDate, fromInclusive)
                     & Filter.Lt(x => x.TransactionDate, toExclusive);

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            filter &= NicFilter(prosumerNic);
        }

        return await _transactions.CountDocumentsAsync(filter);
    }

    /// <inheritdoc />
    public async Task<double> SumCompletedEnergyAsync(string? prosumerNic = null)
    {
        var filter = Filter.Eq(x => x.TransferStatus, TransferStatus.Completed);

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            filter &= NicFilter(prosumerNic);
        }

        // Aggregating server side keeps the whole collection off the wire.
        var aggregation = await _transactions
            .Aggregate()
            .Match(filter)
            .Group(x => 1, g => new { Total = g.Sum(x => x.EnergyAmount) })
            .FirstOrDefaultAsync();

        return aggregation?.Total ?? 0d;
    }

    /// <inheritdoc />
    public async Task<List<EnergyTransaction>> GetRecentByStatusAsync(string transferStatus, int limit, string? prosumerNic = null)
    {
        var filter = Filter.Eq(x => x.TransferStatus, transferStatus);

        if (!string.IsNullOrWhiteSpace(prosumerNic))
        {
            filter &= NicFilter(prosumerNic);
        }

        return await _transactions
            .Find(filter)
            .SortByDescending(x => x.TransactionDate)
            .Limit(limit)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<List<EnergyTransaction>> GetBySlotDateAsync(DateTime date, int limit)
    {
        var day = date.Date;

        var filter = Filter.Gte(x => x.SlotDate, day)
                     & Filter.Lt(x => x.SlotDate, day.AddDays(1));

        return await _transactions
            .Find(filter)
            .SortBy(x => x.StartTime)
            .Limit(limit)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<long> ExpireOverdueTokensAsync(DateTime asOf)
    {
        // Only tokens that are still Active and still awaiting a scan are expired.
        // A verified transfer keeps its token so the operator can finish the handover.
        var filter = Filter.Eq(x => x.QRStatus, QrStatus.Active)
                     & Filter.Lt(x => x.QRExpiryDate, asOf)
                     & Filter.Eq(x => x.TransferStatus, TransferStatus.Pending);

        var update = Builders<EnergyTransaction>.Update
            .Set(x => x.QRStatus, QrStatus.Expired)
            .Set(x => x.UpdatedAt, DateTime.UtcNow);

        var result = await _transactions.UpdateManyAsync(filter, update);

        return result.ModifiedCount;
    }

    /// <summary>
    /// Builds a case-insensitive NIC filter. NICs are entered by hand in several
    /// screens, and Sri Lankan NICs end in a letter that may be typed either way.
    /// </summary>
    /// <param name="nic">The NIC to match.</param>
    private static FilterDefinition<EnergyTransaction> NicFilter(string nic) =>
        Filter.Regex(x => x.ProsumerNIC, new BsonRegularExpression($"^{System.Text.RegularExpressions.Regex.Escape(nic)}$", "i"));
}
