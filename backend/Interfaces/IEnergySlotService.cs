/*
=====================================================
File          : IEnergySlotService.cs
Description   : Defines energy booking slot operations
=====================================================
*/

using backend.Models;

namespace backend.Interfaces;

public interface IEnergySlotService
{
    // Creates a new energy booking slot for a station.
    Task<EnergyBookingSlot> CreateSlot(
        EnergyBookingSlot slot);

    // Retrieves all slots for a given station,
    // optionally filtered by date.
    Task<List<EnergyBookingSlot>> GetSlotsByStation(
        string stationId,
        DateTime? date);

    // Retrieves a single slot by MongoDB document id.
    Task<EnergyBookingSlot?> GetSlotById(string id);

    // Replaces all editable fields of an existing slot.
    Task<bool> UpdateSlot(
        string id,
        EnergyBookingSlot slot);

    // Adjusts only the available capacity of a slot.
    // Called by the booking service when a reservation is made.
    Task<bool> AdjustCapacity(
        string id,
        double availableCapacity);

}
