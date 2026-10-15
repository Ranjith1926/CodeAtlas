using System.ComponentModel.DataAnnotations;
using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Application.Dtos.UserData;

public class BookmarkDto
{
    public int Id { get; set; }
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class CreateBookmarkRequest
{
    [Required]
    public ContentType ContentType { get; set; }

    [Required]
    public int ContentId { get; set; }
}

public class ProgressDto
{
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTimeOffset LastViewedAt { get; set; }
}

public class UpsertProgressRequest
{
    [Required]
    public ContentType ContentType { get; set; }

    [Required]
    public int ContentId { get; set; }

    [Required]
    public ProgressStatus Status { get; set; }
}

public class SyncBookmarkItem
{
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class SyncProgressItem
{
    public ContentType ContentType { get; set; }
    public int ContentId { get; set; }
    public ProgressStatus Status { get; set; }
    public DateTimeOffset LastViewedAt { get; set; }
}

public class SyncRequest
{
    public List<SyncBookmarkItem> Bookmarks { get; set; } = new();
    public List<SyncProgressItem> Progress { get; set; } = new();
}

public class SyncResponse
{
    public List<BookmarkDto> Bookmarks { get; set; } = new();
    public List<ProgressDto> Progress { get; set; } = new();
}
