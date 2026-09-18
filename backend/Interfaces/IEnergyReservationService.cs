using backend.DTOs;
using backend.Models;

namespace backend.Interfaces;

public interface IEnergyReservationService
{
    Task<EnergyReservation> CreateAsync(CreateReservationDto request);
    Task<IReadOnlyList<EnergyReservation>> GetAllAsync(DateTime? date);
    Task<EnergyReservation> UpdateAsync(string reservationId, UpdateReservationDto request);
    Task DeleteAsync(string reservationId);
}
