# 11 · JSON and Serialization

JSON is the wire format for everything you built in modules 13–19. This
module is about the two things that go wrong: **defaults that differ between
contexts**, and **input whose shape you do not control**.

## The mental model

**1. There are two sets of defaults, and they disagree.**

| | Naming out | Matching in |
| --- | --- | --- |
| `JsonSerializer` defaults | **PascalCase** | **case-sensitive** |
| ASP.NET Core web defaults | camelCase | case-insensitive |

That is why a DTO round-trips perfectly in a unit test and then fails to bind
in a controller. **Pass explicit options for anything you care about.**

```csharp
new JsonSerializerOptions {
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
}
```

**2. Reuse one `JsonSerializerOptions` instance.**

It caches type metadata on first use. Constructing one per call throws that
cache away — one of the most common measurable perf mistakes with this API.

**3. What the serialiser does silently.**

| Situation | Default behaviour |
| --- | --- |
| Unknown JSON member | **ignored** |
| Missing member | the type's **default** — not an error |
| `null` member | **written**, unless you opt out |
| Fields (not properties) | **ignored** |
| Enum | written as a **number** |

None of these is validation. If a field is genuinely required, validate after
deserialising (module 16).

**4. A converter is the hook for shapes you do not control.**

```csharp
public override T Read(ref Utf8JsonReader reader, Type t, JsonSerializerOptions o)
public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions o)
```

**Tolerant on input, strict on output** — accept the shapes real callers
send, emit exactly one shape.

## The details that bite

1. **Never send money as a JSON number.** JSON numbers are IEEE doubles in
   most parsers, so a JavaScript client turns your exact `decimal` back into
   `0.30000000000000004`. Serialise it as a string.

2. **Parse with `InvariantCulture` in a converter.** It runs wherever the
   process runs; a culture-sensitive parse reads `"12.50"` as 1250 in Germany.

3. **A converter is a validation boundary.** Returning a silent default for
   malformed input means a payment of 0 that nobody notices. Throw
   `JsonException`.

4. **Enums default to numbers**, which are meaningless to a human and shift
   if anyone reorders the enum. Use `JsonStringEnumConverter` for anything
   crossing the wire.

5. **`Utf8JsonReader` is a forward-only `ref struct`.** You cannot capture it
   in a lambda, store it, or use it across an `await`.

6. **On entry to `Read` the reader is already on your value's first token.**
   Do not call `Read()` first for a scalar; only loop for an array or object.

7. **"Omit nulls" is a contract decision.** Some clients distinguish an absent
   member from a null one — module 13/07's PATCH semantics depend on exactly
   that.

8. **`[JsonIgnore]` is a second line of defence**, not the first. The DTO
   boundary (module 17/04) is the first.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-system-text-json.cs` | ★★☆ | options, naming, nulls, attributes, round-tripping |
| 02 | `02-custom-converters.cs` | ★★★ | money as a string; a member that is sometimes a scalar |
| 03 | `03-naming-and-shaping.cs` | ★★☆ | wire names, ignore conditions, and keeping fields you did not model |
| 04 | `04-polymorphic-json.cs` | ★★☆ | type discriminators over a closed hierarchy |
| 05 | `05-json-documents.cs` | ★★☆ | `JsonNode`/`JsonDocument` for shapes you have no type for |
| 06 | `06-tolerant-contracts.cs` | ★★★ | enums as strings, `required`, and missing vs null |

**03 and 05 answer the same question twice**: what happens to the fields you
did not model? `[JsonExtensionData]` keeps them on a DTO; a node tree never
loses them in the first place. Get it wrong and a read-modify-write endpoint
silently deletes data it never understood.

**06 is the API-versioning file.** Enums as names rather than numbers, and a
`JsonElement` that can tell "absent" from "null" — which is the difference
between a PATCH endpoint that can clear a field and one that cannot.

Do them in order. **02 is the one you will reach for in anger** — the
"sometimes a string, sometimes an array" API shape is depressingly common,
and a converter is the only clean place to normalise it.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (JSON defaults, DTOs) · **Self-check:** `quizzes/06-aspnetcore-basics.md` · **Next:** `csbootcamp/12-dependency-injection`
