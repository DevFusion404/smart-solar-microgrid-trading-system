/*
=====================================================
Project       : Smart Solar Microgrid Trading System
Component     : Microgrid Node and Energy Slot Management
File          : StationUpdateDto.cs
Description   : Data transfer object for updating an
                existing solar microgrid station
Author        : Sithmaka
=====================================================
*/


namespace backend.DTOs;

public class StationUpdateDto
{
    // Display name of the microgrid station
    public string StationName { get; set; }

    // Physical street address of the station
    public string Address { get; set; }

    // GPS latitude used for map integration
    public double Latitude { get; set; }

    // GPS longitude used for map integration
    public double Longitude { get; set; }

    // Maximum energy generation capacity in kW
    public double EnergyCapacity { get; set; }

    // Battery storage capacity of the station in kWh
    public double BatteryStorageCapacity { get; set; }

    // Operational working schedule description
    public string OperationalSchedule { get; set; }
}
