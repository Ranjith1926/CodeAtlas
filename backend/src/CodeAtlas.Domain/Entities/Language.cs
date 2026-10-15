namespace CodeAtlas.Domain.Entities;

public class Language
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string IconName { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<Category> Categories { get; set; } = new List<Category>();
}
