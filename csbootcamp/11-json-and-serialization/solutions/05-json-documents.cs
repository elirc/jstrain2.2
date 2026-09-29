// ─────────────────────────────────────────────────────────────────────────
//  05 · JSON documents — SOLUTION                         ★★☆ core
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
//  Walkthrough:
//  Four small methods, and the interesting part is which API each one picks.
//
//  **`?[...]` all the way down.** `node["user"]["email"]` throws a
//  `NullReferenceException` when there is no `user`; `node["user"]?["email"]`
//  gives null. Since the whole reason to be working with a node tree is that
//  you did not model the payload, assuming its shape is precisely the mistake
//  to avoid. Every hop gets a `?`.
//
//  There is a second null in play: a property present with a JSON `null`
//  parses to a **null `JsonNode`**, so the same `?.` handles "missing" and
//  "explicitly null" identically. Convenient here; note that exercise 06 is
//  about the case where you need to tell them apart.
//
//  **`AsArray()` after a null check, not before.** `TagsOf` returns an empty
//  list for a missing `tags` rather than null, because a caller that has to
//  null-check a collection will forget once.
//
//  **`Stamp` is the argument for node trees over DTOs.** Parse, add one
//  property, write it back — and `meta.retries`, which no type in this file
//  has ever heard of, survives untouched. Deserialise into a DTO and
//  re-serialise instead, and everything you did not model is gone. That is
//  the same lesson as `[JsonExtensionData]` in exercise 03, reached from the
//  other direction.
//
//  **`JsonDocument` is disposable, and its elements die with it.**
//  `TopLevelNames` extracts the strings INSIDE the `using` block. Return a
//  `JsonElement` out of one instead and you get an
//  `ObjectDisposedException` — or worse, silently wrong data, because the
//  underlying buffer has gone back to the pool and may already hold someone
//  else's payload. If you need an element to outlive the document, `.Clone()`
//  it.
//
//  **Which to reach for:** `JsonNode` when you are modifying or when
//  convenience wins, `JsonDocument` when you are only reading and it is on a
//  hot path — it parses into a pooled buffer and allocates far less. Neither
//  is a substitute for a DTO when you actually know the shape.
//
//  Malformed input is a `JsonException` from both, which is the right
//  behaviour: a payload that is not JSON is not an empty payload.
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
// A `?` at every hop: the point of a node tree is that the shape is not
// guaranteed.
string? EmailOf(string json) =>
    JsonNode.Parse(json)?["user"]?["email"]?.GetValue<string>();

// Every tag, or an empty list when there are none.
List<string> TagsOf(string json)
{
    var tags = JsonNode.Parse(json)?["tags"]?.AsArray();

    // Empty rather than null: a caller who has to null-check a collection
    // will forget once.
    if (tags is null) return [];

    return tags.Select(tag => tag!.GetValue<string>()).ToList();
}

// Return the payload with an extra top-level "received" property set to
// `at`, everything else untouched.
string Stamp(string json, string at)
{
    var node = JsonNode.Parse(json)!;

    // Everything we never modelled — meta.retries, say — comes through
    // untouched. A DTO round trip would have deleted it.
    node["received"] = at;

    return node.ToJsonString();
}

// The names of the top-level properties, in document order. Use
// JsonDocument, and do not leak an element out of the using block.
List<string> TopLevelNames(string json)
{
    using var document = JsonDocument.Parse(json);

    // The strings are extracted INSIDE the using block. A JsonElement that
    // outlives its document reads from a buffer already back in the pool.
    return document.RootElement.EnumerateObject()
        .Select(property => property.Name)
        .ToList();
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
