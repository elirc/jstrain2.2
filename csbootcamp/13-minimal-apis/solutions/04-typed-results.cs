// ─────────────────────────────────────────────────────────────────────────
//  04 · typed results — SOLUTION                          ★★☆ core
//  concepts: TypedResults · Results<T1,T2> · ProblemDetails
//  run: dotnet run 04-typed-results.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The union return type is a contract the compiler enforces. Try adding a
//  `return TypedResults.Forbid();` to GetItem and it will not build, because
//  Forbid is not one of the two declared outcomes. That is the difference
//  from `IResult`, which accepts anything and tells you nothing.
//
//  The implicit conversion is what keeps it readable: `TypedResults.Ok(item)`
//  produces an `Ok<Item>`, and C# converts it into the union automatically.
//  You never write the union type anywhere but the signature.
//
//  Because the type survives, tests can assert on it WITHOUT starting a
//  server — `GetItem(1).Result is Ok<Item>` is a plain unit test on a plain
//  method. That is the underrated benefit: typed results make handlers
//  testable without HTTP, and the two server-based tests here exist only to
//  prove the wire behaviour matches.
//
//  Order of checks in PlaceOrder matters: validate the request shape (400)
//  before consulting state (409). Reversing them would report a conflict for
//  a request that was never valid in the first place, which sends the client
//  off to fix the wrong problem.
//
//  `TypedResults.Problem(title:, statusCode:)` returns ProblemDetails —
//  RFC 7807 — which is the standard error envelope for HTTP APIs and what
//  ASP.NET Core produces for its own 400s. Matching it means one error shape
//  across your whole API instead of two.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

var catalogue = new Dictionary<int, Item>
{
    [1] = new Item(1, "widget"),
    [2] = new Item(2, "gadget"),
};

Results<Ok<Item>, NotFound> GetItem(int id)
    => catalogue.TryGetValue(id, out var item)
        ? TypedResults.Ok(item)          // implicitly converts into the union
        : TypedResults.NotFound();

Results<Created<Order>, BadRequest<ProblemDetails>, Conflict> PlaceOrder(
    HashSet<string> placed, OrderRequest request)
{
    // Shape first…
    if (request.Quantity < 1)
    {
        return TypedResults.BadRequest(new ProblemDetails
        {
            Title = "Invalid quantity",
            Detail = "Quantity must be at least 1.",
            Status = StatusCodes.Status400BadRequest,
        });
    }

    // …then state.
    if (!placed.Add(request.Sku)) return TypedResults.Conflict();

    var order = new Order(request.Sku, request.Quantity);
    return TypedResults.Created($"/orders/{order.Sku}", order);
}

void MapRoutes(WebApplication app)
{
    var placed = new HashSet<string>();
    app.MapGet("/items/{id:int}", (int id) => GetItem(id));
    app.MapPost("/orders", (OrderRequest request) => PlaceOrder(placed, request));
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a found item is 200 with the JSON body", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetBody("/items/1"), "{\"id\":1,\"name\":\"widget\"}");
});

Test("a missing item is 404", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    Eq(await app.GetStatus("/items/99"), 404);
});

Test("GetItem returns the typed Ok result, not just an IResult", () =>
{
    var result = GetItem(1);
    Ok(result.Result is Ok<Item>);
    Eq(((Ok<Item>)result.Result).Value, new Item(1, "widget"));
});

Test("GetItem returns the typed NotFound for a missing id", () =>
    Ok(GetItem(99).Result is NotFound));

Test("a valid order is 201 with a Location header", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/orders", new { sku = "ABC", quantity = 2 });

    Eq((int)response.StatusCode, 201);
    Eq(response.Headers.Location?.ToString(), "/orders/ABC");
});

Test("a zero quantity is 400 with an RFC 7807 problem body", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    var response = await app.PostJson("/orders", new { sku = "ABC", quantity = 0 });
    var body = await response.Content.ReadAsStringAsync();

    Eq((int)response.StatusCode, 400);
    Ok(body.Contains("Invalid quantity"));
});

Test("ordering the same sku twice is a 409", async () =>
{
    await using var app = await Web.Serve(MapRoutes);
    await app.PostJson("/orders", new { sku = "ABC", quantity = 1 });
    var second = await app.PostJson("/orders", new { sku = "ABC", quantity = 1 });

    Eq((int)second.StatusCode, 409);
});

// ──────────────────────────── types ──────────────────────────────────────

record Item(int Id, string Name);
record OrderRequest(string Sku, int Quantity);
record Order(string Sku, int Quantity);
