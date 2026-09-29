// ─────────────────────────────────────────────────────────────────────────
//  03 · options validation — SOLUTION                     ★★☆ core
//  concepts: ValidateDataAnnotations · ValidateOnStart · IValidateOptions
//  run: dotnet run 03-options-validation.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Configuration binding never fails. A missing key leaves the property at
//  its default, a malformed number leaves it at zero, and the process starts
//  perfectly happily with a `Timeout` of `00:00:00`. The failure arrives
//  later, as a timeout that fires instantly, on a machine where somebody
//  mistyped an environment variable.
//
//  The fix is to validate at startup and refuse to run:
//
//      services.AddOptions<ApiOptions>()
//              .Bind(configuration.GetSection("Api"))
//              .ValidateDataAnnotations()
//              .Validate(o => o.Timeout > TimeSpan.Zero, "Timeout must be positive")
//              .ValidateOnStart();
//
//  Three layers, in increasing power:
//
//      ValidateDataAnnotations()   [Required], [Range], [Url] on the class
//      .Validate(predicate, msg)   one rule, inline, no new type
//      IValidateOptions<T>         a class — can inject, and can report
//                                  SEVERAL failures at once
//
//  **`ValidateOnStart()` is the load-bearing call.** Without it validation is
//  lazy: it runs the first time something resolves `IOptions<T>`, which may
//  be minutes after the process reported itself healthy. With it, the host
//  refuses to start.
//
//  Walkthrough:
//  Two methods and three layers of validation, and the reason all three exist
//  is that each catches something the others cannot.
//
//  **Binding is lenient, always.** The fourth test is the one to remember: a
//  key nobody set leaves `TimeoutSeconds` at `0`, the process starts, and the
//  first HTTP call times out instantly. No exception, no log line, and the
//  root cause is a variable name misspelled in a deployment manifest. Nothing
//  in the binding pipeline will ever tell you.
//
//  **`ValidateDataAnnotations` covers the declarative cases** — required,
//  ranges, string lengths, URLs. It is the cheapest possible win and belongs
//  on essentially every options class you write.
//
//  **`.Validate(predicate, message)` covers a rule about one instance** that
//  no attribute expresses. Here, "the timeout must be positive": nothing
//  about `int TimeoutSeconds` says that, and `[Range(1, int.MaxValue)]` on
//  the raw seconds would work but reads worse than the rule it encodes.
//
//  **`IValidateOptions<T>` is the full version.** It is a class, so it can
//  take dependencies — a validator that needs `IHostEnvironment` to say "http
//  is fine locally, https is required in production" cannot be a lambda. It
//  can also report several failures in one result, which a predicate cannot.
//
//  **All the validators run, and their failures are collected.** The seventh
//  test breaks two settings and expects both in one exception. That is the
//  same design as `ValidateOnBuild` in module 12/06: one deploy, one list of
//  everything wrong, rather than fix-one-and-try-again.
//
//  **`ValidateOnStart()` is the load-bearing call, and it is absent here**
//  because these tests have no host — they force validation by resolving
//  `IOptions<T>.Value`. In a real application, leave it out and validation is
//  lazy: it runs the first time something reads the options, which may be
//  long after the process reported itself healthy, and may be inside a
//  request that then returns a 500. Add it and the host refuses to start.
//
//  **Validation runs once.** `IOptions<T>` is a singleton and the computed
//  value is cached, which the last test pins. (`IOptionsSnapshot<T>` is
//  scoped and revalidates per scope; `IOptionsMonitor<T>` revalidates on
//  reload. Which one you inject decides how often your validator runs.)
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

// Build a provider that binds ApiOptions from `settings`, with data
// annotations, a positive-timeout rule, and the custom validator below.
ServiceProvider BuildProvider(Dictionary<string, string?> settings)
{
    var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    var services = new ServiceCollection();

    // A class, so it could take dependencies a lambda cannot.
    services.AddSingleton<IValidateOptions<ApiOptions>, HttpsValidator>();

    services.AddOptions<ApiOptions>()
        .Bind(configuration.GetSection("Api"))
        .ValidateDataAnnotations()
        .Validate(options => options.Timeout > TimeSpan.Zero, "Timeout must be positive");

    // A real application adds .ValidateOnStart() here so the HOST runs all
    // of this before it accepts traffic. There is no host in these tests, so
    // Resolve() forces it instead.
    return services.BuildServiceProvider();
}

