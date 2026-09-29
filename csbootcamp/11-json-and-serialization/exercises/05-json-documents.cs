// ─────────────────────────────────────────────────────────────────────────
//  05 · JSON documents                                    ★★☆ core
//  concepts: JsonNode vs JsonDocument · unknown shapes · safe navigation
//  run: dotnet run 05-json-documents.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Sometimes you do not have a type for the payload — a webhook you forward,
//  a config blob, a third-party response where you need two fields out of
//  forty. Deserialising to a DTO would mean modelling all of it, and
//  modelling it wrongly would drop the rest.
//
//      JsonDocument / JsonElement   read-only, pooled, DISPOSABLE, fastest
//      JsonNode / JsonObject        mutable, ordinary objects, easiest
//
//  Use `JsonNode` when you want to change something, `JsonDocument` when you
//  are only reading and care about allocation. `JsonDocument` is
//  `IDisposable` and its `JsonElement`s become invalid after it is disposed —
//  which is a genuinely nasty bug if you return one from a `using` block.
//
//  Navigation is where the care goes. `node["a"]["b"]` throws on a missing
//  `a`; `node["a"]?["b"]` gives null; `element.TryGetProperty` reports it.
//  Payloads from other people are exactly where you should assume the shape
//  is not what you expect.
//
//  hint: `JsonNode.Parse(json)!["user"]?["email"]?.GetValue<string>()` is the
//        whole safe-navigation idiom in one line
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Nodes;

const string Payload = """
    {
      "id": 7,
      "user": { "name": "Ada", "email": "ada@example.com" },
      "tags": ["alpha", "beta"],
      "meta": { "source": "webhook", "retries": 0 }
    }
    """;

// The user's email, or null if the payload does not have one.
string? EmailOf(string json)
{
    throw new NotImplementedException();
}

// Every tag, or an empty list when there are none.
List<string> TagsOf(string json)
{
    throw new NotImplementedException();
}

// Return the payload with an extra top-level "received" property set to
// `at`, everything else untouched.
string Stamp(string json, string at)
{
    throw new NotImplementedException();
}

// The names of the top-level properties, in document order. Use
// JsonDocument, and do not leak an element out of the using block.
List<string> TopLevelNames(string json)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a nested value is read without a DTO", () =>
    Eq(EmailOf(Payload), "ada@example.com"));

Test("a missing branch is null, not an exception", () =>
{
    // node["user"]["email"] throws here. node["user"]?["email"] does not,
    // and third-party payloads are exactly where that matters.
    Eq(EmailOf("""{"id":7}"""), null);
    Eq(EmailOf("""{"user":{}}"""), null);
});

Test("a null in the payload is also null here", () =>
    Eq(EmailOf("""{"user":{"email":null}}"""), null));

Test("an array is read into a list", () =>
    Eq(TagsOf(Payload), new[] { "alpha", "beta" }));

Test("a missing array is empty, not null", () =>
{
    Eq(TagsOf("""{"id":7}"""), Array.Empty<string>());
    Eq(TagsOf("""{"tags":[]}"""), Array.Empty<string>());
});

Test("stamping adds a property and keeps the rest", () =>
{
    var stamped = Stamp(Payload, "2026-09-02T10:00:00Z");
    var node = JsonNode.Parse(stamped)!;

    Eq(node["received"]!.GetValue<string>(), "2026-09-02T10:00:00Z");
    Eq(node["user"]!["name"]!.GetValue<string>(), "Ada");
    Eq(node["tags"]!.AsArray().Count, 2);
});

Test("stamping does not disturb the nested objects", () =>
{
    // The whole reason to use a node tree rather than deserialise to a DTO
    // and re-serialise: nothing you did not model gets lost.
    var stamped = Stamp(Payload, "now");

    Ok(stamped.Contains("webhook"), stamped);
    Ok(stamped.Contains("\"retries\""), stamped);
});

Test("the top-level names come back in document order", () =>
    Eq(TopLevelNames(Payload), new[] { "id", "user", "tags", "meta" }));

Test("an empty object has no properties", () =>
    Eq(TopLevelNames("{}"), Array.Empty<string>()));

Test("malformed JSON is a JsonException, not a null", () =>
    Throws<JsonException>(() => TopLevelNames("{ not json")));
