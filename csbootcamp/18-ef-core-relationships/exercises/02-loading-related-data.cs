// ─────────────────────────────────────────────────────────────────────────
//  02 · loading related data                              ★★☆ core
//  concepts: Include · ThenInclude · projection · filtered includes
//  run: dotnet run 02-loading-related-data.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  EF does not load navigation properties unless you ask. Three ways to ask,
//  and the third is usually the right one:
//
//      .Include(b => b.Posts)                      eager load the collection
//      .Include(b => b.Posts).ThenInclude(p => p.Comments)   go deeper
//      .Select(b => new Dto(b.Name, b.Posts.Count))          project
//
//  `Include` fetches whole ENTITIES — every column of every row, tracked.
//  A projection fetches only the columns your shape actually needs, and is
//  not tracked. When you are returning JSON, project.
//
//  Implement four loaders over Blog → Post → Comment.
//
//  hint: Include only works on entities. The moment you Select into a DTO,
//        Include is ignored — you express what you want in the Select itself
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// The blog with its posts loaded. Posts ordered by title.
Blog? WithPosts(BlogDb db, int blogId)
{
    throw new NotImplementedException();
}

// The blog with posts AND each post's comments loaded.
Blog? WithPostsAndComments(BlogDb db, int blogId)
{
    throw new NotImplementedException();
}

// A summary DTO built in SQL: blog name plus how many posts it has.
// Must NOT load the posts.
BlogSummary? Summary(BlogDb db, int blogId)
{
    throw new NotImplementedException();
}

// Every blog's name with its post titles, as DTOs, ordered by blog name
// then post title. One query, no entity tracking.
List<BlogWithTitles> AllWithTitles(BlogDb db)
{
    throw new NotImplementedException();
}

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

    // Nothing was materialised as an entity, so nothing is tracked.
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
