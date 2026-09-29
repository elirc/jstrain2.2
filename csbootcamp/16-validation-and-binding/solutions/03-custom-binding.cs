// ─────────────────────────────────────────────────────────────────────────
//  03 · custom model binding — SOLUTION                   ★★☆ core
//  concepts: IParsable · TryParse convention · BindAsync
//  run: dotnet run 03-custom-binding.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Both hooks are found by CONVENTION — a `static TryParse` with the right
//  signature, or a `static BindAsync(HttpContext)`. No attribute, no
//  registration, no interface required (though `IParsable<T>` documents the
//  first one nicely). Which one you implement depends on how much of the
//  request the type needs to see:
//
//    TryParse  — ONE value from the route or query string.
//    BindAsync — the whole `HttpContext`: several query keys, headers, the
//                authenticated user, a service from DI.
//
//  The payoff is that the handler signature becomes the contract. `(DateRange
//  range)` says what the endpoint accepts, and a malformed value never
//  reaches the body — the framework 400s before your code runs. Taking a
//  `string` and parsing inside the handler pushes that work into every
//  endpoint and usually turns a free 400 into a hand-rolled one.
//
//  **`TryParse` must never throw.** It is called on hostile input by
//  definition. `DateOnly.TryParseExact` for each half, plus the `From <= To`
//  check, all as `return false` paths — so `/reports/not-a-range` is a clean
//  400. Throwing here produces a 500, which tells an attacker their input
//  reached your parser and tells your ops team nothing useful.
//
//  Notice the domain rule (`From <= To`) lives in the parser. A `DateRange`
//  that exists is always a valid one — the type cannot represent a backwards
//  range. That is worth more than validating it later in three places.
//
//  **`BindAsync` returning null** for a non-nullable parameter is what
//  produces a 400. `PagingOptions` deliberately never returns null: bad
//  paging input clamps to something sensible rather than failing the request,
//  because `?page=0` is a broken link, not an attack. That is a policy
//  choice — the opposite choice (400 on nonsense) is equally defensible, and
//  the point is that you now get to make it.
//
//  `InvariantCulture` on both parsers, for the reason module 01 laboured:
//  the wire format is a protocol, not a user preference.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Globalization;

void MapRoutes(WebApplication app)
{
    // Format explicitly: DateOnly.ToString() would use the machine's culture
    // and render "1/1/2026" on a US box. A wire format is not a locale.
    app.MapGet("/reports/{range}",
        (DateRange range) => $"{range.From:yyyy-MM-dd}..{range.To:yyyy-MM-dd}");
    app.MapGet("/paging", (PagingOptions paging) => $"{paging.Page}:{paging.Size}");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("TryParse binds a route value into a domain type", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/reports/2026-01-01..2026-01-31"), "2026-01-01..2026-01-31");
});

Test("a malformed range is a 400, not a 500", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/reports/not-a-range"), 400);
});

Test("a backwards range is rejected by the parser", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/reports/2026-03-01..2026-01-01"), 400);
});

Test("TryParse is directly unit-testable, no server needed", () =>
{
    Ok(DateRange.TryParse("2026-01-01..2026-01-31", null, out var range));
    Eq(range.From, new DateOnly(2026, 1, 1));
    Eq(range.To, new DateOnly(2026, 1, 31));
});

Test("TryParse returns false instead of throwing", () =>
{
    Ok(!DateRange.TryParse("garbage", null, out _));
    Ok(!DateRange.TryParse(null, null, out _));
    Ok(!DateRange.TryParse("2026-01-01", null, out _));
    Ok(!DateRange.TryParse("2026-13-45..2026-01-01", null, out _));
});

Test("BindAsync assembles one object from several query keys", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging?page=2&size=10"), "2:10");
});

Test("BindAsync applies defaults for missing keys", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging"), "1:20");
});

Test("BindAsync clamps rather than failing on nonsense", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging?page=0&size=9999"), "1:100");
});

Test("unparseable paging values fall back to the defaults", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging?page=abc&size=xyz"), "1:20");
});

// ──────────────────────────── types ──────────────────────────────────────

public readonly record struct DateRange(DateOnly From, DateOnly To)
{
    // Found by convention. Must never throw — it runs on hostile input.
    public static bool TryParse(string? value, IFormatProvider? provider,
                                out DateRange result)
    {
        result = default;
        if (string.IsNullOrWhiteSpace(value)) return false;

        var parts = value.Split("..", StringSplitOptions.None);
        if (parts.Length != 2) return false;

        const string Format = "yyyy-MM-dd";
        var culture = CultureInfo.InvariantCulture;   // a wire format, not a locale

        if (!DateOnly.TryParseExact(parts[0], Format, culture, DateTimeStyles.None, out var from)
         || !DateOnly.TryParseExact(parts[1], Format, culture, DateTimeStyles.None, out var to))
            return false;

        // The domain rule lives here: a DateRange that exists is valid.
        if (from > to) return false;

        result = new DateRange(from, to);
        return true;
    }
}

public record PagingOptions(int Page, int Size)
{
    // Sees the whole request. Returning null would produce a 400; this one
    // deliberately always succeeds and clamps instead.
    public static ValueTask<PagingOptions?> BindAsync(HttpContext context)
    {
        var query = context.Request.Query;

        var page = int.TryParse(query["page"], NumberStyles.Integer,
                                CultureInfo.InvariantCulture, out var p) ? p : 1;
        var size = int.TryParse(query["size"], NumberStyles.Integer,
                                CultureInfo.InvariantCulture, out var s) ? s : 20;

        return ValueTask.FromResult<PagingOptions?>(
            new PagingOptions(Math.Max(page, 1), Math.Clamp(size, 1, 100)));
    }
}
