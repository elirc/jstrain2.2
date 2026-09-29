// ─────────────────────────────────────────────────────────────────────────
//  02 · loading related data — SOLUTION                   ★★☆ core
//  concepts: Include · ThenInclude · projection · filtered includes
//  run: dotnet run 02-loading-related-data.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Two families of answer, and knowing which to reach for is the skill.
//
//  `Include` loads ENTITIES. It fetches every column of every related row and
//  tracks them all. Use it when you are going to *mutate* the graph, or when
//  you genuinely need the whole objects.
//
//  The first test shows a wrinkle worth knowing: in the SAME context that
//  inserted the posts, `blog.Posts` is already populated — not by a query, but
//  by RELATIONSHIP FIXUP. The change tracker holds those posts, sees their FK
//  points at this blog, and wires the navigation up for free. In a fresh
//  context nothing is tracked, so the collection is empty. This is why a test
//  that reuses the seeding context can pass while production, which uses a new
//  context per request, returns empty collections.
//
//  `ThenInclude` continues from the last Include's element type, which is how
//  you reach Blog → Post → Comment. Note the first two tests: `Include` on
//  posts leaves `Comments` empty, because EF loads exactly the levels you
//  named and no more. There is no "load everything" — that is deliberate,
//  because "everything" is usually the whole database.
//
//  `Select` PROJECTS. `b.Posts.Count` inside a Select becomes a SQL COUNT
//  subquery, so the posts are never fetched at all — the database returns one
//  name and one integer. The tracking test proves the difference: after a
//  projection, `ChangeTracker.Entries()` is empty, because a `BlogSummary` is
//  not an entity and there is nothing to write back.
//
//  That is why the rule for an API endpoint is: **project, don't Include.**
//  Include-then-serialise pulls every column you did not want, tracks objects
//  you will throw away, and leaks your schema (module 17). A projection asks
//  for exactly the shape you are about to return.
//
//  `AllWithTitles` shows a projection can build a nested shape in one query —
//  the inner `Select` becomes a join that EF stitches back into lists. A blog
//  with no posts still appears with an empty list, because it is a LEFT join,
//  not an inner one. Doing this with a `foreach` over blogs and a query per
//  blog is exercise 03's problem.
//
//  Ordering inside the projection (`OrderBy(p => p.Title)`) also happens in
//  SQL. Sorting after `ToList()` would work and would sort in memory.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

Blog? WithPosts(BlogDb db, int blogId)
    => db.Blogs
         // A filtered/ordered include: the ordering is applied in SQL.
         .Include(b => b.Posts.OrderBy(p => p.Title))
         .SingleOrDefault(b => b.Id == blogId);

Blog? WithPostsAndComments(BlogDb db, int blogId)
    => db.Blogs
         .Include(b => b.Posts.OrderBy(p => p.Title))
             .ThenInclude(p => p.Comments)      // continues from Post
         .SingleOrDefault(b => b.Id == blogId);

BlogSummary? Summary(BlogDb db, int blogId)
    => db.Blogs
         .Where(b => b.Id == blogId)
         // b.Posts.Count becomes a COUNT subquery — no posts are fetched,
         // and the result is a DTO, so nothing is tracked.
         .Select(b => new BlogSummary(b.Name, b.Posts.Count))
         .SingleOrDefault();

List<BlogWithTitles> AllWithTitles(BlogDb db)
    => db.Blogs
         .OrderBy(b => b.Name)
         .Select(b => new BlogWithTitles(
             b.Name,
             b.Posts.OrderBy(p => p.Title).Select(p => p.Title).ToList()))
         .ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("a fresh context does not load the collection; the same one already has it", () =>
{
    using var db = Seeded();

    // SAME context: it still tracks the posts it just inserted, so
    // relationship fixup wired them onto blog.Posts. No query ran.
    Eq(db.Blogs.Single(b => b.Name == "tech").Posts.Count, 2);

    // FRESH context: nothing is tracked and nothing is lazily fetched.
    using var fresh = TestDb.Again();
    Eq(fresh.Blogs.Single(b => b.Name == "tech").Posts.Count, 0);
});

Test("Include loads the collection", () =>
{
    using var db = Seeded();
    var id = db.Blogs.Single(b => b.Name == "tech").Id;

    using var fresh = TestDb.Again();
    var blog = WithPosts(fresh, id);
    Eq(blog!.Posts.Select(p => p.Title), new[] { "async", "linq" });
});

Test("WithPosts returns null for a missing blog", () =>
{
    using var db = Seeded();
    Eq(WithPosts(db, 999), null);
});

Test("Include alone does not load the second level", () =>
{
    using var db = Seeded();
    var id = db.Blogs.Single(b => b.Name == "tech").Id;

    using var fresh = TestDb.Again();
    var blog = WithPosts(fresh, id);
    Eq(blog!.Posts.Sum(p => p.Comments.Count), 0);
});

Test("ThenInclude loads the second level", () =>
{
    using var db = Seeded();
    var id = db.Blogs.Single(b => b.Name == "tech").Id;

    using var fresh = TestDb.Again();
    var blog = WithPostsAndComments(fresh, id);
    Eq(blog!.Posts.Sum(p => p.Comments.Count), 3);
});

Test("a projection computes the count in SQL", () =>
{
    using var db = Seeded();
    var id = db.Blogs.Single(b => b.Name == "tech").Id;

    using var fresh = TestDb.Again();
    Eq(Summary(fresh, id), new BlogSummary("tech", 2));
});

Test("the projection does not track or load entities", () =>
{
    using var db = Seeded();
    var id = db.Blogs.Single(b => b.Name == "tech").Id;

    using var fresh = TestDb.Again();
    Summary(fresh, id);

    Eq(fresh.ChangeTracker.Entries().Count(), 0);
});

Test("Summary is null for a missing blog", () =>
{
    using var db = Seeded();
    Eq(Summary(db, 999), null);
});

Test("AllWithTitles shapes the whole graph in one query", () =>
{
    using var db = Seeded();

    using var fresh = TestDb.Again();
    Eq(AllWithTitles(fresh), new[]
    {
        new BlogWithTitles("food", ["bread"]),
        new BlogWithTitles("tech", ["async", "linq"]),
    });
});

Test("a blog with no posts still appears, with an empty list", () =>
{
    using var db = Seeded();
    db.Blogs.Add(new Blog { Name = "empty" });
    db.SaveChanges();

    using var fresh = TestDb.Again();
    var empty = AllWithTitles(fresh).Single(b => b.Name == "empty");
    Eq(empty.Titles, Array.Empty<string>());
});

// ──────────────────────────── helpers ────────────────────────────────────

BlogDb Seeded()
{
    var db = TestDb.New();

    var tech = new Blog
    {
        Name = "tech",
        Posts =
        [
            new Post { Title = "linq", Comments = [new Comment { Body = "nice" }] },
            new Post
            {
                Title = "async",
                Comments = [new Comment { Body = "helpful" }, new Comment { Body = "more" }],
            },
        ],
    };
    var food = new Blog { Name = "food", Posts = [new Post { Title = "bread" }] };

    db.Blogs.AddRange(tech, food);
    db.SaveChanges();
    return db;
}

// ──────────────────────────── types ──────────────────────────────────────

public record BlogSummary(string Name, int PostCount);
public record BlogWithTitles(string Name, List<string> Titles);

public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Post> Posts { get; set; } = [];
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;
    public List<Comment> Comments { get; set; } = [];
}

public class Comment
{
    public int Id { get; set; }
    public string Body { get; set; } = "";
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;
}

public class BlogDb(DbContextOptions<BlogDb> options) : DbContext(options)
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
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
