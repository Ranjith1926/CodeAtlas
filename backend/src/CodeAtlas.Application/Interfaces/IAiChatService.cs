namespace CodeAtlas.Application.Interfaces;

/// <summary>
/// Abstraction over the AI tutor chat backend. The Mock implementation (used by default)
/// produces canned, context-aware replies; a real OpenAI-backed implementation can be
/// swapped in later via the "AiProvider" configuration switch without touching callers.
/// </summary>
public interface IAiChatService
{
    IAsyncEnumerable<string> StreamReplyAsync(string userMessage, string? topicContext, ChatImageAttachment? image, CancellationToken ct);
}

/// <summary>A photo captured by the mobile client, sent along with the turn it was attached to (never persisted).</summary>
public record ChatImageAttachment(string Base64Data, string MimeType);
