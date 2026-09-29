// ─────────────────────────────────────────────────────────────────────────
//  02 · the team notes API — SOLUTION                      ★★★ capstone
//  concepts: JWT auth · ownership checks · policies · error middleware
//  run: dotnet run 02-the-team-notes-api.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The second capstone: the same API shape as 01, but every endpoint now has
//  to answer "who is asking?" — and, separately, "are they allowed THIS row?"
//
//  Authentication is wired for you (module 19's job). The pipeline and the
//  handlers are yours.
//
//      POST   /notes              201 · 401
//      GET    /notes              200 — the CALLER's notes only · 401
//      GET    /notes/{id}         200 · 404 (theirs or missing) · 401
//      PUT    /notes/{id}         204 · 404 · 401
//      DELETE /notes/{id}         204 · 404 · 401     admins may delete any
//      GET    /notes/{id}/audit   200 admins only · 403 · 401
//      GET    /boom               500, and says nothing useful
//
//  The rules the tests hold you to:
//
//   1. **The owner comes from the token, never from the body.** `CreateNote`
//      has one field for exactly that reason — a type that cannot express the
//      attack beats a validation rule that has to remember to run.
//
//   2. **"Not yours" is 404, not 403.** A 403 confirms the note exists. Put
//      the ownership test in the QUERY so no path can return a row the caller
//      does not own. (Module 26/02 is the hunt version of this.)
//
//   3. **An admin may delete any note.** Role-based, checked in the handler —
//      because it depends on the row, which a policy attribute cannot see.
//
//   4. **`/notes/{id}/audit` is admin-only**, and that IS a policy: it does
//      not depend on the row at all. Anonymous is 401; a signed-in non-admin
//      is 403. Those are different answers and both matter.
//
//   5. **Every response carries `X-Request-Id`** — including the 401s and the
//      500. Which constrains where that middleware goes.
//
//   6. **The 500 body is generic.** No exception type, no message, no stack.
//      `/boom` throws something with a connection string in it; none of it
//      may reach the client.
//
//   7. **Let `NotImplementedException` through.** A catch-all that swallows it
//      would turn every handler you have not written yet into a red 500
//      instead of a `☐ todo`. An exception filter —
//      `catch (Exception e) when (e is not NotImplementedException)` — keeps
//      the harness honest. Real pipelines do the same thing for the
//      exceptions the framework needs to see, `OperationCanceledException`
//      chief among them.
//
//  Walkthrough:
//  Two middlewares and seven endpoints, and the interesting decisions are all
//  about placement and about which question is being asked.
//
//  **Pipeline order is the design.** `X-Request-Id` goes on first, because
//  the responses that most need a correlation id are the ones no endpoint
//  ever ran to produce: the 401 that authorization short-circuits, and the
//  500 that comes out of the error handler. Register it after
//  `UseAuthentication` and the 401 has no id, which is exactly the request
//  someone will later ask you to find in the logs.
//
//  It is also set **before** `await next(ctx)`, while the response has not
//  started. Setting a header after `next` returns is module 25/01's bug: the
//  header block is already on the wire and the assignment is silently lost.
//
//  **The error handler wraps everything it means to catch**, so it goes
//  outside auth and the endpoints — and it still checks `HasStarted`, because
//  an exception thrown midway through serialising a response cannot be turned
//  into a 500 any more. All the caller gets is a fixed string; the exception
//  goes to the log, where it is still available and no longer public.
//
//  **Authentication and authorization are different questions**, and the
//  status codes say so. 401 means "I do not know who you are"; 403 means "I
//  know exactly who you are, and no". The audit endpoint returns each in its
//  own case, and a client that treats them the same will retry a login loop
//  forever against a permission it will never have.
//
//  **Two kinds of authorization, and only one is a policy.** `AdminOnly` on
//  the audit route is a claim check that does not depend on any row, so it
//  belongs in `RequireAuthorization("AdminOnly")` where it is declarative and
//  visible. Ownership is not: whether ada may read note 7 depends on note 7.
//  That check lives in the handler — but it lives in the QUERY, as
//  `n.Id == id && n.Owner == owner`, not as an `if` after a lookup that
//  already succeeded. One is a filter; the other is a check someone will
//  forget to write on the next endpoint.
//
//  **The owner is never bound.** `CreateNote` has exactly one property, so
//  `{"text":"...","owner":"bob"}` binds `text` and drops `owner` on the
//  floor. There is no rule to enforce and no rule to forget — module 26/02 is
//  the same lesson taught by letting you find the hole instead.
//
//  **"Not yours" and "not there" return the same thing.** Otherwise a 403
//  confirms the note exists, and an attacker with a for-loop over ids learns
//  the shape of your data without reading a single row.
//
//  One thing that is easy to miss: the admin branch of `DELETE` does not
//  reuse the ownership query. It deliberately widens the lookup, and the
//  widening is one visible line in one handler — not a flag threaded through
//  a helper where the next reader will not notice which calls are privileged.
#:sdk Microsoft.NET.Sdk.Web
#:package Microsoft.AspNetCore.Authentication.JwtBearer@10.0.11
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

