// ─────────────────────────────────────────────────────────────────────────
//  07 · a complete CRUD resource — SOLUTION               ★★★ stretch
//  concepts: REST verbs · idempotency · 204 · PATCH semantics
//  run: dotnet run 07-crud-resource.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Four DTOs for one entity, and that is not over-engineering. TaskItem is
//  what goes out; CreateTask is what a client may send to POST (no id, so
//  it cannot choose one); ReplaceTask is the full body PUT requires; and
//  PatchTask has NULLABLE members so that "absent" is representable.
//
//  That last point is the exercise. `record PatchTask(string? Title, bool?
//  Done)` deserialises a missing JSON field as null, so
//  `patch.Title ?? existing.Title` means "use the new one if sent, keep the
//  old one otherwise". With a non-nullable `bool Done`, an absent field
//  would arrive as `false` and PATCH would silently un-complete every task
//  it touched — a real bug, shipped often. (The honest caveat: this makes
//  it impossible to PATCH a field TO null. When you need that, the answer is
//  JsonPatchDocument or a wrapper type that tracks "was set".)
//
//  Empty collection → `200 []`, never 404. A 404 means "this resource does
//  not exist"; a collection with nothing in it exists and is empty. Clients
//  written against a 404 here break the day the list empties.
//
//  PUT returns 404 rather than creating the task. The spec permits PUT to
//  create at a client-chosen id, but with server-assigned ids that would let
//  a client invent /tasks/9999, so refusing is the right call here — and it
//  keeps PUT idempotent, which the double-PUT test pins down.
//
//  DELETE returns 204 with a genuinely empty body. Returning 200 with
//  `{"deleted":true}` is a common habit and it is noise: the status code
//  already said it. Note the second DELETE is a 404 — deleting is idempotent
//  in EFFECT (the task is gone either way) but the status differs, and both
//  behaviours are defensible as long as you are consistent.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

void MapRoutes(WebApplication app)
{
    var store = new Dictionary<int, TaskItem>();
    var nextId = 0;

    var tasks = app.MapGroup("/tasks");

    tasks.MapGet("/", () => store.Values.OrderBy(t => t.Id));

    tasks.MapGet("/{id:int}", (int id) =>
        store.TryGetValue(id, out var task) ? Results.Ok(task) : Results.NotFound());

    tasks.MapPost("/", (CreateTask input) =>
    {
        if (string.IsNullOrWhiteSpace(input.Title)) return Results.BadRequest();

        var task = new TaskItem(++nextId, input.Title, Done: false);
        store[task.Id] = task;
        return Results.Created($"/tasks/{task.Id}", task);
    });

    // Full replacement: every field comes from the request.
    tasks.MapPut("/{id:int}", (int id, ReplaceTask input) =>
    {
        if (!store.ContainsKey(id)) return Results.NotFound();
        if (string.IsNullOrWhiteSpace(input.Title)) return Results.BadRequest();

        var task = new TaskItem(id, input.Title, input.Done);
        store[id] = task;
        return Results.Ok(task);
    });

    // Partial update: null member == field not supplied, so keep the old one.
    tasks.MapPatch("/{id:int}", (int id, PatchTask patch) =>
    {
        if (!store.TryGetValue(id, out var existing)) return Results.NotFound();

        var updated = existing with
        {
            Title = patch.Title ?? existing.Title,
            Done = patch.Done ?? existing.Done,
        };
        store[id] = updated;
        return Results.Ok(updated);
    });

    tasks.MapDelete("/{id:int}", (int id) =>
        store.Remove(id) ? Results.NoContent() : Results.NotFound());
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
record PatchTask(string? Title, bool? Done);
