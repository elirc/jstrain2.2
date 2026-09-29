// ─────────────────────────────────────────────────────────────────────────
//  05 · factories and delegates — SOLUTION                ★★☆ core
//  concepts: factory registration · Func<T> · why service location is a smell
//  run: dotnet run 05-factories-and-delegates.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Constructor injection covers most cases. Three it does not:
//
//   1. **The service needs a value the container does not have** — a
//      connection string, a tenant, a clock. Register a factory:
//      `AddSingleton(sp => new Thing(sp.GetRequiredService<IClock>(), "x"))`.
//   2. **You need MANY instances, created later** — a per-item worker, a
//      retry that wants a fresh connection. Inject a `Func<T>`.
//   3. **You need to construct a type the container does not know about**,
//      with some arguments injected and some supplied — that is
//      `ActivatorUtilities.CreateInstance<T>(provider, extras)`.
//
//  What is NOT on that list: injecting `IServiceProvider` and calling
//  `GetRequiredService` inside your methods. That is the **service locator**
//  pattern, and it is a smell for concrete reasons — the constructor stops
//  telling the truth about the type's dependencies, a missing registration
//  becomes a runtime failure deep in a call path instead of at startup, and
//  every test has to build a container.
//
//  A `Func<T>` gets you deferred creation while keeping the dependency
//  visible in the signature.
//
//  Walkthrough:
//  Two methods, and three different ways of building something the plain
//  constructor-injection path cannot.
//
//  **The factory lambda is the escape hatch for values.** `Greeter` needs a
//  `Counter` (the container has one) and a greeting string (it does not, and
//  should not — `AddSingleton<string>` is a genuinely terrible idea). The
//  lambda takes the provider, pulls what it can, and supplies the rest. In a
//  real app the string would come from `IConfiguration` or `IOptions`, and
//  the shape is identical.
//
//  **`Func<Worker>` is deferred creation with the dependency still visible.**
//  Look at `Batch`: its constructor says `Func<Worker>`, so a reader knows it
//  makes Workers, and a test can pass `() => new Worker(counter)` with no
//  container at all. Compare the version that injects `IServiceProvider` —
//  the constructor then says nothing, a missing registration surfaces
//  wherever the call happens rather than at startup, and every test needs a
//  container to run.
//
//  That is the whole argument against **service location**. It is not
//  aesthetics: it is that the type stops declaring what it needs, so nothing
//  — not the compiler, not `ValidateOnBuild`, not a reader — can check it.
//
//  The fourth test pins the laziness: resolving the `Func` creates nothing.
//  A `Worker` that opens a connection should not be built by a code path that
//  turns out not to need one.
//
//  **`ActivatorUtilities.CreateInstance<T>` constructs a type the container
//  has never heard of**, resolving what it can from the provider and taking
//  the rest positionally from you. `Report` is not registered — the seventh
//  test checks `GetService<Report>()` is null — and it is still built with
//  the container's singleton `Counter` injected.
//
//  It picks the constructor it can satisfy from the provider plus the extra
//  arguments, matching the extras **by type**. Two `string` parameters and
//  one supplied string is therefore ambiguous in a way the compiler will not
//  warn you about, which is the one sharp edge here.
//
//  Where you actually meet it: middleware (ASP.NET Core builds each one this
//  way), and anywhere a framework has to construct your type with a mix of
//  injected services and per-call arguments.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.DependencyInjection;

// Register:
//   Counter                     singleton, so instances can be counted
//   Greeter                     singleton, built by a FACTORY that supplies
//                               the greeting "hi" alongside the Counter
//   Worker                      transient
//   Func<Worker>                a delegate that makes a NEW Worker per call
ServiceProvider BuildProvider()
{
    var services = new ServiceCollection();

    services.AddSingleton<Counter>();

    // The container has the Counter and cannot have the greeting. The
    // factory supplies the difference.
    services.AddSingleton(sp => new Greeter(sp.GetRequiredService<Counter>(), "hi"));

    services.AddTransient<Worker>();

    // Deferred creation: resolving this delegate builds nothing.
    services.AddTransient<Func<Worker>>(sp => () => sp.GetRequiredService<Worker>());

    return services.BuildServiceProvider();
}

