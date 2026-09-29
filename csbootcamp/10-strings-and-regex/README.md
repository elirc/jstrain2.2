# 10 · Strings and Regex

Strings are immutable, so naive string code allocates constantly. And string
*comparison* has a default that is culture-sensitive, which produces bugs that
only appear on a machine in the wrong country. This module is about both.

## The mental model

**1. Every "change" to a string allocates a new one.**

| Building | Cost |
| --- | --- |
| `s += x` in a loop | **O(n²)** — n intermediate strings |
| `StringBuilder` | one growable buffer |
| `string.Join` | one pass, one result |
| `ReadOnlySpan<char>` | **zero** — a window over existing text |

**2. A span is a window, not a copy.**

```csharp
var span = line.AsSpan();
var key = span[..at].Trim();      // moves indices; copies nothing
return key.ToString();            // materialise only where a string is needed
```

Slicing and trimming a span are index arithmetic. `Split` allocates an array
*and* a string per part.

**3. The default comparison is not ordinal.**

| Use | For |
| --- | --- |
| `StringComparison.Ordinal` | keys, identifiers, protocol tokens, paths |
| `OrdinalIgnoreCase` | the same, case-insensitively |
| `CurrentCulture` | text you are showing a human, mainly sorting |

`ToLower()`, `CompareTo` and `string.Compare` are **culture-sensitive** by
default. In Turkish, uppercase `i` is `İ` and lowercase `I` is `ı` — so a
culture-aware comparison decides `"ID"` and `"id"` are different words, and
your identifier lookup fails only in Istanbul.

**4. Regex: anchor it, name it, compile it, time it.**

```csharp
new Regex(@"^[A-Z]{3}-[0-9]{4}$", RegexOptions.None, TimeSpan.FromSeconds(1))
```

- **`^...$`** — without anchors, `IsMatch` asks whether the pattern occurs
  *anywhere*, so `"say ABC-1234 please"` passes your validator.
- **`(?<year>\d{4})`** — named groups survive someone adding a group earlier;
  `groups[1]` silently shifts.
- **`[GeneratedRegex]`** on a partial method builds the matcher at **compile
  time** — no startup parse, and a malformed pattern is a build error.
- **A timeout** guards against catastrophic backtracking.

## The details that bite

1. **Missing anchors is the #1 regex validation bug.** It fails open: input
   containing something valid is accepted.

2. **Catastrophic backtracking is a DoS vector.** Nested quantifiers over
   overlapping classes — `(a+)+$` — take exponential time on non-matching
   input. If the pattern touches user input, set a timeout.

3. **`Regex.IsMatch(input, pattern)` re-parses per call.** There is a small
   internal cache keyed by pattern string, and a hot loop can thrash it. Hold
   a `static readonly Regex`, or generate it.

4. **`Split('=')` on `"url=http://x?a=b"` gives three parts.** Use `IndexOf`
   for the *first* separator when the value may contain it.

5. **Regex is not always the answer.** Collapsing whitespace with
   `Split`+`Join` beats `Regex.Replace` for that specific job. Reach for regex
   when the pattern is genuinely irregular.

6. **Top-level statements cannot declare `static` fields.** Put shared
   compiled patterns in a `static class` at the bottom of the file.

## Cheat table

| You want | Use |
| --- | --- |
| Build in a loop | `StringBuilder` |
| Join with a separator | `string.Join` |
| Parse without allocating | `AsSpan()` + slicing |
| Compare identifiers | `string.Equals(a, b, StringComparison.OrdinalIgnoreCase)` |
| Blank check | `string.IsNullOrWhiteSpace` |
| Split, dropping blanks | `Split(null, StringSplitOptions.RemoveEmptyEntries)` |
| Validate a whole string | `^pattern$` |
| Extract parts | named groups `(?<name>…)` |
| A pattern used repeatedly | `[GeneratedRegex]`, or a `static readonly Regex` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-strings-and-spans.cs` | ★★☆ | `StringBuilder`, span parsing, and the Turkish-I test |
| 02 | `02-regex.cs` | ★★☆ | anchored validation, named groups, compiled patterns |
| 03 | `03-formatting-and-culture.cs` | ★★☆ | invariant vs the user’s culture, and round-trip formats |
| 04 | `04-splitting-and-joining.cs` | ★★☆ | `StringSplitOptions`, and the point where `Split` runs out |
| 05 | `05-comparison-and-search.cs` | ★★☆ | ordinal vs culture, and the Turkish I |
| 06 | `06-building-a-slug.cs` | ★★★ | Unicode normalization, combining marks, one pass |

**03 and 05 are the same lesson from two directions**, and it is the most
expensive one in this module: **anything a machine will read back is
invariant.** A comma-decimal parsed as invariant becomes a hundred times too
large; `"FILE".ToLower()` on a Turkish machine is not `"file"`. Neither
crashes.

**06 is the one place a working programmer meets Unicode normalization**, and
it is worth doing for that alone — `Café` written two different ways is two
different strings that render identically.

Do them in order. **01's last test forces `tr-TR`** to show a culture-aware
comparison breaking, and **02's anchor test** shows a validator accepting a
whole sentence. Both are bugs you would otherwise meet in production.

---

**Stuck?** `cheatsheets/csharp-basics.md` (string methods, comparison) · **Self-check:** `quizzes/01-language-core.md` · **Next:** `csbootcamp/11-json-and-serialization`
