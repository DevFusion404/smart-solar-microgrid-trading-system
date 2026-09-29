// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: DefaultAdminSeeder.cs
// Description: Creates the first Backoffice account on startup so a fresh deployment (e.g. on IIS)
//              can log in and create the remaining web users. Runs only when DefaultAdmin
//              credentials are configured and no Backoffice user exists in UserDetails.
// ===============================================

using backend.Configuration;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Identity;

namespace backend.Data;

public static class DefaultAdminSeeder
{
    // Seeds one Active Backoffice account if none exists; never overwrites an existing user
    public static async Task SeedAsync(IServiceProvider services, DefaultAdminSettings settings, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(settings.Username) || string.IsNullOrWhiteSpace(settings.Password))
        {
            logger.LogInformation("DefaultAdmin not configured; skipping Backoffice seed.");
            return;
        }

        using var scope = services.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<IUserRepository>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<UserDetails>>();

        var (_, backofficeCount) = await userRepository.ListWebUsersAsync(UserRole.Backoffice, null, 1, 1);
        if (backofficeCount > 0)
        {
            return;
        }

        if (await userRepository.GetByUsernameAsync(settings.Username.Trim()) != null)
        {
            logger.LogWarning("DefaultAdmin username '{Username}' is already used by a non-Backoffice account; skipping seed.", settings.Username);
            return;
        }

        var admin = new UserDetails
        {
            FullName = settings.FullName.Trim(),
            Email = settings.Email.Trim().ToLowerInvariant(),
            PhoneNumber = settings.PhoneNumber.Trim(),
            Username = settings.Username.Trim(),
            Role = UserRole.Backoffice,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ActivatedAt = DateTime.UtcNow,
            ActivatedBy = "system-seed",
            Version = 1
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, settings.Password);

        await userRepository.CreateAsync(admin);
        logger.LogInformation("Seeded default Backoffice account '{Username}'.", admin.Username);
    }
}
