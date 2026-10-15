namespace CodeAtlas.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public int LanguageId { get; set; }
    public Language? Language { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<Topic> Topics { get; set; } = new List<Topic>();
}
