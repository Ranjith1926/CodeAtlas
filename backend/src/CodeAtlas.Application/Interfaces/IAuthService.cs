using CodeAtlas.Application.Dtos.Auth;

namespace CodeAtlas.Application.Interfaces;

public interface IAuthService
{
    Task<(bool Success, string? Error, AuthResponse? Result)> RegisterAsync(RegisterRequest request);
    Task<(bool Success, AuthResponse? Result)> LoginAsync(LoginRequest request);
    Task<(bool Success, RefreshResponse? Result)> RefreshAsync(string refreshToken);
    Task LogoutAsync(string refreshToken);
    Task<UserDto?> GetUserAsync(Guid userId);
}
