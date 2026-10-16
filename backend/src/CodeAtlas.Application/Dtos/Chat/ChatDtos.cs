using System.ComponentModel.DataAnnotations;
using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Application.Dtos.Chat;

public class ChatSessionDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public int? ContextTopicId { get; set; }
}

public class CreateChatSessionRequest
{
    public string? Title { get; set; }
    public int? ContextTopicId { get; set; }
}

public class ChatMessageDto
{
    public int Id { get; set; }
    public ChatRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}

public class PostChatMessageRequest
{
    [Required]
    public string Content { get; set; } = string.Empty;

    /// <summary>Base64-encoded photo captured from the mobile client's camera, if any. Never persisted — used only for this one turn's prompt to the AI.</summary>
    public string? ImageBase64 { get; set; }

    /// <summary>MIME type of <see cref="ImageBase64"/>, e.g. "image/jpeg". Required when ImageBase64 is set.</summary>
    public string? ImageMimeType { get; set; }
}
