// ─────────────────────────────────────────────────────────────────────────
//  04 · polymorphic JSON                                  ★★☆ core
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
//  hint: an unmapped subtype throws `NotSupportedException` on serialize —
//        which is the compiler-equivalent of module 09/03's missing arm
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
string Write(Payment payment)
{
    throw new NotImplementedException();
}

Payment? Read(string json)
{
    throw new NotImplementedException();
}

List<Payment> ReadList(string json)
{
    throw new NotImplementedException();
}

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

// Add the polymorphism attributes. The discriminator property is "kind";
// the names are "card", "cash" and "invoice". Crypto is deliberately NOT
// mapped — the eighth test depends on that.
public abstract record Payment(decimal Amount);

public sealed record Card(string Last4, decimal Amount) : Payment(Amount);
public sealed record Cash(decimal Amount) : Payment(Amount);
public sealed record Invoice(int Days, decimal Amount) : Payment(Amount);
public sealed record Crypto(decimal Amount) : Payment(Amount);
