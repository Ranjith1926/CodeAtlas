using CodeAtlas.Application.Dtos.Chat;
using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Application.Interfaces;

public interface IChatService
{
    Task<List<ChatSessionDto>> GetSessionsAsync(Guid userId);
    Task<ChatSessionDto> CreateSessionAsync(Guid userId, CreateChatSessionRequest request);
    Task<(bool Found, bool Owned, List<ChatMessageDto> Messages)> GetMessagesAsync(Guid userId, int sessionId);
    Task<(bool Found, bool Owned, int? ContextTopicId)> GetSessionOwnershipAsync(Guid userId, int sessionId);
    Task<(bool Found, bool Owned)> DeleteSessionAsync(Guid userId, int sessionId);
    Task<ChatMessageDto> AddUserMessageAsync(int sessionId, string content);
    Task<ChatMessageDto> AddAssistantMessageAsync(int sessionId, string content);
    Task<string?> GetTopicContextAsync(int topicId);
}
