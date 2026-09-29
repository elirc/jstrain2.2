// ─────────────────────────────────────────────────────────────────────────
//  04 · splitting and joining                             ★★☆ core
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
//  hint: for the quoted parser, walk the string character by character with
//        a bool for "am I inside quotes" — Split cannot express this
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// Split on commas, trim each field, drop the empty ones.
List<string> Fields(string line)
{
    throw new NotImplementedException();
}

// Join with ", " — no trailing separator, and no separator at all for one
// item or none.
string Sentence(IEnumerable<string> items)
{
    throw new NotImplementedException();
}

// "a, b and c" — an Oxford-comma-free list. One item is itself; two are
// joined with " and ".
string AndList(IReadOnlyList<string> items)
{
    throw new NotImplementedException();
}

// Split a CSV line, honouring double quotes. A quoted field may contain
// commas; "" inside a quoted field is a literal quote character.
List<string> CsvFields(string line)
{
    throw new NotImplementedException();
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
