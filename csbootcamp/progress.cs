// progress.cs — your scoreboard. Runs every exercise you have and shows
// where you are.
//
//     dotnet run csbootcamp/progress.cs        # the whole track
//     dotnet run csbootcamp/progress.cs 04     # one module (much faster)
//
// Legend:  ✔ done   ✘ failing   ☐ not started   🐛 hunt bug still loose
//
// Running the whole track compiles every file, which takes a few minutes the
// first time. Pass a module number while you are working — that is the way
// this is meant to be used day to day.

using System.Diagnostics;
using System.Text.RegularExpressions;

var trackDir = FindTrack() ?? throw new DirectoryNotFoundException(
    "could not locate the csbootcamp directory");

var filters = args.Where(a => !a.StartsWith('-')).ToArray();

var modules = Directory.GetDirectories(trackDir)
    .Where(d => Regex.IsMatch(Path.GetFileName(d), @"^\d\d-"))
    .Where(d => filters.Length == 0 ||
                filters.Any(f => Path.GetFileName(d).StartsWith(f.PadLeft(2, '0'))))
    .OrderBy(d => d)
    .ToArray();

if (modules.Length == 0)
{
    Console.WriteLine("no modules matched. try: dotnet run progress.cs 04");
    return;
}

var useColor = !Console.IsOutputRedirected &&
               Environment.GetEnvironmentVariable("NO_COLOR") is null;
string Paint(string code, string s) => useColor ? "\u001b[" + code + "m" + s + "\u001b[0m" : s;

var totalDone = 0;
var totalFiles = 0;

foreach (var module in modules)
{
    var name = Path.GetFileName(module);
    var dir = Path.Combine(module, "exercises");
    if (!Directory.Exists(dir)) continue;

    var files = Directory.GetFiles(dir, "*.cs").OrderBy(f => f).ToArray();
    if (files.Length == 0) continue;

    var isHunt = name.Contains("-debug") || name.EndsWith("-hunts");
    var marks = new List<string>();
    var done = 0;

    foreach (var file in files)
    {
        var (passed, failed, todo) = Run(file);
        string mark;
        if (passed > 0 && failed == 0 && todo == 0) { mark = Paint("32", "✔"); done++; }
        else if (todo > 0 && failed == 0) mark = Paint("2", "☐");
        else if (isHunt) mark = "🐛";
        else mark = Paint("31", "✘");
        marks.Add(mark);
    }

    totalDone += done;
    totalFiles += files.Length;

    var bar = string.Join("", marks);
    var count = (done + "/" + files.Length).PadLeft(6);
    Console.WriteLine(name.PadRight(28) + count + "  " + bar);
}

Console.WriteLine();
var pct = totalFiles == 0 ? 0 : 100.0 * totalDone / totalFiles;
Console.WriteLine("  " + totalDone + " / " + totalFiles +
                  " exercises green  (" + pct.ToString("F0") + "%)");

// ── helpers ───────────────────────────────────────────────────────────────

(int passed, int failed, int todo) Run(string file)
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

    var m = Regex.Match(stdout + stderr, @"#done passed=(\d+) failed=(\d+) todo=(\d+)");
    if (!m.Success) return (0, 1, 0);   // did not compile / did not report
    return (int.Parse(m.Groups[1].Value),
            int.Parse(m.Groups[2].Value),
            int.Parse(m.Groups[3].Value));
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
