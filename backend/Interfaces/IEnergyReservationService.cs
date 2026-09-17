using backend.DTOs;
using backend.Models;

namespace backend.Interfaces;

public interface IEnergyReservationService
{
    Task<EnergyReservation> CreateAsync(string username, CreateReservationDto request);
    Task<IReadOnlyList<EnergyReservation>> GetCurrentForUserAsync(string username, DateTime? date);
    Task<IReadOnlyList<EnergyReservation>> GetHistoryForUserAsync(string username, DateTime? date);
    Task<EnergyReservation> CancelAsync(string username, string reservationId, CancelReservationDto request);
}
