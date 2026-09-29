/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SlotCapacityDto.cs
Description   : Data transfer object for adjusting the
                available capacity of a booking slot.
                Used by booking flow.
Author        : Nanayakkara G.L.C.S
=====================================================
*/


namespace backend.DTOs;

public class SlotCapacityDto
{
    // New available capacity value in kWh after booking adjustment
    public double AvailableCapacity { get; set; }
}
