using CodeAtlas.Api.Common;
using CodeAtlas.Application.Dtos.UserData;
using CodeAtlas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sync")]
public class SyncController : ControllerBase
{
    private readonly IUserDataService _userDataService;

    public SyncController(IUserDataService userDataService)
    {
        _userDataService = userDataService;
    }

    [HttpPost]
    public async Task<IActionResult> Sync([FromBody] SyncRequest request)
    {
        var result = await _userDataService.SyncAsync(User.GetUserId(), request);
        return Ok(result);
    }
}
