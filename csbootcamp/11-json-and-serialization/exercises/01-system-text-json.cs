// ─────────────────────────────────────────────────────────────────────────
//  01 · System.Text.Json                                  ★★☆ core
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
//  hint: one `JsonSerializerOptions` instance, reused — constructing one per
//        call defeats its internal metadata cache and is genuinely slow
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// Serialise with camelCase names and NO null members in the output.
string ToJson<T>(T value)
{
    throw new NotImplementedException();
}

// Deserialise, accepting either casing.
T? FromJson<T>(string json)
{
    throw new NotImplementedException();
}

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
