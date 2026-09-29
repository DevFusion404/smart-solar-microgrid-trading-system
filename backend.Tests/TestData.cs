// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: TestData.cs
// Component: Identity and Account Management (Component 1) - Tests
// Description: Shared builders for valid registration requests and pre-existing users.
// ===============================================

using backend.DTOs.Prosumers;
using backend.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Tests;

public static class TestData
{
    public const string ValidPassword = "Solar1234";

    // Builds a registration request that passes every validation rule
    public static RegisterProsumerDto ValidRegistration(string nic = "200012345678", string username = "kamal_p", string email = "kamal@example.com") => new()
    {
        Nic = nic,
        FullName = "Kamal Perera",
        Email = email,
        PhoneNumber = "0771234567",
        Address = "12 Galle Road, Colombo 03",
        Username = username,
        Password = ValidPassword
    };

    // Builds a stored user with a real password hash so login can be tested
    public static UserDetails User(IPasswordHasher<UserDetails> hasher, string username, UserRole role, AccountStatus status, string? nic = null)
    {
        var user = new UserDetails
        {
            Id = Guid.NewGuid().ToString("N"),
            Username = username,
            FullName = "Test " + username,
            Email = username + "@example.com",
            PhoneNumber = "0771234567",
            Address = role == UserRole.Prosumer ? "1 Test Street, Kandy" : null,
            Nic = nic,
            Role = role,
            Status = status
        };
        user.PasswordHash = hasher.HashPassword(user, ValidPassword);
        return user;
    }
}
