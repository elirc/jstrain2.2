// ─────────────────────────────────────────────────────────────────────────
//  01 · one-to-many — SOLUTION                            ★★☆ core
//  concepts: navigation properties · FK conventions · required vs optional
//  run: dotnet run 01-one-to-many.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `CreateBlogWithPosts` never touches a foreign key, and that is the point.
//  You build the OBJECT GRAPH — a blog holding posts — add the root, and save
//  once. EF walks the graph, discovers the posts are new, inserts the blog
//  first to get its generated id, then writes that id into each post's
//  `BlogId`. One SaveChanges, one transaction, correct ordering for free.
//
//  Assigning `BlogId` by hand works too and is occasionally necessary (when
//  you have the id but not the entity), but it means you have to know the id
//  *before* the insert, which for a generated key means an extra round trip.
//  Prefer the navigation.
//
//  `CountPosts` filters on the FK and calls `Count()`, so it becomes
//  `SELECT COUNT(*) FROM Posts WHERE BlogId = @id` — no rows leave the
//  database. `db.Blogs.Include(b => b.Posts).Single(...).Posts.Count` gives
//  the same number after fetching every post and materialising every one of
//  them.
//
//  The "not loaded unless you ask" test is the one worth internalising. EF
//  Core does **not** lazy-load by default: a fresh context returns a Blog
//  whose `Posts` is an empty list, not null and not silently populated. That
//  is a deliberate design choice — implicit lazy loading is how you get N+1
//  queries you never wrote (exercise 03). The collection initialiser
//  `= []` is what keeps it empty rather than null, which is why the
//  convention is worth following on every navigation collection.
//
//  The last test shows the FK's nullability doing real work: `int BlogId`
//  makes the relationship required, so SQLite's NOT NULL constraint rejects
//  the orphan and EF surfaces it as `DbUpdateException`. Change it to
//  `int? BlogId` and the same insert succeeds. The C# type IS the schema.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

Blog CreateBlogWithPosts(BlogDb db, string blogName, params string[] titles)
{
    var blog = new Blog
    {
        Name = blogName,
        Posts = titles.Select(t => new Post { Title = t }).ToList(),
    };

    db.Blogs.Add(blog);     // EF discovers the posts by walking the graph
    db.SaveChanges();       // inserts blog, then posts with the new BlogId
    return blog;
}

// SELECT COUNT(*) — no rows materialised.
int CountPosts(BlogDb db, int blogId)
    => db.Posts.Count(p => p.BlogId == blogId);

List<string> PostTitles(BlogDb db, int blogId)
    => db.Posts
         .Where(p => p.BlogId == blogId)
         .OrderBy(p => p.Title)
         .Select(p => p.Title)      // one column, not whole entities
         .ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("the blog and its posts are saved together", () =>
{
    using var db = TestDb.New();
    var blog = CreateBlogWithPosts(db, "tech", "one", "two");

    Ok(blog.Id > 0);
    Eq(db.Blogs.Count(), 1);
    Eq(db.Posts.Count(), 2);
});

Test("EF sets the foreign key from the navigation property", () =>
{
    using var db = TestDb.New();
    var blog = CreateBlogWithPosts(db, "tech", "one");

    Eq(db.Posts.Single().BlogId, blog.Id);
});

Test("CountPosts asks the database", () =>
{
    using var db = TestDb.New();
    var blog = CreateBlogWithPosts(db, "tech", "a", "b", "c");

    Eq(CountPosts(db, blog.Id), 3);
});

Test("CountPosts is 0 for a blog with no posts", () =>
{
    using var db = TestDb.New();
    var blog = CreateBlogWithPosts(db, "empty");

    Eq(CountPosts(db, blog.Id), 0);
});

Test("PostTitles returns them sorted", () =>
{
    using var db = TestDb.New();
    var blog = CreateBlogWithPosts(db, "tech", "zebra", "apple", "mango");

    Eq(PostTitles(db, blog.Id), new[] { "apple", "mango", "zebra" });
});

Test("posts are scoped to their own blog", () =>
{
    using var db = TestDb.New();
    var first = CreateBlogWithPosts(db, "first", "a");
    var second = CreateBlogWithPosts(db, "second", "b", "c");

    Eq(PostTitles(db, first.Id), new[] { "a" });
    Eq(PostTitles(db, second.Id), new[] { "b", "c" });
});

Test("the navigation property is not loaded unless you ask", () =>
{
    using var db = TestDb.New();
    var created = CreateBlogWithPosts(db, "tech", "one", "two");
    var blogId = created.Id;

    using var fresh = TestDb.Again();
    var blog = fresh.Blogs.Single(b => b.Id == blogId);
    Eq(blog.Posts.Count, 0);
});

Test("a post cannot exist without a blog", () =>
{
    using var db = TestDb.New();
    db.Posts.Add(new Post { Title = "orphan" });

    Throws<DbUpdateException>(() => db.SaveChanges());
});

// ──────────────────────────── types ──────────────────────────────────────

// Each test gets a private in-memory database. The connection is held open
// because SQLite discards an in-memory database when the last one closes.
static class TestDb
{
    private static SqliteConnection? _connection;

    /// <summary>A fresh, empty database.</summary>
    public static BlogDb New()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var db = Context();
        db.Database.EnsureCreated();
        return db;
    }

    /// <summary>A SECOND context over the same database — its own change
    /// tracker, so it has never seen anything the first one loaded.</summary>
    public static BlogDb Again() => Context();

    private static BlogDb Context()
        => new(new DbContextOptionsBuilder<BlogDb>().UseSqlite(_connection!).Options);
}

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
