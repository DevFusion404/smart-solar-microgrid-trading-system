// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: DefaultAdminSettings.cs
// Description: Configuration model for the first Backoffice account that is seeded on startup
//              when no Backoffice user exists yet. Values come from appsettings.Local.json or
//              environment variables (e.g. DefaultAdmin__Password) so no password is committed.
// ===============================================

namespace backend.Configuration;

public class DefaultAdminSettings
{
    public const string SectionName = "DefaultAdmin";

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = "System Administrator";
    public string Email { get; set; } = "admin@smartsolar.lk";
    public string PhoneNumber { get; set; } = "0110000000";
}
