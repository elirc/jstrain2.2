// ─────────────────────────────────────────────────────────────────────────
//  01 · System.Text.Json — SOLUTION                       ★★☆ core
//  concepts: options · naming policies · nulls · round-tripping
//  run: dotnet run 01-system-text-json.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `System.Text.Json` is strict by default, and the defaults differ from
//  ASP.NET Core's web defaults — which is why the same object serialises
//  differently in a unit test and in a controller:
//
//      JsonSerializer defaults   PascalCase out, case-SENSITIVE in
//      ASP.NET Core web defaults camelCase out, case-INSENSITIVE in
//
//  So a DTO that round-trips fine in a test can fail to bind in production,
//  or vice versa. Always pass explicit options for anything you care about.
//
//  Other defaults worth knowing:
//    · nulls ARE written unless you ask otherwise
//    · fields are ignored; only PROPERTIES are serialised
//    · read-only properties are written but not read back
//    · unknown JSON members are silently ignored on deserialise
//
//  Walkthrough:
//  One `JsonSerializerOptions`, held in a static class and reused. That is
//  not a style preference: the options object caches type metadata the first
//  time it serialises a type, and constructing a fresh one per call throws
//  that cache away every time. It is one of the most common measurable
//  performance mistakes with this API.
//
//  `PropertyNamingPolicy = CamelCase` on the way out and
//  `PropertyNameCaseInsensitive = true` on the way in together reproduce
//  ASP.NET Core's **web defaults**. The raw serializer defaults are
//  PascalCase out and case-SENSITIVE in — which is why a DTO can round-trip
//  perfectly in a unit test and then fail to bind in a controller, or the
//  reverse. If the shape matters, pass options explicitly rather than
//  inheriting whichever default you happen to be standing in.
//
//  `DefaultIgnoreCondition = WhenWritingNull` is what makes `email` vanish
//  rather than appear as `"email": null`. Worth choosing deliberately: some
//  clients treat an absent member and a null member differently (module
//  13/07's PATCH semantics depend on exactly that distinction), so "omit
//  nulls" is a contract decision, not tidiness.
//
//  `[JsonPropertyName]` beats the naming policy for a single member — the
//  right tool when an external API insists on `account_id` and your C# wants
//  `Id`. `[JsonIgnore]` keeps a member out entirely, which is a second line
//  of defence behind the DTO boundary from module 17/04.
//
//  Enums serialise as **numbers** by default, which makes an API's payloads
//  meaningless to a human and brittle to reorder — inserting a value shifts
//  every number after it. `JsonStringEnumConverter` writes the name instead.
//  Prefer it on any enum that crosses the wire.
//
//  Note what is silent: unknown JSON members are ignored, and a missing
//  member becomes the type default rather than an error. If a field is
//  genuinely required, validate after deserialising (module 16) — the
//  serializer will not do it for you.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// Serialise with camelCase names and NO null members in the output.
string ToJson<T>(T value) => JsonSerializer.Serialize(value, Json.Options);

// Deserialise, accepting either casing.
T? FromJson<T>(string json) => JsonSerializer.Deserialize<T>(json, Json.Options);

// ──────────────────────────── tests ──────────────────────────────────────

Test("properties are written in camelCase", () =>
    Eq(ToJson(new Person("Ada", 36, null)),
       "{\"name\":\"Ada\",\"age\":36}"));

Test("null members are omitted", () =>
{
    // "email" is absent entirely, not present as null.
    Ok(!ToJson(new Person("Ada", 36, null)).Contains("email"));
});

Test("a present value is written", () =>
    Ok(ToJson(new Person("Ada", 36, "a@b.c")).Contains("\"email\":\"a@b.c\"")));

Test("deserialising accepts camelCase", () =>
{
    var person = FromJson<Person>("{\"name\":\"Ada\",\"age\":36}");

    Eq(person?.Name, "Ada");
    Eq(person?.Age, 36);
});

Test("deserialising also accepts PascalCase", () =>
{
    // Case-insensitive matching is what ASP.NET Core does; the raw
    // serializer default is case-SENSITIVE and would leave Name null.
    Eq(FromJson<Person>("{\"Name\":\"Ada\",\"Age\":36}")?.Name, "Ada");
});

Test("unknown members are ignored, not an error", () =>
{
    var person = FromJson<Person>("{\"name\":\"Ada\",\"age\":36,\"extra\":true}");
    Eq(person?.Name, "Ada");
});

Test("a missing member gets the type default", () =>
{
    var person = FromJson<Person>("{\"name\":\"Ada\"}");

    Eq(person?.Age, 0);          // not an error — just the default
    Eq(person?.Email, null);
});

Test("round-tripping preserves the value", () =>
{
    var original = new Person("Ada", 36, "a@b.c");
    Eq(FromJson<Person>(ToJson(original)), original);
});

Test("[JsonPropertyName] overrides the naming policy", () =>
    Ok(ToJson(new Account("acc-1", 10m)).Contains("\"account_id\":\"acc-1\"")));

Test("[JsonIgnore] keeps a member out of the JSON entirely", () =>
{
    var json = ToJson(new Account("acc-1", 10m) { InternalNote = "secret" });
    Ok(!json.Contains("secret"));
});

Test("an enum serialises as its NAME, not its number", () =>
    Ok(ToJson(new Ticket(Status.Open)).Contains("\"status\":\"Open\"")));

Test("malformed JSON throws rather than returning a broken object", () =>
    Throws<JsonException>(() => FromJson<Person>("{not json")));

// ──────────────────────────── types ──────────────────────────────────────

public record Person(string Name, int Age, string? Email);

public record Account(
    [property: JsonPropertyName("account_id")] string Id,
    decimal Balance)
{
    [JsonIgnore]
    public string? InternalNote { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<Status>))]
public enum Status { Open, Closed }

public record Ticket(Status Status);

// Top-level statements cannot hold static fields, so the options live here.
// ONE instance, reused: it caches type metadata on first use.
static class Json
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}
