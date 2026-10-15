namespace CodeAtlas.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public Topic? Topic { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<CodeExample> CodeExamples { get; set; } = new List<CodeExample>();
}
