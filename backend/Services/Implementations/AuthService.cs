// ===============================================
// SE4040 - Enterprise Application Development
// Smart Solar Microgrid Trading System
// File: AuthService.cs
// Description: Domain service implementation handling authentication, credential verification, and user session lookup.
// ===============================================

using backend.DTOs.Auth;
using backend.Helpers;
using backend.Middleware;
using backend.Models;
using backend.Repositories;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher<UserDetails> _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    // Initializes AuthService with repository, password hasher, and token generator dependencies
    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher<UserDetails> passwordHasher,
        IJwtTokenGenerator tokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    // Verifies user login credentials, status rules (BR-04, BR-09), and generates JWT token
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            throw new BadRequestException("INVALID_CREDENTIALS", "Username and password are required.");
        }

        var user = await _userRepository.GetByUsernameAsync(request.Username.Trim());
        if (user == null)
        {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid username or password.");
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid username or password.");
        }

        // BR-09: Block deactivated users from logging in
        if (user.Status == AccountStatus.Deactivated)
        {
            throw new ForbiddenException("ACCOUNT_DEACTIVATED", "Your account has been deactivated. Please contact support.");
        }

        // BR-04: Block pending activation users from logging in / accessing protected resources
        if (user.Status == AccountStatus.PendingActivation)
        {
            throw new ForbiddenException("ACCOUNT_PENDING_ACTIVATION", "Your account is pending activation by an administrator.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user);

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user);

        return new LoginResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserSummaryDto
            {
                Username = user.Username,
                FullName = user.FullName,
                Role = user.Role.ToString(),
                Status = user.Status.ToString(),
                Nic = user.Nic
            }
        };
    }

    // Fetches UserDetails domain entity by username or throws NotFoundException
    public async Task<UserDetails> GetCurrentUserAsync(string username)
    {
        var user = await _userRepository.GetByUsernameAsync(username);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", $"User with username '{username}' was not found.");
        }
        return user;
    }
}
