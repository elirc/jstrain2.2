// ─────────────────────────────────────────────────────────────────────────
//  04 · sections and arrays — SOLUTION                    ★★☆ core
//  concepts: hierarchical keys · arrays as indices · Get<T> vs Bind
//  run: dotnet run 04-sections-and-arrays.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Configuration is a **flat dictionary of string keys**, however it looked
//  in the file it came from. `:` separates levels and array elements are
//  numeric segments:
//
//      { "Smtp": { "Host": "mail", "Ports": [25, 587] } }
//
//      Smtp:Host       = "mail"
//      Smtp:Ports:0    = "25"
//      Smtp:Ports:1    = "587"
//
//  Three consequences worth knowing before you debug one of them:
//
//   1. **Arrays are merged by INDEX, not appended.** A later source with
//      `Smtp:Ports:0 = 2525` replaces element 0 and leaves element 1 alone.
//      There is no way to remove an element, and no way to append one
//      without knowing the length.
//   2. **`Get<T>()` returns a NEW object; `Bind(existing)` fills one in.**
//      Use `Get<T>` for a fresh value, `Bind` when defaults are already set
//      on the instance and config should only override what it mentions.
//   3. **A missing section is not null.** `GetSection("nope")` returns an
//      empty section, so `.Get<T>()` on it gives you `null` but
//      `.Bind(obj)` leaves `obj` untouched. Neither throws.
//
//  Walkthrough:
//  Three one-liners. Everything interesting is in what the tests demonstrate
//  about a system that is, underneath, a flat `Dictionary<string, string>`.
//
//  **Arrays merge by index, and that surprises everyone once.** The fifth and
//  sixth tests are the demonstration: overriding `Smtp:Ports:0` in a later
//  layer leaves elements 1 and 2 from the earlier one in place. There is no
//  "replace the whole array" and no "remove an element" — the model is a key
//  per element, and a later source only speaks about the keys it names.
//
//  In practice that means a `appsettings.Production.json` listing two allowed
//  origins on top of a base file listing four gives you four, with the first
//  two overwritten. The usual workarounds are a single delimited string that
//  you split yourself, or a dictionary keyed by name instead of an array —
//  both of which are ugly, and both of which are less ugly than the bug.
//
//  **`Get<T>` versus `Bind`** is the second decision. `Get<T>` constructs a
//  fresh object, so every property the configuration does not mention is at
//  its type default — a `Port` of `0`, not your carefully chosen `1025`.
//  `Bind` fills in an existing instance and leaves the rest alone, which is
//  what you want when the object already carries defaults. The eighth test is
//  exactly that distinction.
//
//  **A missing section is empty, not null, and never throws.**
//  `GetSection("nope")` gives you a real section object with no children.
//  `Get<T>` on it returns `null`; `Bind` on it does nothing at all. Both are
//  silent, which is why module 22/03 exists — configuration will not tell you
//  that a whole section is missing, so validation has to.
//
//  **The `:` separator is the whole hierarchy.** On a platform where `:` is
//  not legal in an environment variable name, `__` (double underscore) maps
//  to it — so `Smtp__Retry__Attempts` is `Smtp:Retry:Attempts`. That mapping
//  is the single most useful piece of trivia in this module, because it is
//  how every containerised deployment sets nested configuration.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;

// Build configuration from these in-memory layers, later ones winning.
IConfiguration Build(params Dictionary<string, string?>[] layers)
{
    var builder = new ConfigurationBuilder();

    // Later sources win, key by key — not wholesale.
    foreach (var layer in layers)
        builder.AddInMemoryCollection(layer);

    return builder.Build();
}

// The Smtp section as a fresh SmtpOptions, or null when there is no such
// section at all.
// A FRESH object: anything the configuration does not mention is at its
// type default, not at whatever you would have chosen.
SmtpOptions? ReadSmtp(IConfiguration configuration) =>
    configuration.GetSection("Smtp").Get<SmtpOptions>();

// Fill in `defaults` from the Smtp section, leaving anything the
// configuration does not mention exactly as it was.
// Fills in an EXISTING object, so defaults survive. A missing section
// simply does nothing.
void OverlaySmtp(IConfiguration configuration, SmtpOptions defaults) =>
    configuration.GetSection("Smtp").Bind(defaults);

// ──────────────────────────── tests ──────────────────────────────────────

static Dictionary<string, string?> Base() => new()
{
    ["Smtp:Host"] = "mail.example.com",
    ["Smtp:Port"] = "25",
    ["Smtp:Ports:0"] = "25",
    ["Smtp:Ports:1"] = "587",
    ["Smtp:Retry:Attempts"] = "3",
};

Test("a section binds to an object", () =>
{
    var smtp = ReadSmtp(Build(Base()))!;

    Eq(smtp.Host, "mail.example.com");
    Eq(smtp.Port, 25);
});

Test("nested sections bind too", () =>
    Eq(ReadSmtp(Build(Base()))!.Retry.Attempts, 3));

Test("an array is numeric keys underneath", () =>
    Eq(ReadSmtp(Build(Base()))!.Ports, new[] { 25, 587 }));

Test("a later layer wins, key by key", () =>
{
    var smtp = ReadSmtp(Build(Base(), new() { ["Smtp:Host"] = "smtp.internal" }))!;

    Eq(smtp.Host, "smtp.internal");
    Eq(smtp.Port, 25, "an untouched key keeps its earlier value");
});

Test("arrays MERGE by index rather than being replaced", () =>
{
    // The one that surprises people. Overriding the first port leaves the
    // second one from the earlier layer in place, and there is no syntax
    // for "actually, just these two".
    var smtp = ReadSmtp(Build(Base(), new() { ["Smtp:Ports:0"] = "2525" }))!;

    Eq(smtp.Ports, new[] { 2525, 587 });
});

Test("a shorter later array does not truncate the earlier one", () =>
{
    var smtp = ReadSmtp(Build(
        new Dictionary<string, string?> { ["Smtp:Ports:0"] = "1", ["Smtp:Ports:1"] = "2", ["Smtp:Ports:2"] = "3" },
        new Dictionary<string, string?> { ["Smtp:Ports:0"] = "9" }))!;

    Eq(smtp.Ports, new[] { 9, 2, 3 });
});

Test("a missing section is null from Get<T>", () =>
    Eq(ReadSmtp(Build(new Dictionary<string, string?> { ["Other:Thing"] = "x" })), null));

Test("Bind leaves untouched properties alone", () =>
{
    // Get<T> would give a fresh object with Port back at 0. Bind only
    // overwrites what the configuration actually mentions.
    var defaults = new SmtpOptions { Host = "localhost", Port = 1025 };

    OverlaySmtp(Build(new Dictionary<string, string?> { ["Smtp:Host"] = "mail" }), defaults);

    Eq(defaults.Host, "mail");
    Eq(defaults.Port, 1025, "the configuration said nothing about the port");
});

Test("Bind against a missing section changes nothing and does not throw", () =>
{
    var defaults = new SmtpOptions { Host = "localhost", Port = 1025 };

    OverlaySmtp(Build(new Dictionary<string, string?> { ["Nope:Host"] = "x" }), defaults);

    Eq(defaults.Host, "localhost");
    Eq(defaults.Port, 1025);
});

// ──────────────────────────── types ──────────────────────────────────────

public sealed class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; }
    public int[] Ports { get; set; } = [];
    public RetryOptions Retry { get; set; } = new();
}

public sealed class RetryOptions
{
    public int Attempts { get; set; }
}