void MapApi(WebApplication app)
{
    // FIRST, so it reaches responses no endpoint produces: the 401 that
    // authorization short-circuits, and the 500 below. Set before next(),
    // while the response has not started — see module 25/01.
    app.Use(async (ctx, next) =>
    {
        ctx.Response.Headers["X-Request-Id"] = Guid.NewGuid().ToString("n");
        await next(ctx);
    });

    // Outside everything it means to catch. The filter lets the harness see
    // an unwritten handler as a todo rather than a failure.
    app.Use(async (ctx, next) =>
    {
        try
        {
            await next(ctx);
        }
        catch (Exception e) when (e is not NotImplementedException)
        {
            app.Logger.LogError(e, "unhandled exception");

            // Too late to change the status if bytes are already going out.
            if (ctx.Response.HasStarted) throw;

            ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
            await ctx.Response.WriteAsJsonAsync(new { error = "internal error" });
        }
    });

    app.UseAuthentication();
    app.UseAuthorization();

    // The caller's identity, from the token and nowhere else.
    static string? Caller(HttpContext ctx) => ctx.User.FindFirst("sub")?.Value;

    // Ownership in the QUERY: no code path below can return a row the caller
    // does not own, because no code path can look one up.
    static Note? Owned(NoteStore store, int id, string? owner) =>
        store.All.SingleOrDefault(n => n.Id == id && n.Owner == owner);

    app.MapPost("/notes", (CreateNote input, HttpContext ctx, NoteStore store) =>
    {
        // input has no Owner to bind. That is the defence.
        var note = store.Add(Caller(ctx)!, input.Text);

        return Results.Created($"/notes/{note.Id}", note);
    }).RequireAuthorization();

    app.MapGet("/notes", (HttpContext ctx, NoteStore store) =>
        Results.Ok(store.All.Where(n => n.Owner == Caller(ctx)))).RequireAuthorization();

    app.MapGet("/notes/{id:int}", (int id, HttpContext ctx, NoteStore store) =>
    {
        var note = Owned(store, id, Caller(ctx));

        // 404, not 403: a 403 would confirm the note exists.
        return note is null ? Results.NotFound() : Results.Ok(note);
    }).RequireAuthorization();

    app.MapPut("/notes/{id:int}", (int id, CreateNote input, HttpContext ctx, NoteStore store) =>
    {
        var note = Owned(store, id, Caller(ctx));
        if (note is null) return Results.NotFound();

        store.Replace(note with { Text = input.Text });

        return Results.NoContent();
    }).RequireAuthorization();

    app.MapDelete("/notes/{id:int}", (int id, HttpContext ctx, NoteStore store) =>
    {
        // The one privileged lookup in the file, and it is visible as one.
        var note = ctx.User.IsInRole("admin")
            ? store.All.SingleOrDefault(n => n.Id == id)
            : Owned(store, id, Caller(ctx));

        if (note is null) return Results.NotFound();

        store.Remove(note.Id);

        return Results.NoContent();
    }).RequireAuthorization();

    // Row-independent, so it is a policy rather than a check in the handler.
    app.MapGet("/notes/{id:int}/audit", (int id, NoteStore store) =>
    {
        var note = store.All.SingleOrDefault(n => n.Id == id);

        return note is null ? Results.NotFound() : Results.Ok(new { note.Id, note.Owner });
    }).RequireAuthorization("AdminOnly");

    app.MapGet("/boom", string () => throw new InvalidOperationException(
        "query failed: Server=db-prod-01;User=sa;Password=hunter2"));
}

// ──────────────────────────── tests ──────────────────────────────────────

async Task<int> NewNote(ServedApp app, string user, string text)
{
    var response = await Post(app, "/notes", new { text }, user);
    Eq((int)response.StatusCode, 201, "creating a note should be 201");

    return Read(await response.Content.ReadAsStringAsync()).GetProperty("id").GetInt32();
}

Test("an anonymous request is 401", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    Eq((int)(await Send(app, HttpMethod.Get, "/notes", null)).StatusCode, 401);
});

