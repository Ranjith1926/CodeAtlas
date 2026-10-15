using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Domain.Entities;

public class Bookmark
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser? User { get; set; }
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
