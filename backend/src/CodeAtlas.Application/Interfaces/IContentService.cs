using CodeAtlas.Application.Dtos.Content;
using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Application.Interfaces;

public interface IContentService
{
    Task<List<LanguageDto>> GetLanguagesAsync();
    Task<List<CategoryDto>?> GetCategoriesForLanguageAsync(string languageCode);
    Task<List<TopicSummaryDto>?> GetTopicsForCategoryAsync(int categoryId);
    Task<TopicDetailDto?> GetTopicDetailAsync(int topicId);
    Task<LessonDetailDto?> GetLessonDetailAsync(int lessonId);
    Task<List<InterviewQuestionSummaryDto>?> GetInterviewQuestionsAsync(int topicId, Difficulty? difficulty);
    Task<InterviewQuestionDetailDto?> GetInterviewQuestionAsync(int id);
}
