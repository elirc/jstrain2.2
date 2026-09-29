// ─────────────────────────────────────────────────────────────────────────
//  03 · the N+1 problem                                    ★★★ stretch
//  concepts: query counting · eager loading · projection
//  run: dotnet run 03-the-n-plus-1-problem.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The most expensive bug in ORM code, and it never looks like a bug:
//
//      var blogs = db.Blogs.ToList();                   // 1 query
//      foreach (var b in blogs)
//          Console.WriteLine(db.Posts.Count(p => p.BlogId == b.Id));   // N more
//
//  One query for the list, then one per row — **N+1**. With 10 blogs on your
//  laptop it is imperceptible. With 10,000 rows and 2ms of network latency it
//  is 20 seconds, and the profiler blames "the database".
//
//  Nothing in C# warns you. The loop reads perfectly well. The only way to
//  see it is to COUNT THE QUERIES — which this exercise does for real, with
//  an EF command interceptor.
//
//  Write three versions of "every blog's name and post count":
//
//      Naive       → deliberately N+1 (this one is your baseline)
//      WithInclude → one query, but fetches whole Post entities
//      Projected   → one query, fetching only the count
//
//  The tests assert the exact query counts. That is the whole lesson.
//
//  hint: the counter is `Queries.Count` — read it before and after
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

// N+1 ON PURPOSE: fetch the blogs, then count each blog's posts in the loop.
// This is the shape you must learn to recognise.
List<BlogStat> Naive(BlogDb db)
{
    throw new NotImplementedException();
}

// One query, using Include. Correct, but it drags every Post row across.
List<BlogStat> WithInclude(BlogDb db)
{
    throw new NotImplementedException();
}

// One query that returns ONLY the name and the count.
List<BlogStat> Projected(BlogDb db)
{
    throw new NotImplementedException();
}

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

    Eq(Queries.Count, 6);   // 1 for the blogs + 5 for the counts
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
    // 5 blogs + 15 posts, all tracked.
    Eq(included.ChangeTracker.Entries().Count(), 20);

    using var projected = TestDb.Again();
    Projected(projected);
    // A DTO is not an entity. Nothing tracked, nothing fetched but 2 columns.
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

/// <summary>Counts every SQL command EF actually sends.</summary>
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
