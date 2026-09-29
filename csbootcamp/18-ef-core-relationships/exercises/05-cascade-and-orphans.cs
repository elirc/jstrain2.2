// ─────────────────────────────────────────────────────────────────────────
//  05 · cascade deletes and orphans                       ★★★ stretch
//  concepts: DeleteBehavior · required vs optional · soft delete
//  run: dotnet run 05-cascade-and-orphans.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Delete a blog that has posts. What happens to the posts? EF decides from
//  the FK's nullability, and the two answers are very different:
//
//      int  BlogId  (required) → DeleteBehavior.Cascade
//                                the posts are DELETED with the blog
//      int? BlogId  (optional) → DeleteBehavior.ClientSetNull
//                                the posts SURVIVE with BlogId = null
//
//  Nobody chose that. It falls out of a `?` you typed for other reasons —
//  which is why "we deleted a category and lost 40,000 products" is a real
//  incident report.
//
//  This file has both shapes side by side so you can watch them differ:
//
//      Blog   → Post       required   (cascade)
//      Author → Article    optional   (orphan)
//
//  And one more thing worth knowing: cascade only reaches entities EF has
//  LOADED, unless the database itself has the constraint. Exercise 03's
//  lesson applies — what is in the change tracker decides what happens.
//
//  hint: `Include` the children before deleting the parent, and notice what
//        changes when you don't
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Delete the blog and let the configured behaviour decide the posts' fate.
// Load the posts first so EF can act on them. False if no such blog.
bool DeleteBlog(BlogDb db, string blogName)
{
    throw new NotImplementedException();
}

// Delete the author. Articles are optional-FK, so they must survive.
bool DeleteAuthor(BlogDb db, string authorName)
{
    throw new NotImplementedException();
}

// Do NOT delete: mark the blog deleted and keep every row. Returns false if
// the blog does not exist or is already marked.
bool SoftDeleteBlog(BlogDb db, string blogName)
{
    throw new NotImplementedException();
}

// Blogs that are not soft-deleted, by name.
List<string> LiveBlogs(BlogDb db)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("deleting a blog cascades to its posts", () =>
{
    using var db = Seeded();
    Ok(DeleteBlog(db, "tech"));

    using var after = TestDb.Again();
    Eq(after.Blogs.Count(), 1);
    Eq(after.Posts.Count(), 1);              // only food's post remains
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
    Eq(after.Articles.Count(), 2);           // the articles SURVIVE
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
    // Same operation, opposite outcomes — decided by int vs int?.
    using var db = Seeded();
    DeleteBlog(db, "tech");
    DeleteAuthor(db, "ada");

    using var after = TestDb.Again();
    Eq(after.Posts.Count(), 1);              // cascaded away
    Eq(after.Articles.Count(), 2);           // orphaned, kept
});

Test("soft delete keeps every row", () =>
{
    using var db = Seeded();
    Ok(SoftDeleteBlog(db, "tech"));

    using var after = TestDb.Again();
    Eq(after.Blogs.Count(), 2);              // nothing removed
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
    public int BlogId { get; set; }              // REQUIRED → cascade
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
    public int? AuthorId { get; set; }           // OPTIONAL → orphan
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
