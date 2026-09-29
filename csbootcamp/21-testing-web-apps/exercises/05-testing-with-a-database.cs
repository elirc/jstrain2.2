// ─────────────────────────────────────────────────────────────────────────
//  05 · testing with a database                           ★★★ stretch
//  concepts: per-test databases · a fresh DbContext · seeding
//  run: dotnet run 05-testing-with-a-database.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Exercise 04's rule applied to data: **a test that shares a database with
//  another test is not isolated.** Two specific traps, and both are subtle
//  enough to survive code review:
//
//    1. a shared database — test A's rows are visible to test B, so B passes
//       for the wrong reason and fails when A is deleted
//    2. a shared DbContext — even against a private database, the change
//       tracker still holds the entities you inserted, and *relationship
//       fixup* populates navigations with no query at all (module 18/02).
//       Your assertion passes; production, with a context per request,
//       returns empty collections.
//
//  So the fixture is: **a new database per test, AND a new context to
//  assert with.**
//
//  `TestDb.Fresh()` gives you a private in-memory SQLite database.
//  `TestDb.Connect()` gives you another context over that same database —
//  which is what a second HTTP request would get.
//
//  Build a repository and prove both kinds of isolation.
//
//  hint: seed with one context, assert with another — if a test only passes
//        when you reuse the seeding context, it is testing the tracker
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.EntityFrameworkCore.Sqlite@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// Add a team with its members in one save. Returns the saved team.
Team AddTeam(ShopDb db, string name, params string[] members)
{
    throw new NotImplementedException();
}

// The team's member names, alphabetically. Must work on a context that has
// never seen the team before — so it has to actually query.
List<string> MemberNames(ShopDb db, int teamId)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a team and its members are saved", () =>
{
    using var db = TestDb.Fresh();
    var team = AddTeam(db, "core", "ada", "bob");

    Ok(team.Id > 0);
    Eq(db.Teams.Count(), 1);
    Eq(db.Members.Count(), 2);
});

Test("members are queryable from a FRESH context", () =>
{
    using var seed = TestDb.Fresh();
    var team = AddTeam(seed, "core", "zoe", "ada");

    // A second context = what the next HTTP request would see.
    using var fresh = TestDb.Connect();
    Eq(MemberNames(fresh, team.Id), new[] { "ada", "zoe" });
});

Test("each test gets its own database", () =>
{
    // If this saw the previous test's team, the fixture is shared.
    using var db = TestDb.Fresh();
    Eq(db.Teams.Count(), 0);
});

Test("and again — order must not matter", () =>
{
    using var db = TestDb.Fresh();
    AddTeam(db, "only", "solo");
    Eq(db.Teams.Count(), 1);
});

Test("an unknown team has no members, and does not throw", () =>
{
    using var db = TestDb.Fresh();
    Eq(MemberNames(db, 999), new List<string>());
});

Test("a team with no members is valid", () =>
{
    using var seed = TestDb.Fresh();
    var team = AddTeam(seed, "empty");

    using var fresh = TestDb.Connect();
    Eq(MemberNames(fresh, team.Id), new List<string>());
});

Test("two teams' members do not mix", () =>
{
    using var seed = TestDb.Fresh();
    var core = AddTeam(seed, "core", "ada");
    var ops = AddTeam(seed, "ops", "bob");

    using var fresh = TestDb.Connect();
    Eq(MemberNames(fresh, core.Id), new[] { "ada" });
    Eq(MemberNames(fresh, ops.Id), new[] { "bob" });
});

Test("the seeding context flatters you — the fresh one tells the truth", () =>
{
    using var seed = TestDb.Fresh();
    var team = AddTeam(seed, "core", "ada");

    // The seeding context still TRACKS the members, so the navigation is
    // populated with no query. That is relationship fixup, not a real load.
    var tracked = seed.Teams.Single(t => t.Id == team.Id);
    Eq(tracked.Members.Count, 1);

    // A fresh context has nothing tracked: the navigation is empty until
    // something actually asks the database for it.
    using var fresh = TestDb.Connect();
    Eq(fresh.Teams.Single(t => t.Id == team.Id).Members.Count, 0);

    // …which is why MemberNames must query rather than read a navigation.
    Eq(MemberNames(TestDb.Connect(), team.Id), new[] { "ada" });
});

// ──────────────────────────── types ──────────────────────────────────────

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<Member> Members { get; set; } = [];
}

public class Member
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
}

public class ShopDb(DbContextOptions<ShopDb> options) : DbContext(options)
{
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<Member> Members => Set<Member>();
}

// Fresh()   → a brand new private database, and a context over it
// Connect() → ANOTHER context over the same database (a second "request")
static class TestDb
{
    private static SqliteConnection? _connection;

    public static ShopDb Fresh()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();      // held open, or SQLite discards the database

        var db = Connect();
        db.Database.EnsureCreated();
        return db;
    }

    public static ShopDb Connect()
        => new(new DbContextOptionsBuilder<ShopDb>().UseSqlite(_connection!).Options);
}
