// ─────────────────────────────────────────────────────────────────────────
//  05 · cascade deletes and orphans — SOLUTION            ★★★ stretch
//  concepts: DeleteBehavior · required vs optional · soft delete
//  run: dotnet run 05-cascade-and-orphans.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `DeleteBlog` and `DeleteAuthor` are the same three lines. They behave
//  completely differently, and the only difference in the whole file is
//  `int BlogId` versus `int? AuthorId`.
//
//    required FK → DeleteBehavior.Cascade         children DELETED
//    optional FK → DeleteBehavior.ClientSetNull   children KEPT, FK nulled
//
//  Nobody picks that in a design meeting. It falls out of a `?` typed for
//  unrelated reasons, and it is why "we deleted one category and lost 40,000
//  products" is a real incident report. Before you delete anything with
//  children in production, go and look at the FK's nullability.
//
//  `Include(b => b.Posts)` before deleting is not decoration. EF's cascade
//  runs over the entities it is TRACKING. Delete a blog whose posts were
//  never loaded and EF has nothing to cascade to — you then rely on the
//  database's own FK constraint, which SQLite does not enforce by default,
//  so the posts can survive as broken rows pointing at a blog that no longer
//  exists. Load the children, or configure the database constraint, but do
//  not assume.
//
//  `SoftDeleteBlog` is the answer most production systems actually want. A
//  DELETE is irreversible, breaks audit trails, and cascades in ways you may
//  not have predicted; a flag is none of those. The cost is that **every
//  query must remember the filter**, which is exactly the kind of thing
//  everyone forgets. In a real app you would add a global query filter:
//
//      modelBuilder.Entity<Blog>().HasQueryFilter(b => !b.IsDeleted);
//
//  and then `db.Blogs` excludes them everywhere automatically, with
//  `IgnoreQueryFilters()` as the deliberate escape hatch. Doing it by hand
//  here shows what the filter is doing for you.
//
//  Note `SoftDeleteBlog` returns false when already deleted, so the operation
//  is not silently idempotent — the caller can tell "I did it" from "someone
//  already had".
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

bool DeleteBlog(BlogDb db, string blogName)
{
    // Include matters: cascade acts on TRACKED children.
    var blog = db.Blogs.Include(b => b.Posts).SingleOrDefault(b => b.Name == blogName);
    if (blog is null) return false;

    db.Blogs.Remove(blog);   // required FK → posts are deleted too
    db.SaveChanges();
    return true;
}

bool DeleteAuthor(BlogDb db, string authorName)
{
    var author = db.Authors.Include(a => a.Articles)
                           .SingleOrDefault(a => a.Name == authorName);
    if (author is null) return false;

    db.Authors.Remove(author);   // optional FK → articles kept, AuthorId nulled
    db.SaveChanges();
    return true;
}

bool SoftDeleteBlog(BlogDb db, string blogName)
{
    var blog = db.Blogs.SingleOrDefault(b => b.Name == blogName);
    if (blog is null || blog.IsDeleted) return false;

    blog.IsDeleted = true;   // tracked entity → one UPDATE, nothing removed
    db.SaveChanges();
    return true;
}

List<string> LiveBlogs(BlogDb db)
    // Every query must remember this filter — which is what a global query
    // filter exists to automate.
    => db.Blogs
         .Where(b => !b.IsDeleted)
         .OrderBy(b => b.Name)
         .Select(b => b.Name)
         .ToList();

// ──────────────────────────── tests ──────────────────────────────────────

Test("deleting a blog cascades to its posts", () =>
{
    using var db = Seeded();
    Ok(DeleteBlog(db, "tech"));

    using var after = TestDb.Again();
    Eq(after.Blogs.Count(), 1);
    Eq(after.Posts.Count(), 1);
    Eq(after.Posts.Single().Title, "bread");
});

Test("the other blog's posts are untouched", () =>
{
    using var db = Seeded();
    DeleteBlog(db, "tech");

    using var after = TestDb.Again();
    Eq(after.Blogs.Single().Name, "food");
});

Test("DeleteBlog reports a missing blog", () =>
{
    using var db = Seeded();
    Ok(!DeleteBlog(db, "nope"));
});

Test("an optional FK orphans instead of cascading", () =>
{
    using var db = Seeded();
    Ok(DeleteAuthor(db, "ada"));

    using var after = TestDb.Again();
    Eq(after.Authors.Count(), 0);
    Eq(after.Articles.Count(), 2);
});

Test("orphaned articles have a null foreign key", () =>
{
    using var db = Seeded();
    DeleteAuthor(db, "ada");

    using var after = TestDb.Again();
    Ok(after.Articles.All(a => a.AuthorId == null));
});

Test("the two behaviours differ only by a question mark", () =>
{
    using var db = Seeded();
    DeleteBlog(db, "tech");
    DeleteAuthor(db, "ada");

    using var after = TestDb.Again();
    Eq(after.Posts.Count(), 1);
    Eq(after.Articles.Count(), 2);
});

Test("soft delete keeps every row", () =>
{
    using var db = Seeded();
    Ok(SoftDeleteBlog(db, "tech"));

    using var after = TestDb.Again();
    Eq(after.Blogs.Count(), 2);
    Eq(after.Posts.Count(), 2);
});

Test("a soft-deleted blog is hidden from the live list", () =>
{
    using var db = Seeded();
    SoftDeleteBlog(db, "tech");

    Eq(LiveBlogs(TestDb.Again()), new[] { "food" });
});

Test("soft deleting twice is refused", () =>
{
    using var db = Seeded();
    Ok(SoftDeleteBlog(db, "tech"));
    Ok(!SoftDeleteBlog(TestDb.Again(), "tech"));
});

Test("LiveBlogs lists everything when nothing is deleted", () =>
{
    using var db = Seeded();
    Eq(LiveBlogs(db), new[] { "food", "tech" });
});

// ──────────────────────────── helpers ────────────────────────────────────

BlogDb Seeded()
{
    var db = TestDb.New();

    db.Blogs.AddRange(
        new Blog { Name = "tech", Posts = [new Post { Title = "linq" }] },
        new Blog { Name = "food", Posts = [new Post { Title = "bread" }] });

    db.Authors.Add(new Author
    {
        Name = "ada",
        Articles = [new Article { Headline = "one" }, new Article { Headline = "two" }],
    });

    db.SaveChanges();
    return db;
}

// ──────────────────────────── types ──────────────────────────────────────

public class Blog
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsDeleted { get; set; }
    public List<Post> Posts { get; set; } = [];
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;
}

public class Author
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Article> Articles { get; set; } = [];
}

public class Article
{
    public int Id { get; set; }
    public string Headline { get; set; } = "";
    public int? AuthorId { get; set; }
    public Author? Author { get; set; }
}

public class BlogDb(DbContextOptions<BlogDb> options) : DbContext(options)
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Author> Authors => Set<Author>();
    public DbSet<Article> Articles => Set<Article>();
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
