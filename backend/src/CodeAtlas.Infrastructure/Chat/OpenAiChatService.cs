using CodeAtlas.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace CodeAtlas.Infrastructure.Chat;

/// <summary>
/// Skeleton for a real OpenAI-backed implementation. Not wired up yet — selected only when
/// configuration sets "AiProvider": "OpenAI". Implement the actual HTTP/streaming call to the
/// OpenAI Chat Completions (or Responses) API here when ready to go live.
/// </summary>
public class OpenAiChatService : IAiChatService
{
    private readonly OpenAiOptions _options;

    public OpenAiChatService(IOptions<OpenAiOptions> options)
    {
        _options = options.Value;
    }

    public IAsyncEnumerable<string> StreamReplyAsync(string userMessage, string? topicContext, ChatImageAttachment? image, CancellationToken ct)
    {
        throw new NotSupportedException(
            "OpenAiChatService is not implemented yet. Set AiProvider=OpenAI only after wiring up the " +
            $"OpenAI API key and model ('{_options.Model}') and implementing the streaming call.");
    }
}
