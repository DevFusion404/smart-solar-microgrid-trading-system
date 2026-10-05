// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: AuthDtos.cs
// Description: Data Transfer Objects for authentication requests, login responses, and user summary data.
// ===============================================

namespace backend.DTOs.Auth;

public class LoginRequestDto
{
    // Value of ClientType sent by the Android app
    public const string MobileClient = "Mobile";

    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;

    // Optional. "Mobile" when the login comes from the Android app, which gets the longer mobile session
    public string? ClientType { get; set; }
}

public class UserSummaryDto
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Nic { get; set; }
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserSummaryDto User { get; set; } = null!;
}
