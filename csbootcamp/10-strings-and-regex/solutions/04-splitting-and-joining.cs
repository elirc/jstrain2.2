// ─────────────────────────────────────────────────────────────────────────
//  04 · splitting and joining — SOLUTION                  ★★☆ core
//  concepts: StringSplitOptions · Join · the quoting problem
//  run: dotnet run 04-splitting-and-joining.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  `Split` has options that remove most of the code people write around it:
//
//      StringSplitOptions.RemoveEmptyEntries    drop ""
//      StringSplitOptions.TrimEntries           trim each piece
//      both, combined with |                    trim FIRST, then drop empties
//
//  That ordering matters: `"a, ,b"` with both options gives `["a", "b"]`,
//  because `" "` is trimmed to `""` and then removed. With only
//  `RemoveEmptyEntries` you keep `" "`, which is not empty.
//
//  `string.Join` is the other half, and it is the one to reach for instead of
//  building a string with a trailing separator and then trimming it off.
//
//  The last exercise is the reason CSV parsers exist: **splitting on a comma
//  is wrong the moment a field contains one.** You will write a tiny parser
//  that handles quoted fields, which is enough to show why you should use a
//  library for the real thing.
//
//  Walkthrough:
//  Three one-liners and one small state machine, and the contrast between
//  them is the lesson.
//
//  **`TrimEntries | RemoveEmptyEntries` replaces a loop.** The order the
//  runtime applies them in is what makes `"a, ,b"` work: each piece is
//  trimmed first, so `" "` becomes `""` and is then removed. With only
//  `RemoveEmptyEntries` you keep a field containing a space, because a space
//  is not empty — and the `.Where(s => !string.IsNullOrWhiteSpace(s))` people
//  write instead is that same rule, spelled out longhand.
//
//  **`string.Join` never leaves a trailing separator**, handles one item and
//  handles none. The alternative — append, append, then `TrimEnd(',')` — is
//  three chances to get it wrong and one of them only shows up on an empty
//  list.
//
//  **`AndList` is a switch on the count**, because the English rule genuinely
//  has three cases. `items[^1]` is the last element and `Take(Count - 1)` is
//  everything before it; splitting the sequence at the join is clearer than
//  building the whole string and then surgically replacing the last comma.
//
//  **`CsvFields` is where `Split` runs out.** A comma inside quotes is data,
//  not a delimiter, and no delimiter-based split can know the difference —
//  the decision depends on everything to the left of the character. That
//  makes it a state machine, and the state is one bool.
//
//  Two details in it worth naming:
//
//   · A doubled `""` inside a quoted field is an escaped quote, so the
//     parser looks ahead one character before deciding the field has ended.
//     Get this wrong and `"say ""hi"""` silently truncates.
//   · The last field is appended AFTER the loop. Every parser of this shape
//     has that line, and forgetting it drops the final column — which the
//     `"a,b,c"` test would still catch, but a test with a trailing comma
//     would not.
//
//  **Empty fields are preserved here and dropped in `Fields`**, which looks
//  inconsistent and is not: in a CSV an empty field is a column with no
//  value, and removing it shifts every later column by one. Same operation,
//  different meaning, different rule.
//
//  And the real advice: this is a demonstration, not a CSV parser. Embedded
//  newlines, BOMs, and the several incompatible things people mean by "CSV"
//  are why `Sep`, `CsvHelper` and friends exist. Write this once to
//  understand the shape, then use a library.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Split on commas, trim each field, drop the empty ones.
// Trimmed FIRST, then emptied entries removed — which is what turns
// " " into nothing.
List<string> Fields(string line) =>
    line.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
        .ToList();

// Join with ", " — no trailing separator, and no separator at all for one
// item or none.
string Sentence(IEnumerable<string> items) => string.Join(", ", items);

// "a, b and c" — an Oxford-comma-free list. One item is itself; two are
// joined with " and ".
string AndList(IReadOnlyList<string> items) => items.Count switch
{
    0 => "",
    1 => items[0],
    _ => string.Join(", ", items.Take(items.Count - 1)) + " and " + items[^1],
};

// Split a CSV line, honouring double quotes. A quoted field may contain
// commas; "" inside a quoted field is a literal quote character.
List<string> CsvFields(string line)
{
    var fields = new List<string>();
    var current = new System.Text.StringBuilder();
    var inQuotes = false;

    for (var i = 0; i < line.Length; i++)
    {
        var character = line[i];

        if (inQuotes)
        {
            if (character != '"')
            {
                current.Append(character);
            }
            else if (i + 1 < line.Length && line[i + 1] == '"')
            {
                // "" inside quotes is one literal quote. Look ahead, then
                // skip the second one.
                current.Append('"');
                i++;
            }
            else
            {
                inQuotes = false;
            }
        }
        else if (character == '"')
        {
            inQuotes = true;
        }
        else if (character == ',')
        {
            // An empty field here is a column with no value, not nothing.
            fields.Add(current.ToString());
            current.Clear();
        }
        else
        {
            current.Append(character);
        }
    }

    // The last field has no comma after it. Every parser of this shape has
    // this line, and forgetting it drops the final column.
    fields.Add(current.ToString());

    return fields;
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("fields are split and trimmed", () =>
    Eq(Fields("a, b ,c"), new[] { "a", "b", "c" }));

Test("blank fields disappear", () =>
{
    // " " is trimmed to "" and THEN removed — which only works because the
    // two options combine in that order.
    Eq(Fields("a, ,b"), new[] { "a", "b" });
    Eq(Fields("a,,b"), new[] { "a", "b" });
    Eq(Fields(""), Array.Empty<string>());
});

Test("Sentence joins without a trailing separator", () =>
{
    Eq(Sentence(["a", "b", "c"]), "a, b, c");
    Eq(Sentence(["a"]), "a");
    Eq(Sentence([]), "");
});

Test("AndList reads like English", () =>
{
    Eq(AndList(["a", "b", "c"]), "a, b and c");
    Eq(AndList(["a", "b"]), "a and b");
    Eq(AndList(["a"]), "a");
    Eq(AndList([]), "");
});

Test("a plain CSV line splits as you would expect", () =>
    Eq(CsvFields("a,b,c"), new[] { "a", "b", "c" }));

Test("a quoted field may contain a comma", () =>
{
    // This is why `line.Split(',')` is wrong for CSV, and why the bug only
    // appears once a customer is called "Smith, Jane".
    Eq(CsvFields("\"Smith, Jane\",30,london"),
       new[] { "Smith, Jane", "30", "london" });
});

Test("a doubled quote inside a quoted field is a literal quote", () =>
    Eq(CsvFields("\"say \"\"hi\"\"\",x"), new[] { "say \"hi\"", "x" }));

Test("empty fields are preserved in CSV, unlike Fields", () =>
{
    // Different job, different rule: in a CSV an empty field is a column
    // with no value, and dropping it would shift every later column.
    Eq(CsvFields("a,,c"), new[] { "a", "", "c" });
    Eq(CsvFields(",a"), new[] { "", "a" });
});

Test("a quoted empty field survives", () =>
    Eq(CsvFields("a,\"\",c"), new[] { "a", "", "c" }));
