// ─────────────────────────────────────────────────────────────────────────
//  05 · a CRUD controller with a service                  ★★★ stretch
//  concepts: constructor injection · CreatedAtAction · thin controllers
//  run: dotnet run 05-controller-crud.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The rule that keeps controllers maintainable: a controller translates
//  HTTP to method calls and back. It does not hold business logic, it does
//  not touch storage, and it does not know how anything is implemented. All
//  of that lives in an injected service — which is then testable without
//  HTTP at all.
//
//  `ICustomerStore` is given, already implemented and registered. Your job
//  is the controller: take it in the constructor and map each action onto
//  it with the right status codes.
//
//      GET    /api/customers          → 200, the list
//      GET    /api/customers/{id}     → 200 or 404
//      POST   /api/customers          → 201 + Location, or 400
//      PUT    /api/customers/{id}     → 204 or 404
//      DELETE /api/customers/{id}     → 204 or 404
//
//  Use `CreatedAtAction` rather than building the URL by hand — it asks
//  routing where the action actually lives, so renaming a route cannot leave
//  you serving a Location that 404s.
//
//  hint: CreatedAtAction(nameof(GetById), new { id = created.Id }, created)
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

// Provided, complete. The controller must not duplicate any of this.
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
    public ActionResult<IEnumerable<Customer>> GetAll() => throw new NotImplementedException();

    [HttpGet("{id:int}")]
    public ActionResult<Customer> GetById(int id) => throw new NotImplementedException();

    [HttpPost]
    public ActionResult<Customer> Create(CustomerInput input)
        => throw new NotImplementedException();

    [HttpPut("{id:int}")]
    public IActionResult Update(int id, CustomerInput input)
        => throw new NotImplementedException();

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id) => throw new NotImplementedException();
}
