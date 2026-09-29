// ─────────────────────────────────────────────────────────────────────────
//  05 · environments — SOLUTION                           ★★☆ core
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
//  Walkthrough:
//  Three short methods, and one habit that is worth more than all of them.
//
//  **Write the condition as "is it development?", never as "is it
//  production?"** Both look equivalent and they fail in opposite directions.
//  `if (env.IsProduction()) Lock(); else Unlock();` unlocks for "Prod-EU",
//  for a typo, for an unset variable, and for the staging environment nobody
//  remembered to configure. `if (env.IsDevelopment()) Unlock(); else Lock();`
//  locks for all of those.
//
//  The third test walks four wrong-looking environment names and demands the
//  safe branch for every one. That test is the entire exercise; the rest is
//  mechanics.
//
//  This is the same principle as module 19/04's authorization handler failing
//  closed, and module 07/05's validator reporting rather than assuming:
//  **ambiguity must resolve to the safe answer.** The cost of being wrong in
//  one direction is a developer being mildly inconvenienced; in the other, a
//  stack trace with connection strings in it, in front of a customer.
//
//  **`IsDevelopment()` is an ordinal case-insensitive comparison** against
//  the well-known name, which is why "development" works and "Dev" does not.
//  For your own names, `IsEnvironment("QA")` does the same comparison.
//
//  **Environment checks belong in startup wiring, not in business logic.**
//  `BuildProvider` decides once which `IGreeter` exists, and nothing
//  downstream ever asks what environment it is in. The alternative —
//  `if (env.IsDevelopment())` scattered through the code — means the
//  behaviour of a class depends on ambient state, which makes it untestable
//  and makes "what does this do in staging?" a question nobody can answer
//  without reading everything.
//
//  Where you genuinely need per-environment behaviour deeper in the app,
//  prefer a **capability** — an injected `IFeatureFlags` or a configuration
//  value — over the environment name. Then "turn this on in staging" is a
//  config change, not a deployment.
//
//  **Configuration layers work the same way**, which is what
//  `BuildConfiguration` shows: a shared base, then an environment-specific
//  layer on top, then (in a real host) environment variables, then command
//  line. Later wins, key by key — module 22/04's rule, applied here.
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
    var environment = new Env(environmentName);
    var services = new ServiceCollection();

    // "Is it dev?" — so every unrecognised name falls into the safe branch.
    if (environment.IsDevelopment())
        services.AddSingleton<IGreeter, LoudGreeter>();
    else
        services.AddSingleton<IGreeter, QuietGreeter>();

    return services.BuildServiceProvider();
}

// Should detailed errors be shown? Development only.
bool ShowDetailedErrors(IHostEnvironment environment) => environment.IsDevelopment();

// Load configuration with an environment-specific layer on top:
//   base:  appsettings-ish values from `shared`
//   then:  the layer named by `environmentName`, if `perEnvironment` has one
IConfiguration BuildConfiguration(
    Dictionary<string, string?> shared,
    Dictionary<string, Dictionary<string, string?>> perEnvironment,
    string environmentName)
{
    var builder = new ConfigurationBuilder().AddInMemoryCollection(shared);

    // No layer for this environment is not an error — the shared values
    // simply stand on their own.
    if (perEnvironment.TryGetValue(environmentName, out var layer))
        builder.AddInMemoryCollection(layer);

    return builder.Build();
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
