/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Energy Transfer and Transaction Management
File          : IReservationLookupRepository.cs
Description   : Read/close contract over Component 3's reservation
                collection. This component reads reservations to
                validate a transfer and closes them once the energy
                has changed hands; it never creates or cancels one.
Author        : Malmi
=====================================================
*/

using backend.Models;

namespace backend.Repositories;

/// <summary>
/// Narrow access to the <c>EnergyReservations</c> collection owned by
/// Component 3 (Reservation Management).
/// <para>
/// Only the two operations the energy transfer workflow genuinely needs are
/// exposed — look a reservation up, and mark it Completed. Everything else
/// about a reservation's lifecycle stays with Component 3.
/// </para>
/// </summary>
public interface IReservationLookupRepository
{
    /// <summary>
    /// Finds a reservation by its business key or MongoDB document id.
    /// </summary>
    /// <param name="reservationId">Reservation business key or ObjectId string.</param>
    /// <returns>A projection of the reservation, or null when it does not exist.</returns>
    Task<ReservationSnapshot?> GetByReservationIdAsync(string reservationId);

    /// <summary>
    /// Lists a prosumer's approved reservations dated on or after the given day.
    /// Used by the prosumer dashboard to offer bookings that still need a QR.
    /// </summary>
    /// <param name="prosumerNic">Prosumer NIC.</param>
    /// <param name="username">Account username, matched as a fallback when the NIC is not stored on the reservation.</param>
    /// <param name="fromDate">Inclusive lower bound on the slot date.</param>
    /// <returns>Approved reservations ordered by slot date.</returns>
    Task<List<ReservationSnapshot>> GetApprovedFromDateAsync(string? prosumerNic, string? username, DateTime fromDate);

    /// <summary>
    /// Moves a reservation to Completed once the energy transfer is confirmed.
    /// </summary>
    /// <param name="reservationId">Reservation business key.</param>
    /// <param name="completedAt">When the transfer completed.</param>
    /// <returns>True when a reservation document was updated.</returns>
    Task<bool> MarkCompletedAsync(string reservationId, DateTime completedAt);
}
