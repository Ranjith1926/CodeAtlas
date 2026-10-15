using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Domain.Entities;

public class ProgressEntry
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public AppUser? User { get; set; }
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTimeOffset LastViewedAt { get; set; } = DateTimeOffset.UtcNow;
}
