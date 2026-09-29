// ─────────────────────────────────────────────────────────────────────────
//  07 · a complete CRUD resource                          ★★★ stretch
//  concepts: REST verbs · idempotency · 204 · PATCH semantics
//  run: dotnet run 07-crud-resource.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Put the whole module together: one resource, all five operations, correct
//  status codes. The status codes ARE the API — a client written against
//  them should never need to parse a message to know what happened.
//
//      GET    /tasks           → 200, the list (empty list, not 404)
//      GET    /tasks/{id}      → 200 or 404
//      POST   /tasks           → 201 + Location, or 400
//      PUT    /tasks/{id}      → 200 (replaced) or 404. Idempotent:
//                                 the same PUT twice has the same effect
//      PATCH  /tasks/{id}      → 200, changing ONLY the fields sent
//      DELETE /tasks/{id}      → 204 (no body) or 404
//
//  The PATCH is the interesting one. `{"done":true}` must leave the title
//  alone, and `{"title":"x"}` must leave `done` alone — which means you have
//  to tell "absent" apart from "null", and a `record` with nullable members
//  does exactly that.
//
//  Order the list by id so the tests are deterministic.
//
//  hint: Results.NoContent() is the 204; for PATCH, a null member means
//        "not supplied", so `patch.Title ?? existing.Title` is the whole trick
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the empty collection is 200 and an empty array, not 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/tasks"), 200);
    Eq(await app.GetBody("/tasks"), "[]");
});

Test("POST creates and GET lists it", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var created = await app.PostJson("/tasks", new { title = "write tests" });

    Eq((int)created.StatusCode, 201);
    Eq(created.Headers.Location?.ToString(), "/tasks/1");
    Eq(await app.GetBody("/tasks"), "[{\"id\":1,\"title\":\"write tests\",\"done\":false}]");
});

Test("GET by id returns one task, or 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/tasks", new { title = "a" });

    Eq(await app.GetBody("/tasks/1"), "{\"id\":1,\"title\":\"a\",\"done\":false}");
    Eq(await app.GetStatus("/tasks/99"), 404);
});

Test("POST with a blank title is 400 and creates nothing", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq((int)(await app.PostJson("/tasks", new { title = "" })).StatusCode, 400);
    Eq(await app.GetBody("/tasks"), "[]");
});

Test("PUT replaces the whole task", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/tasks", new { title = "old" });

    var response = await app.PutJson("/tasks/1", new { title = "new", done = true });
    Eq((int)response.StatusCode, 200);
    Eq(await app.GetBody("/tasks/1"), "{\"id\":1,\"title\":\"new\",\"done\":true}");
});

Test("PUT is idempotent — twice is the same as once", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/tasks", new { title = "old" });

    await app.PutJson("/tasks/1", new { title = "new", done = true });
    await app.PutJson("/tasks/1", new { title = "new", done = true });

    Eq(await app.GetBody("/tasks/1"), "{\"id\":1,\"title\":\"new\",\"done\":true}");
    Eq(await app.GetBody("/tasks"), "[{\"id\":1,\"title\":\"new\",\"done\":true}]");
});

Test("PUT to a missing id is 404, not an upsert", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PutJson("/tasks/99", new { title = "ghost", done = false });
    Eq((int)response.StatusCode, 404);
});

Test("PATCH changes only the field that was sent", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/tasks", new { title = "keep me" });

    var patch = new HttpRequestMessage(HttpMethod.Patch, "/tasks/1")
    {
        Content = new StringContent("{\"done\":true}",
            System.Text.Encoding.UTF8, "application/json"),
    };
    var response = await app.Send(patch);

    Eq((int)response.StatusCode, 200);
    // done changed; title survived
    Eq(await app.GetBody("/tasks/1"), "{\"id\":1,\"title\":\"keep me\",\"done\":true}");
});

Test("DELETE is 204 with no body, then the task is gone", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/tasks", new { title = "temporary" });

    var response = await app.Client.DeleteAsync("/tasks/1");
    Eq((int)response.StatusCode, 204);
    Eq(await response.Content.ReadAsStringAsync(), "");
    Eq(await app.GetStatus("/tasks/1"), 404);
});

Test("DELETE of a missing task is 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq((int)(await app.Client.DeleteAsync("/tasks/99")).StatusCode, 404);
});

// ──────────────────────────── types ──────────────────────────────────────

record TaskItem(int Id, string Title, bool Done);
record CreateTask(string Title);
record ReplaceTask(string Title, bool Done);
// Nullable members: null means "the client did not send this field".
record PatchTask(string? Title, bool? Done);
