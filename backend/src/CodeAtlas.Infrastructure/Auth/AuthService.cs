using CodeAtlas.Application.Dtos.Auth;
using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Entities;
using CodeAtlas.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CodeAtlas.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly CodeAtlasDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly JwtOptions _jwtOptions;

    public AuthService(
        UserManager<AppUser> userManager,
        CodeAtlasDbContext db,
        ITokenService tokenService,
        IOptions<JwtOptions> jwtOptions)
    {
        _userManager = userManager;
        _db = db;
        _tokenService = tokenService;
        _jwtOptions = jwtOptions.Value;
    }

    public async Task<(bool Success, string? Error, AuthResponse? Result)> RegisterAsync(RegisterRequest request)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
        {
            return (false, "A user with this email already exists.", null);
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return (false, errors, null);
        }

        var response = await IssueTokensAsync(user);
        return (true, null, response);
    }

    public async Task<(bool Success, AuthResponse? Result)> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return (false, null);
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            return (false, null);
        }

        var response = await IssueTokensAsync(user);
        return (true, response);
    }

    public async Task<(bool Success, RefreshResponse? Result)> RefreshAsync(string refreshToken)
    {
        var hash = _tokenService.HashToken(refreshToken);
        var existing = await _db.RefreshTokens.Include(x => x.User)
            .FirstOrDefaultAsync(x => x.TokenHash == hash);

        if (existing == null || !existing.IsActive || existing.User == null)
        {
            return (false, null);
        }

        // Rotate: revoke the old token and issue a new one.
        var newPlainText = _tokenService.GenerateRefreshTokenPlainText();
        var newHash = _tokenService.HashToken(newPlainText);

        existing.RevokedAt = DateTimeOffset.UtcNow;
        existing.ReplacedByTokenHash = newHash;

        var newRefreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = existing.UserId,
            TokenHash = newHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays),
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.RefreshTokens.Add(newRefreshToken);

        var accessToken = _tokenService.GenerateAccessToken(existing.User);

        await _db.SaveChangesAsync();

        return (true, new RefreshResponse { AccessToken = accessToken, RefreshToken = newPlainText });
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var hash = _tokenService.HashToken(refreshToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash);
        if (existing != null && existing.RevokedAt == null)
        {
            existing.RevokedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<UserDto?> GetUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return null;
        return MapUser(user);
    }

    private async Task<AuthResponse> IssueTokensAsync(AppUser user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshPlainText = _tokenService.GenerateRefreshTokenPlainText();
        var refreshHash = _tokenService.HashToken(refreshPlainText);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtOptions.RefreshTokenDays),
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshPlainText,
            User = MapUser(user)
        };
    }

    private static UserDto MapUser(AppUser user) => new()
    {
        Id = user.Id,
        Email = user.Email ?? string.Empty,
        DisplayName = user.DisplayName,
        CreatedAt = user.CreatedAt
    };
}
