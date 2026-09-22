using backend.DTOs;
using backend.Models;

namespace backend.Interfaces;

public interface IEnergyReservationService
{
    Task<EnergyReservation> CreateAsync(string userId, CreateReservationDto request);
    Task<IReadOnlyList<EnergyReservation>> GetAllAsync(string userId, DateTime? date);
    Task<IReadOnlyList<EnergyReservation>> GetHistoryAsync(string userId, DateTime? date);
    Task<EnergyReservation> UpdateAsync(string userId, string reservationId, UpdateReservationDto request);
    Task DeleteAsync(string userId, string reservationId);
    Task<IReadOnlyList<EnergyReservation>> GetAllForBackofficeAsync();
    Task<EnergyReservation> UpdateStatusForBackofficeAsync(string reservationId, UpdateReservationStatusDto request);
    Task<byte[]> GetQrPngForBackofficeAsync(string reservationId);
    Task<byte[]> GetQrPngForUserAsync(string userId, string reservationId);
}
