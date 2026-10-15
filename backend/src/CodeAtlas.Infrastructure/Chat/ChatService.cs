using CodeAtlas.Application.Dtos.Chat;
using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Entities;
using CodeAtlas.Domain.Enums;
using CodeAtlas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodeAtlas.Infrastructure.Chat;

public class ChatService : IChatService
{
    private readonly CodeAtlasDbContext _db;

    public ChatService(CodeAtlasDbContext db)
    {
        _db = db;
    }

    public async Task<List<ChatSessionDto>> GetSessionsAsync(Guid userId)
    {
        return await _db.ChatSessions
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ChatSessionDto
            {
                Id = s.Id,
                Title = s.Title,
                CreatedAt = s.CreatedAt,
                ContextTopicId = s.ContextTopicId
            })
            .ToListAsync();
    }

    public async Task<ChatSessionDto> CreateSessionAsync(Guid userId, CreateChatSessionRequest request)
    {
        var session = new ChatSession
        {
            UserId = userId,
            Title = request.Title,
            ContextTopicId = request.ContextTopicId,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ChatSessions.Add(session);
        await _db.SaveChangesAsync();

        return new ChatSessionDto
        {
            Id = session.Id,
            Title = session.Title,
            CreatedAt = session.CreatedAt,
            ContextTopicId = session.ContextTopicId
        };
    }

    public async Task<(bool Found, bool Owned, List<ChatMessageDto> Messages)> GetMessagesAsync(Guid userId, int sessionId)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null) return (false, false, new List<ChatMessageDto>());
        if (session.UserId != userId) return (true, false, new List<ChatMessageDto>());

        var messages = await _db.ChatMessages
            .Where(m => m.ChatSessionId == sessionId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                Role = m.Role,
                Content = m.Content,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        return (true, true, messages);
    }

    public async Task<(bool Found, bool Owned, int? ContextTopicId)> GetSessionOwnershipAsync(Guid userId, int sessionId)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(s => s.Id == sessionId);
        if (session == null) return (false, false, null);
        if (session.UserId != userId) return (true, false, null);
        return (true, true, session.ContextTopicId);
    }

    public async Task<ChatMessageDto> AddUserMessageAsync(int sessionId, string content)
    {
        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            Role = ChatRole.User,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return new ChatMessageDto { Id = message.Id, Role = message.Role, Content = message.Content, CreatedAt = message.CreatedAt };
    }

    public async Task<ChatMessageDto> AddAssistantMessageAsync(int sessionId, string content)
    {
        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            Role = ChatRole.Assistant,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow
        };
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();

        return new ChatMessageDto { Id = message.Id, Role = message.Role, Content = message.Content, CreatedAt = message.CreatedAt };
    }

    public async Task<string?> GetTopicContextAsync(int topicId)
    {
        var topic = await _db.Topics.FirstOrDefaultAsync(t => t.Id == topicId);
        return topic?.Title;
    }
}
