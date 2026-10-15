namespace CodeAtlas.Infrastructure.Seeding;

// DTOs matching the exact JSON schema used by Seeding/Content/{languageCode}.json files.
// Deserialized case-insensitively via System.Text.Json.

public class SeedContentFile
{
    public string LanguageCode { get; set; } = string.Empty;
    public List<SeedCategory> Categories { get; set; } = new();
}

public class SeedCategory
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public List<SeedTopic> Topics { get; set; } = new();
}

public class SeedTopic
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Difficulty { get; set; } = "Beginner";
    public List<SeedLesson> Lessons { get; set; } = new();
    public List<SeedInterviewQuestion> InterviewQuestions { get; set; } = new();
}

public class SeedLesson
{
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentMarkdown { get; set; } = string.Empty;
    public List<SeedCodeExample> CodeExamples { get; set; } = new();
}

public class SeedCodeExample
{
    public string? Description { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? ExpectedOutput { get; set; }
}

public class SeedInterviewQuestion
{
    public string Difficulty { get; set; } = "Beginner";
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string? Scenario { get; set; }
    public string? CommonMistakes { get; set; }
    public string? FollowUps { get; set; }
}
