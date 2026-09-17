// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProfileService.cs
// Description: Domain service implementation handling self-service profile queries, updates, and prosumer deactivation requests.
// ===============================================

using backend.DTOs.Profile;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Interfaces;
using System.Text.RegularExpressions;

using Microsoft.AspNetCore.Identity;

namespace backend.Services.Implementations;

public class ProfileService : IProfileService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<UserDetails> _passwordHasher;

    // Initializes ProfileService with IUserRepository and IPasswordHasher dependency injection
    public ProfileService(IUserRepository userRepository, IPasswordHasher<UserDetails> passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    // Fetches user profile record by username
    public async Task<UserDetails> GetProfileAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User '{username}' was not found.");
        }
        return user;
    }

    // Updates profile details (FullName, Sri Lankan Phone Number, Address) for active accounts
    public async Task<UserDetails> UpdateProfileAsync(string username, UpdateProfileDto request)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User '{username}' was not found.");
        }

        if (user.Status != AccountStatus.Active)
        {
            throw new ForbiddenException("INACTIVE_ACCOUNT", "Only active accounts can update profile details.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            if (request.FullName.Trim().Length < 2)
            {
                throw new BadRequestException("INVALID_FULLNAME_FORMAT", "Full name must be at least 2 characters long.");
            }
            user.FullName = request.FullName.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            if (!Regex.IsMatch(request.PhoneNumber.Trim(), @"^(0[0-9]{9}|\+94[0-9]{9})$"))
            {
                throw new BadRequestException("INVALID_PHONE_FORMAT", "Phone number must match Sri Lankan format.");
            }
            user.PhoneNumber = request.PhoneNumber.Trim();
        }

        if (user.Role == UserRole.Prosumer && !string.IsNullOrWhiteSpace(request.Address))
        {
            if (request.Address.Trim().Length < 5)
            {
                throw new BadRequestException("INVALID_ADDRESS_FORMAT", "Address must be at least 5 characters long.");
            }
            user.Address = request.Address.Trim();
        }

        await _userRepository.UpdateAsync(user);
        return user;
    }

    // Submits voluntary prosumer deactivation request with reason for Backoffice approval
    public async Task SubmitDeactivationRequestAsync(string username, string reason)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User '{username}' was not found.");
        }

        if (user.Role != UserRole.Prosumer)
        {
            throw new ForbiddenException("PROSUMER_ONLY", "Only Prosumer accounts can submit voluntary deactivation requests.");
        }

        if (user.Status != AccountStatus.Active)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", $"Only Active prosumers can request deactivation. Current status is '{user.Status}'.");
        }

        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10 || reason.Trim().Length > 500)
        {
            throw new BadRequestException("REASON_REQUIRED", "Deactivation request reason must be between 10 and 500 characters.");
        }

        user.Status = AccountStatus.DeactivationRequested;
        user.DeactivationRequestedAt = DateTime.UtcNow;
        user.DeactivationReason = reason.Trim();

        await _userRepository.UpdateAsync(user);
    }

    // Changes authenticated user password after verifying current password and enforcing strength requirements
    public async Task ChangePasswordAsync(string username, ChangePasswordDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            throw new BadRequestException("INVALID_INPUT", "Current password and new password are required.");
        }

        if (request.NewPassword != request.ConfirmPassword)
        {
            throw new BadRequestException("PASSWORD_MISMATCH", "New password and confirmation password do not match.");
        }

        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User '{username}' was not found.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new BadRequestException("INVALID_CURRENT_PASSWORD", "Current password is incorrect.");
        }

        if (request.NewPassword.Length < 6)
        {
            throw new BadRequestException("WEAK_PASSWORD", "New password must be at least 6 characters long.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }
}
