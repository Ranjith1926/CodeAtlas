using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace CodeAtlas.Api.Common;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(value) || !Guid.TryParse(value, out var userId))
        {
            throw new UnauthorizedAccessException("Could not resolve the current user's id from the access token.");
        }

        return userId;
    }
}
