// ─────────────────────────────────────────────────────────────────────────
//  04 · sections and arrays                               ★★☆ core
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
//  hint: `configuration.GetSection("Smtp").Get<SmtpOptions>()` is the whole
//        of the read path — the interesting part is what happens when a key
//        is missing
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using Microsoft.Extensions.Configuration;

// Build configuration from these in-memory layers, later ones winning.
IConfiguration Build(params Dictionary<string, string?>[] layers)
{
    throw new NotImplementedException();
}

// The Smtp section as a fresh SmtpOptions, or null when there is no such
// section at all.
SmtpOptions? ReadSmtp(IConfiguration configuration)
{
    throw new NotImplementedException();
}

// Fill in `defaults` from the Smtp section, leaving anything the
// configuration does not mention exactly as it was.
void OverlaySmtp(IConfiguration configuration, SmtpOptions defaults)
{
    throw new NotImplementedException();
}

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
