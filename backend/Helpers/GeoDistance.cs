// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: GeoDistance.cs
// Description: GPS helpers used to find the microgrid stations nearest to a prosumer.
//              Distance uses the Haversine formula (great-circle distance on a sphere),
//              which is accurate to well under 1% for distances inside Sri Lanka.
//              Formula reference: https://en.wikipedia.org/wiki/Haversine_formula
//Author        : Nanayakkara G.L.C.S
// ===============================================

namespace backend.Helpers;

public static class GeoDistance
{
    // Mean Earth radius in kilometres (IUGG value)
    public const double EarthRadiusKm = 6371.0088;

    // Returns the straight-line (great-circle) distance in km between two GPS points
    public static double HaversineKm(double lat1, double lng1, double lat2, double lng2)
    {
        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    // Returns true when latitude is within -90..90 and longitude within -180..180
    public static bool IsValidCoordinate(double latitude, double longitude)
    {
        return !double.IsNaN(latitude) && !double.IsNaN(longitude) &&
               latitude >= -90 && latitude <= 90 &&
               longitude >= -180 && longitude <= 180;
    }

    // Returns true for the 0,0 point, which is what an unset station location defaults to
    public static bool IsUnset(double latitude, double longitude)
    {
        return latitude == 0 && longitude == 0;
    }

    // Converts degrees to radians
    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}
