// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: JwtSettings.cs
// Description: Strongly-typed configuration model for JWT token generation and validation parameters.
// ===============================================

namespace backend.Configuration;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SmartSolarMicrogrid.Backend";
    public string Audience { get; set; } = "SmartSolarMicrogrid.Clients";
    public int ExpiryMinutes { get; set; } = 60;

    // Token lifetime for logins from the Android app (7 days), so a login saved on the phone lasts a week
    public int MobileExpiryMinutes { get; set; } = 10080;
}
