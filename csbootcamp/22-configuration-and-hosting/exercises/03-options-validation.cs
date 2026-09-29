// ─────────────────────────────────────────────────────────────────────────
//  03 · options validation                                ★★☆ core
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
//  hint: `.ValidateOnStart()` is what makes the host run the validators — the
//        tests here call the validator directly, because there is no host
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
    throw new NotImplementedException();
}

// Resolve the options and return them, or throw OptionsValidationException.
ApiOptions Resolve(ServiceProvider provider)
{
    throw new NotImplementedException();
}

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

// Add the data annotations the tests ask for:
//   BaseUrl   required
//   Key       required
//   Retries   0..10
public sealed class ApiOptions
{
    public string BaseUrl { get; set; } = "";
    public string Key { get; set; } = "";
    public int TimeoutSeconds { get; set; }
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
        throw new NotImplementedException();
    }
}
