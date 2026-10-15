namespace CodeAtlas.Domain.Entities;

public class CodeExample
{
    public int Id { get; set; }
    public int? LessonId { get; set; }
    public Lesson? Lesson { get; set; }
    public string LanguageCode { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? ExpectedOutput { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
}
