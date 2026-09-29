// ─────────────────────────────────────────────────────────────────────────
//  02 · the options pattern — SOLUTION                    ★★☆ core
//  concepts: IOptions vs IOptionsMonitor · binding · validation
//  run: dotnet run 02-the-options-pattern.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  `AddOptions<T>().Bind(section)` is the modern spelling; `Configure<T>` is
//  the older one and does the same binding. The chain matters:
//
//      .Bind(section)                → map the config section onto the class
//      .ValidateDataAnnotations()    → run [Required], [Range], …
//      .ValidateOnStart()            → run that validation AT BUILD TIME
//
//  One wrinkle this file makes visible: `ValidateOnStart()` does not validate
//  anything by itself. It registers an `IStartupValidator`, which the generic
//  **host** invokes while starting. In a real app `WebApplication.Run()` does
//  that for you; here there is no host, so `BuildValidated` resolves the
//  validator and calls it — which is a useful thing to have seen, because it
//  explains why `ValidateOnStart` appears to do nothing in a bare
//  `ServiceProvider` or a unit test.
//
//  Without `ValidateOnStart`, validation is **lazy**: it fires the first time
//  something resolves `IOptions<T>.Value`. If that path is a rarely-hit
//  endpoint, a typo in production config sits dormant until the worst moment.
//  With it, a bad config is a startup crash — loud, immediate, and in front of
//  whoever is deploying. The two "fails at startup" tests are the point of the
//  exercise.
//
//  Binding does type conversion for you: `"587"` becomes an `int`, `"true"` a
//  `bool`. A missing key leaves the property's initialiser, which is why
//  `Port = 25` is a real default rather than a zero.
//
//  The three flavours differ only in WHEN the value is read:
//
//    · `IOptions<T>` — resolved once, registered singleton. Cheap, and blind
//      to later changes. Fine for anything set at deploy time.
//    · `IOptionsSnapshot<T>` — recomputed per scope, so per HTTP request.
//      **Scoped**, so it cannot be injected into a singleton (exercise 01's
//      captive dependency).
//    · `IOptionsMonitor<T>` — re-reads on every `CurrentValue`, and supports
//      `OnChange`. The only one safe inside a singleton when the value can
//      change.
//
//  Reaching for `IOptions<T>` in a long-lived service and wondering why a
//  config reload did nothing is the same "captured at startup" trap as
//  module 14/02's frozen `bool`.
//
//  `OptionsValidationException` names the failing members, so the message is
//  actionable — worth preserving rather than catching and rethrowing.
//  Injecting `IConfiguration` everywhere and calling `config["Smtp:Host"]`
//  spreads stringly-typed lookups through your codebase, with no validation
//  and no way to know a key is missing until the line runs. The options
//  pattern binds a section to a CLASS, once, at startup.
//
//      services.Configure<SmtpOptions>(config.GetSection("Smtp"));
//      class Mailer(IOptions<SmtpOptions> options) { … options.Value.Host … }
//
//  Three flavours, and the difference is *when the value is read*:
//
//      IOptions<T>          resolved ONCE, singleton. Never sees a change.
//      IOptionsSnapshot<T>  once per scope/request. Scoped only.
//      IOptionsMonitor<T>   re-reads on every access; supports change
//                           notifications. Safe in a singleton.
//
//  Picking `IOptions<T>` inside a long-lived service and then wondering why
//  a config change did nothing is the classic mistake — the same "captured at
//  startup" trap as module 14/02.
//
//  Wire up binding and validation.
//
//  hint: `ValidateDataAnnotations()` plus `ValidateOnStart()` turns a bad
//        config into a startup crash rather than a 3am surprise
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Extensions.DependencyInjection@10.0.11
#:package Microsoft.Extensions.Options.ConfigurationExtensions@10.0.11
#:package Microsoft.Extensions.Configuration@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.ComponentModel.DataAnnotations;

