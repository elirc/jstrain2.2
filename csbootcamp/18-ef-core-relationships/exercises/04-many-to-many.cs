// ─────────────────────────────────────────────────────────────────────────
//  04 · many-to-many                                      ★★☆ core
//  concepts: skip navigations · the implicit join table · Any() filtering
//  run: dotnet run 04-many-to-many.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A post has many tags; a tag belongs to many posts. In the database that
//  needs a third table — but since EF Core 5 you do not have to model it:
//
//      class Post { public List<Tag>  Tags  { get; set; } = []; }
//      class Tag  { public List<Post> Posts { get; set; } = []; }
//
//  Two collections pointing at each other and EF infers a join table
//  (`PostTag`, columns `PostsId` + `TagsId`) that you never see in C#. Those
//  are SKIP NAVIGATIONS — they "skip" over the join entity.
//
//  You only model the join table explicitly when it carries its own data:
//  an `AddedOn` timestamp, an `AddedBy` user, a sort order. Then it becomes a
//  real entity with two one-to-many relationships.
//
//  Implement four operations.
//
//  hint: to find posts having a tag, filter with `p.Tags.Any(t => …)` —
//        it becomes an EXISTS subquery, not a client-side scan
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Attach an EXISTING tag to an existing post. Both are looked up by name/
// title. No-op if the post already has it. Returns false if either is missing.
bool AddTag(BlogDb db, string postTitle, string tagName)
{
    throw new NotImplementedException();
}

// Titles of posts carrying this tag, alphabetically. One query.
List<string> PostsTagged(BlogDb db, string tagName)
{
    throw new NotImplementedException();
}

// Every tag name with how many posts use it, ordered by name.
// Must not load the posts.
List<TagCount> TagCounts(BlogDb db)
{
    throw new NotImplementedException();
}

// Detach a tag from a post. Returns false if the link was not there.
bool RemoveTag(BlogDb db, string postTitle, string tagName)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("EF created a join table without you modelling one", () =>
{
    using var db = Seeded();

    // The relationship exists in the database as a third table.
    var tables = db.Database.SqlQueryRaw<string>(
        "SELECT name FROM sqlite_master WHERE type='table'").ToList();

    Ok(tables.Any(t => t.Contains("Tag") && t != "Tags"),
       "expected an implicit join table, got: " + string.Join(", ", tables));
});

Test("a tag can be attached to a post", () =>
{
    using var db = Seeded();
    Ok(AddTag(db, "linq", "csharp"));

    Eq(PostsTagged(TestDb.Again(), "csharp"), new[] { "linq" });
});

Test("one tag can span many posts", () =>
{
    using var db = Seeded();
    AddTag(db, "linq", "csharp");
    AddTag(db, "async", "csharp");

    Eq(PostsTagged(TestDb.Again(), "csharp"), new[] { "async", "linq" });
});

Test("one post can carry many tags", () =>
{
    using var db = Seeded();
    AddTag(db, "linq", "csharp");
    AddTag(db, "linq", "data");

    using var fresh = TestDb.Again();
    var post = fresh.Posts.Include(p => p.Tags).Single(p => p.Title == "linq");
    Eq(post.Tags.Select(t => t.Name).OrderBy(n => n), new[] { "csharp", "data" });
});

Test("adding the same tag twice is a no-op, not a duplicate", () =>
{
    using var db = Seeded();
    AddTag(db, "linq", "csharp");
    AddTag(db, "linq", "csharp");

    Eq(TagCounts(TestDb.Again()).Single(t => t.Name == "csharp").PostCount, 1);
});

Test("AddTag reports a missing post or tag", () =>
{
    using var db = Seeded();
    Ok(!AddTag(db, "nope", "csharp"));
    Ok(!AddTag(db, "linq", "nope"));
});

Test("TagCounts counts in SQL, including zero-use tags", () =>
{
    using var db = Seeded();
    AddTag(db, "linq", "csharp");

    Eq(TagCounts(TestDb.Again()), new[]
    {
        new TagCount("csharp", 1),
        new TagCount("data", 0),
    });
});

Test("an untagged post appears under no tag", () =>
{
    using var db = Seeded();
    Eq(PostsTagged(db, "csharp"), new List<string>());
});

Test("RemoveTag detaches the link but keeps both rows", () =>
{
    using var db = Seeded();
    AddTag(db, "linq", "csharp");

    Ok(RemoveTag(TestDb.Again(), "linq", "csharp"));

    using var after = TestDb.Again();
    Eq(PostsTagged(after, "csharp"), new List<string>());
    Eq(after.Posts.Count(), 2);     // the post survives
    Eq(after.Tags.Count(), 2);      // so does the tag
});

Test("RemoveTag reports a link that was not there", () =>
{
    using var db = Seeded();
    Ok(!RemoveTag(db, "linq", "csharp"));
});

// ──────────────────────────── helpers ────────────────────────────────────

BlogDb Seeded()
{
    var db = TestDb.New();

    db.Posts.AddRange(new Post { Title = "linq" }, new Post { Title = "async" });
    db.Tags.AddRange(new Tag { Name = "csharp" }, new Tag { Name = "data" });
    db.SaveChanges();
    return db;
}

// ──────────────────────────── types ──────────────────────────────────────

public record TagCount(string Name, int PostCount);

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public List<Tag> Tags { get; set; } = [];      // skip navigation
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Post> Posts { get; set; } = [];    // the other side
}

public class BlogDb(DbContextOptions<BlogDb> options) : DbContext(options)
{
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Tag> Tags => Set<Tag>();
}

static class TestDb
{
    private static SqliteConnection? _connection;

    public static BlogDb New()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var db = Context();
        db.Database.EnsureCreated();
        return db;
    }

    public static BlogDb Again() => Context();

    private static BlogDb Context()
        => new(new DbContextOptionsBuilder<BlogDb>().UseSqlite(_connection!).Options);
}
