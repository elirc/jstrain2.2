// ─────────────────────────────────────────────────────────────────────────
//  05 · environments                                      ★★☆ core
//  concepts: IHostEnvironment · conditional wiring · fail-closed defaults
//  run: dotnet run 05-environments.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `IHostEnvironment.EnvironmentName` is just a string, read from
//  `DOTNET_ENVIRONMENT` / `ASPNETCORE_ENVIRONMENT`. Three names are
//  well-known — Development, Staging, Production — and `IsDevelopment()`,
//  `IsStaging()`, `IsProduction()` and `IsEnvironment("QA")` are ordinal
//  case-INSENSITIVE comparisons against that string.
//
//  Two rules that keep this from becoming a source of incidents:
//
//   1. **Branch on a CAPABILITY, not on the environment name**, wherever you
//      can. `if (env.IsDevelopment()) UseInMemoryStore();` scatters
//      environment checks through the codebase; registering the store once,
//      based on configuration, keeps the decision in one place. Environment
//      checks belong in startup wiring, not in business logic.
//
//   2. **Default to the SAFE branch.** An unrecognised or unset environment
//      must behave like production — locked down, no developer exception
//      page, no seeded test data. Anything else means a typo in a deployment
//      variable silently turns diagnostics on in front of customers, and
//      "ProductionN" or "prod" will happen eventually.
//
//  hint: `IsDevelopment()` is false for "prod", "Prod-EU", "" and null — so
//        write the condition as "is it dev?" and let everything else fall
//        into the safe branch
#:sdk Microsoft.NET.Sdk.Web
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

// Register IGreeter: a LoudGreeter in Development, a QuietGreeter anywhere
// else — including an environment name nobody recognises.
ServiceProvider BuildProvider(string environmentName)
{
    throw new NotImplementedException();
}

// Should detailed errors be shown? Development only.
bool ShowDetailedErrors(IHostEnvironment environment)
{
    throw new NotImplementedException();
}

// Load configuration with an environment-specific layer on top:
//   base:  appsettings-ish values from `shared`
//   then:  the layer named by `environmentName`, if `perEnvironment` has one
IConfiguration BuildConfiguration(
    Dictionary<string, string?> shared,
    Dictionary<string, Dictionary<string, string?>> perEnvironment,
    string environmentName)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("development gets the development implementation", () =>
{
    using var provider = BuildProvider("Development");

    Eq(provider.GetRequiredService<IGreeter>().Greet("ada"), "HELLO ADA");
});

Test("production gets the other one", () =>
{
    using var provider = BuildProvider("Production");

    Eq(provider.GetRequiredService<IGreeter>().Greet("ada"), "hello ada");
});

Test("an unknown environment falls into the SAFE branch", () =>
{
    // "Prod-EU", a typo, or an unset variable must not behave like a
    // developer machine. Write the condition as "is it dev?" and this is
    // free; write it as "is it prod?" and it is a production incident.
    foreach (var name in new[] { "Prod-EU", "prodution", "Staging", "" })
    {
        using var provider = BuildProvider(name);

        Eq(provider.GetRequiredService<IGreeter>().Greet("ada"), "hello ada", name);
    }
});

Test("the environment check is case-insensitive", () =>
{
    using var provider = BuildProvider("development");

    Eq(provider.GetRequiredService<IGreeter>().Greet("ada"), "HELLO ADA");
});

Test("detailed errors are on in development and off everywhere else", () =>
{
    Ok(ShowDetailedErrors(new Env("Development")));
    Ok(!ShowDetailedErrors(new Env("Production")));
    Ok(!ShowDetailedErrors(new Env("Staging")));
    Ok(!ShowDetailedErrors(new Env("something-else")));
});

Test("the shared layer applies everywhere", () =>
{
    var configuration = BuildConfiguration(
        new() { ["App:Name"] = "bootcamp", ["App:Url"] = "https://prod" },
        new() { ["Development"] = new() { ["App:Url"] = "https://localhost" } },
        "Production");

    Eq(configuration["App:Name"], "bootcamp");
    Eq(configuration["App:Url"], "https://prod");
});

Test("the environment layer overrides the shared one", () =>
{
    var configuration = BuildConfiguration(
        new() { ["App:Name"] = "bootcamp", ["App:Url"] = "https://prod" },
        new() { ["Development"] = new() { ["App:Url"] = "https://localhost" } },
        "Development");

    Eq(configuration["App:Name"], "bootcamp", "the shared value is still there");
    Eq(configuration["App:Url"], "https://localhost");
});

Test("an environment with no layer just uses the shared one", () =>
{
    var configuration = BuildConfiguration(
        new() { ["App:Url"] = "https://prod" },
        new() { ["Development"] = new() { ["App:Url"] = "https://localhost" } },
        "Staging");

    Eq(configuration["App:Url"], "https://prod");
});

// ──────────────────────────── types ──────────────────────────────────────

public interface IGreeter
{
    string Greet(string name);
}

public sealed class LoudGreeter : IGreeter
{
    public string Greet(string name) => $"HELLO {name.ToUpperInvariant()}";
}

public sealed class QuietGreeter : IGreeter
{
    public string Greet(string name) => $"hello {name}";
}

// A minimal IHostEnvironment for the tests.
public sealed class Env(string name) : IHostEnvironment
{
    public string EnvironmentName { get; set; } = name;
    public string ApplicationName { get; set; } = "tests";
    public string ContentRootPath { get; set; } = ".";
    public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } =
        new Microsoft.Extensions.FileProviders.NullFileProvider();
}
