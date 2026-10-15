using CodeAtlas.Api.Common;
using CodeAtlas.Application.Dtos.UserData;
using CodeAtlas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/progress")]
public class ProgressController : ControllerBase
{
    private readonly IUserDataService _userDataService;

    public ProgressController(IUserDataService userDataService)
    {
        _userDataService = userDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProgress()
    {
        var progress = await _userDataService.GetProgressAsync(User.GetUserId());
        return Ok(progress);
    }

    [HttpPut]
    public async Task<IActionResult> UpsertProgress([FromBody] UpsertProgressRequest request)
    {
        var progress = await _userDataService.UpsertProgressAsync(User.GetUserId(), request);
        return Ok(progress);
    }
}
