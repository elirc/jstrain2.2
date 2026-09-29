// ─────────────────────────────────────────────────────────────────────────
//  03 · custom model binding                              ★★☆ core
//  concepts: IParsable · TryParse convention · BindAsync
//  run: dotnet run 03-custom-binding.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Minimal APIs bind route and query values by calling `TryParse` on the
//  target type. That is a CONVENTION, not a hard-coded list — so any type
//  you own can be bound directly, and your handler can take a domain type
//  instead of a `string` it has to re-parse:
//
//      app.MapGet("/reports/{range}", (DateRange range) => …);
//
//  Two hooks, and the difference matters:
//
//      static bool TryParse(string?, IFormatProvider?, out T)   ← ONE value
//          (this is `IParsable<T>`; route and query values)
//
//      static ValueTask<T?> BindAsync(HttpContext)              ← the whole
//          request: headers, several query keys, the user, a service
//
//  Build both:
//
//      GET /reports/2026-01-01..2026-01-31   → a DateRange, bound by TryParse
//      GET /paging?page=2&size=10            → a PagingOptions, bound by
//                                              BindAsync from two query keys
//
//  A malformed range must be a 400 from the framework, not a 500 from you.
//
//  hint: TryParse must never throw — return false. BindAsync returning null
//        for a non-nullable parameter is what produces the 400.
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
    Ok(!DateRange.TryParse("2026-01-01", null, out _));      // no separator
    Ok(!DateRange.TryParse("2026-13-45..2026-01-01", null, out _));  // bad date
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
    // A bad ?page=0 should give page 1, not a 500 and not a 400.
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging?page=0&size=9999"), "1:100");
});

Test("unparseable paging values fall back to the defaults", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/paging?page=abc&size=xyz"), "1:20");
});

// ──────────────────────────── types ──────────────────────────────────────

// Bound from a single route/query value by the TryParse convention.
// "2026-01-01..2026-01-31" → From, To. From must be <= To.
public readonly record struct DateRange(DateOnly From, DateOnly To)
{
    public static bool TryParse(string? value, IFormatProvider? provider,
                                out DateRange result)
        => throw new NotImplementedException();
}

// Bound from the whole request. Page defaults to 1 and clamps to >= 1;
// Size defaults to 20 and clamps to [1, 100]. Never fails.
public record PagingOptions(int Page, int Size)
{
    public static ValueTask<PagingOptions?> BindAsync(HttpContext context)
        => throw new NotImplementedException();
}
