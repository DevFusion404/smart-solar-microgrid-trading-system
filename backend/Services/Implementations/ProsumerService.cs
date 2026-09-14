// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: ProsumerService.cs
// Description: Domain service implementation for prosumer registration, NIC validation, activation, and account status management.
// ===============================================

using backend.DTOs.Prosumers;
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
            Username = normalizedUsername,
            Role = UserRole.Prosumer,
            Status = AccountStatus.PendingActivation, // BR-03
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ActivationRequestedAt = DateTime.UtcNow,
            Version = 1
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.CreateAsync(user);

        return MapToResponse(user);
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

    // Approves deactivation request and updates prosumer account status to Deactivated
    public async Task<ProsumerResponseDto> ApproveDeactivationAsync(string nic, string actingUsername)
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

        if (errors.Count > 0)
        {
            throw new BadRequestException("VALIDATION_FAILED", "One or more validation errors occurred.", errors);
        }
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
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt
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
