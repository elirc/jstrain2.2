// ─────────────────────────────────────────────────────────────────────────
//  03 · exception handling middleware                     ★★☆ core
//  concepts: catching at the edge · ProblemDetails · not leaking internals
//  run: dotnet run 03-exception-handling.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  An unhandled exception in a handler becomes a 500 with an empty body. In
//  Development you get a stack trace page; in Production you get nothing,
//  because leaking stack traces to the internet tells an attacker your
//  framework versions, file paths and query shapes.
//
//  The professional answer is one middleware at the OUTERMOST position that
//  turns exceptions into a consistent, safe error envelope — and maps the
//  ones you threw deliberately onto the right status code.
//
//  Write a handler that produces:
//
//      NotFoundException      → 404, {"error":"not found"}
//      ValidationException    → 400, {"error":"<the exception message>"}
//      anything else          → 500, {"error":"internal error"}
//                               and the real message NEVER in the body
//
//  Content type must be application/json in every case, and the exception
//  must be recorded in `seen` so an operator could log it.
//
//  hint: try/catch around `await next(ctx)`, then switch on the exception
//        type; ctx.Response.WriteAsJsonAsync writes JSON and sets the type
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Register the exception-handling middleware, then these endpoints:
//   GET /ok        → "fine"
//   GET /missing   → throws NotFoundException
//   GET /invalid   → throws ValidationException("name is required")
//   GET /boom      → throws InvalidOperationException("connection string
//                    is Server=prod;Password=hunter2")
void BuildPipeline(WebApplication app, List<Exception> seen)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a healthy request is untouched", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    Eq(await app.GetStatus("/ok"), 200);
    Eq(await app.GetBody("/ok"), "fine");
});

Test("a NotFoundException becomes a 404", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var response = await app.Client.GetAsync("/missing");

    Eq((int)response.StatusCode, 404);
    Eq(await response.Content.ReadAsStringAsync(), "{\"error\":\"not found\"}");
});

Test("a ValidationException becomes a 400 carrying its message", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var response = await app.Client.GetAsync("/invalid");

    Eq((int)response.StatusCode, 400);
    Eq(await response.Content.ReadAsStringAsync(), "{\"error\":\"name is required\"}");
});

Test("an unexpected exception becomes a generic 500", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var response = await app.Client.GetAsync("/boom");

    Eq((int)response.StatusCode, 500);
    Eq(await response.Content.ReadAsStringAsync(), "{\"error\":\"internal error\"}");
});

Test("the 500 body leaks nothing about the internals", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    var body = await app.GetBody("/boom");

    Ok(!body.Contains("hunter2"));
    Ok(!body.Contains("Server=prod"));
    Ok(!body.Contains("InvalidOperationException"));
    Ok(!body.Contains("at "));            // no stack frames
});

Test("errors are still recorded for the operator", async () =>
{
    var seen = new List<Exception>();
    await using var app = await Web.Serve(a => BuildPipeline(a, seen));
    await app.GetBody("/boom");

    Eq(seen.Count, 1);
    Ok(seen[0].Message.Contains("hunter2"));   // the detail is kept, not sent
});

Test("every error response is JSON", async () =>
{
    await using var app = await Web.Serve(a => BuildPipeline(a, []));
    foreach (var path in new[] { "/missing", "/invalid", "/boom" })
    {
        var response = await app.Client.GetAsync(path);
        Eq(response.Content.Headers.ContentType?.MediaType, "application/json");
    }
});

// ──────────────────────────── types ──────────────────────────────────────

sealed class NotFoundException : Exception;

sealed class ValidationException(string message) : Exception(message);
