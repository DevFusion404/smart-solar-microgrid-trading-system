/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SlotCreateDto.cs
Description   : Data transfer object for creating a new
                energy booking slot at a station
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class SlotCreateDto
{
    // Unique identifier for this booking slot
    public string SlotId { get; set; }

    // Date on which this slot is available for booking
    public DateTime Date { get; set; }

    // Slot start time (e.g. 08:00:00)
    public TimeSpan StartTime { get; set; }

    // Slot end time (e.g. 10:00:00)
    public TimeSpan EndTime { get; set; }

    // Maximum energy capacity available for this slot in kWh
    public double TotalCapacity { get; set; }

    // Remaining bookable capacity at the time of creation
    public double AvailableCapacity { get; set; }

    // Slot status — Available or Closed
    public string Status { get; set; }
}