// Bind the "Smtp" section of `settings` to SmtpOptions. No validation.
ServiceProvider Build(Dictionary<string, string?> settings)
{
    var config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();

    IServiceCollection services = new ServiceCollection();
    services.AddOptions<SmtpOptions>().Bind(config.GetSection("Smtp"));

    return services.BuildServiceProvider();
}

// Same, but the options must satisfy their DataAnnotations, checked AT
// STARTUP (not lazily on first use).
ServiceProvider BuildValidated(Dictionary<string, string?> settings)
{
    var config = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();

    IServiceCollection services = new ServiceCollection();
    services.AddOptions<SmtpOptions>()
            .Bind(config.GetSection("Smtp"))
            .ValidateDataAnnotations()
            .ValidateOnStart();          // at BOOT, not on first use

    var provider = services.BuildServiceProvider();

    // ValidateOnStart registers an IStartupValidator that the generic HOST
    // invokes during startup. There is no host here, so we run it ourselves
    // — this is exactly what WebApplication.Run() does for you.
    provider.GetRequiredService<IStartupValidator>().Validate();

    return provider;
}

// ──────────────────────────── tests ──────────────────────────────────────

Dictionary<string, string?> Valid() => new()
{
    ["Smtp:Host"] = "mail.example.com",
    ["Smtp:Port"] = "587",
    ["Smtp:UseTls"] = "true",
};

Test("a section binds onto a typed class", () =>
{
    using var provider = Build(Valid());
    var options = provider.GetRequiredService<IOptions<SmtpOptions>>().Value;

    Eq(options.Host, "mail.example.com");
    Eq(options.Port, 587);
    Eq(options.UseTls, true);
});

Test("strings are converted to the property's type", () =>
{
    // "587" became an int and "true" became a bool — binding does the parse.
    using var provider = Build(Valid());
    var options = provider.GetRequiredService<IOptions<SmtpOptions>>().Value;

    Eq(options.Port.GetType().Name, "Int32");
});

Test("a missing key leaves the property's default", () =>
{
    var settings = Valid();
    settings.Remove("Smtp:Port");

    using var provider = Build(settings);
    Eq(provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Port, 25);
});

Test("IOptions is a singleton — the same instance every time", () =>
{
    using var provider = Build(Valid());

    using var scopeA = provider.CreateScope();
    using var scopeB = provider.CreateScope();

    Ok(ReferenceEquals(
        scopeA.ServiceProvider.GetRequiredService<IOptions<SmtpOptions>>().Value,
        scopeB.ServiceProvider.GetRequiredService<IOptions<SmtpOptions>>().Value));
});

Test("IOptionsMonitor exposes the same bound values", () =>
{
    using var provider = Build(Valid());
    var monitor = provider.GetRequiredService<IOptionsMonitor<SmtpOptions>>();

    Eq(monitor.CurrentValue.Host, "mail.example.com");
});

Test("valid config passes startup validation", () =>
{
    using var provider = BuildValidated(Valid());
    Eq(provider.GetRequiredService<IOptions<SmtpOptions>>().Value.Port, 587);
});

Test("a missing required value fails AT STARTUP", () =>
{
    var settings = Valid();
    settings.Remove("Smtp:Host");

    // Not on first use, three hours into the night — at boot.
    Throws<OptionsValidationException>(() => BuildValidated(settings));
});

Test("an out-of-range value fails too, naming the problem", () =>
{
    var settings = Valid();
    settings["Smtp:Port"] = "99999";

    var error = Throws<OptionsValidationException>(() => BuildValidated(settings));
    Ok(error.Message.Contains("Port"), "expected the field named, got: " + error.Message);
});

// ──────────────────────────── types ──────────────────────────────────────

public class SmtpOptions
{
    [Required]
    public string Host { get; set; } = "";

    [Range(1, 65535)]
    public int Port { get; set; } = 25;      // the default when unset

    public bool UseTls { get; set; }
}
