using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public int ChatSessionId { get; set; }
    public ChatSession? ChatSession { get; set; }
    public ChatRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
