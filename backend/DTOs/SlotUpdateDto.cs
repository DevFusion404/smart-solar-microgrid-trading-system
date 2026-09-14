/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SlotUpdateDto.cs
Description   : Data transfer object for updating an
                existing energy booking slot
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class SlotUpdateDto
{
    // Updated date for this booking slot
    public DateTime Date { get; set; }

    // Updated slot start time
    public TimeSpan StartTime { get; set; }

    // Updated slot end time
    public TimeSpan EndTime { get; set; }

    // Updated maximum capacity in kWh
    public double TotalCapacity { get; set; }

    // Updated remaining available capacity in kWh
    public double AvailableCapacity { get; set; }

    // Updated slot status — Available or Closed
    public string Status { get; set; }
}
