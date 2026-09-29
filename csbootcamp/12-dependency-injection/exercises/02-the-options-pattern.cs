// ─────────────────────────────────────────────────────────────────────────
//  02 · the options pattern                               ★★☆ core
//  concepts: IOptions vs IOptionsMonitor · binding · validation
//  run: dotnet run 02-the-options-pattern.cs
// ─────────────────────────────────────────────────────────────────────────
//
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
    throw new NotImplementedException();
}

// Same, but the options must satisfy their DataAnnotations, checked AT
// STARTUP (not lazily on first use).
ServiceProvider BuildValidated(Dictionary<string, string?> settings)
{
    throw new NotImplementedException();
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
