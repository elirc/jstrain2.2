// ─────────────────────────────────────────────────────────────────────────
//  06 · tolerant contracts                                ★★★ stretch
//  concepts: missing vs null · enums as strings · required · versioning
//  run: dotnet run 06-tolerant-contracts.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An API contract has to survive clients that are older than it, newer than
//  it, and written by someone who read the docs once. Four decisions do most
//  of that work.
//
//   1. **Enums as strings, never as numbers.** The default serialises an
//      enum as its integer value, so inserting a member in the middle
//      silently reassigns every stored payload. `JsonStringEnumConverter`
//      makes the wire value the NAME, which is a contract you can keep.
//
//   2. **"Missing" and "null" are different facts.** A PATCH that omits a
//      field means "leave it alone"; one that sends `null` means "clear it".
//      A plain `string?` cannot tell them apart — both arrive as null.
//
//   3. **`required` for what you cannot proceed without.** A missing
//      required property is a `JsonException` at deserialise time rather
//      than a null that surfaces three layers away.
//
//   4. **Unknown properties are tolerated by default**, and that is usually
//      right — a newer client sending a field you do not know about should
//      not get a 400. Turn it off (`UnmappedMemberHandling.Disallow`) only
//      where a typo in a config file should be loud.
//
//  hint: for (2), a plain `JsonElement` property has `ValueKind ==
//        Undefined` when the field was MISSING and `ValueKind == Null` when
//        it was sent as null — three states, one property
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// The options this API uses: enums as strings, unknown properties tolerated.
JsonSerializerOptions Options()
{
    throw new NotImplementedException();
}

// What did the caller say about the nickname?
//   "absent"  – the property was not in the payload at all
//   "clear"   – it was sent as null
//   the value – it was sent as a string
string NicknameIntent(string json)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an enum is written as its NAME", () =>
{
    var json = JsonSerializer.Serialize(new Account { Name = "ada", Status = Status.Suspended }, Options());

    Ok(json.Contains("\"Suspended\""), json);
    Ok(!json.Contains("\":1"), json);
});

Test("an enum is read from its name", () =>
{
    const string incoming = """{"Name":"ada","Status":"Closed"}""";

    Eq(JsonSerializer.Deserialize<Account>(incoming, Options())!.Status, Status.Closed);
});

Test("reordering the enum would have broken numeric payloads", () =>
{
    // Status.Suspended is 1 today. Insert a member above it and every stored
    // `"status":1` now means something else. Names do not move.
    Eq((int)Status.Suspended, 1);
    Ok(JsonSerializer.Serialize(new Account { Name = "ada", Status = Status.Suspended }, Options())
        .Contains("Suspended"));
});

Test("a required property that is missing is an error", () =>
{
    // Not a null that shows up three layers away as a NullReference.
    Throws<JsonException>(() =>
        JsonSerializer.Deserialize<Account>("""{"Status":"Active"}""", Options()));
});

Test("unknown properties are tolerated", () =>
{
    // A newer client sending a field we do not know about is not an error.
    const string incoming = """{"Name":"ada","Status":"Active","futureField":42}""";

    Eq(JsonSerializer.Deserialize<Account>(incoming, Options())!.Name, "ada");
});

Test("an absent field and a null field are different", () =>
{
    Eq(NicknameIntent("""{"Name":"ada"}"""), "absent");
    Eq(NicknameIntent("""{"Name":"ada","Nickname":null}"""), "clear");
    Eq(NicknameIntent("""{"Name":"ada","Nickname":"Addy"}"""), "Addy");
});

Test("that distinction is what makes PATCH implementable", () =>
{
    // "absent" leaves the stored value alone; "clear" removes it. With a
    // plain string? both arrive as null and one of the two is impossible.
    var stored = "Addy";

    foreach (var (payload, expected) in new[]
    {
        ("""{"Name":"ada"}""", "Addy"),
        ("""{"Name":"ada","Nickname":null}""", null),
        ("""{"Name":"ada","Nickname":"Ace"}""", "Ace"),
    })
    {
        var intent = NicknameIntent(payload);
        var result = intent switch
        {
            "absent" => stored,
            "clear" => null,
            _ => intent,
        };

        Eq(result, expected);
    }
});

Test("a strict reader rejects what the tolerant one accepted", () =>
{
    // Same payload, opposite policy. Useful for a config file, where a typo
    // should be loud rather than silently ignored.
    var strict = new JsonSerializerOptions(Options())
    {
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
    };

    const string incoming = """{"Name":"ada","Status":"Active","typoField":1}""";

    Throws<JsonException>(() => JsonSerializer.Deserialize<Account>(incoming, strict));
});

// ──────────────────────────── types ──────────────────────────────────────

public enum Status { Active, Suspended, Closed }

public sealed class Account
{
    public required string Name { get; init; }
    public Status Status { get; init; }
}

// A patch where "missing" and "null" mean different things.
public sealed class AccountPatch
{
    public string? Name { get; set; }

    // An absent property leaves this at default(JsonElement), whose
    // ValueKind is Undefined. A JSON null gives ValueKind Null.
    public JsonElement Nickname { get; set; }
}
