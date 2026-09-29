// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProsumerService.cs
// Description: Domain service implementation for prosumer registration, NIC validation, activation, and account status management.
// ===============================================

using backend.DTOs.Prosumers;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using System.Text.RegularExpressions;

namespace backend.Services.Implementations;

public class ProsumerService : IProsumerService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<UserDetails> _passwordHasher;

    // Initializes ProsumerService with user repository and password hasher dependencies
    public ProsumerService(IUserRepository userRepository, IPasswordHasher<UserDetails> passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    // Handles prosumer self-registration with Sri Lankan NIC primary key and initial PendingActivation status
    public async Task<ProsumerResponseDto> RegisterProsumerAsync(RegisterProsumerDto request)
    {
        var user = await CreateProsumerAccountAsync(request, AccountStatus.PendingActivation, null);
        return MapToResponse(user);
    }

    // Creates a prosumer account on behalf of a customer by a Backoffice officer (account is Active immediately)
    public async Task<ProsumerResponseDto> CreateProsumerByBackofficeAsync(RegisterProsumerDto request, string actingUsername)
    {
        var user = await CreateProsumerAccountAsync(request, AccountStatus.Active, actingUsername);
        return MapToResponse(user);
    }

    // Shared creation logic: validates input, enforces unique NIC/username/email, hashes password and saves the account
    private async Task<UserDetails> CreateProsumerAccountAsync(RegisterProsumerDto request, AccountStatus initialStatus, string? actingUsername)
    {
        ValidateRegisterProsumer(request);

        var normalizedNic = request.Nic.Trim().ToUpperInvariant();
        var normalizedUsername = request.Username.Trim();
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // Uniqueness Checks (BR-01, BR-02)
        var existingNic = await _userRepository.GetByNicAsync(normalizedNic);
        if (existingNic != null)
        {
            throw new ConflictException("DUPLICATE_NIC", $"NIC '{normalizedNic}' is already registered.");
        }

        var existingUsername = await _userRepository.GetByUsernameAsync(normalizedUsername);
        if (existingUsername != null)
        {
            throw new ConflictException("DUPLICATE_USERNAME", $"Username '{normalizedUsername}' is already taken.");
        }

        var existingEmail = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (existingEmail != null)
        {
            throw new ConflictException("DUPLICATE_EMAIL", $"Email '{normalizedEmail}' is already in use.");
        }

        var user = new UserDetails
        {
            Nic = normalizedNic,
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = request.PhoneNumber.Trim(),
            Address = request.Address.Trim(),
            // Optional home GPS location, used later to find the nearest stations
            HomeLatitude = request.HomeLatitude,
            HomeLongitude = request.HomeLongitude,
            Username = normalizedUsername,
            Role = UserRole.Prosumer,
            Status = initialStatus, // BR-03: self-registered accounts start as PendingActivation
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ActivationRequestedAt = DateTime.UtcNow,
            Version = 1
        };

        // Accounts created by a Backoffice officer are approved at creation time
        if (initialStatus == AccountStatus.Active)
        {
            user.ActivatedAt = DateTime.UtcNow;
            user.ActivatedBy = actingUsername;
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.CreateAsync(user);

        return user;
    }

    // Returns paginated list of prosumer accounts filtered by account status
    public async Task<ProsumerListResponseDto> ListProsumersAsync(AccountStatus? status, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _userRepository.ListProsumersAsync(status, page, pageSize);
        return new ProsumerListResponseDto
        {
            Items = items.Select(MapToSummary),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Searches prosumer accounts matching search query string across FullName, NIC, Email, or Username
    public async Task<ProsumerListResponseDto> SearchProsumersAsync(string query, AccountStatus? status, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _userRepository.SearchProsumersAsync(query, status, page, pageSize);
        return new ProsumerListResponseDto
        {
            Items = items.Select(MapToSummary),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Retrieves detailed prosumer profile response by NIC primary key
    public async Task<ProsumerResponseDto> GetProsumerByNicAsync(string nic)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        return MapToResponse(user);
    }

    // Updates prosumer profile information by NIC with validation checks
    public async Task<ProsumerResponseDto> UpdateProsumerAsync(string nic, UpdateProsumerDto request)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.Email) && !string.Equals(request.Email, user.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (!Regex.IsMatch(request.Email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            {
                throw new BadRequestException("INVALID_EMAIL_FORMAT", "Invalid email format.");
            }
            var existingEmail = await _userRepository.GetByEmailAsync(request.Email.Trim());
            if (existingEmail != null && existingEmail.Id != user.Id)
            {
                throw new ConflictException("DUPLICATE_EMAIL", $"Email '{request.Email}' is already in use.");
            }
            user.Email = request.Email.Trim().ToLowerInvariant();
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
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

        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            user.Address = request.Address.Trim();
        }

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Lists prosumer accounts currently in PendingActivation status
    public async Task<ProsumerListResponseDto> ListPendingActivationsAsync(int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _userRepository.ListPendingActivationsAsync(page, pageSize);
        return new ProsumerListResponseDto
        {
            Items = items.Select(MapToSummary),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Activates a pending prosumer account and records activating Backoffice officer username
    public async Task<ProsumerResponseDto> ActivateProsumerAsync(string nic, string actingUsername)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (user.Status != AccountStatus.PendingActivation)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", $"Cannot activate prosumer in state '{user.Status}'.");
        }

        user.Status = AccountStatus.Active;
        user.ActivatedAt = DateTime.UtcNow;
        user.ActivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Rejects pending prosumer registration with rejection reason and marks account Deactivated
    public async Task<ProsumerResponseDto> RejectProsumerActivationAsync(string nic, string reason, string actingUsername)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10 || reason.Trim().Length > 500)
        {
            throw new BadRequestException("REASON_REQUIRED", "Rejection reason must be between 10 and 500 characters.");
        }

        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (user.Status != AccountStatus.PendingActivation)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", $"Cannot reject activation for prosumer in state '{user.Status}'.");
        }

        user.Status = AccountStatus.Deactivated;
        user.DeactivationReason = $"Registration Rejected: {reason.Trim()}";
        user.DeactivatedAt = DateTime.UtcNow;
        user.DeactivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Submits voluntary deactivation request for active prosumer account
    public async Task<ProsumerResponseDto> RequestDeactivationAsync(string nic, string reason)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10 || reason.Trim().Length > 500)
        {
            throw new BadRequestException("REASON_REQUIRED", "Deactivation request reason must be between 10 and 500 characters.");
        }

        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (user.Status != AccountStatus.Active)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", $"Only Active prosumers can request deactivation. Current status is '{user.Status}'.");
        }

        user.Status = AccountStatus.DeactivationRequested;
        user.DeactivationRequestedAt = DateTime.UtcNow;
        user.DeactivationReason = reason.Trim();

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Lists prosumer accounts requesting deactivation for Backoffice review
    public async Task<ProsumerListResponseDto> ListDeactivationRequestsAsync(int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _userRepository.ListDeactivationRequestsAsync(page, pageSize);
        return new ProsumerListResponseDto
        {
            Items = items.Select(MapToSummary),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Deactivates a prosumer: approves a pending request, or directly deactivates an Active account (reason required)
    public async Task<ProsumerResponseDto> ApproveDeactivationAsync(string nic, string actingUsername, string? reason = null)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (user.Status != AccountStatus.DeactivationRequested && user.Status != AccountStatus.Active)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", $"Cannot deactivate prosumer in state '{user.Status}'.");
        }

        var trimmedReason = reason?.Trim();
        if (!string.IsNullOrEmpty(trimmedReason) && (trimmedReason.Length < 10 || trimmedReason.Length > 500))
        {
            throw new BadRequestException("REASON_REQUIRED", "Deactivation reason must be between 10 and 500 characters.");
        }

        // An officer-initiated deactivation (no request from the prosumer) must be justified
        if (user.Status == AccountStatus.Active && string.IsNullOrEmpty(trimmedReason))
        {
            throw new BadRequestException("REASON_REQUIRED", "A reason (10-500 characters) is required to deactivate an active account.");
        }

        if (!string.IsNullOrEmpty(trimmedReason))
        {
            user.DeactivationReason = trimmedReason;
        }

        user.Status = AccountStatus.Deactivated;
        user.DeactivatedAt = DateTime.UtcNow;
        user.DeactivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Reactivates a previously deactivated prosumer account (Backoffice officer only)
    public async Task<ProsumerResponseDto> ReactivateProsumerAsync(string nic, string actingUsername)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        if (user.Status == AccountStatus.Active)
        {
            throw new ConflictException("ALREADY_ACTIVE", "Prosumer account is already active.");
        }

        // New registrations must go through the activate/reject review instead of reactivation
        if (user.Status == AccountStatus.PendingActivation)
        {
            throw new ConflictException("INVALID_STATUS_TRANSITION", "Pending registrations must be activated, not reactivated.");
        }

        user.Status = AccountStatus.Active;
        user.DeactivationReason = null;
        user.DeactivationRequestedAt = null;
        user.DeactivatedAt = null;
        user.DeactivatedBy = null;
        user.ActivatedAt = DateTime.UtcNow;
        user.ActivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Checks current account status and returns activation boolean flag for given NIC
    public async Task<ProsumerStatusDto> CheckProsumerStatusAsync(string nic)
    {
        var user = await _userRepository.GetByNicAsync(nic.Trim());
        if (user == null || user.Role != UserRole.Prosumer)
        {
            throw new NotFoundException("PROSUMER_NOT_FOUND", $"Prosumer with NIC '{nic}' was not found.");
        }

        return new ProsumerStatusDto
        {
            Nic = user.Nic!,
            Status = user.Status.ToString(),
            IsActive = user.Status == AccountStatus.Active
        };
    }

    // Validates field formats (Sri Lankan NIC, phone number, password strength) for prosumer registration
    private static void ValidateRegisterProsumer(RegisterProsumerDto dto)
    {
        var errors = new Dictionary<string, string[]>();

        // Sri Lanka NIC Regex: 9 digits + V/X OR 12 digits
        if (string.IsNullOrWhiteSpace(dto.Nic) || !Regex.IsMatch(dto.Nic.Trim(), @"^([0-9]{9}[VXvx]|[0-9]{12})$"))
            errors["nic"] = new[] { "NIC must match Sri Lanka format (9 digits + V/X or 12 digits)." };

        if (string.IsNullOrWhiteSpace(dto.FullName) || dto.FullName.Trim().Length < 2)
            errors["fullName"] = new[] { "Full name must be at least 2 characters long." };

        if (string.IsNullOrWhiteSpace(dto.Email) || !Regex.IsMatch(dto.Email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            errors["email"] = new[] { "Invalid email address format." };

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || !Regex.IsMatch(dto.PhoneNumber.Trim(), @"^(0[0-9]{9}|\+94[0-9]{9})$"))
            errors["phoneNumber"] = new[] { "Phone number must match Sri Lankan format (e.g. 0771234567 or +94771234567)." };

        if (string.IsNullOrWhiteSpace(dto.Address) || dto.Address.Trim().Length < 5)
            errors["address"] = new[] { "Address must be at least 5 characters long." };

        if (string.IsNullOrWhiteSpace(dto.Username) || !Regex.IsMatch(dto.Username.Trim(), @"^[a-zA-Z0-9_]{4,30}$"))
            errors["username"] = new[] { "Username must be 4-30 alphanumeric characters or underscores." };

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8 ||
            !Regex.IsMatch(dto.Password, @"[A-Z]") || !Regex.IsMatch(dto.Password, @"[a-z]") ||
            !Regex.IsMatch(dto.Password, @"[0-9]"))
            errors["password"] = new[] { "Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters." };

        // Home location is optional, but if sent it must be a complete, valid GPS point
        var locationError = ValidateHomeLocation(dto.HomeLatitude, dto.HomeLongitude);
        if (locationError != null)
            errors["homeLocation"] = new[] { locationError };

        if (errors.Count > 0)
        {
            throw new BadRequestException("VALIDATION_FAILED", "One or more validation errors occurred.", errors);
        }
    }

    // Returns an error message when a home location is incomplete or out of range, otherwise null
    public static string? ValidateHomeLocation(double? latitude, double? longitude)
    {
        if (latitude == null && longitude == null)
            return null;

        if (latitude == null || longitude == null)
            return "Home location needs both latitude and longitude.";

        if (!GeoDistance.IsValidCoordinate(latitude.Value, longitude.Value) ||
            GeoDistance.IsUnset(latitude.Value, longitude.Value))
            return "Home location must be a valid GPS point (latitude -90..90, longitude -180..180).";

        return null;
    }

    // Maps UserDetails domain entity to ProsumerSummaryDto for list responses
    private static ProsumerSummaryDto MapToSummary(UserDetails user)
    {
        return new ProsumerSummaryDto
        {
            Nic = user.Nic ?? string.Empty,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Username = user.Username,
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt,
            ActivationRequestedAt = user.ActivationRequestedAt,
            DeactivationRequestedAt = user.DeactivationRequestedAt,
            DeactivationReason = user.DeactivationReason
        };
    }

    // Maps UserDetails domain entity to ProsumerResponseDto payload
    private static ProsumerResponseDto MapToResponse(UserDetails user)
    {
        return new ProsumerResponseDto
        {
            Nic = user.Nic ?? string.Empty,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address ?? string.Empty,
            HomeLatitude = user.HomeLatitude,
            HomeLongitude = user.HomeLongitude,
            Username = user.Username,
            Status = user.Status.ToString(),
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt,
            ActivationRequestedAt = user.ActivationRequestedAt,
            ActivatedAt = user.ActivatedAt,
            ActivatedBy = user.ActivatedBy,
            DeactivationRequestedAt = user.DeactivationRequestedAt,
            DeactivationReason = user.DeactivationReason,
            DeactivatedAt = user.DeactivatedAt,
            DeactivatedBy = user.DeactivatedBy
        };
    }
}
