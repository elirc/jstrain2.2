// ─────────────────────────────────────────────────────────────────────────
//  03 · naming and shaping                                ★★☆ core
//  concepts: JsonPropertyName · ignore conditions · extension data
//  run: dotnet run 03-naming-and-shaping.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  The wire format and your C# names are two different things, and pretending
//  otherwise is how a rename in a DTO becomes a breaking API change.
//
//      [JsonPropertyName("customer_id")]   pin ONE property's wire name
//      PropertyNamingPolicy               a default for all of them
//      [JsonIgnore(Condition = …)]        leave it out, sometimes or always
//      [JsonExtensionData]                keep the fields you did not model
//
//  `[JsonPropertyName]` beats the naming policy, which is the point: the
//  policy is a convenience and the attribute is a contract.
//
//  `[JsonExtensionData]` on a `Dictionary<string, JsonElement>` collects
//  every unmatched property instead of dropping it — which is what makes a
//  round trip through your service lossless. Without it, a client that sends
//  a field you have not modelled yet gets it silently deleted, and a
//  read-modify-write endpoint quietly destroys data it never understood.
//
//  hint: `JsonIgnoreCondition.WhenWritingNull` and `WhenWritingDefault` are
//        different — `0` is a default and is not null
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Text.Json;
using System.Text.Json.Serialization;

// Serializer options for this API: snake_case property names by default.
JsonSerializerOptions Options()
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the naming policy renames everything by default", () =>
{
    var json = JsonSerializer.Serialize(new Customer { FirstName = "Ada" }, Options());

    Ok(json.Contains("\"first_name\":\"Ada\""), json);
});

Test("an explicit JsonPropertyName wins over the policy", () =>
{
    // The policy would make this "customer_id". The attribute says otherwise
    // because some other system already depends on the name.
    var json = JsonSerializer.Serialize(new Customer { Id = 7 }, Options());

    Ok(json.Contains("\"id\":7"), json);
    Ok(!json.Contains("customer_id"), json);
});

Test("a never-serialised property stays out of the payload", () =>
{
    var json = JsonSerializer.Serialize(
        new Customer { FirstName = "Ada", InternalNote = "flagged" }, Options());

    Ok(!json.Contains("flagged"), json);
    Ok(!json.Contains("internal"), json);
});

Test("a null optional field is omitted", () =>
{
    var json = JsonSerializer.Serialize(new Customer { FirstName = "Ada" }, Options());

    Ok(!json.Contains("nickname"), json);
});

Test("...but a zero is not, because zero is not null", () =>
{
    // WhenWritingNull and WhenWritingDefault differ exactly here, and
    // choosing the wrong one silently drops legitimate zeroes.
    var json = JsonSerializer.Serialize(new Customer { FirstName = "Ada", Visits = 0 }, Options());

    Ok(json.Contains("\"visits\":0"), json);
});

Test("unknown fields are captured, not dropped", () =>
{
    const string incoming = """
        {"first_name":"Ada","id":7,"loyalty_tier":"gold","beta_flag":true}
        """;

    var customer = JsonSerializer.Deserialize<Customer>(incoming, Options())!;

    Eq(customer.FirstName, "Ada");
    Eq(customer.Extra.Count, 2);
    Eq(customer.Extra["loyalty_tier"].GetString(), "gold");
});

Test("a round trip through the DTO loses nothing", () =>
{
    // The read-modify-write case. Without extension data, loyalty_tier is
    // gone the first time anything passes through this service.
    const string incoming = """{"first_name":"Ada","id":7,"loyalty_tier":"gold"}""";

    var customer = JsonSerializer.Deserialize<Customer>(incoming, Options())!;
    var json = JsonSerializer.Serialize(customer, Options());

    Ok(json.Contains("loyalty_tier"), json);
    Ok(json.Contains("gold"), json);
});

Test("deserialisation is case-insensitive when asked", () =>
{
    // Off by default. A client sending "First_Name" gets a null property and
    // no error whatsoever, which is a genuinely annoying afternoon.
    var lenient = new JsonSerializerOptions(Options()) { PropertyNameCaseInsensitive = true };

    Eq(JsonSerializer.Deserialize<Customer>("""{"First_Name":"Ada"}""", lenient)!.FirstName, "Ada");
    Eq(JsonSerializer.Deserialize<Customer>("""{"First_Name":"Ada"}""", Options())!.FirstName, null);
});

// ──────────────────────────── your code ──────────────────────────────────

// Shape this DTO with attributes so the tests above pass. Do not change the
// property names or types — the attributes are the whole exercise.
public sealed class Customer
{
    // The wire name must stay "id" even under a snake_case policy.
    public int Id { get; set; }

    // Follows the policy: "first_name".
    public string? FirstName { get; set; }

    // Never serialised, in either direction.
    public string? InternalNote { get; set; }

    // Omitted when it is null.
    public string? Nickname { get; set; }

    // Always written, INCLUDING when it is 0.
    public int Visits { get; set; }

    // Every property that did not match one of the above.
    public Dictionary<string, JsonElement> Extra { get; set; } = [];
}
