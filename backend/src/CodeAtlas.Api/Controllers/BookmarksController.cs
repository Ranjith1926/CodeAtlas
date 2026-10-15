using CodeAtlas.Api.Common;
using CodeAtlas.Application.Dtos.UserData;
using CodeAtlas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookmarks")]
public class BookmarksController : ControllerBase
{
    private readonly IUserDataService _userDataService;

    public BookmarksController(IUserDataService userDataService)
    {
        _userDataService = userDataService;
    }

    [HttpGet]
    public async Task<IActionResult> GetBookmarks()
    {
        var bookmarks = await _userDataService.GetBookmarksAsync(User.GetUserId());
        return Ok(bookmarks);
    }

    [HttpPost]
    public async Task<IActionResult> AddBookmark([FromBody] CreateBookmarkRequest request)
    {
        var bookmark = await _userDataService.AddBookmarkAsync(User.GetUserId(), request);
        return Ok(bookmark);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBookmark(int id)
    {
        var deleted = await _userDataService.DeleteBookmarkAsync(User.GetUserId(), id);
        if (!deleted)
        {
            return NotFound(new { error = new { message = $"Bookmark {id} was not found.", statusCode = 404 } });
        }

        return NoContent();
    }
}
