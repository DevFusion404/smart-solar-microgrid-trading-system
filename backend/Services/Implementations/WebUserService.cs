// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: WebUserService.cs
// Description: Domain service implementation for managing Web Application users (Backoffice officers and Grid Operators).
// ===============================================

using backend.DTOs.WebUsers;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using System.Text.RegularExpressions;

namespace backend.Services.Implementations;

public class WebUserService : IWebUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<UserDetails> _passwordHasher;

    // Initializes WebUserService with repository and password hasher dependencies
    public WebUserService(IUserRepository userRepository, IPasswordHasher<UserDetails> passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    // Creates a new Web Application user account with role Backoffice or GridOperator
    public async Task<WebUserResponseDto> CreateWebUserAsync(CreateWebUserDto request, string actingUsername)
    {
        ValidateCreateWebUser(request);

        if (!Enum.TryParse<UserRole>(request.Role, true, out var targetRole) ||
            (targetRole != UserRole.Backoffice && targetRole != UserRole.GridOperator))
        {
            throw new BadRequestException("INVALID_ROLE", "Role must be 'Backoffice' or 'GridOperator'.");
        }

        // Uniqueness checks (BR-02)
        var existingUsername = await _userRepository.GetByUsernameAsync(request.Username.Trim());
        if (existingUsername != null)
        {
            throw new ConflictException("DUPLICATE_USERNAME", $"Username '{request.Username}' is already taken.");
        }

        var existingEmail = await _userRepository.GetByEmailAsync(request.Email.Trim());
        if (existingEmail != null)
        {
            throw new ConflictException("DUPLICATE_EMAIL", $"Email '{request.Email}' is already in use.");
        }

        var user = new UserDetails
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Username = request.Username.Trim(),
            Role = targetRole,
            Status = AccountStatus.Active,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ActivatedAt = DateTime.UtcNow,
            ActivatedBy = actingUsername,
            Version = 1
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        await _userRepository.CreateAsync(user);

        return MapToResponse(user);
    }

    // Retrieves paginated list of web users with optional role and status filtering
    public async Task<(IEnumerable<WebUserResponseDto> Items, long TotalCount)> ListWebUsersAsync(UserRole? role, AccountStatus? status, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalCount) = await _userRepository.ListWebUsersAsync(role, status, page, pageSize);
        return (items.Select(MapToResponse), totalCount);
    }

    // Retrieves web user account details by username
    public async Task<WebUserResponseDto> GetWebUserByUsernameAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null || (user.Role != UserRole.Backoffice && user.Role != UserRole.GridOperator))
        {
            throw new NotFoundException("WEB_USER_NOT_FOUND", $"Web user '{username}' was not found.");
        }

        return MapToResponse(user);
    }

    // Updates web user profile details (FullName, Email, PhoneNumber)
    public async Task<WebUserResponseDto> UpdateWebUserAsync(string username, UpdateWebUserDto request)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null || (user.Role != UserRole.Backoffice && user.Role != UserRole.GridOperator))
        {
            throw new NotFoundException("WEB_USER_NOT_FOUND", $"Web user '{username}' was not found.");
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

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Deactivates a web user account with reason and prevents self-deactivation
    public async Task<WebUserResponseDto> DeactivateWebUserAsync(string username, string reason, string actingUsername)
    {
        if (string.IsNullOrWhiteSpace(reason) || reason.Trim().Length < 10 || reason.Trim().Length > 500)
        {
            throw new BadRequestException("REASON_REQUIRED", "Deactivation reason must be between 10 and 500 characters.");
        }

        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null || (user.Role != UserRole.Backoffice && user.Role != UserRole.GridOperator))
        {
            throw new NotFoundException("WEB_USER_NOT_FOUND", $"Web user '{username}' was not found.");
        }

        if (string.Equals(user.Username, actingUsername, StringComparison.OrdinalIgnoreCase))
        {
            throw new BadRequestException("CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own account.");
        }

        if (user.Status == AccountStatus.Deactivated)
        {
            throw new ConflictException("ALREADY_DEACTIVATED", "User is already deactivated.");
        }

        user.Status = AccountStatus.Deactivated;
        user.DeactivationReason = reason.Trim();
        user.DeactivatedAt = DateTime.UtcNow;
        user.DeactivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Reactivates a previously deactivated web user account
    public async Task<WebUserResponseDto> ReactivateWebUserAsync(string username, string actingUsername)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null || (user.Role != UserRole.Backoffice && user.Role != UserRole.GridOperator))
        {
            throw new NotFoundException("WEB_USER_NOT_FOUND", $"Web user '{username}' was not found.");
        }

        if (user.Status == AccountStatus.Active)
        {
            throw new ConflictException("ALREADY_ACTIVE", "User account is already active.");
        }

        user.Status = AccountStatus.Active;
        user.DeactivationReason = null;
        user.DeactivatedAt = null;
        user.DeactivatedBy = null;
        user.ActivatedAt = DateTime.UtcNow;
        user.ActivatedBy = actingUsername;

        await _userRepository.UpdateAsync(user);
        return MapToResponse(user);
    }

    // Validates inputs (FullName, Email format, Sri Lankan Phone Number, Username format, Password strength) for web user creation
    private static void ValidateCreateWebUser(CreateWebUserDto dto)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(dto.FullName) || dto.FullName.Trim().Length < 2)
            errors["fullName"] = new[] { "Full name must be at least 2 characters long." };

        if (string.IsNullOrWhiteSpace(dto.Email) || !Regex.IsMatch(dto.Email.Trim(), @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            errors["email"] = new[] { "Invalid email address format." };

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || !Regex.IsMatch(dto.PhoneNumber.Trim(), @"^(0[0-9]{9}|\+94[0-9]{9})$"))
            errors["phoneNumber"] = new[] { "Phone number must match Sri Lankan format (e.g. 0771234567 or +94771234567)." };

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

    // Maps UserDetails entity to WebUserResponseDto payload
    private static WebUserResponseDto MapToResponse(UserDetails user)
    {
        return new WebUserResponseDto
        {
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role.ToString(),
            Status = user.Status.ToString(),
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            LastLoginAt = user.LastLoginAt,
            DeactivationReason = user.DeactivationReason,
            DeactivatedAt = user.DeactivatedAt,
            DeactivatedBy = user.DeactivatedBy,
            ActivatedAt = user.ActivatedAt,
            ActivatedBy = user.ActivatedBy
        };
    }
}
