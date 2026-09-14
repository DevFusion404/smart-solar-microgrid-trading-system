// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProfileDtos.cs
// Description: Data Transfer Objects for user profile updates.
// ===============================================

namespace backend.DTOs.Profile;

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; } // Prosumers only
}
