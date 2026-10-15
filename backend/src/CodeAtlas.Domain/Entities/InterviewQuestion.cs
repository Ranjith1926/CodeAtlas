using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Domain.Entities;

public class InterviewQuestion
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public Topic? Topic { get; set; }
    public Difficulty Difficulty { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Scenario { get; set; }
    public string? CommonMistakes { get; set; }
    public string? FollowUps { get; set; }
    public int SortOrder { get; set; }
}
