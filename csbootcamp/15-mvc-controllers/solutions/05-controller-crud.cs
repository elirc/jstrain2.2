// ─────────────────────────────────────────────────────────────────────────
//  05 · a CRUD controller with a service — SOLUTION       ★★★ stretch
//  concepts: constructor injection · CreatedAtAction · thin controllers
//  run: dotnet run 05-controller-crud.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Every action is one line, and that is the target. The controller decides
//  which STATUS CODE a store outcome deserves and nothing else — no
//  validation (the annotations plus [ApiController] did it), no id
//  generation, no storage. Move any of that in here and it becomes
//  untestable without spinning up HTTP.
//
//  Notice how well the store's return types map onto HTTP: `Customer?` from
//  Find becomes 200-or-404, and `bool` from Update/Remove becomes
//  204-or-404. Designing a service so its results translate cleanly is what
//  keeps the controller this thin.
//
//  `CreatedAtAction(nameof(GetById), new { id }, created)` asks the routing
//  system to generate the URL for that action. Hand-writing
//  `$"/api/customers/{id}"` works right up until someone changes the
//  [Route] prefix, at which point you serve a Location header that 404s and
//  nothing fails loudly. The "Location header actually resolves" test is
//  there precisely because that bug is invisible otherwise.
//
//  `nameof(GetById)` rather than "GetById" means renaming the action is a
//  compile error instead of a runtime one.
//
//  PUT returns 204: the client already knows what it sent, so echoing the
//  object back is bytes nobody reads. Returning 200 with the entity is also
//  defensible — what matters is being consistent across the API.
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.ComponentModel.DataAnnotations;

void AddServices(WebApplicationBuilder builder)
{
    builder.Services.AddSingleton<ICustomerStore, InMemoryCustomerStore>();
    builder.Services.AddControllers();
}

void MapRoutes(WebApplication app) => app.MapControllers();

// ──────────────────────────── tests ──────────────────────────────────────

Test("the list starts empty", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetBody("/api/customers"), "[]");
});

Test("POST returns 201 and a Location pointing at the new customer", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/customers", new { name = "Ada" });

    Eq((int)response.StatusCode, 201);
    Eq(response.Headers.Location?.AbsolutePath, "/api/customers/1");
});

Test("the Location header actually resolves", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var created = await app.PostJson("/api/customers", new { name = "Ada" });

    var followed = await app.Client.GetAsync(created.Headers.Location);
    Eq((int)followed.StatusCode, 200);
    Eq(await followed.Content.ReadAsStringAsync(), "{\"id\":1,\"name\":\"Ada\"}");
});

Test("an invalid name is rejected with 400 before reaching the store", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PostJson("/api/customers", new { name = "" });

    Eq((int)response.StatusCode, 400);
    Eq(await app.GetBody("/api/customers"), "[]");
});

Test("GET by id is 404 for an unknown customer", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    Eq(await app.GetStatus("/api/customers/99"), 404);
});

Test("PUT updates and returns 204", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.PostJson("/api/customers", new { name = "Ada" });

    var response = await app.PutJson("/api/customers/1", new { name = "Ada L" });
    Eq((int)response.StatusCode, 204);
    Eq(await app.GetBody("/api/customers/1"), "{\"id\":1,\"name\":\"Ada L\"}");
});

Test("PUT to a missing customer is 404", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    var response = await app.PutJson("/api/customers/99", new { name = "Ghost" });
    Eq((int)response.StatusCode, 404);
});

Test("DELETE removes and returns 204, then 404", async () =>
{
    await using var app = await Web.Serve(AddServices, MapRoutes);
    await app.PostJson("/api/customers", new { name = "Ada" });

    Eq((int)(await app.Client.DeleteAsync("/api/customers/1")).StatusCode, 204);
    Eq(await app.GetStatus("/api/customers/1"), 404);
    Eq((int)(await app.Client.DeleteAsync("/api/customers/1")).StatusCode, 404);
});

// ──────────────────────────── types ──────────────────────────────────────

public record Customer(int Id, string Name);

public class CustomerInput
{
    [Required]
    [MinLength(1)]
    public string Name { get; set; } = "";
}

public interface ICustomerStore
{
    IReadOnlyList<Customer> All();
    Customer? Find(int id);
    Customer Add(string name);
    bool Update(int id, string name);
    bool Remove(int id);
}

public class InMemoryCustomerStore : ICustomerStore
{
    private readonly Dictionary<int, Customer> _items = [];
    private int _nextId;

    public IReadOnlyList<Customer> All() => _items.Values.OrderBy(c => c.Id).ToList();

    public Customer? Find(int id) => _items.GetValueOrDefault(id);

    public Customer Add(string name)
    {
        var customer = new Customer(++_nextId, name);
        _items[customer.Id] = customer;
        return customer;
    }

    public bool Update(int id, string name)
    {
        if (!_items.ContainsKey(id)) return false;
        _items[id] = new Customer(id, name);
        return true;
    }

    public bool Remove(int id) => _items.Remove(id);
}

[ApiController]
[Route("api/customers")]
public class CustomersController(ICustomerStore store) : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<Customer>> GetAll() => Ok(store.All());

    [HttpGet("{id:int}")]
    public ActionResult<Customer> GetById(int id)
        => store.Find(id) is { } customer ? customer : NotFound();

    [HttpPost]
    public ActionResult<Customer> Create(CustomerInput input)
    {
        var created = store.Add(input.Name);
        // Let routing build the URL — never string-concatenate it.
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, CustomerInput input)
        => store.Update(id, input.Name) ? NoContent() : NotFound();

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
        => store.Remove(id) ? NoContent() : NotFound();
}
