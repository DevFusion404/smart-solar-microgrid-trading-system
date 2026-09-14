/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : StationScheduleDto.cs
Description   : Data transfer object for updating the
                operational schedule of a station
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class StationScheduleDto
{
    // New operational schedule string for the station
    public string OperationalSchedule { get; set; }
}
