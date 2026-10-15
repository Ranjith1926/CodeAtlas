using System.Text.Json;
using CodeAtlas.Domain.Entities;
using CodeAtlas.Domain.Enums;
using CodeAtlas.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CodeAtlas.Infrastructure.Seeding;

public static class DbSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static async Task SeedAsync(CodeAtlasDbContext db, ILogger logger)
    {
        if (!await db.Languages.AnyAsync())
        {
            await SeedLanguagesAndContentAsync(db, logger);
        }
    }

    private static async Task SeedLanguagesAndContentAsync(CodeAtlasDbContext db, ILogger logger)
    {
        var languages = new List<Language>
        {
            new() { Code = "fundamentals", Name = "Programming Fundamentals", Description = "Core concepts every developer needs: variables, control flow, data structures, and algorithmic thinking.", IconName = "school-outline", SortOrder = 0 },
            new() { Code = "javascript", Name = "JavaScript", Description = "The dynamic language of the web — closures, async/await, the event loop, and modern ES features.", IconName = "logo-javascript", SortOrder = 1 },
            new() { Code = "typescript", Name = "TypeScript", Description = "JavaScript with static types — interfaces, generics, and safer large-scale application development.", IconName = "code-slash-outline", SortOrder = 2 },
            new() { Code = "csharp", Name = "C#", Description = "A strongly-typed, object-oriented language for building apps on .NET — from console tools to ASP.NET services.", IconName = "logo-microsoft", SortOrder = 3 },
            new() { Code = "dotnet", Name = ".NET", Description = "The runtime and framework ecosystem powering C#, F#, and VB applications across platforms.", IconName = "layers-outline", SortOrder = 4 },
            new() { Code = "aspnet-web-api", Name = "ASP.NET Web API", Description = "Build production-ready REST APIs on .NET — routing, middleware, authentication, and EF Core.", IconName = "server-outline", SortOrder = 5 },
            new() { Code = "html", Name = "HTML", Description = "The markup language that structures every web page — semantic elements, forms, and accessibility.", IconName = "logo-html5", SortOrder = 6 },
            new() { Code = "css", Name = "CSS", Description = "Style and layout for the web — flexbox, grid, responsive design, and modern styling techniques.", IconName = "logo-css3", SortOrder = 7 },
            new() { Code = "react", Name = "React", Description = "A component-based UI library — hooks, state management, and building interactive interfaces.", IconName = "logo-react", SortOrder = 8 },
            new() { Code = "nextjs", Name = "Next.js", Description = "The React framework for production — routing, server rendering, and full-stack React apps.", IconName = "layers-outline", SortOrder = 9 },
            new() { Code = "python", Name = "Python", Description = "A readable, versatile language used for scripting, data science, automation, and web backends.", IconName = "logo-python", SortOrder = 10 },
            new() { Code = "sql", Name = "SQL", Description = "The language of relational databases — queries, joins, indexing, and schema design.", IconName = "server-outline", SortOrder = 11 },
        };

        db.Languages.AddRange(languages);
        await db.SaveChangesAsync();

        var contentDir = Path.Combine(AppContext.BaseDirectory, "Seeding", "Content");

        foreach (var language in languages)
        {
            if (language.Code is "javascript" or "csharp")
            {
                var jsonPath = Path.Combine(contentDir, $"{language.Code}.json");
                if (File.Exists(jsonPath))
                {
                    await SeedFromJsonAsync(db, language, jsonPath, logger);
                    continue;
                }

                logger.LogWarning(
                    "Seed content file not found at {Path} for language '{Code}'. Falling back to a stub topic.",
                    jsonPath, language.Code);
            }

            await SeedStubAsync(db, language);
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedFromJsonAsync(CodeAtlasDbContext db, Language language, string jsonPath, ILogger logger)
    {
        SeedContentFile? content;
        try
        {
            var json = await File.ReadAllTextAsync(jsonPath);
            content = JsonSerializer.Deserialize<SeedContentFile>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to parse seed content JSON at {Path}. Falling back to a stub topic.", jsonPath);
            await SeedStubAsync(db, language);
            return;
        }

        if (content == null || content.Categories.Count == 0)
        {
            logger.LogWarning("Seed content JSON at {Path} was empty. Falling back to a stub topic.", jsonPath);
            await SeedStubAsync(db, language);
            return;
        }

        var categorySort = 0;
        foreach (var seedCategory in content.Categories)
        {
            var category = new Category
            {
                LanguageId = language.Id,
                Name = seedCategory.Name,
                Slug = seedCategory.Slug,
                SortOrder = categorySort++
            };
            db.Categories.Add(category);
            await db.SaveChangesAsync();

            var topicSort = 0;
            foreach (var seedTopic in seedCategory.Topics)
            {
                var topic = new Topic
                {
                    CategoryId = category.Id,
                    Title = seedTopic.Title,
                    Slug = seedTopic.Slug,
                    Summary = seedTopic.Summary,
                    Difficulty = ParseDifficulty(seedTopic.Difficulty),
                    SortOrder = topicSort++
                };
                db.Topics.Add(topic);
                await db.SaveChangesAsync();

                var lessonSort = 0;
                foreach (var seedLesson in seedTopic.Lessons)
                {
                    var lesson = new Lesson
                    {
                        TopicId = topic.Id,
                        Title = seedLesson.Title,
                        Slug = seedLesson.Slug,
                        ContentMarkdown = seedLesson.ContentMarkdown,
                        SortOrder = lessonSort++
                    };
                    db.Lessons.Add(lesson);
                    await db.SaveChangesAsync();

                    var exampleSort = 0;
                    foreach (var seedExample in seedLesson.CodeExamples)
                    {
                        db.CodeExamples.Add(new CodeExample
                        {
                            LessonId = lesson.Id,
                            LanguageCode = language.Code,
                            Code = seedExample.Code,
                            ExpectedOutput = seedExample.ExpectedOutput,
                            Description = seedExample.Description,
                            SortOrder = exampleSort++
                        });
                    }
                }

                var questionSort = 0;
                foreach (var seedQuestion in seedTopic.InterviewQuestions)
                {
                    db.InterviewQuestions.Add(new InterviewQuestion
                    {
                        TopicId = topic.Id,
                        Difficulty = ParseDifficulty(seedQuestion.Difficulty),
                        Question = seedQuestion.Question,
                        Answer = seedQuestion.Answer,
                        Scenario = seedQuestion.Scenario,
                        CommonMistakes = seedQuestion.CommonMistakes,
                        FollowUps = seedQuestion.FollowUps,
                        SortOrder = questionSort++
                    });
                }

                await db.SaveChangesAsync();
            }
        }
    }

    private static async Task SeedStubAsync(CodeAtlasDbContext db, Language language)
    {
        var category = new Category
        {
            LanguageId = language.Id,
            Name = "Getting Started",
            Slug = "getting-started",
            SortOrder = 0
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        for (var i = 0; i < 2; i++)
        {
            var topic = new Topic
            {
                CategoryId = category.Id,
                Title = i == 0 ? $"Introduction to {language.Name}" : $"{language.Name} Essentials",
                Slug = i == 0 ? "introduction" : "essentials",
                Summary = "Full content coming soon.",
                Difficulty = Difficulty.Beginner,
                SortOrder = i
            };
            db.Topics.Add(topic);
            await db.SaveChangesAsync();

            db.Lessons.Add(new Lesson
            {
                TopicId = topic.Id,
                Title = "Overview",
                Slug = "overview",
                ContentMarkdown = "Full content coming soon.",
                SortOrder = 0
            });
        }

        await db.SaveChangesAsync();
    }

    private static Difficulty ParseDifficulty(string value) =>
        Enum.TryParse<Difficulty>(value, true, out var result) ? result : Difficulty.Beginner;
}
