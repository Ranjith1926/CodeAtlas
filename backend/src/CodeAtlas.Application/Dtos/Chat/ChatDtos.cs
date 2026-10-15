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
}
