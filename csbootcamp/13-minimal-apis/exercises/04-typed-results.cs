// ─────────────────────────────────────────────────────────────────────────
//  04 · typed results                                     ★★☆ core
//  concepts: TypedResults · Results<T1,T2> · ProblemDetails
//  run: dotnet run 04-typed-results.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `Results.Ok(x)` returns `IResult` — an opaque box. `TypedResults.Ok(x)`
//  returns `Ok<T>`, a concrete type. That difference buys you two things:
//  the compiler checks the shape, and OpenAPI can describe the endpoint
//  without you writing `.Produces<T>(200)` by hand.
//
//  When a handler can return more than one status, declare the union:
//
//      Results<Ok<Item>, NotFound>  — exactly two possible outcomes
//
//  Anything you return that is not one of those two is a compile error,
//  which is the point.
//
//  Build:
//
//      GET /items/{id}     → Ok<Item> or NotFound
//      GET /items/{id}/raw → the same, but as plain IResult (for contrast)
//      POST /orders        → Created<Order>, BadRequest<ProblemDetails>,
//                            or Conflict when the sku is already ordered
//
//  hint: TypedResults.Problem(...) builds an RFC 7807 body; the union type
//        is `Results<Created<Order>, BadRequest<ProblemDetails>, Conflict>`
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

// The two items that exist, for lookup.
var catalogue = new Dictionary<int, Item>
{
    [1] = new Item(1, "widget"),
    [2] = new Item(2, "gadget"),
};

// Return the item, or NotFound. The RETURN TYPE must name both outcomes.
Results<Ok<Item>, NotFound> GetItem(int id)
{
    throw new NotImplementedException();
}

// Place an order:
//   quantity < 1            → BadRequest with a ProblemDetails body whose
//                             title is "Invalid quantity"
//   sku already in `placed` → Conflict
//   otherwise               → Created at /orders/{sku}, with the Order
Results<Created<Order>, BadRequest<ProblemDetails>, Conflict> PlaceOrder(
    HashSet<string> placed, OrderRequest request)
{
    throw new NotImplementedException();
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
    // The union carries the concrete type, so you can assert on it directly.
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
