// ─────────────────────────────────────────────────────────────────────────
//  05 · correlation ids and HttpContext.Items             ★★☆ core
//  concepts: HttpContext.Items · per-request state · header propagation
//  run: dotnet run 05-correlation-id.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  When a request crosses four services, you need one id that follows it all
//  the way so the logs can be stitched back together. The convention:
//
//    · if the caller sent `X-Correlation-Id`, honour it
//    · otherwise mint a new one
//    · make it available to everything downstream in this request
//    · echo it back on the response so the caller can log it too
//
//  "Available to everything downstream" is the interesting part.
//  `HttpContext.Items` is a per-request dictionary — created fresh for each
//  request and discarded at the end — which is exactly the right lifetime.
//  A static field would be shared across concurrent requests; a singleton
//  service would be too. This is the safe place for per-request state.
//
//      GET /trace   (no header)                     → a fresh non-empty id
//      GET /trace   with X-Correlation-Id: abc-123  → "abc-123"
//
//  The endpoint must READ the id from Items, not re-read the header — that
//  is what proves the id was actually propagated.
//
//  hint: ctx.Items["CorrelationId"] = value;  and the endpoint takes an
//        HttpContext parameter to read it back
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Add correlation middleware, then:
//   GET /trace → the correlation id for this request, read from Items
void BuildPipeline(WebApplication app)
{
    throw new NotImplementedException();
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
