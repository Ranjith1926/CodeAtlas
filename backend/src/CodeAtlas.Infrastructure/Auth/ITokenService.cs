using CodeAtlas.Domain.Entities;

namespace CodeAtlas.Infrastructure.Auth;

public interface ITokenService
{
    string GenerateAccessToken(AppUser user);
    string GenerateRefreshTokenPlainText();
    string HashToken(string plainText);
}