Test("a note can be created and read back", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "buy milk");

    var body = await Body(app, HttpMethod.Get, $"/notes/{id}", Token("ada"));

    Eq(Read(body).GetProperty("text").GetString(), "buy milk");
    Eq(Read(body).GetProperty("owner").GetString(), "ada");
});

Test("the owner comes from the token, not the body", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var response = await Post(app, "/notes",
        new { text = "mine now", owner = "bob" }, Token("ada"));

    Eq((int)response.StatusCode, 201);
    Eq(Read(await response.Content.ReadAsStringAsync()).GetProperty("owner").GetString(), "ada");
});

Test("the listing shows only the caller's notes", async () =>
{
    await using var app = await Fixture.Serve(MapApi);

    await NewNote(app, Token("ada"), "ada one");
    await NewNote(app, Token("bob"), "bob one");
    await NewNote(app, Token("ada"), "ada two");

    var body = await Body(app, HttpMethod.Get, "/notes", Token("ada"));
    var texts = Read(body).EnumerateArray()
        .Select(e => e.GetProperty("text").GetString()).ToArray();

    Eq(texts, new[] { "ada one", "ada two" });
});

Test("someone else's note is 404, not 403", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("bob"), "bob's secret");

    Eq((int)(await Send(app, HttpMethod.Get, $"/notes/{id}", Token("ada"))).StatusCode, 404);
});

Test("someone else's note is indistinguishable from a missing one", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("bob"), "bob's secret");

    var theirs = (int)(await Send(app, HttpMethod.Get, $"/notes/{id}", Token("ada"))).StatusCode;
    var missing = (int)(await Send(app, HttpMethod.Get, "/notes/9999", Token("ada"))).StatusCode;

    Eq(theirs, missing);
});

Test("someone else's text never reaches the response", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("bob"), "bob's secret");

    var body = await Body(app, HttpMethod.Get, $"/notes/{id}", Token("ada"));
    Ok(!body.Contains("secret"), "leaked another user's note: " + body);
});

Test("a note can be edited by its owner", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "draft");

    var response = await Send(app, HttpMethod.Put, $"/notes/{id}",
        Token("ada"), new { text = "final" });

    Eq((int)response.StatusCode, 204);
    Eq(Read(await Body(app, HttpMethod.Get, $"/notes/{id}", Token("ada")))
        .GetProperty("text").GetString(), "final");
});

Test("a note cannot be edited by anyone else", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("bob"), "bob's");

    var response = await Send(app, HttpMethod.Put, $"/notes/{id}",
        Token("ada"), new { text = "ada was here" });

    Eq((int)response.StatusCode, 404);
    Eq(Read(await Body(app, HttpMethod.Get, $"/notes/{id}", Token("bob")))
        .GetProperty("text").GetString(), "bob's");
});

Test("an owner can delete their note; a stranger cannot", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "temporary");

    Eq((int)(await Send(app, HttpMethod.Delete, $"/notes/{id}", Token("bob"))).StatusCode, 404);
    Eq((int)(await Send(app, HttpMethod.Delete, $"/notes/{id}", Token("ada"))).StatusCode, 204);
    Eq((int)(await Send(app, HttpMethod.Get, $"/notes/{id}", Token("ada"))).StatusCode, 404);
});

Test("an admin can delete anyone's note", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "ada's");

    Eq((int)(await Send(app, HttpMethod.Delete, $"/notes/{id}", Token("root", "admin")))
        .StatusCode, 204);
});

Test("the audit endpoint is 403 for a signed-in non-admin", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "ada's");

    Eq((int)(await Send(app, HttpMethod.Get, $"/notes/{id}/audit", Token("ada"))).StatusCode, 403);
});

Test("the audit endpoint is 401 for anonymous — a different answer", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "ada's");

    Eq((int)(await Send(app, HttpMethod.Get, $"/notes/{id}/audit", null)).StatusCode, 401);
});

Test("an admin can audit any note", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var id = await NewNote(app, Token("ada"), "ada's");

    var body = await Body(app, HttpMethod.Get, $"/notes/{id}/audit", Token("root", "admin"));
    Eq(Read(body).GetProperty("owner").GetString(), "ada");
});

Test("every response carries X-Request-Id — including the 401", async () =>
{
    await using var app = await Fixture.Serve(MapApi);

    var ok = await Send(app, HttpMethod.Get, "/notes", Token("ada"));
    var denied = await Send(app, HttpMethod.Get, "/notes", null);

    Ok(ok.Headers.Contains("X-Request-Id"), "missing on a 200");
    Ok(denied.Headers.Contains("X-Request-Id"), "missing on a 401");
});

