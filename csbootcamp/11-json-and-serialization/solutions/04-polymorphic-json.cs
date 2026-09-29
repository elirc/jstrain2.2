// ─────────────────────────────────────────────────────────────────────────
//  04 · polymorphic JSON — SOLUTION                       ★★☆ core
//  concepts: JsonDerivedType · type discriminators · closed hierarchies
//  run: dotnet run 04-polymorphic-json.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Serialising a `Payment` that is really a `Card` writes only the `Payment`
//  properties — the runtime type is ignored, because the serializer works
//  from the DECLARED type. Deserialising it back is worse: there is no way to
//  know which subtype the payload was.
//
//  `[JsonPolymorphic]` and `[JsonDerivedType]` fix both ends by writing a
//  **discriminator** into the payload:
//
//      [JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
//      [JsonDerivedType(typeof(Card), "card")]
//      [JsonDerivedType(typeof(Cash), "cash")]
//      public abstract record Payment;
//
//      {"kind":"card","last4":"4242","amount":19.99}
//
//  Two rules that are easy to get wrong:
//
//   · **The discriminator is part of your wire contract.** Use explicit
//     string names, not the default (which is the .NET type name and changes
//     when you rename or move a class).
//   · **The discriminator must come first in the payload.** The reader needs
//     it before it can pick a type, and `System.Text.Json` will look ahead
//     for it — but a hand-built payload that puts it last is asking for
//     trouble with other parsers.
//
//  Walkthrough:
//  Three one-line helpers and four attributes.
//
//  **`Serialize<Payment>(payment)` — the explicit type argument matters.**
//  `JsonSerializer.Serialize` writes the DECLARED type, so calling it on a
//  variable typed `Card` produces a Card with no discriminator, and the same
//  payload then fails to deserialise as a `Payment`. Serialising through the
//  base type is what makes the polymorphic machinery run at all. This is the
//  single most common way people conclude "polymorphic JSON does not work".
//
//  **The discriminator names are string literals on purpose.** Leave them out
//  and the default is the .NET type name — so renaming `Card`, or moving it
//  into a namespace, silently invalidates every payload already sitting in a
//  queue or a database column. Explicit names decouple the wire format from
//  your class names, which is the entire reason you are allowed to refactor.
//
//  **`TypeDiscriminatorPropertyName = "kind"`** replaces the default `$type`.
//  `$type` is fine internally and unpleasant in a public API — it looks like
//  an implementation detail leaking, and some clients choke on a leading `$`.
//
//  **`Crypto` is deliberately unmapped, and the failure is loud.**
//  Serialising it throws `NotSupportedException` rather than writing a
//  discriminator-free `Payment` that nothing can read back. That is the same
//  design decision as module 09/03's missing switch arm: when the set is
//  closed, an unhandled member should stop the program, not produce a
//  plausible-looking wrong answer.
//
//  An unknown discriminator on the way IN is a `JsonException` for the same
//  reason — better than materialising a base `Payment` with default values
//  that some downstream `switch` then quietly mishandles.
//
//  **Collections work with no extra effort**: `List<Payment>` deserialises
//  each element by its own discriminator, which is what the last test shows.
//  That is the case that makes this feature worth the attributes — a mixed
//  array is otherwise a hand-written converter.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// All three use camelCase property names — the payloads in the tests are
// written that way, and so is every web API you will meet.
//
// Serialize as the BASE type. `JsonSerializer.Serialize(card)` on a variable
// typed `Card` writes a Card and no discriminator — the declared type is what
// the serializer works from, which is half of why this is confusing.
// <Payment> explicitly: Serialize writes the DECLARED type, so calling
// this with a `Card`-typed variable would emit no discriminator at all.
string Write(Payment payment) => JsonSerializer.Serialize<Payment>(payment, Web());

Payment? Read(string json) => JsonSerializer.Deserialize<Payment>(json, Web());

// Each element resolves by its own discriminator — no extra work.
List<Payment> ReadList(string json) => JsonSerializer.Deserialize<List<Payment>>(json, Web())!;

// camelCase, because that is what the payloads use. The discriminator name
// is set by the attribute and is NOT affected by the naming policy.
JsonSerializerOptions Web() => new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

// ──────────────────────────── tests ──────────────────────────────────────

Test("the discriminator is written", () =>
{
    var json = Write(new Card("4242", 19.99m));

    Ok(json.Contains("\"kind\":\"card\""), json);
});

Test("the subtype's own properties are written", () =>
{
    // Without the attributes this is the failure: only Payment's members
    // survive, and Last4 vanishes.
    var json = Write(new Card("4242", 19.99m));

    Ok(json.Contains("4242"), json);
});

Test("it comes back as the right subtype", () =>
{
    var json = Write(new Card("4242", 19.99m));
    var payment = Read(json);

    Ok(payment is Card, payment?.GetType().Name ?? "null");
    Eq(((Card)payment!).Last4, "4242");
});

Test("every subtype round-trips", () =>
{
    Payment[] originals = [new Card("4242", 1m), new Cash(2m), new Invoice(30, 3m)];

    foreach (var original in originals)
    {
        var back = Read(Write(original));

        Eq(back, original);
    }
});

Test("the discriminator names are OURS, not the .NET type names", () =>
{
    // The default would write "Card" — and then renaming the class breaks
    // every stored payload. Explicit strings are a contract.
    var json = Write(new Invoice(30, 3m));

    Ok(json.Contains("\"kind\":\"invoice\""), json);
    Ok(!json.Contains("Invoice"), json);
});

Test("a payload can be read without knowing the subtype in advance", () =>
{
    const string incoming = """{"kind":"cash","amount":5.00}""";

    var payment = Read(incoming);

    Eq(payment, new Cash(5.00m));
});

Test("an unknown discriminator is a clear error", () =>
{
    // Better than silently producing a base Payment with default values.
    const string incoming = """{"kind":"crypto","amount":5.00}""";

    Throws<JsonException>(() => Read(incoming));
});

Test("a subtype that was never mapped cannot be written", () =>
{
    // Same shape as module 09/03: an unhandled case fails loudly instead of
    // producing a plausible-looking wrong answer.
    Throws<NotSupportedException>(() => Write(new Crypto(9m)));
});

Test("the total is computed from whatever came back", () =>
{
    const string incoming = """
        [{"kind":"card","last4":"4242","amount":10.00},{"kind":"cash","amount":5.50}]
        """;

    var payments = ReadList(incoming);

    Eq(payments.Sum(p => p.Amount), 15.50m);
});

// ──────────────────────────── your code ──────────────────────────────────

// "kind" rather than the default "$type", and explicit names rather than
// the default .NET type names — both are wire contract, not implementation.
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(Card), "card")]
[JsonDerivedType(typeof(Cash), "cash")]
[JsonDerivedType(typeof(Invoice), "invoice")]
// Crypto is deliberately absent: writing one throws rather than producing a
// payload nothing can read back.
public abstract record Payment(decimal Amount);

public sealed record Card(string Last4, decimal Amount) : Payment(Amount);
public sealed record Cash(decimal Amount) : Payment(Amount);
public sealed record Invoice(int Days, decimal Amount) : Payment(Amount);
public sealed record Crypto(decimal Amount) : Payment(Amount);
