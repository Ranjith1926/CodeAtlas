using CodeAtlas.Application.Dtos.UserData;

namespace CodeAtlas.Application.Interfaces;

public interface IUserDataService
{
    Task<List<BookmarkDto>> GetBookmarksAsync(Guid userId);
    Task<BookmarkDto> AddBookmarkAsync(Guid userId, CreateBookmarkRequest request);
    Task<bool> DeleteBookmarkAsync(Guid userId, int bookmarkId);

    Task<List<ProgressDto>> GetProgressAsync(Guid userId);
    Task<ProgressDto> UpsertProgressAsync(Guid userId, UpsertProgressRequest request);

    Task<SyncResponse> SyncAsync(Guid userId, SyncRequest request);
}
