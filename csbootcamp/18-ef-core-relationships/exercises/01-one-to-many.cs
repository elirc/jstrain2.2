// ─────────────────────────────────────────────────────────────────────────
//  01 · one-to-many                                       ★★☆ core
//  concepts: navigation properties · FK conventions · required vs optional
//  run: dotnet run 01-one-to-many.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A blog has many posts. In the database that is a foreign key column on
//  Posts; in C# it is a pair of NAVIGATION PROPERTIES that EF wires together
//  by convention:
//
//      class Blog { public List<Post> Posts { get; set; } = []; }   // one side
//      class Post { public int BlogId { get; set; }                 // the FK
//                   public Blog Blog { get; set; } = null!; }       // many side
//
//  EF sees `BlogId` next to a `Blog` navigation and infers the whole
//  relationship — table, column, constraint. You write no configuration for
//  the common case.
//
//  The nullability of the FK decides whether the relationship is REQUIRED:
//
//      int  BlogId   → required. Every post must have a blog.
//      int? BlogId   → optional. A post may be orphaned.
//
//  Implement three helpers against the model at the bottom.
//
//  hint: adding a Post to `blog.Posts` is enough — EF sets the FK for you
//        when it saves the graph
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Create a blog with these post titles in ONE SaveChanges, and return it.
// Do not set any foreign key by hand.
Blog CreateBlogWithPosts(BlogDb db, string blogName, params string[] titles)
{
    throw new NotImplementedException();
}

// How many posts belong to this blog — asked of the database, without
// loading the posts.
int CountPosts(BlogDb db, int blogId)
{
    throw new NotImplementedException();
}

// The titles of that blog's posts, alphabetically. One query.
List<string> PostTitles(BlogDb db, int blogId)
{
    throw new NotImplementedException();
}

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

    // Never assigned by hand — EF derived it from blog.Posts.
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

    // A FRESH context has never seen the posts. Lazy loading is off, so the
    // collection is empty — not null, and not silently fetched.
    using var fresh = TestDb.Again();
    var blog = fresh.Blogs.Single(b => b.Id == blogId);
    Eq(blog.Posts.Count, 0);
});

Test("a post cannot exist without a blog", () =>
{
    using var db = TestDb.New();
    db.Posts.Add(new Post { Title = "orphan" });   // BlogId is int, required

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
    public List<Post> Posts { get; set; } = [];       // the "many" end
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int BlogId { get; set; }                   // non-nullable → required
    public Blog Blog { get; set; } = null!;
}

public class BlogDb(DbContextOptions<BlogDb> options) : DbContext(options)
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();
}
