/*
 * File Name    : IEnergyReservationService.cs
 * Project      : Smart Solar Microgrid Trading System
 * Description  : Defines the reservation operations used by prosumer and Backoffice reservation endpoints.
 * Author       : Project Team
 * Date         : 28 Sep 2026
 */

using backend.DTOs;
using backend.Models;

namespace backend.Interfaces;

public interface IEnergyReservationService
{
    // Creates a reservation for the specified prosumer.
    Task<EnergyReservation> CreateAsync(string userId, CreateReservationDto request);

    // Retrieves a prosumer's reservations, optionally filtered by slot date.
    Task<IReadOnlyList<EnergyReservation>> GetAllAsync(string userId, DateTime? date);

    // Retrieves a prosumer's reservations from dates before the current day.
    Task<IReadOnlyList<EnergyReservation>> GetHistoryAsync(string userId, DateTime? date);

    // Updates a prosumer's editable reservation.
    Task<EnergyReservation> UpdateAsync(string userId, string reservationId, UpdateReservationDto request);

    // Deletes a prosumer's editable reservation.
    Task DeleteAsync(string userId, string reservationId);

    // Retrieves all reservations for Backoffice use.
    Task<IReadOnlyList<EnergyReservation>> GetAllForBackofficeAsync();

    // Updates a reservation workflow status for Backoffice use.
    Task<EnergyReservation> UpdateStatusForBackofficeAsync(string reservationId, UpdateReservationStatusDto request);

    // Generates the PNG QR pass for an approved reservation for Backoffice use.
    Task<byte[]> GetQrPngForBackofficeAsync(string reservationId);

    // Generates the PNG QR pass for an approved reservation owned by a prosumer.
    Task<byte[]> GetQrPngForUserAsync(string userId, string reservationId);
}
