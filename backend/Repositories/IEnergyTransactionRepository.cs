/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : IEnergyTransactionRepository.cs
Description   : Data access contract for the EnergyTransactions
                collection.
Author        : Malmi
=====================================================
*/

using backend.Models;

namespace backend.Repositories;

/// <summary>
/// Persistence operations for <see cref="EnergyTransaction"/> documents.
/// All business rules live in the service layer; this interface only moves data.
/// </summary>
public interface IEnergyTransactionRepository
{
    /// <summary>Inserts a new transaction document.</summary>
    /// <param name="transaction">The transaction to persist.</param>
    Task CreateAsync(EnergyTransaction transaction);

    /// <summary>Replaces an existing transaction and refreshes its audit timestamp.</summary>
    /// <param name="transaction">The transaction carrying the changes.</param>
    /// <returns>True when a document was modified.</returns>
    Task<bool> UpdateAsync(EnergyTransaction transaction);

    /// <summary>Finds a transaction by its business key or MongoDB document id.</summary>
    /// <param name="transactionId">Business key or ObjectId string.</param>
    Task<EnergyTransaction?> GetByTransactionIdAsync(string transactionId);

    /// <summary>Finds a transaction by the token embedded in its QR image.</summary>
    /// <param name="qrToken">The scanned token.</param>
    Task<EnergyTransaction?> GetByQrTokenAsync(string qrToken);

    /// <summary>
    /// Returns the transactions raised against one reservation, newest first.
    /// A reservation normally has one, but a rejected transfer can be reissued.
    /// </summary>
    /// <param name="reservationId">Reservation business key.</param>
    Task<List<EnergyTransaction>> GetByReservationIdAsync(string reservationId);

    /// <summary>Returns every transaction belonging to one prosumer, newest first.</summary>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="transferStatus">Optional transfer status filter.</param>
    Task<List<EnergyTransaction>> GetByProsumerAsync(string prosumerNic, string? transferStatus = null);

    /// <summary>
    /// Paged search across the collection.
    /// Every filter is optional; omitted filters widen the result set.
    /// </summary>
    /// <param name="status">Transfer status, already normalised by the service.</param>
    /// <param name="date">Restricts to transactions whose slot date falls on this day.</param>
    /// <param name="stationId">Station identifier.</param>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="fromDate">Inclusive lower bound on the slot date.</param>
    /// <param name="toDate">Inclusive upper bound on the slot date.</param>
    /// <param name="page">1-based page number.</param>
    /// <param name="pageSize">Items per page.</param>
    /// <returns>The matching page and the total match count.</returns>
    Task<(List<EnergyTransaction> Items, long TotalCount)> SearchAsync(
        string? status,
        DateTime? date,
        string? stationId,
        string? prosumerNic,
        DateTime? fromDate,
        DateTime? toDate,
        int page,
        int pageSize);

    /// <summary>Counts documents matching one transfer status, optionally scoped to a prosumer.</summary>
    /// <param name="transferStatus">Transfer status to count.</param>
    /// <param name="prosumerNic">Optional prosumer scope.</param>
    Task<long> CountByStatusAsync(string transferStatus, string? prosumerNic = null);

    /// <summary>Counts transactions created between two instants, optionally scoped to a prosumer.</summary>
    /// <param name="fromInclusive">Inclusive lower bound.</param>
    /// <param name="toExclusive">Exclusive upper bound.</param>
    /// <param name="prosumerNic">Optional prosumer scope.</param>
    Task<long> CountCreatedBetweenAsync(DateTime fromInclusive, DateTime toExclusive, string? prosumerNic = null);

    /// <summary>Sums the energy delivered by completed transfers, optionally scoped to a prosumer.</summary>
    /// <param name="prosumerNic">Optional prosumer scope.</param>
    Task<double> SumCompletedEnergyAsync(string? prosumerNic = null);

    /// <summary>Returns the most recent transactions in one transfer status.</summary>
    /// <param name="transferStatus">Transfer status to list.</param>
    /// <param name="limit">Maximum documents to return.</param>
    /// <param name="prosumerNic">Optional prosumer scope.</param>
    Task<List<EnergyTransaction>> GetRecentByStatusAsync(string transferStatus, int limit, string? prosumerNic = null);

    /// <summary>Returns transactions whose booked slot falls on the given day.</summary>
    /// <param name="date">The day to list.</param>
    /// <param name="limit">Maximum documents to return.</param>
    Task<List<EnergyTransaction>> GetBySlotDateAsync(DateTime date, int limit);

    /// <summary>
    /// Marks every Active token whose expiry has passed as Expired.
    /// Called opportunistically so dashboards never show stale Active tokens.
    /// </summary>
    /// <param name="asOf">The instant to compare expiry against.</param>
    /// <returns>Number of tokens transitioned to Expired.</returns>
    Task<long> ExpireOverdueTokensAsync(DateTime asOf);
}
