// ─────────────────────────────────────────────────────────────────────────
//  03 · testing endpoints                                 ★★★ stretch
//  concepts: swapping a service in tests · what to assert over HTTP
//  run: dotnet run 03-testing-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An endpoint test should exercise the REAL routing, binding, status codes
//  and serialisation — that is the part you cannot check any other way — while
//  substituting the parts that make tests slow or unrepeatable (a payment
//  provider, an email service, a third-party API).
//
//  The seam is the same one as exercise 01, reached through DI:
//
//      builder.Services.AddSingleton<IRates>(fakeRates);   // test double
//
//  Register the fake and the real registration is simply never used.
//
//  What to assert, in order of value:
//    1. the STATUS CODE — it is the API's contract
//    2. the BODY SHAPE — field names and types clients depend on
//    3. the SIDE EFFECT — what the fake recorded
//  and never the internal call sequence.
//
//  Build the endpoints, then make the tests pass against a fake rates
//  service you can make slow, broken, or precise on demand.
//
//  hint: `Web.Serve(services, configure)` takes a builder callback first —
//        register the fake there
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Map:
//   GET /convert?from=USD&to=EUR&amount=10
//     → 200 {"from":"USD","to":"EUR","amount":10,"converted":9.10}
//       (converted = amount * rate, rounded to 2dp, away from zero)
//     → 400 if amount is negative
//     → 404 if the pair is unknown
//     → 503 if the rates service throws
void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a known pair converts", async () =>
{
    var rates = new FakeRates { ["USD:EUR"] = 0.91m };
    await using var app = await Serve(rates);

    // 9.10, not 9.1: decimal carries its SCALE, and Math.Round(_, 2) sets
    // that scale to 2 — so the trailing zero survives serialisation.
    Eq(await app.GetBody("/convert?from=USD&to=EUR&amount=10"),
       "{\"from\":\"USD\",\"to\":\"EUR\",\"amount\":10,\"converted\":9.10}");
});

Test("the result is rounded to 2dp", async () =>
{
    var rates = new FakeRates { ["USD:EUR"] = 0.9166m };
    await using var app = await Serve(rates);

    // 10 * 0.9166 = 9.166 → 9.17
    Ok((await app.GetBody("/convert?from=USD&to=EUR&amount=10")).Contains("9.17"));
});

Test("an unknown pair is 404", async () =>
{
    await using var app = await Serve(new FakeRates());
    Eq(await app.GetStatus("/convert?from=USD&to=XYZ&amount=10"), 404);
});

Test("a negative amount is 400", async () =>
{
    var rates = new FakeRates { ["USD:EUR"] = 0.91m };
    await using var app = await Serve(rates);

    Eq(await app.GetStatus("/convert?from=USD&to=EUR&amount=-5"), 400);
});

Test("a non-numeric amount is 400 from the framework", async () =>
{
    // Binding failure — you write no code for this.
    var rates = new FakeRates { ["USD:EUR"] = 0.91m };
    await using var app = await Serve(rates);

    Eq(await app.GetStatus("/convert?from=USD&to=EUR&amount=lots"), 400);
});

Test("a broken rates service is 503, not 500", async () =>
{
    // The scenario you cannot produce with the real service.
    var rates = new FakeRates { FailWith = new HttpRequestException("upstream down") };
    await using var app = await Serve(rates);

    Eq(await app.GetStatus("/convert?from=USD&to=EUR&amount=10"), 503);
});

Test("the 503 body does not leak the upstream error", async () =>
{
    var rates = new FakeRates { FailWith = new HttpRequestException("token abc123 rejected") };
    await using var app = await Serve(rates);

    var body = await app.GetBody("/convert?from=USD&to=EUR&amount=10");
    Ok(!body.Contains("abc123"), "internal detail must not reach the client");
});

Test("the endpoint really asked the service", async () =>
{
    // Assert the side effect the fake RECORDED — not the call sequence.
    var rates = new FakeRates { ["USD:EUR"] = 0.91m };
    await using var app = await Serve(rates);

    await app.GetBody("/convert?from=USD&to=EUR&amount=10");
    Eq(rates.Lookups, new[] { "USD:EUR" });
});

Test("zero is allowed — it is not negative", async () =>
{
    var rates = new FakeRates { ["USD:EUR"] = 0.91m };
    await using var app = await Serve(rates);

    Eq(await app.GetStatus("/convert?from=USD&to=EUR&amount=0"), 200);
});

// ──────────────────────────── helpers ────────────────────────────────────

async Task<ServedApp> Serve(FakeRates rates)
    => await Web.Serve(
        builder => builder.Services.AddSingleton<IRates>(rates),
        MapRoutes);

// ──────────────────────────── types ──────────────────────────────────────

public interface IRates
{
    // Null when the pair is unknown. May throw if the upstream is down.
    decimal? Get(string from, string to);
}

// A rates service you fully control: seed pairs, force failures, and see
// what was asked for.
public class FakeRates : IRates
{
    private readonly Dictionary<string, decimal> _rates = [];

    public List<string> Lookups { get; } = [];
    public Exception? FailWith { get; set; }

    public decimal this[string pair] { set => _rates[pair] = value; }

    public decimal? Get(string from, string to)
    {
        if (FailWith is not null) throw FailWith;

        var pair = $"{from}:{to}";
        Lookups.Add(pair);
        return _rates.TryGetValue(pair, out var rate) ? rate : null;
    }
}

public record Conversion(string From, string To, decimal Amount, decimal Converted);
