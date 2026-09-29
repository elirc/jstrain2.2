// ─────────────────────────────────────────────────────────────────────────
//  06 · tolerant contracts — SOLUTION                     ★★★ stretch
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
//  Walkthrough:
//  Two methods, and both of them are about a distinction the type system does
//  not make for you.
//
//  **`JsonStringEnumConverter` should be on essentially every API you write.**
//  The default writes an enum as its underlying integer, which binds your
//  wire format to declaration ORDER. Insert a member in the middle a year
//  later and every stored `"status":1` now means something different — no
//  error, no migration, just records that quietly changed meaning. The third
//  test pins `(int)Status.Suspended == 1` to make that concrete.
//
//  Names are stable across reordering, readable in a log, and greppable. The
//  cost is a few bytes per payload.
//
//  **`required` turns a missing field into a `JsonException` at the
//  boundary.** Without it, `Name` is null, nothing complains, and the
//  `NullReferenceException` arrives three layers in with a stack trace
//  pointing at innocent code. `System.Text.Json` honours `required` natively
//  — which is worth knowing, because it means the CLR's initialisation rule
//  and your wire contract agree for free.
//
//  **Missing versus null is the PATCH problem**, and a plain `JsonElement` is
//  the cheapest honest answer:
//
//      property absent   →  ValueKind == Undefined  (default(JsonElement))
//      "nickname": null  →  ValueKind == Null
//      "nickname": "Ace" →  ValueKind == String
//
//  Note that `JsonElement?` does NOT work here: System.Text.Json maps a JSON
//  null onto the C# null for a nullable value type, so "absent" and "null"
//  collapse again. The undefined/null distinction only survives on the
//  non-nullable JsonElement.
//
//  Three states, three representations. A plain `string?` collapses the first
//  two, which means a PATCH endpoint literally cannot express "clear this
//  field" — and the usual workaround is a magic sentinel like `""`, which
//  then cannot be a real value.
//
//  The seventh test walks the whole PATCH decision to make the point: absent
//  keeps the stored value, null clears it, a string replaces it. That is
//  three different outcomes from one field, and the alternative is a second
//  `NicknameSpecified` boolean beside every optional property.
//
//  **Tolerant by default, strict where a typo should hurt.** Ignoring unknown
//  properties is right for an API: a newer client sending a field you have
//  not deployed yet should not get a 400, and that is what lets the two sides
//  deploy independently. `UnmappedMemberHandling.Disallow` is right for
//  configuration files, where `"conection"` silently doing nothing is a much
//  worse outcome than a startup failure.
//
//  Same serializer, opposite policies, chosen per use — which is the general
//  shape of every decision in this file.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// The options this API uses: enums as strings, unknown properties tolerated.
JsonSerializerOptions Options() => new()
{
    // Names, not numbers: an enum's integer value is its declaration ORDER,
    // and reordering must not silently rewrite stored payloads.
    Converters = { new JsonStringEnumConverter() },

    // The default, stated explicitly: a newer client sending a field we do
    // not know about is not an error.
    UnmappedMemberHandling = JsonUnmappedMemberHandling.Skip,
};

// What did the caller say about the nickname?
//   "absent"  – the property was not in the payload at all
//   "clear"   – it was sent as null
//   the value – it was sent as a string
string NicknameIntent(string json)
{
    var patch = JsonSerializer.Deserialize<AccountPatch>(json, Options())!;

    // Three states, three answers, from ONE property. A plain string? would
    // collapse the first two and make "clear this field" inexpressible.
    return patch.Nickname.ValueKind switch
    {
        JsonValueKind.Undefined => "absent",     // the property was not sent
        JsonValueKind.Null => "clear",           // it was sent as null
        _ => patch.Nickname.GetString()!,
    };
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
