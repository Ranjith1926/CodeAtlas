namespace CodeAtlas.Application.Interfaces;

/// <summary>
/// Abstraction over the AI tutor chat backend. The Mock implementation (used by default)
/// produces canned, context-aware replies; a real OpenAI-backed implementation can be
/// swapped in later via the "AiProvider" configuration switch without touching callers.
/// </summary>
public interface IAiChatService
{
    IAsyncEnumerable<string> StreamReplyAsync(string userMessage, string? topicContext, CancellationToken ct);
}