Test("two requests get two different request ids", async () =>
{
    await using var app = await Fixture.Serve(MapApi);

    var first = (await Send(app, HttpMethod.Get, "/notes", Token("ada")))
        .Headers.GetValues("X-Request-Id").Single();
    var second = (await Send(app, HttpMethod.Get, "/notes", Token("ada")))
        .Headers.GetValues("X-Request-Id").Single();

    Ok(first != second, "the request id is not per-request");
});

Test("an unhandled error is a 500 that says nothing useful", async () =>
{
    await using var app = await Fixture.Serve(MapApi);
    var response = await Send(app, HttpMethod.Get, "/boom", Token("ada"));
    var body = await response.Content.ReadAsStringAsync();

    Eq((int)response.StatusCode, 500);
    Ok(!body.Contains("hunter2"), "the 500 leaked a password");
    Ok(!body.Contains("db-prod-01"), "the 500 leaked a hostname");
    Ok(!body.Contains("InvalidOperationException"), "the 500 leaked the exception type");
    Ok(response.Headers.Contains("X-Request-Id"), "the 500 has no request id to grep for");
});

// ──────────────────────────── test plumbing ──────────────────────────────

async Task<HttpResponseMessage> Send(ServedApp app, HttpMethod method, string path,
                                     string? token, object? body = null)
{
    var request = new HttpRequestMessage(method, path);

    if (token is not null)
        request.Headers.Authorization = new("Bearer", token);

    if (body is not null)
        request.Content = new StringContent(JsonSerializer.Serialize(body),
                                            Encoding.UTF8, "application/json");

    return await app.Send(request);
}

Task<HttpResponseMessage> Post(ServedApp app, string path, object body, string token)
    => Send(app, HttpMethod.Post, path, token, body);

async Task<string> Body(ServedApp app, HttpMethod method, string path, string? token)
    => await (await Send(app, method, path, token)).Content.ReadAsStringAsync();

static JsonElement Read(string json) => JsonDocument.Parse(json).RootElement;

// Mint a token for a user, optionally with roles.
static string Token(string sub, params string[] roles)
{
    var claims = new List<Claim> { new("sub", sub) };
    claims.AddRange(roles.Select(r => new Claim("role", r)));

    var token = new JwtSecurityToken(
        issuer: Auth.Issuer,
        audience: Auth.Audience,
        claims: claims,
        expires: DateTime.UtcNow.AddMinutes(5),
        signingCredentials: new SigningCredentials(Auth.Key, SecurityAlgorithms.HmacSha256));

    return new JwtSecurityTokenHandler().WriteToken(token);
}

// ──────────────────────────── auth wiring (given) ────────────────────────

static class Auth
{
    public static readonly SymmetricSecurityKey Key = new(
        Encoding.UTF8.GetBytes("bootcamp-signing-key-at-least-32-bytes-long"));

    public const string Issuer = "bootcamp";
    public const string Audience = "bootcamp-notes";
}

public record Note(int Id, string Owner, string Text);
public record CreateNote(string Text);

// The store. Not a database — the data layer is capstone 01's subject.
public sealed class NoteStore
{
    private readonly Dictionary<int, Note> _notes = new();
    private int _next = 1;

    public Note Add(string owner, string text)
    {
        var note = new Note(_next++, owner, text);
        _notes[note.Id] = note;

        return note;
    }

    public IEnumerable<Note> All => _notes.Values.OrderBy(n => n.Id);
    public void Replace(Note note) => _notes[note.Id] = note;
    public void Remove(int id) => _notes.Remove(id);
}

static class Fixture
{
    public static Task<ServedApp> Serve(Action<WebApplication> map) => Web.Serve(
        builder =>
        {
            builder.Services.AddSingleton<NoteStore>();

            builder.Services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    // Claims mean what they were issued as. See module 19/04.
                    options.MapInboundClaims = false;

                    options.TokenValidationParameters = new()
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = Auth.Key,
                        ValidateIssuer = true,
                        ValidIssuer = Auth.Issuer,
                        ValidateAudience = true,
                        ValidAudience = Auth.Audience,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,

                        // So ctx.User.IsInRole("admin") reads the "role" claim.
                        RoleClaimType = "role",
                        NameClaimType = "sub",
                    };
                });

            builder.Services.AddAuthorization(options =>
                options.AddPolicy("AdminOnly", p => p.RequireRole("admin")));
        },
        map);
}
