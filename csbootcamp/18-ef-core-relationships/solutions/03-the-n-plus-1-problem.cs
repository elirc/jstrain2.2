// ─────────────────────────────────────────────────────────────────────────
//  03 · the N+1 problem — SOLUTION                         ★★★ stretch
//  concepts: query counting · eager loading · projection
//  run: dotnet run 03-the-n-plus-1-problem.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  All three functions return identical data. The tests that matter are the
//  ones counting queries, and the numbers are the whole lesson:
//
//      Naive        20 blogs → 21 queries
//      WithInclude  20 blogs →  1 query
//      Projected    20 blogs →  1 query
//
//  `Naive` is N+1, and notice how *reasonable* it looks. `ToList()` ends the
//  first query, so `blogs` is now plain objects in memory. Every
//  `db.Posts.Count(...)` inside the loop is therefore a brand-new round trip.
//  There is no compiler warning, no analyzer, no runtime complaint. On a
//  laptop with 3 rows it is instant; at 10,000 rows and 2ms latency it is 20
//  seconds, and the profiler blames "the database".
//
//  The signature to recognise: **a query inside a loop over the results of
//  another query.** That includes touching a lazy-loaded navigation property
//  in a loop, which is why EF Core ships with lazy loading OFF.
//
//  `WithInclude` fixes the count — one query — by telling EF up front to
//  bring the posts along. Correct, and it fetches every column of all 40 post
//  rows to produce 20 integers. The tracking test shows the cost concretely:
//  20 entities tracked (5 blogs + 15 posts) versus 0.
//
//  `Projected` is the one to reach for. `b.Posts.Count` inside a `Select`
//  becomes a SQL COUNT subquery, so the database does the counting and
//  returns two columns per blog. One query, no posts fetched, nothing
//  tracked.
//
//  Rule of thumb: **Include when you need the objects, project when you need
//  a shape.** For anything you are about to serialise as JSON, project.
//
//  Worth knowing how to see this in your own code: `.ToQueryString()` shows
//  the SQL for a query, and logging `Microsoft.EntityFrameworkCore.Database
//  .Command` at Information level prints every statement EF sends. The
//  interceptor here is the same idea, made assertable.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

List<BlogStat> Naive(BlogDb db)
{
    // Query 1: the blogs. ToList() ends it — from here on, plain objects.
    var blogs = db.Blogs.OrderBy(b => b.Name).ToList();

    var stats = new List<BlogStat>();
    foreach (var blog in blogs)
    {
        // Queries 2..N+1: one round trip per blog. THIS is the bug.
        var count = db.Posts.Count(p => p.BlogId == blog.Id);
        stats.Add(new BlogStat(blog.Name, count));
    }
    return stats;
}

List<BlogStat> WithInclude(BlogDb db)
    // One query — but it fetches every column of every Post to count them.
    => db.Blogs
         .Include(b => b.Posts)
         .OrderBy(b => b.Name)
         .ToList()
         .Select(b => new BlogStat(b.Name, b.Posts.Count))
         .ToList();

List<BlogStat> Projected(BlogDb db)
    // One query, two columns. b.Posts.Count becomes a COUNT subquery.
    => db.Blogs
         .OrderBy(b => b.Name)
         .Select(b => new BlogStat(b.Name, b.Posts.Count))
         .ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("all three produce the same answer", () =>
{
    using var db = Seeded(3, postsEach: 4);
    var expected = new[]
    {
        new BlogStat("blog-1", 4), new BlogStat("blog-2", 4), new BlogStat("blog-3", 4),
    };

    Eq(Naive(db), expected);
    Eq(WithInclude(TestDb.Again()), expected);
    Eq(Projected(TestDb.Again()), expected);
});

Test("the naive version runs N+1 queries", () =>
{
    using var db = Seeded(5, postsEach: 2);

    using var fresh = TestDb.Again();
    Queries.Reset();
    Naive(fresh);

    Eq(Queries.Count, 6);
});

Test("N+1 gets worse as the data grows — the code does not change", () =>
{
    using var db = Seeded(20, postsEach: 2);

    using var fresh = TestDb.Again();
    Queries.Reset();
    Naive(fresh);

    Eq(Queries.Count, 21);
});

Test("Include collapses it to a single query", () =>
{
    using var db = Seeded(20, postsEach: 2);

    using var fresh = TestDb.Again();
    Queries.Reset();
    WithInclude(fresh);

    Eq(Queries.Count, 1);
});

Test("the projection is also a single query", () =>
{
    using var db = Seeded(20, postsEach: 2);

    using var fresh = TestDb.Again();
    Queries.Reset();
    Projected(fresh);

    Eq(Queries.Count, 1);
});

Test("Include materialises the posts; the projection does not", () =>
{
    using var db = Seeded(5, postsEach: 3);

    using var included = TestDb.Again();
    WithInclude(included);
    Eq(included.ChangeTracker.Entries().Count(), 20);

    using var projected = TestDb.Again();
    Projected(projected);
    Eq(projected.ChangeTracker.Entries().Count(), 0);
});

Test("the count is right even for a blog with no posts", () =>
{
    using var db = Seeded(1, postsEach: 0);

    Eq(Projected(TestDb.Again()), new[] { new BlogStat("blog-1", 0) });
    Eq(WithInclude(TestDb.Again()), new[] { new BlogStat("blog-1", 0) });
});

// ──────────────────────────── helpers ────────────────────────────────────

BlogDb Seeded(int blogs, int postsEach)
{
    var db = TestDb.New();

    for (var b = 1; b <= blogs; b++)
    {
        db.Blogs.Add(new Blog
        {
            Name = $"blog-{b}",
            Posts = Enumerable.Range(1, postsEach)
                              .Select(p => new Post { Title = $"post-{p}" })
                              .ToList(),
        });
    }

    db.SaveChanges();
    return db;
}

// ──────────────────────────── types ──────────────────────────────────────

public record BlogStat(string Name, int PostCount);

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
}

public class BlogDb(DbContextOptions<BlogDb> options) : DbContext(options)
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();
}

public static class Queries
{
    private static int _count;
    public static int Count => _count;
    public static void Reset() => _count = 0;
    internal static void Record() => Interlocked.Increment(ref _count);
}

public class CountingInterceptor : DbCommandInterceptor
{
    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command, CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
    {
        Queries.Record();
        return result;
    }
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
        => new(new DbContextOptionsBuilder<BlogDb>()
            .UseSqlite(_connection!)
            .AddInterceptors(new CountingInterceptor())
            .Options);
}
