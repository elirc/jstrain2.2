// ─────────────────────────────────────────────────────────────────────────
//  03 · testing endpoints — SOLUTION                      ★★★ stretch
//  concepts: swapping a service in tests · what to assert over HTTP
//  run: dotnet run 03-testing-endpoints.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  One line does the substitution — `AddSingleton<IRates>(rates)` in the
//  builder callback — and everything else in the pipeline stays real. The
//  test exercises actual routing, actual query binding, actual JSON
//  serialisation and actual status codes, while the one genuinely
//  unrepeatable collaborator is under the test's control.
//
//  That balance is the whole point of an endpoint test. Fake too little and
//  the suite is slow and flaky; fake too much and you are testing your
//  mocks. The rule of thumb: **substitute across process boundaries you do
//  not own** (payment providers, email, third-party APIs, sometimes the
//  clock) and **keep everything inside your own process real**.
//
//  Two tests here are only possible because of the fake:
//
//    · "a broken rates service is 503" — you cannot ask a real upstream to
//      fail on cue, and this is precisely the path most likely to be wrong.
//    · "the 503 body does not leak" — the fake's message carries a token, and
//      the test asserts it never reaches the client. That is module 14's
//      lesson, now enforced by a test rather than a code review.
//
//  Note what is asserted and what is not. The last-but-one test checks
//  `rates.Lookups` — a **recorded side effect** — rather than "was `Get`
//  called once with these arguments". Same information, but the result-based
//  version survives you refactoring the handler, adding a cache, or batching
//  the lookup.
//
//  `Math.Round(..., 2, MidpointRounding.AwayFromZero)` for the same reason as
//  module 01: banker's rounding is the default and it is not what an invoice
//  expects.
//
//  A detail the first test pins down: the body says `9.10`, not `9.1`. A
//  `decimal` carries its SCALE as part of the value, and `Math.Round(x, 2)`
//  sets that scale to 2 — so the trailing zero is real and survives
//  serialisation. `double` would have given `9.1`. For money that is a
//  feature, not noise.
//
//  The two 400s are worth distinguishing. `amount=-5` is **your** rule, so
//  you write the check. `amount=lots` is a **binding** failure the framework
//  rejects before your handler runs — free, and you should not reimplement
//  it.
//
//  ### On WebApplicationFactory
//
//  The BCL answer to this is `WebApplicationFactory<TEntryPoint>` from
//  `Microsoft.AspNetCore.Mvc.Testing`, with `WithWebHostBuilder` +
//  `ConfigureTestServices` to swap the fake. It runs the app in-memory over
//  `TestServer` rather than a real socket, which is faster and lets you keep
//  your production `Program.cs` as the single source of truth.
//
//  This track's `Web.Serve` builds the app inline on a real loopback port
//  instead. The trade: you configure the pipeline in the test (so an exercise
//  is self-contained and there is no hidden `Program.cs`), and you get real
//  sockets — which means real content negotiation, real header handling, and
//  no chance of a TestServer-only behaviour difference. In a production
//  codebase, prefer `WebApplicationFactory`: testing the `Program.cs` you
//  actually ship is worth more than the realism of a socket.
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
    app.MapGet("/convert", (string from, string to, decimal amount, IRates rates) =>
    {
        // Your rule → your check. (A non-numeric amount is already a 400
        // from model binding; do not reimplement that.)
        if (amount < 0) return Results.BadRequest();

        decimal? rate;
        try
        {
            rate = rates.Get(from, to);
        }
        catch (Exception)
        {
            // Upstream is down: 503, and the reason stays on the server.
            return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
        }

        if (rate is null) return Results.NotFound();

        var converted = Math.Round(amount * rate.Value, 2, MidpointRounding.AwayFromZero);
        return Results.Ok(new Conversion(from, to, amount, converted));
    });
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
