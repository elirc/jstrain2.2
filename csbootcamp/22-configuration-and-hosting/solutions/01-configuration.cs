// ─────────────────────────────────────────────────────────────────────────
//  01 · configuration — SOLUTION                          ★★☆ core
//  concepts: layered sources · precedence · env var mapping · secrets
//  run: dotnet run 01-configuration.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `IConfiguration` is a stack of sources merged into one key-value view.
//  **Later sources win.** The default ASP.NET Core order is:
//
//      appsettings.json
//      appsettings.{Environment}.json     ← overrides the above
//      user secrets (Development only)
//      environment variables              ← overrides those
//      command-line arguments             ← wins over everything
//
//  So a deployment can override any setting without editing a file, and a
//  developer can override it locally without committing anything.
//
//  Keys are hierarchical, separated by `:` — but `:` is not legal in an
//  environment variable name on every platform, so **`__` (double
//  underscore) maps to `:`**. `Smtp__Host` sets `Smtp:Host`. That single
//  fact accounts for a lot of "why won't it read my env var" time.
//
//  Walkthrough:
//  `ConfigurationBuilder` is a list, and **order is precedence**: each source
//  added later overrides keys from the ones before. That is the whole model,
//  and it is what lets one `appsettings.json` serve every environment while a
//  deployment overrides two keys via environment variables and a developer
//  overrides a third locally.
//
//  `AddEnvironmentVariables` performs the `__` → `:` translation. It exists
//  because `:` is not a legal character in an environment variable name on
//  every platform — notably it breaks in bash and in some container
//  runtimes. `Smtp__Host` becomes `Smtp:Host`. Setting `Smtp:Host` directly
//  works on Windows and silently does nothing elsewhere, which is one of the
//  more annoying "works on my machine" failures.
//
//  `Required` is the important habit. `config["Typo:Here"]` returns **null**,
//  not an error — configuration is a dictionary, and a dictionary has no
//  opinion about which keys you meant to have. So a misspelled key is silent
//  until something downstream dereferences null, usually far away and much
//  later. A `Required` helper that names the key turns that into an
//  immediate, actionable startup failure.
//
//  Treating a blank value as missing matters too: an environment variable
//  set to the empty string is a very common deployment mistake, and
//  `IsNullOrWhiteSpace` catches both cases at once.
//
//  Better still is the **options pattern** (module 12/02): bind the section
//  to a class, annotate it, and call `ValidateOnStart()` — then the whole
//  config is checked at boot rather than key by key. `Get<T>()` here is the
//  same binding without the validation.
//
//  One security note: never put secrets in `appsettings.json`. It is
//  committed. Use user-secrets in development and a real secret store
//  (environment variables injected by the platform, Key Vault, etc.) in
//  production — which is exactly why environment variables sit above files
//  in the precedence order.
#:project ../../_lib/Check/Check.csproj
#:package Microsoft.Extensions.Configuration@10.0.11
#:package Microsoft.Extensions.Configuration.Binder@10.0.11
#:package Microsoft.Extensions.Configuration.EnvironmentVariables@10.0.11

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;

// Build a configuration from `baseSettings`, then `overrides`, then the
// given environment variables (which use __ for :). Later wins.
IConfiguration Build(
    Dictionary<string, string?> baseSettings,
    Dictionary<string, string?> overrides,
    Dictionary<string, string> environment)
{
    // Order IS precedence — each source overrides the ones before it.
    var builder = new ConfigurationBuilder()
        .AddInMemoryCollection(baseSettings)
        .AddInMemoryCollection(overrides);

    if (environment.Count > 0)
    {
        // AddEnvironmentVariables does the __ -> : translation.
        foreach (var (key, value) in environment)
            Environment.SetEnvironmentVariable(key, value);

        builder.AddEnvironmentVariables();
    }

    return builder.Build();
}

// Read a required value, throwing a clear error naming the key when absent.
string Required(IConfiguration config, string key)
{
    var value = config[key];

    // A missing key is null and a blank env var is "" — both are mistakes,
    // and both should name the key rather than fail somewhere downstream.
    if (string.IsNullOrWhiteSpace(value))
        throw new InvalidOperationException($"required configuration missing: {key}");

    return value;
}

// ──────────────────────────── tests ──────────────────────────────────────

Dictionary<string, string?> Base() => new()
{
    ["Smtp:Host"] = "localhost",
    ["Smtp:Port"] = "25",
    ["Feature:Beta"] = "false",
};

Test("a single source is read straight through", () =>
{
    var config = Build(Base(), [], []);
    Eq(config["Smtp:Host"], "localhost");
});

Test("a later source overrides an earlier one", () =>
{
    var config = Build(Base(), new() { ["Smtp:Host"] = "mail.example.com" }, []);

    Eq(config["Smtp:Host"], "mail.example.com");
    Eq(config["Smtp:Port"], "25");        // untouched keys survive
});

Test("environment variables beat file settings", () =>
{
    var config = Build(Base(), new() { ["Smtp:Host"] = "from-override" },
                       new() { ["Smtp__Host"] = "from-env" });

    Eq(config["Smtp:Host"], "from-env");
});

Test("double underscore maps to a colon", () =>
{
    // The single most common "why won't it read my env var" cause.
    var config = Build(Base(), [], new() { ["Feature__Beta"] = "true" });
    Eq(config["Feature:Beta"], "true");
});

Test("keys are case-insensitive", () =>
{
    var config = Build(Base(), [], []);
    Eq(config["smtp:host"], "localhost");
    Eq(config["SMTP:HOST"], "localhost");
});

Test("a missing key is null, not an exception", () =>
{
    // Which is exactly why a typo'd key is silent.
    var config = Build(Base(), [], []);
    Eq(config["Smtp:Nope"], null);
});

Test("a section groups its children", () =>
{
    var config = Build(Base(), [], []);
    var section = config.GetSection("Smtp");

    Eq(section["Host"], "localhost");
    Eq(section["Port"], "25");
});

Test("a section binds onto a typed object", () =>
{
    var config = Build(Base(), [], []);
    var smtp = config.GetSection("Smtp").Get<SmtpSettings>()!;

    Eq(smtp.Host, "localhost");
    Eq(smtp.Port, 25);          // converted from the string
});

Test("Required returns a present value", () =>
    Eq(Required(Build(Base(), [], []), "Smtp:Host"), "localhost"));

Test("Required names the missing key instead of returning null", () =>
{
    // Turning a silent null into a loud, actionable startup error.
    var config = Build(Base(), [], []);
    var error = Throws<InvalidOperationException>(() => Required(config, "Smtp:Password"));

    Ok(error.Message.Contains("Smtp:Password"),
       "the error must name the key, got: " + error.Message);
});

Test("a blank value counts as missing", () =>
{
    var config = Build(Base(), new() { ["Smtp:Host"] = "   " }, []);
    Throws<InvalidOperationException>(() => Required(config, "Smtp:Host"));
});

// ──────────────────────────── types ──────────────────────────────────────

public class SmtpSettings
{
    public string Host { get; set; } = "";
    public int Port { get; set; }
}
