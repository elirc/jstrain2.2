// ─────────────────────────────────────────────────────────────────────────
//  02 · the team notes API                                 ★★★ capstone
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
//  hint: `ctx.User.FindFirst("sub")?.Value` is the caller · `ctx.User
//        .IsInRole("admin")` needs the role claim, which is wired below ·
//        the request-id middleware must run BEFORE anything that can respond
//
//  Take these one at a time. `POST` and `GET /notes` first; the rest of the
//  tests only become reachable once those two work.
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
    // The pipeline. Order is the whole exercise here: X-Request-Id must reach
    // responses the endpoints never produce (401s, and the 500 from /boom),
    // and the error handler has to be outside everything it means to catch.
    throw new NotImplementedException();

    // Then the endpoints:
    //
    //   POST   /notes              body CreateNote → 201 + Location, owner
    //                              taken from the token
    //   GET    /notes              the caller's notes, oldest id first
    //   GET    /notes/{id}         the caller's note, or 404
    //   PUT    /notes/{id}         replace the text of the caller's note
    //   DELETE /notes/{id}         the caller's note — or ANY note if the
    //                              caller is an admin
    //   GET    /notes/{id}/audit   { id, owner } — admins only, via policy
    //   GET    /boom               throws; the middleware turns it into a 500
    //
    // Everything except /boom requires an authenticated caller.
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
