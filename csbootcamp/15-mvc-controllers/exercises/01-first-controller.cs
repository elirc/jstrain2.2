// ─────────────────────────────────────────────────────────────────────────
//  01 · your first controller                             ★☆☆ warm-up
//  concepts: ControllerBase · attribute routing · ActionResult<T>
//  run: dotnet run 01-first-controller.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Controllers are the other way to write an HTTP API in ASP.NET Core. The
//  routing, binding and results you learned in module 13 are all the same
//  underneath — what changes is that related endpoints share a class, a
//  route prefix, and a set of filters.
//
//  Two lines wire it up:
//
//      builder.Services.AddControllers();   // register the MVC services
//      app.MapControllers();                // map the discovered actions
//
//  Controllers are found by scanning the assembly for public classes whose
//  name ends in "Controller" or that derive from ControllerBase — you never
//  register them one by one.
//
//  The BooksController at the bottom already carries its routing
//  attributes — read them first, they are half the lesson. Implement the
//  three action bodies so that:
//
//      GET /api/books        → the whole list
//      GET /api/books/{id}   → one book, or 404
//      GET /api/books/count  → the number of books
//
//  hint: `ActionResult<T>` lets you return either the value or a result
//        helper like NotFound() from the same method
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

void AddServices(WebApplicationBuilder builder) => builder.Services.AddControllers();
void MapRoutes(WebApplication app) => app.MapControllers();

// ──────────────────────────── tests ──────────────────────────────────────

Test("the collection route returns every book", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/books"),
       "[{\"id\":1,\"title\":\"Dune\"},{\"id\":2,\"title\":\"Neuromancer\"}]");
});

Test("a single book is returned by id", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/books/1"), "{\"id\":1,\"title\":\"Dune\"}");
});

Test("a missing book is a 404", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/api/books/99"), 404);
});

Test("a literal segment beats the {id} template", async () =>
{
    // "/count" and "/{id}" both match "count"; the literal route wins.
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/books/count"), "2");
});

Test("the route prefix comes from the class, not each action", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/books"), 404);
    Eq(await app.GetStatus("/api/books"), 200);
});

Test("POST to a GET-only action is 405", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.Client.PostAsync("/api/books", new StringContent(""));
    Eq((int)response.StatusCode, 405);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Book(int Id, string Title);

// The routing attributes are given — read them, they are the lesson:
//   [Route] on the CLASS sets the prefix every action inherits.
//   [HttpGet] on an ACTION sets the verb and the template appended to it.
// You implement the three bodies.
[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    private static readonly List<Book> Books =
    [
        new(1, "Dune"),
        new(2, "Neuromancer"),
    ];

    // → GET /api/books
    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll() => throw new NotImplementedException();

    // → GET /api/books/{id}
    [HttpGet("{id:int}")]
    public ActionResult<Book> GetById(int id) => throw new NotImplementedException();

    // → GET /api/books/count
    [HttpGet("count")]
    public ActionResult<int> Count() => throw new NotImplementedException();
}
