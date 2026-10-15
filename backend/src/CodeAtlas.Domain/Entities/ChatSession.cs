namespace CodeAtlas.Domain.Entities;

public class ChatSession
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser? User { get; set; }
    public string? Title { get; set; }
    public int? ContextTopicId { get; set; }
    public Topic? ContextTopic { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
