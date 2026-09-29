// ─────────────────────────────────────────────────────────────────────────
//  03 · exception handling middleware — SOLUTION          ★★☆ core
//  concepts: catching at the edge · ProblemDetails · not leaking internals
//  run: dotnet run 03-exception-handling.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  One try/catch, registered outermost, is the whole pattern. It has to be
//  first: a middleware can only catch what is nested inside it, so anything
//  registered above this one is unprotected.
//
//  The switch maps exception TYPE to status code. That is the design worth
//  taking away — throw a meaningful exception deep in your domain code and
//  let one place at the edge decide what it means over HTTP. The
//  alternative, returning result objects through every layer, works too, but
//  it puts HTTP concerns in code that should not know HTTP exists.
//
//  The security point is the `_ =>` arm. ValidationException's message is
//  echoed because YOU wrote it for a user to read. An arbitrary exception's
//  message is not: it may contain a connection string, a file path, or in
//  this case a password. So the generic arm sends a fixed string and keeps
//  the real exception on the server, where the operator can see it. The
//  test asserting `hunter2` is absent from the body but present in `seen`
//  is the exact line between "helpful" and "breach".
//
//  `ctx.Response.HasStarted` is worth a check in production code: if the
//  handler already flushed bytes you cannot change the status code, and
//  trying throws a second, more confusing exception on top of the first.
//
//  Real apps get most of this from `app.UseExceptionHandler(...)` plus
//  `AddProblemDetails()`, which produce RFC 7807 bodies. This is what those
//  are doing underneath.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void BuildPipeline(WebApplication app, List<Exception> seen)
{
    // Outermost, so it wraps every endpoint and every other middleware.
    app.Use(async (ctx, next) =>
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            seen.Add(ex);   // keep the detail on the server

            // If bytes are already on the wire, the status is locked in.
            if (ctx.Response.HasStarted) throw;

            var (status, message) = ex switch
            {
                NotFoundException => (StatusCodes.Status404NotFound, "not found"),
                ValidationException => (StatusCodes.Status400BadRequest, ex.Message),
                // Never ex.Message here — it may hold secrets.
                _ => (StatusCodes.Status500InternalServerError, "internal error"),
            };

            ctx.Response.StatusCode = status;
            await ctx.Response.WriteAsJsonAsync(new { error = message });
        }
    });

    app.MapGet("/ok", () => "fine");
    app.MapGet("/missing", string () => throw new NotFoundException());
    app.MapGet("/invalid", string () => throw new ValidationException("name is required"));
    app.MapGet("/boom", string () => throw new InvalidOperationException(
        "connection string is Server=prod;Password=hunter2"));
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
    Ok(!body.Contains("at "));
});

Test("errors are still recorded for the operator", async () =>
{
    var seen = new List<Exception>();
    await using var app = await Web.Serve(a => BuildPipeline(a, seen));
    await app.GetBody("/boom");

    Eq(seen.Count, 1);
    Ok(seen[0].Message.Contains("hunter2"));
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