// Resolve the options and return them, or throw OptionsValidationException.
// Reading .Value is what triggers validation without a host.
ApiOptions Resolve(ServiceProvider provider) =>
    provider.GetRequiredService<IOptions<ApiOptions>>().Value;

// ──────────────────────────── tests ──────────────────────────────────────

static Dictionary<string, string?> Good() => new()
{
    ["Api:BaseUrl"] = "https://example.com",
    ["Api:Key"] = "secret-key",
    ["Api:TimeoutSeconds"] = "30",
    ["Api:Retries"] = "3",
};

Test("a good configuration binds", () =>
{
    using var provider = BuildProvider(Good());
    var options = Resolve(provider);

    Eq(options.BaseUrl, "https://example.com");
    Eq(options.Retries, 3);
    Eq(options.TimeoutSeconds, 30);
});

Test("a missing required value is rejected", () =>
{
    var settings = Good();
    settings.Remove("Api:Key");

    using var provider = BuildProvider(settings);

    var error = Throws<OptionsValidationException>(() => Resolve(provider));
    Ok(error.Message.Contains("Key"), error.Message);
});

Test("an out-of-range value is rejected", () =>
{
    var settings = Good();
    settings["Api:Retries"] = "99";

    using var provider = BuildProvider(settings);

    Throws<OptionsValidationException>(() => Resolve(provider));
});

Test("a MISSING number binds to zero rather than failing", () =>
{
    // The thing this whole exercise exists for. Binding is lenient: a key
    // nobody set leaves the property at default, and the process starts with
    // a timeout of zero. Only validation catches it.
    var settings = Good();
    settings.Remove("Api:TimeoutSeconds");

    using var provider = BuildProvider(settings);

    var error = Throws<OptionsValidationException>(() => Resolve(provider));
    Ok(error.Message.Contains("Timeout", StringComparison.OrdinalIgnoreCase), error.Message);
});

Test("the inline rule catches a zero timeout", () =>
{
    var settings = Good();
    settings["Api:TimeoutSeconds"] = "0";

    using var provider = BuildProvider(settings);

    Throws<OptionsValidationException>(() => Resolve(provider));
});

Test("the custom validator catches a rule annotations cannot express", () =>
{
    // "A production URL must be https" is not a [Range] or a [Required].
    var settings = Good();
    settings["Api:BaseUrl"] = "http://example.com";

    using var provider = BuildProvider(settings);

    var error = Throws<OptionsValidationException>(() => Resolve(provider));
    Ok(error.Message.Contains("https"), error.Message);
});

Test("ALL the failures are reported, not just the first", () =>
{
    // One deploy, one list of what is wrong with the config.
    var settings = Good();
    settings.Remove("Api:Key");
    settings["Api:Retries"] = "99";

    using var provider = BuildProvider(settings);

    var error = Throws<OptionsValidationException>(() => Resolve(provider));
    Ok(error.Failures.Count() >= 2, "expected several failures, got " + error.Failures.Count());
});

Test("validation runs ONCE and the result is cached", () =>
{
    HttpsValidator.Calls = 0;

    using var provider = BuildProvider(Good());

    Resolve(provider);
    Resolve(provider);

    Eq(HttpsValidator.Calls, 1, "IOptions<T> is a singleton — validated once");
});

// ──────────────────────────── your code ──────────────────────────────────

public sealed class ApiOptions
{
    [Required]
    public string BaseUrl { get; set; } = "";

    [Required]
    public string Key { get; set; } = "";

    // No annotation: "positive" is expressed by the inline rule, which reads
    // closer to the requirement than [Range(1, int.MaxValue)] does.
    public int TimeoutSeconds { get; set; }

    [Range(0, 10)]
    public int Retries { get; set; }

    public TimeSpan Timeout => TimeSpan.FromSeconds(TimeoutSeconds);
}

// A rule no annotation can express. Return Success, or Fail with a message
// containing "https".
public sealed class HttpsValidator : IValidateOptions<ApiOptions>
{
    // Counts how often the validator ran, for the last test.
    public static int Calls;

    public ValidateOptionsResult Validate(string? name, ApiOptions options)
    {
        Interlocked.Increment(ref Calls);

        // A rule about the SHAPE of a value, which no annotation expresses.
        return options.BaseUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail("BaseUrl must use https");
    }
}
