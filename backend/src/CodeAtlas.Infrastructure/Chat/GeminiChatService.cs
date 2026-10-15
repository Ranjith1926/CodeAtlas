using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using CodeAtlas.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace CodeAtlas.Infrastructure.Chat;

/// <summary>
/// Real AI tutor backed by Google's Gemini API. Selected when configuration sets
/// "AiProvider": "Gemini". Streams the model's reply via Gemini's SSE
/// (streamGenerateContent?alt=sse) endpoint so the chat UI's typing effect is driven by
/// genuine token-by-token output rather than a simulated delay.
/// </summary>
public class GeminiChatService : IAiChatService
{
    private const string SystemInstruction =
        "You are CodeAtlas's AI programming tutor. Explain concepts clearly and concisely for " +
        "learners preparing for technical interviews. Use fenced code blocks (```language) for " +
        "any code you include, and keep answers focused on what was asked.";

    private readonly HttpClient _httpClient;
    private readonly IOptionsMonitor<GeminiOptions> _optionsMonitor;

    public GeminiChatService(HttpClient httpClient, IOptionsMonitor<GeminiOptions> optionsMonitor)
    {
        _httpClient = httpClient;
        _optionsMonitor = optionsMonitor;
    }

    private GeminiOptions Options => _optionsMonitor.CurrentValue;

    public async IAsyncEnumerable<string> StreamReplyAsync(
        string userMessage,
        string? topicContext,
        [EnumeratorCancellation] CancellationToken ct)
    {
        var options = Options;

        if (string.IsNullOrWhiteSpace(options.ApiKey))
        {
            throw new InvalidOperationException(
                "Gemini:ApiKey is not configured. Set it in appsettings.json or switch AiProvider back to \"Mock\".");
        }

        var promptText = topicContext is null
            ? userMessage
            : $"(The learner is currently viewing the topic \"{topicContext}\".)\n\n{userMessage}";

        var requestBody = new
        {
            systemInstruction = new { parts = new[] { new { text = SystemInstruction } } },
            contents = new[]
            {
                new { role = "user", parts = new[] { new { text = promptText } } }
            }
        };

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{options.Model}:streamGenerateContent?alt=sse";

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-goog-api-key", options.ApiKey);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            // The client's own timeout (not the caller's cancellation) tripped — likely a transient
            // network issue reaching Gemini rather than a slow model response.
            throw new InvalidOperationException(
                "Gemini API request timed out before a response was received. This is usually a transient " +
                "network issue — please try again.");
        }
        using var _ = response;

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Gemini API request failed ({(int)response.StatusCode}): {errorBody}");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);

        while (await reader.ReadLineAsync(ct) is { } line)
        {
            ct.ThrowIfCancellationRequested();

            if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data: ", StringComparison.Ordinal))
            {
                continue;
            }

            var json = line["data: ".Length..];
            string? chunk;
            try
            {
                using var doc = JsonDocument.Parse(json);
                chunk = ExtractText(doc.RootElement);
            }
            catch (JsonException)
            {
                continue;
            }

            if (!string.IsNullOrEmpty(chunk))
            {
                yield return chunk;
            }
        }
    }

    private static string? ExtractText(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            return null;
        }

        var firstCandidate = candidates[0];
        if (!firstCandidate.TryGetProperty("content", out var content) ||
            !content.TryGetProperty("parts", out var parts))
        {
            return null;
        }

        var builder = new StringBuilder();
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textEl))
            {
                builder.Append(textEl.GetString());
            }
        }

        return builder.Length > 0 ? builder.ToString() : null;
    }
}
