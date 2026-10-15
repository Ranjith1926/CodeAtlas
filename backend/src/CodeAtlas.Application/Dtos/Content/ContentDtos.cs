using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Application.Dtos.Content;

public class LanguageDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class CategoryDto
{
    public int Id { get; set; }
    public int LanguageId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class TopicSummaryDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public Difficulty Difficulty { get; set; }
    public int SortOrder { get; set; }
}

public class LessonSummaryDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class TopicDetailDto : TopicSummaryDto
{
    public List<LessonSummaryDto> Lessons { get; set; } = new();
    public List<TopicSummaryDto> RelatedTopics { get; set; } = new();
}

public class CodeExampleDto
{
    public int Id { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? ExpectedOutput { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}

public class LessonDetailDto
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public List<CodeExampleDto> CodeExamples { get; set; } = new();
    public int? PrevLessonId { get; set; }
    public int? NextLessonId { get; set; }
}

public class InterviewQuestionSummaryDto
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public Difficulty Difficulty { get; set; }
    public string Question { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class InterviewQuestionDetailDto : InterviewQuestionSummaryDto
{
    public string Answer { get; set; } = string.Empty;
    public string? Scenario { get; set; }
    public string? CommonMistakes { get; set; }
    public string? FollowUps { get; set; }
}
