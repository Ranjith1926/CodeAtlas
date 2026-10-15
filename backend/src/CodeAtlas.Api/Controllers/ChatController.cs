using System.Text;
using System.Text.Json;
using CodeAtlas.Api.Common;
using CodeAtlas.Application.Dtos.Chat;
using CodeAtlas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IAiChatService _aiChatService;

    public ChatController(IChatService chatService, IAiChatService aiChatService)
    {
        _chatService = chatService;
        _aiChatService = aiChatService;
    }

    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions()
    {
        var sessions = await _chatService.GetSessionsAsync(User.GetUserId());
        return Ok(sessions);
    }

    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateChatSessionRequest request)
    {
        var session = await _chatService.CreateSessionAsync(User.GetUserId(), request);
        return Ok(session);
    }

    [HttpGet("sessions/{id:int}/messages")]
    public async Task<IActionResult> GetMessages(int id)
    {
        var userId = User.GetUserId();
        var (found, owned, messages) = await _chatService.GetMessagesAsync(userId, id);
        if (!found)
        {
            return NotFound(new { error = new { message = $"Chat session {id} was not found.", statusCode = 404 } });
        }

        if (!owned)
        {
            return Forbid();
        }

        return Ok(messages);
    }

    [HttpPost("sessions/{id:int}/messages")]
    public async Task PostMessage(int id, [FromBody] PostChatMessageRequest request, CancellationToken ct)
    {
        var userId = User.GetUserId();
        var (found, owned, contextTopicId) = await _chatService.GetSessionOwnershipAsync(userId, id);

        if (!found)
        {
            Response.StatusCode = StatusCodes.Status404NotFound;
            await Response.WriteAsJsonAsync(new { error = new { message = $"Chat session {id} was not found.", statusCode = 404 } }, ct);
            return;
        }

        if (!owned)
        {
            Response.StatusCode = StatusCodes.Status403Forbidden;
            await Response.WriteAsJsonAsync(new { error = new { message = "You do not own this chat session.", statusCode = 403 } }, ct);
            return;
        }

        // Persist the user's message before streaming the reply.
        await _chatService.AddUserMessageAsync(id, request.Content);

        string? topicContext = contextTopicId.HasValue
            ? await _chatService.GetTopicContextAsync(contextTopicId.Value)
            : null;

        Response.ContentType = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["X-Accel-Buffering"] = "no"; // disable proxy buffering for SSE
        var bufferingFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
        bufferingFeature?.DisableBuffering();

        var fullReply = new StringBuilder();

        await foreach (var chunk in _aiChatService.StreamReplyAsync(request.Content, topicContext, ct))
        {
            fullReply.Append(chunk);

            var payload = JsonSerializer.Serialize(new { delta = chunk });
            await Response.WriteAsync($"data: {payload}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        await Response.WriteAsync("data: [DONE]\n\n", ct);
        await Response.Body.FlushAsync(ct);

        // Persist the full assistant reply once streaming completes.
        await _chatService.AddAssistantMessageAsync(id, fullReply.ToString());
    }
}
