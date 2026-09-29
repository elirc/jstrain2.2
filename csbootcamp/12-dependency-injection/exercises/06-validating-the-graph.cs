// ─────────────────────────────────────────────────────────────────────────
//  06 · validating the graph                              ★★☆ core
//  concepts: ValidateOnBuild · ValidateScopes · failing at startup
//  run: dotnet run 06-validating-the-graph.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A DI container resolves lazily, which means a broken registration is a
//  **runtime** error — discovered by the first request that happens to walk
//  that path, at 3am, on the one endpoint nobody exercised.
//
//  Two switches move those failures to startup:
//
//      ValidateOnBuild = true    every registration is checked at Build()
//                                time: can each one actually be constructed?
//      ValidateScopes = true     a scoped service resolved from the ROOT
//                                provider throws instead of silently
//                                becoming a de facto singleton
//
//  Both are ON by default in the ASP.NET Core host **in Development only**.
//  So the captive dependency from exercise 01 throws on your machine and
//  works — wrongly, silently, shared across every request — in production.
//  Turning them on everywhere is nearly always the right call: a container
//  that cannot be built is a deployment that should not start.
//
//  `ValidateOnBuild` reports EVERY problem at once, wrapped in an
//  `AggregateException`. That is deliberate — you want the whole list, not
//  the first one and another deploy.
//
//  hint: `services.BuildServiceProvider(new ServiceProviderOptions { … })`
//        is the overload that takes both switches
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Build with BOTH validations on.
ServiceProvider BuildValidated(ServiceCollection services)
{
    throw new NotImplementedException();
}

// Build with neither — the permissive behaviour, for contrast.
ServiceProvider BuildPermissive(ServiceCollection services)
{
    throw new NotImplementedException();
}

// A collection where Report depends on Formatter, and Formatter is NOT
// registered. Everything else about it is fine.
ServiceCollection MissingDependency()
{
    throw new NotImplementedException();
}

// A collection with the captive dependency from exercise 01: a SINGLETON
// that depends on a SCOPED service.
ServiceCollection CaptiveDependency()
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a missing dependency is caught at BUILD time", () =>
{
    // Not on the first request that touches Report. At startup, before the
    // process claims to be healthy.
    Throws<AggregateException>(() => BuildValidated(MissingDependency()));
});

Test("...and without validation it builds happily", () =>
{
    using var provider = BuildPermissive(MissingDependency());

    // The container is fine. The failure is waiting for whoever resolves it.
    Throws<InvalidOperationException>(() => provider.GetRequiredService<Report>());
});

Test("the aggregate names the service that cannot be built", () =>
{
    var error = Throws<AggregateException>(() => BuildValidated(MissingDependency()));

    Ok(error.ToString().Contains("Report") || error.ToString().Contains("Formatter"),
       error.Message);
});

Test("EVERY broken registration is reported, not just the first", () =>
{
    // One deploy, one list. That is the reason for the AggregateException.
    var services = MissingDependency();
    services.AddSingleton<AlsoBroken>();

    var error = Throws<AggregateException>(() => BuildValidated(services));

    Eq(error.InnerExceptions.Count, 2);
});

Test("a captive dependency is caught by scope validation", () =>
{
    // A singleton holding a scoped service means one instance shared across
    // every request — a data leak between users, in the shape of a cache.
    Throws<AggregateException>(() => BuildValidated(CaptiveDependency()));
});

Test("...and without validation it is silently wrong", () =>
{
    using var provider = BuildPermissive(CaptiveDependency());
    var first = provider.GetRequiredService<CachingService>();
    var second = provider.GetRequiredService<CachingService>();

    // Same singleton, same captured scoped instance. Nothing complains.
    Ok(ReferenceEquals(first.PerRequest, second.PerRequest));
});

Test("scope validation also refuses a scoped service from the ROOT", () =>
{
    var services = new ServiceCollection();
    services.AddScoped<PerRequestService>();

    using var provider = BuildValidated(services);

    // Resolving it from the root would make it a de facto singleton.
    Throws<InvalidOperationException>(() => provider.GetRequiredService<PerRequestService>());
});

Test("...but resolving it inside a scope is fine", () =>
{
    var services = new ServiceCollection();
    services.AddScoped<PerRequestService>();

    using var provider = BuildValidated(services);
    using var scope = provider.CreateScope();

    NotNull(scope.ServiceProvider.GetRequiredService<PerRequestService>());
});

Test("a healthy graph builds under validation without complaint", () =>
{
    var services = new ServiceCollection();
    services.AddSingleton<Formatter>();
    services.AddSingleton<Report>();

    using var provider = BuildValidated(services);

    NotNull(provider.GetRequiredService<Report>());
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Formatter
{
    public string Format(string text) => text.ToUpperInvariant();
}

public sealed class Report(Formatter formatter)
{
    public string Render() => formatter.Format("report");
}

// Also depends on something that is never registered.
public sealed class AlsoBroken(Formatter formatter)
{
    public Formatter Formatter { get; } = formatter;
}

public sealed class PerRequestService
{
    public Guid Id { get; } = Guid.NewGuid();
}

// A singleton holding a scoped service: the captive dependency.
public sealed class CachingService(PerRequestService perRequest)
{
    public PerRequestService PerRequest { get; } = perRequest;
}
