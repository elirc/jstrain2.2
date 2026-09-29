// verify.cs — maintainer check. Runs every file in the track and enforces
// the two halves of the contract in _lib/FORMAT.md:
//
//   solutions/  must end "all green"      → passed>0, failed=0, todo=0
//   exercises/  must be todo-only         → failed=0, todo>0
//   debug/hunt modules invert exercises   → failed>0, todo=0  (a planted bug)
//
//     dotnet run csbootcamp/verify.cs        # the whole track (slow, ~10 min)
//     dotnet run csbootcamp/verify.cs 04     # just module 04
//     dotnet run csbootcamp/verify.cs 13 14  # a few modules
//
// Exit code 1 if anything is broken, so CI can gate on it.

using System.Diagnostics;
using System.Text.RegularExpressions;

var root = AppContext.BaseDirectory;
// Walk up out of the build output folder to the csbootcamp directory.
var here = new DirectoryInfo(Directory.GetCurrentDirectory());
var trackDir = FindTrack() ?? throw new DirectoryNotFoundException(
    "could not locate the csbootcamp directory from " + Directory.GetCurrentDirectory());

var filters = args.Where(a => !a.StartsWith('-')).ToArray();

var modules = Directory.GetDirectories(trackDir)
    .Where(d => Regex.IsMatch(Path.GetFileName(d), @"^\d\d-"))
    .Where(d => filters.Length == 0 ||
                filters.Any(f => Path.GetFileName(d).StartsWith(f.PadLeft(2, '0'))))
    .OrderBy(d => d)
    .ToArray();

if (modules.Length == 0)
{
    Console.WriteLine("no modules matched " + string.Join(", ", filters));
    return 1;
}

var broken = new List<string>();
var checkedFiles = 0;
var started = Stopwatch.StartNew();

foreach (var module in modules)
{
    var name = Path.GetFileName(module);
    var isHunt = IsHuntModule(name);
    Console.WriteLine("\n" + name + (isHunt ? "  (hunt module: exercises ship red)" : ""));

    foreach (var kind in new[] { "solutions", "exercises" })
    {
        var dir = Path.Combine(module, kind);
        if (!Directory.Exists(dir)) continue;

        foreach (var file in Directory.GetFiles(dir, "*.cs").OrderBy(f => f))
        {
            checkedFiles++;
            var (passed, failed, todo, output) = Run(file);
            var label = kind + "/" + Path.GetFileName(file);

            string? problem = (kind, isHunt) switch
            {
                // A solution always has to be fully green.
                ("solutions", _) when failed > 0 => failed + " failing test(s)",
                ("solutions", _) when todo > 0 => todo + " unimplemented test(s)",
                ("solutions", _) when passed == 0 => "no tests ran",

                // A normal exercise is a stub: every test reports todo.
                ("exercises", false) when failed > 0 => failed + " failing test(s) in a stub",
                ("exercises", false) when todo == 0 => "no todos — is the stub missing?",

                // A hunt exercise ships finished and broken: red, never todo.
                ("exercises", true) when todo > 0 => todo + " todo(s) in a hunt exercise",
                ("exercises", true) when failed == 0 => "no failing test — the bug is missing",

                _ => null,
            };

            if (problem is null)
            {
                Console.WriteLine("  ok    " + label);
            }
            else
            {
                Console.WriteLine("  BROKEN " + label + " — " + problem);
                broken.Add(label + " — " + problem);
                if (output.Contains("error CS"))
                {
                    foreach (var line in output.Split('\n')
                                 .Where(l => l.Contains("error CS")).Take(3))
                        Console.WriteLine("         " + line.Trim());
                }
            }
        }
    }
}

started.Stop();
Console.WriteLine("\n" + checkedFiles + " files checked in " +
                  started.Elapsed.TotalSeconds.ToString("F0") + "s");

if (broken.Count == 0)
{
    Console.WriteLine("everything is in contract.");
    return 0;
}

Console.WriteLine(broken.Count + " file(s) out of contract:");
foreach (var b in broken) Console.WriteLine("  - " + b);
return 1;

// ── helpers ───────────────────────────────────────────────────────────────

static bool IsHuntModule(string name)
    => name.Contains("-debug") || name.EndsWith("-hunts");

(int passed, int failed, int todo, string output) Run(string file)
{
    var psi = new ProcessStartInfo("dotnet")
    {
        WorkingDirectory = Path.GetDirectoryName(file)!,
        RedirectStandardOutput = true,
        RedirectStandardError = true,
    };
    psi.ArgumentList.Add("run");
    psi.ArgumentList.Add(Path.GetFileName(file));
    psi.Environment["NO_COLOR"] = "1";

    using var proc = Process.Start(psi)!;
    var stdout = proc.StandardOutput.ReadToEnd();
    var stderr = proc.StandardError.ReadToEnd();
    proc.WaitForExit(120_000);

    var all = stdout + stderr;
    var m = Regex.Match(all, @"#done passed=(\d+) failed=(\d+) todo=(\d+)");
    if (!m.Success) return (0, 0, 0, all);   // never reported: treated as broken
    return (int.Parse(m.Groups[1].Value),
            int.Parse(m.Groups[2].Value),
            int.Parse(m.Groups[3].Value),
            all);
}

static string? FindTrack()
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir is not null)
    {
        if (dir.Name == "csbootcamp") return dir.FullName;
        var child = Path.Combine(dir.FullName, "csbootcamp");
        if (Directory.Exists(child)) return child;
        dir = dir.Parent;
    }
    return null;
}
