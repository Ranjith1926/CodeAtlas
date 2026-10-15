using CodeAtlas.Api.Common;
using CodeAtlas.Application.Dtos.Auth;
using CodeAtlas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (success, error, result) = await _authService.RegisterAsync(request);
        if (!success)
        {
            return BadRequest(new { error = new { message = error, statusCode = 400 } });
        }

        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, result) = await _authService.LoginAsync(request);
        if (!success)
        {
            return Unauthorized(new { error = new { message = "Invalid email or password.", statusCode = 401 } });
        }

        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
    {
        var (success, result) = await _authService.RefreshAsync(request.RefreshToken);
        if (!success)
        {
            return Unauthorized(new { error = new { message = "Invalid, expired, or revoked refresh token.", statusCode = 401 } });
        }

        return Ok(result);
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        await _authService.LogoutAsync(request.RefreshToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.GetUserId();
        var user = await _authService.GetUserAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }
}
