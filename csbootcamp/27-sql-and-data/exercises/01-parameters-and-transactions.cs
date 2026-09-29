// ─────────────────────────────────────────────────────────────────────────
//  01 · parameters and transactions                       ★★★ stretch
//  concepts: SQL injection · parameterisation · atomicity · rollback
//  run: dotnet run 01-parameters-and-transactions.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Two rules, and violating either is a production incident.
//
//  **1. Never concatenate user input into SQL.**
//
//      $"SELECT * FROM Users WHERE Name = '{name}'"      ← injection
//      "SELECT * FROM Users WHERE Name = $name"          ← parameter
//
//  A parameter is not "escaping done for you" — the value never becomes part
//  of the statement at all. The database parses the SQL once and then
//  receives the value separately, so there is nothing for an attacker to
//  break out of. Escaping is a filter you can get wrong; parameters are
//  structural.
//
//  **2. A multi-step change is one transaction, or it is a bug.**
//
//  Debit one account, credit another. If the second fails and the first
//  already committed, money has vanished. `BeginTransaction` + `Commit`, and
//  anything that throws in between rolls the whole thing back.
//
//  hint: `command.Parameters.AddWithValue("$name", name)` — the $ prefix is
//        SQLite's; SQL Server uses @
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Data.Sqlite@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Data.Sqlite;

// Find accounts whose owner matches EXACTLY. Must be injection-proof.
List<string> FindByOwner(SqliteConnection db, string owner)
{
    throw new NotImplementedException();
}

// Move `amount` from one account to another, atomically.
// Throws InvalidOperationException (and changes NOTHING) if the source
// lacks the funds or either account is missing.
void Transfer(SqliteConnection db, string from, string to, decimal amount)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a normal lookup works", () =>
{
    using var db = Seeded();
    Eq(FindByOwner(db, "ada"), new[] { "ada-current" });
});

Test("an owner with no accounts returns nothing", () =>
{
    using var db = Seeded();
    Eq(FindByOwner(db, "nobody"), new List<string>());
});

Test("a quote in the input is data, not syntax", () =>
{
    // Concatenation would produce a syntax error here.
    using var db = Seeded();
    Eq(FindByOwner(db, "O'Brien"), new[] { "obrien-current" });
});

Test("a classic injection payload finds nothing and breaks nothing", () =>
{
    // Concatenated, this returns EVERY row. Parameterised, it looks for an
    // owner literally named "' OR '1'='1" — and there isn't one.
    using var db = Seeded();
    Eq(FindByOwner(db, "' OR '1'='1"), new List<string>());
});

Test("a destructive payload does not execute", () =>
{
    using var db = Seeded();
    FindByOwner(db, "'; DROP TABLE Accounts; --");

    // The table is still there.
    Eq(FindByOwner(db, "ada"), new[] { "ada-current" });
});

Test("a successful transfer moves the money", () =>
{
    using var db = Seeded();
    Transfer(db, "ada-current", "bob-current", 30m);

    Eq(Balance(db, "ada-current"), 70m);
    Eq(Balance(db, "bob-current"), 80m);
});

Test("a transfer conserves the total", () =>
{
    using var db = Seeded();
    var before = Balance(db, "ada-current") + Balance(db, "bob-current");

    Transfer(db, "ada-current", "bob-current", 30m);

    Eq(Balance(db, "ada-current") + Balance(db, "bob-current"), before);
});

Test("insufficient funds is refused", () =>
{
    using var db = Seeded();
    Throws<InvalidOperationException>(() => Transfer(db, "ada-current", "bob-current", 1000m));
});

Test("a refused transfer leaves BOTH balances untouched", () =>
{
    // The atomicity test: the debit must not survive the failed credit.
    using var db = Seeded();
    try { Transfer(db, "ada-current", "bob-current", 1000m); } catch { }

    Eq(Balance(db, "ada-current"), 100m);
    Eq(Balance(db, "bob-current"), 50m);
});

Test("a transfer to a missing account rolls back the debit", () =>
{
    using var db = Seeded();
    try { Transfer(db, "ada-current", "no-such-account", 10m); } catch { }

    Eq(Balance(db, "ada-current"), 100m);
});

Test("transferring the full balance is allowed", () =>
{
    using var db = Seeded();
    Transfer(db, "ada-current", "bob-current", 100m);

    Eq(Balance(db, "ada-current"), 0m);
});

// ──────────────────────────── helpers ────────────────────────────────────

decimal Balance(SqliteConnection db, string account)
{
    using var command = db.CreateCommand();
    command.CommandText = "SELECT Balance FROM Accounts WHERE Id = $id";
    command.Parameters.AddWithValue("$id", account);
    return Convert.ToDecimal(command.ExecuteScalar());
}

SqliteConnection Seeded()
{
    var db = new SqliteConnection("Data Source=:memory:");
    db.Open();

    using var create = db.CreateCommand();
    create.CommandText = """
        CREATE TABLE Accounts (Id TEXT PRIMARY KEY, Owner TEXT, Balance TEXT);
        INSERT INTO Accounts VALUES ('ada-current', 'ada', '100');
        INSERT INTO Accounts VALUES ('bob-current', 'bob', '50');
        INSERT INTO Accounts VALUES ('obrien-current', 'O''Brien', '10');
        """;
    create.ExecuteNonQuery();
    return db;
}
