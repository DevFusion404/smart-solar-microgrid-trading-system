// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: NearbyStationDto.cs
// Description: Station returned by GET /api/stations/nearby and /api/stations/nearby/me.
//              It has the same fields as SolarStationInfo (so existing clients can read it
//              with their normal station model) plus DistanceKm from the requested point.
// ===============================================

namespace backend.DTOs;

public class NearbyStationDto
{
    public string? Id { get; set; }
    public string StationId { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double EnergyCapacity { get; set; }
    public double BatteryStorageCapacity { get; set; }
    public string OperationalSchedule { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AssignedOperatorName { get; set; }

    // Straight-line distance in km from the requested location, rounded to 2 decimals
    public double DistanceKm { get; set; }
}
