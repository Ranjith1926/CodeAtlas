using CodeAtlas.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CodeAtlas.Infrastructure.Persistence;

public class CodeAtlasDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public CodeAtlasDbContext(DbContextOptions<CodeAtlasDbContext> options) : base(options)
    {
    }

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<CodeExample> CodeExamples => Set<CodeExample>();
    public DbSet<InterviewQuestion> InterviewQuestions => Set<InterviewQuestion>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<ProgressEntry> ProgressEntries => Set<ProgressEntry>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Language>(e =>
        {
            e.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<Category>(e =>
        {
            e.HasIndex(x => x.LanguageId);
            e.HasOne(x => x.Language).WithMany(x => x.Categories).HasForeignKey(x => x.LanguageId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Topic>(e =>
        {
            e.HasIndex(x => x.CategoryId);
            e.HasIndex(x => x.Slug);
            e.HasOne(x => x.Category).WithMany(x => x.Topics).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Lesson>(e =>
        {
            e.HasIndex(x => x.TopicId);
            e.HasIndex(x => x.Slug);
            e.HasOne(x => x.Topic).WithMany(x => x.Lessons).HasForeignKey(x => x.TopicId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CodeExample>(e =>
        {
            e.HasIndex(x => x.LessonId);
            e.HasOne(x => x.Lesson).WithMany(x => x.CodeExamples).HasForeignKey(x => x.LessonId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<InterviewQuestion>(e =>
        {
            e.HasIndex(x => x.TopicId);
            e.HasOne(x => x.Topic).WithMany(x => x.InterviewQuestions).HasForeignKey(x => x.TopicId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Bookmark>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProgressEntry>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.ContentType, x.ContentId }).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ChatSession>(e =>
        {
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ContextTopicId);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ContextTopic).WithMany().HasForeignKey(x => x.ContextTopicId).OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<ChatMessage>(e =>
        {
            e.HasIndex(x => x.ChatSessionId);
            e.HasOne(x => x.ChatSession).WithMany(x => x.Messages).HasForeignKey(x => x.ChatSessionId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
