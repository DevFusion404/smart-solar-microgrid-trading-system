/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : SlotCapacityDto.cs
Description   : Data transfer object for adjusting the
                available capacity of a booking slot.
                Used by Pasan's booking flow.
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class SlotCapacityDto
{
    // New available capacity value in kWh after booking adjustment
    public double AvailableCapacity { get; set; }
}
