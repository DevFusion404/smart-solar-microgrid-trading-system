namespace backend.Configuration;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "SmartSolarMicrogrid.Backend";
    public string Audience { get; set; } = "SmartSolarMicrogrid.Clients";
    public int ExpiryMinutes { get; set; } = 60;
}
