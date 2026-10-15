using CodeAtlas.Application.Dtos.Content;
using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Enums;
using CodeAtlas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CodeAtlas.Infrastructure.Content;

public class ContentService : IContentService
{
    private readonly CodeAtlasDbContext _db;

    public ContentService(CodeAtlasDbContext db)
    {
        _db = db;
    }

    public async Task<List<LanguageDto>> GetLanguagesAsync()
    {
        return await _db.Languages
            .OrderBy(l => l.SortOrder)
            .Select(l => new LanguageDto
            {
                Id = l.Id,
                Code = l.Code,
                Name = l.Name,
                Description = l.Description,
                IconName = l.IconName,
                SortOrder = l.SortOrder
            })
            .ToListAsync();
    }

    public async Task<List<CategoryDto>?> GetCategoriesForLanguageAsync(string languageCode)
    {
        var language = await _db.Languages.FirstOrDefaultAsync(l => l.Code == languageCode);
        if (language == null) return null;

        return await _db.Categories
            .Where(c => c.LanguageId == language.Id)
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                LanguageId = c.LanguageId,
                Name = c.Name,
                Slug = c.Slug,
                SortOrder = c.SortOrder
            })
            .ToListAsync();
    }

    public async Task<List<TopicSummaryDto>?> GetTopicsForCategoryAsync(int categoryId)
    {
        var categoryExists = await _db.Categories.AnyAsync(c => c.Id == categoryId);
        if (!categoryExists) return null;

        return await _db.Topics
            .Where(t => t.CategoryId == categoryId)
            .OrderBy(t => t.SortOrder)
            .Select(t => new TopicSummaryDto
            {
                Id = t.Id,
                CategoryId = t.CategoryId,
                Title = t.Title,
                Slug = t.Slug,
                Summary = t.Summary,
                Difficulty = t.Difficulty,
                SortOrder = t.SortOrder
            })
            .ToListAsync();
    }

    public async Task<TopicDetailDto?> GetTopicDetailAsync(int topicId)
    {
        var topic = await _db.Topics.FirstOrDefaultAsync(t => t.Id == topicId);
        if (topic == null) return null;

        var lessons = await _db.Lessons
            .Where(l => l.TopicId == topicId)
            .OrderBy(l => l.SortOrder)
            .Select(l => new LessonSummaryDto { Id = l.Id, Title = l.Title, Slug = l.Slug, SortOrder = l.SortOrder })
            .ToListAsync();

        var related = await _db.Topics
            .Where(t => t.CategoryId == topic.CategoryId && t.Id != topicId)
            .OrderBy(t => t.SortOrder)
            .Take(3)
            .Select(t => new TopicSummaryDto
            {
                Id = t.Id,
                CategoryId = t.CategoryId,
                Title = t.Title,
                Slug = t.Slug,
                Summary = t.Summary,
                Difficulty = t.Difficulty,
                SortOrder = t.SortOrder
            })
            .ToListAsync();

        return new TopicDetailDto
        {
            Id = topic.Id,
            CategoryId = topic.CategoryId,
            Title = topic.Title,
            Slug = topic.Slug,
            Summary = topic.Summary,
            Difficulty = topic.Difficulty,
            SortOrder = topic.SortOrder,
            Lessons = lessons,
            RelatedTopics = related
        };
    }

    public async Task<LessonDetailDto?> GetLessonDetailAsync(int lessonId)
    {
        var lesson = await _db.Lessons.FirstOrDefaultAsync(l => l.Id == lessonId);
        if (lesson == null) return null;

        var codeExamples = await _db.CodeExamples
            .Where(c => c.LessonId == lessonId)
            .OrderBy(c => c.SortOrder)
            .Select(c => new CodeExampleDto
            {
                Id = c.Id,
                LanguageCode = c.LanguageCode,
                Code = c.Code,
                ExpectedOutput = c.ExpectedOutput,
                Description = c.Description,
                SortOrder = c.SortOrder
            })
            .ToListAsync();

        var siblings = await _db.Lessons
            .Where(l => l.TopicId == lesson.TopicId)
            .OrderBy(l => l.SortOrder)
            .Select(l => new { l.Id, l.SortOrder })
            .ToListAsync();

        var index = siblings.FindIndex(s => s.Id == lesson.Id);
        int? prevId = index > 0 ? siblings[index - 1].Id : null;
        int? nextId = index >= 0 && index < siblings.Count - 1 ? siblings[index + 1].Id : null;

        return new LessonDetailDto
        {
            Id = lesson.Id,
            TopicId = lesson.TopicId,
            Title = lesson.Title,
            Slug = lesson.Slug,
            ContentMarkdown = lesson.ContentMarkdown,
            SortOrder = lesson.SortOrder,
            CodeExamples = codeExamples,
            PrevLessonId = prevId,
            NextLessonId = nextId
        };
    }

    public async Task<List<InterviewQuestionSummaryDto>?> GetInterviewQuestionsAsync(int topicId, Difficulty? difficulty)
    {
        var topicExists = await _db.Topics.AnyAsync(t => t.Id == topicId);
        if (!topicExists) return null;

        var query = _db.InterviewQuestions.Where(q => q.TopicId == topicId);
        if (difficulty.HasValue)
        {
            query = query.Where(q => q.Difficulty == difficulty.Value);
        }

        return await query
            .OrderBy(q => q.SortOrder)
            .Select(q => new InterviewQuestionSummaryDto
            {
                Id = q.Id,
                TopicId = q.TopicId,
                Difficulty = q.Difficulty,
                Question = q.Question,
                SortOrder = q.SortOrder
            })
            .ToListAsync();
    }

    public async Task<InterviewQuestionDetailDto?> GetInterviewQuestionAsync(int id)
    {
        var q = await _db.InterviewQuestions.FirstOrDefaultAsync(x => x.Id == id);
        if (q == null) return null;

        return new InterviewQuestionDetailDto
        {
            Id = q.Id,
            TopicId = q.TopicId,
            Difficulty = q.Difficulty,
            Question = q.Question,
            Answer = q.Answer,
            Scenario = q.Scenario,
            CommonMistakes = q.CommonMistakes,
            FollowUps = q.FollowUps,
            SortOrder = q.SortOrder
        };
    }
}
