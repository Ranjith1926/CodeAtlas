using CodeAtlas.Application.Interfaces;
using CodeAtlas.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CodeAtlas.Api.Controllers;

// Anonymous GETs for browsing content; everything else in the app requires auth.
[ApiController]
[AllowAnonymous]
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }

    [HttpGet("api/languages")]
    public async Task<IActionResult> GetLanguages()
    {
        var languages = await _contentService.GetLanguagesAsync();
        return Ok(languages);
    }

    [HttpGet("api/languages/{code}/categories")]
    public async Task<IActionResult> GetCategories(string code)
    {
        var categories = await _contentService.GetCategoriesForLanguageAsync(code);
        if (categories == null)
        {
            return NotFound(new { error = new { message = $"Language '{code}' was not found.", statusCode = 404 } });
        }

        return Ok(categories);
    }

    [HttpGet("api/categories/{id:int}/topics")]
    public async Task<IActionResult> GetTopics(int id)
    {
        var topics = await _contentService.GetTopicsForCategoryAsync(id);
        if (topics == null)
        {
            return NotFound(new { error = new { message = $"Category {id} was not found.", statusCode = 404 } });
        }

        return Ok(topics);
    }

    [HttpGet("api/topics/{id:int}")]
    public async Task<IActionResult> GetTopicDetail(int id)
    {
        var topic = await _contentService.GetTopicDetailAsync(id);
        if (topic == null)
        {
            return NotFound(new { error = new { message = $"Topic {id} was not found.", statusCode = 404 } });
        }

        return Ok(topic);
    }

    [HttpGet("api/lessons/{id:int}")]
    public async Task<IActionResult> GetLessonDetail(int id)
    {
        var lesson = await _contentService.GetLessonDetailAsync(id);
        if (lesson == null)
        {
            return NotFound(new { error = new { message = $"Lesson {id} was not found.", statusCode = 404 } });
        }

        return Ok(lesson);
    }

    [HttpGet("api/topics/{id:int}/interview-questions")]
    public async Task<IActionResult> GetInterviewQuestions(int id, [FromQuery] Difficulty? difficulty)
    {
        var questions = await _contentService.GetInterviewQuestionsAsync(id, difficulty);
        if (questions == null)
        {
            return NotFound(new { error = new { message = $"Topic {id} was not found.", statusCode = 404 } });
        }

        return Ok(questions);
    }

    [HttpGet("api/interview-questions/{id:int}")]
    public async Task<IActionResult> GetInterviewQuestion(int id)
    {
        var question = await _contentService.GetInterviewQuestionAsync(id);
        if (question == null)
        {
            return NotFound(new { error = new { message = $"Interview question {id} was not found.", statusCode = 404 } });
        }

        return Ok(question);
    }
}
