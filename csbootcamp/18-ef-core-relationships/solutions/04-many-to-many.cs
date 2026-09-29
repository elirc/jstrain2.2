// ─────────────────────────────────────────────────────────────────────────
//  04 · many-to-many — SOLUTION                           ★★☆ core
//  concepts: skip navigations · the implicit join table · Any() filtering
//  run: dotnet run 04-many-to-many.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  There is no join ENTITY in this file, and there is a join TABLE in the
//  database — the first test proves it. Two collections pointing at each
//  other is the whole declaration; EF generates `PostTag(PostsId, TagsId)`
//  and keeps it in sync as you add and remove from the navigations. You
//  manipulate objects, EF writes rows.
//
//  `AddTag` must `Include(p => p.Tags)` before touching the collection. Load
//  the post without it and `post.Tags` is empty — so the duplicate check
//  passes when it shouldn't, and `Add` on an unloaded collection is EF asking
//  you to insert a row that may already exist. Loading first is what makes
//  the "twice is a no-op" test pass.
//
//  `PostsTagged` filters with `p.Tags.Any(t => t.Name == tagName)`, which
//  becomes an `EXISTS (SELECT 1 FROM PostTag …)` subquery. The database does
//  the work and returns only the titles. Writing
//  `db.Posts.Include(p => p.Tags).ToList().Where(...)` gives the same answer
//  after loading every post and every tag link in the table.
//
//  `TagCounts` projects `t.Posts.Count` into a DTO — a COUNT subquery, so no
//  posts are fetched — and because it is a LEFT-join-shaped subquery, a tag
//  with zero posts still appears with 0. That is the detail the test pins:
//  an inner join would silently drop unused tags.
//
//  `RemoveTag` removes from the navigation collection and saves. EF deletes
//  the join row and leaves both entities alone, which the test checks
//  explicitly — a common fear is that removing from a collection deletes the
//  child, and for a skip navigation it does not. (For a one-to-many, whether
//  the child is deleted or orphaned depends on cascade behaviour — that is
//  exercise 05.)
//
//  When the relationship needs its own data — who tagged it, when, in what
//  order — you stop using skip navigations and model the join as a real
//  entity with two one-to-many relationships. You can have both: EF supports
//  a skip navigation *and* an explicit join entity over the same table.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

bool AddTag(BlogDb db, string postTitle, string tagName)
{
    // Include is mandatory: without it Tags is empty and the duplicate
    // check below is meaningless.
    var post = db.Posts.Include(p => p.Tags).SingleOrDefault(p => p.Title == postTitle);
    var tag = db.Tags.SingleOrDefault(t => t.Name == tagName);
    if (post is null || tag is null) return false;

    if (post.Tags.Any(t => t.Id == tag.Id)) return true;   // already linked

    post.Tags.Add(tag);      // EF turns this into an INSERT on the join table
    db.SaveChanges();
    return true;
}

List<string> PostsTagged(BlogDb db, string tagName)
    => db.Posts
         .Where(p => p.Tags.Any(t => t.Name == tagName))   // EXISTS subquery
         .OrderBy(p => p.Title)
         .Select(p => p.Title)
         .ToList();

List<TagCount> TagCounts(BlogDb db)
    => db.Tags
         .OrderBy(t => t.Name)
         .Select(t => new TagCount(t.Name, t.Posts.Count))  // COUNT subquery
         .ToList();

bool RemoveTag(BlogDb db, string postTitle, string tagName)
{
    var post = db.Posts.Include(p => p.Tags).SingleOrDefault(p => p.Title == postTitle);
    var tag = post?.Tags.SingleOrDefault(t => t.Name == tagName);
    if (tag is null) return false;

    post!.Tags.Remove(tag);  // deletes the join row, not the tag
    db.SaveChanges();
    return true;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("EF created a join table without you modelling one", () =>
{
    using var db = Seeded();

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
    Eq(after.Posts.Count(), 2);
    Eq(after.Tags.Count(), 2);
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
    public List<Tag> Tags { get; set; } = [];
}

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
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
