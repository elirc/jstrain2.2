// ─────────────────────────────────────────────────────────────────────────
//  05 · correlation ids and HttpContext.Items — SOLUTION  ★★☆ core
//  concepts: HttpContext.Items · per-request state · header propagation
//  run: dotnet run 05-correlation-id.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Three lines of logic: take the incoming header or mint one, stash it in
//  Items, echo it on the response.
//
//  `HttpContext.Items` is a `Dictionary<object, object?>` scoped to exactly
//  one request. That lifetime is the whole reason to use it. A `static`
//  field would be shared by every concurrent request on the server, so
//  request A would overwrite request B's id and both would log the wrong
//  one — a race that only shows up under load, which is the worst kind. The
//  "two requests get different ids" test is a miniature version of that
//  check.
//
//  `StringValues` (what Headers returns) converts to string cleanly, and an
//  absent header converts to "" rather than throwing — so
//  `IsNullOrWhiteSpace` covers both "not sent" and "sent empty" in one
//  condition, which the last test verifies.
//
//  The echo is set BEFORE `await next(ctx)` for the reason module 04 covered:
//  after next() the headers may already be flushed.
//
//  In a real service you would also push this id into the logging scope
//  (`logger.BeginScope`) so every log line in the request carries it
//  automatically, and forward it on any outbound HttpClient call (module 28).
//  Items is the handoff point that makes both possible.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void BuildPipeline(WebApplication app)
{
    app.Use(async (ctx, next) =>
    {
        var incoming = ctx.Request.Headers["X-Correlation-Id"].ToString();
        var id = string.IsNullOrWhiteSpace(incoming)
            ? Guid.NewGuid().ToString()
            : incoming;

        // Per-request storage: born with this request, dies with it.
        ctx.Items["CorrelationId"] = id;

        // Echo on the way IN, while the headers are still writable.
        ctx.Response.Headers["X-Correlation-Id"] = id;

        await next(ctx);
    });

    // Reads from Items, not from the request header — that is what proves
    // the value was propagated rather than re-derived.
    app.MapGet("/trace", (HttpContext ctx) => ctx.Items["CorrelationId"] as string ?? "");
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("an incoming correlation id is honoured", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);

    var request = new HttpRequestMessage(HttpMethod.Get, "/trace");
    request.Headers.Add("X-Correlation-Id", "abc-123");
    var response = await app.Send(request);

    Eq(await response.Content.ReadAsStringAsync(), "abc-123");
});

Test("the id is echoed back on the response", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);

    var request = new HttpRequestMessage(HttpMethod.Get, "/trace");
    request.Headers.Add("X-Correlation-Id", "abc-123");
    var response = await app.Send(request);

    Eq(response.Headers.GetValues("X-Correlation-Id").First(), "abc-123");
});

Test("a missing id is generated, not left blank", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var body = await app.GetBody("/trace");

    Ok(!string.IsNullOrWhiteSpace(body));
});

Test("a generated id is echoed on the response too", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);
    var response = await app.Client.GetAsync("/trace");

    Ok(response.Headers.Contains("X-Correlation-Id"));
    Eq(response.Headers.GetValues("X-Correlation-Id").First(),
       await response.Content.ReadAsStringAsync());
});

Test("two requests without an id get DIFFERENT ids", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);

    var first = await app.GetBody("/trace");
    var second = await app.GetBody("/trace");

    Ok(first != second, "per-request state must not be shared between requests");
});

Test("an empty incoming header is treated as absent", async () =>
{
    await using var app = await Web.Serve(BuildPipeline);

    var request = new HttpRequestMessage(HttpMethod.Get, "/trace");
    request.Headers.Add("X-Correlation-Id", "");
    var response = await app.Send(request);

    Ok(!string.IsNullOrWhiteSpace(await response.Content.ReadAsStringAsync()));
});
