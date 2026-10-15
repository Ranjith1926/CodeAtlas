using CodeAtlas.Domain.Enums;

namespace CodeAtlas.Domain.Entities;

public class Topic
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public Difficulty Difficulty { get; set; }
    public int SortOrder { get; set; }

    public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    public ICollection<InterviewQuestion> InterviewQuestions { get; set; } = new List<InterviewQuestion>();
}