// Build a Report using ActivatorUtilities: `title` comes from the caller,
// the Counter comes from the container.
// Report is not registered anywhere. The extras are matched by TYPE, so
// the string lands on `title` and the Counter is resolved.
Report MakeReport(IServiceProvider provider, string title) =>
    ActivatorUtilities.CreateInstance<Report>(provider, title);

// ──────────────────────────── tests ──────────────────────────────────────

Test("the factory supplies the value the container does not have", () =>
{
    using var provider = BuildProvider();

    Eq(provider.GetRequiredService<Greeter>().Greet("ada"), "hi, ada");
});

Test("the factory still gets its injected dependencies", () =>
{
    using var provider = BuildProvider();
    var greeter = provider.GetRequiredService<Greeter>();

    greeter.Greet("ada");
    greeter.Greet("bob");

    Eq(provider.GetRequiredService<Counter>().Greetings, 2);
});

Test("a Func<T> hands back a NEW instance each call", () =>
{
    using var provider = BuildProvider();
    var makeWorker = provider.GetRequiredService<Func<Worker>>();

    var first = makeWorker();
    var second = makeWorker();

    Ok(!ReferenceEquals(first, second));
});

Test("...and nothing is created until you call it", () =>
{
    // Deferred creation, which is the point: a Worker that is expensive to
    // build should not be built by a code path that never uses one.
    using var provider = BuildProvider();
    var counter = provider.GetRequiredService<Counter>();

    var makeWorker = provider.GetRequiredService<Func<Worker>>();

    Eq(counter.Workers, 0, "resolving the factory must not create a Worker");

    makeWorker();

    Eq(counter.Workers, 1);
});

Test("the Func is a real dependency, visible in the constructor", () =>
{
    // Batch takes Func<Worker>, not IServiceProvider. Its signature still
    // says what it needs, which is the whole argument.
    using var provider = BuildProvider();
    var batch = new Batch(provider.GetRequiredService<Func<Worker>>());

    Eq(batch.Run(3), new[] { "worked", "worked", "worked" });
    Eq(provider.GetRequiredService<Counter>().Workers, 3);
});

Test("ActivatorUtilities mixes injected and supplied arguments", () =>
{
    using var provider = BuildProvider();
    var report = MakeReport(provider, "Quarterly");

    Eq(report.Title, "Quarterly");
    Ok(report.Counter is not null, "the Counter should have been injected");
});

Test("...and the type does not need to be registered at all", () =>
{
    using var provider = BuildProvider();

    // Report is not in the container. ActivatorUtilities builds it anyway,
    // resolving what it can and taking the rest from you.
    Eq(provider.GetService<Report>(), null);
    Eq(MakeReport(provider, "Ad hoc").Title, "Ad hoc");
});

Test("the injected Counter is the container's singleton", () =>
{
    using var provider = BuildProvider();
    var report = MakeReport(provider, "Quarterly");

    Ok(ReferenceEquals(report.Counter, provider.GetRequiredService<Counter>()));
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class Counter
{
    public int Greetings { get; private set; }
    public int Workers { get; private set; }

    public void CountGreeting() => Greetings++;
    public void CountWorker() => Workers++;
}

// Needs a greeting the container has no way to know about.
public sealed class Greeter(Counter counter, string greeting)
{
    public string Greet(string name)
    {
        counter.CountGreeting();

        return $"{greeting}, {name}";
    }
}

// Counts on CONSTRUCTION, so the tests can see when one was actually made.
public sealed class Worker
{
    public Worker(Counter counter) => counter.CountWorker();

    public string Work() => "worked";
}

// Takes a FACTORY, not a provider: the dependency stays visible.
public sealed class Batch(Func<Worker> makeWorker)
{
    public List<string> Run(int count) =>
        Enumerable.Range(0, count).Select(_ => makeWorker().Work()).ToList();
}

// Not registered anywhere. Built by ActivatorUtilities.
public sealed class Report(Counter counter, string title)
{
    public Counter Counter { get; } = counter;
    public string Title { get; } = title;
}
