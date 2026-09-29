// ─────────────────────────────────────────────────────────────────────────
//  01 · your first controller — SOLUTION                  ★☆☆ warm-up
//  concepts: ControllerBase · attribute routing · ActionResult<T>
//  run: dotnet run 01-first-controller.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `ActionResult<T>` is a union: it converts implicitly from a `T` AND from
//  any `ActionResult`, so `return Books;` and `return NotFound();` are both
//  legal in one method. That is why GetById needs no casting and no
//  `Ok(...)` wrapper — returning the value directly means 200 with the value
//  serialised.
//
//  `ControllerBase` supplies the helper methods: Ok, NotFound, BadRequest,
//  Created, NoContent, and so on. Note it is ControllerBase, not Controller
//  — the latter adds view rendering, which an API does not need and which
//  drags in Razor.
//
//  Route templates compose: `[Route("api/books")]` on the class plus
//  `[HttpGet("count")]` on the action gives /api/books/count. The action
//  attribute never repeats the prefix.
//
//  The "/count beats /{id}" test is about route precedence, and the rule is
//  worth memorising: more specific wins, and a LITERAL segment is more
//  specific than a parameter segment. So /api/books/count reaches Count()
//  and never tries to parse "count" as an id. The `:int` constraint would
//  have saved it anyway here, but the precedence rule holds without it.
//
//  The 405 on POST is free: the action declared GET, the route matched, the
//  verb did not, so MVC answers Method Not Allowed rather than 404.
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

[ApiController]
[Route("api/books")]
public class BooksController : ControllerBase
{
    private static readonly List<Book> Books =
    [
        new(1, "Dune"),
        new(2, "Neuromancer"),
    ];

    [HttpGet]
    public ActionResult<IEnumerable<Book>> GetAll() => Books;

    [HttpGet("{id:int}")]
    public ActionResult<Book> GetById(int id)
    {
        var book = Books.FirstOrDefault(b => b.Id == id);
        // ActionResult<T> accepts either the value or a result helper.
        return book is null ? NotFound() : book;
    }

    [HttpGet("count")]
    public ActionResult<int> Count() => Books.Count;
}
