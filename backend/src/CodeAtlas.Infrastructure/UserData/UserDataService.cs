using CodeAtlas.Application.Dtos.UserData;
using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Entities;
using CodeAtlas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodeAtlas.Infrastructure.UserData;

public class UserDataService : IUserDataService
{
    private readonly CodeAtlasDbContext _db;

    public UserDataService(CodeAtlasDbContext db)
    {
        _db = db;
    }

    public async Task<List<BookmarkDto>> GetBookmarksAsync(Guid userId)
    {
        return await _db.Bookmarks
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new BookmarkDto { Id = b.Id, ContentType = b.ContentType, ContentId = b.ContentId, CreatedAt = b.CreatedAt })
            .ToListAsync();
    }

    public async Task<BookmarkDto> AddBookmarkAsync(Guid userId, CreateBookmarkRequest request)
    {
        var existing = await _db.Bookmarks.FirstOrDefaultAsync(b =>
            b.UserId == userId && b.ContentType == request.ContentType && b.ContentId == request.ContentId);

        if (existing != null)
        {
            return new BookmarkDto { Id = existing.Id, ContentType = existing.ContentType, ContentId = existing.ContentId, CreatedAt = existing.CreatedAt };
        }

        var bookmark = new Bookmark
        {
            UserId = userId,
            ContentType = request.ContentType,
            ContentId = request.ContentId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.Bookmarks.Add(bookmark);
        await _db.SaveChangesAsync();

        return new BookmarkDto { Id = bookmark.Id, ContentType = bookmark.ContentType, ContentId = bookmark.ContentId, CreatedAt = bookmark.CreatedAt };
    }

    public async Task<bool> DeleteBookmarkAsync(Guid userId, int bookmarkId)
    {
        var bookmark = await _db.Bookmarks.FirstOrDefaultAsync(b => b.Id == bookmarkId && b.UserId == userId);
        if (bookmark == null) return false;

        _db.Bookmarks.Remove(bookmark);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ProgressDto>> GetProgressAsync(Guid userId)
    {
        return await _db.ProgressEntries
            .Where(p => p.UserId == userId)
            .Select(p => new ProgressDto { ContentType = p.ContentType, ContentId = p.ContentId, Status = p.Status, LastViewedAt = p.LastViewedAt })
            .ToListAsync();
    }

    public async Task<ProgressDto> UpsertProgressAsync(Guid userId, UpsertProgressRequest request)
    {
        var existing = await _db.ProgressEntries.FirstOrDefaultAsync(p =>
            p.UserId == userId && p.ContentType == request.ContentType && p.ContentId == request.ContentId);

        if (existing != null)
        {
            existing.Status = request.Status;
            existing.LastViewedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            existing = new ProgressEntry
            {
                UserId = userId,
                ContentType = request.ContentType,
                ContentId = request.ContentId,
                Status = request.Status,
                LastViewedAt = DateTimeOffset.UtcNow
            };
            _db.ProgressEntries.Add(existing);
        }

        await _db.SaveChangesAsync();

        return new ProgressDto { ContentType = existing.ContentType, ContentId = existing.ContentId, Status = existing.Status, LastViewedAt = existing.LastViewedAt };
    }

    public async Task<SyncResponse> SyncAsync(Guid userId, SyncRequest request)
    {
        foreach (var item in request.Bookmarks)
        {
            var existing = await _db.Bookmarks.FirstOrDefaultAsync(b =>
                b.UserId == userId && b.ContentType == item.ContentType && b.ContentId == item.ContentId);

            if (existing == null)
            {
                _db.Bookmarks.Add(new Bookmark
                {
                    UserId = userId,
                    ContentType = item.ContentType,
                    ContentId = item.ContentId,
                    CreatedAt = item.CreatedAt
                });
            }
        }

        foreach (var item in request.Progress)
        {
            var existing = await _db.ProgressEntries.FirstOrDefaultAsync(p =>
                p.UserId == userId && p.ContentType == item.ContentType && p.ContentId == item.ContentId);

            if (existing == null)
            {
                _db.ProgressEntries.Add(new ProgressEntry
                {
                    UserId = userId,
                    ContentType = item.ContentType,
                    ContentId = item.ContentId,
                    Status = item.Status,
                    LastViewedAt = item.LastViewedAt
                });
            }
            else if (item.LastViewedAt >= existing.LastViewedAt)
            {
                // Last-write-wins merge, keyed by client-reported timestamp.
                existing.Status = item.Status;
                existing.LastViewedAt = item.LastViewedAt;
            }
        }

        await _db.SaveChangesAsync();

        var bookmarks = await GetBookmarksAsync(userId);
        var progress = await GetProgressAsync(userId);
        return new SyncResponse { Bookmarks = bookmarks, Progress = progress };
    }
}
