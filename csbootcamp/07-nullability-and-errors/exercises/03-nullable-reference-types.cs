// ─────────────────────────────────────────────────────────────────────────
//  03 · nullable reference types                          ★★☆ core
//  concepts: NRT annotations · null-forgiving · attributes · guard clauses
//  run: dotnet run 03-nullable-reference-types.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  With nullable reference types on — and they are on for this whole track —
//  `string` means "never null" and `string?` means "might be". The compiler
//  checks it, and the annotation becomes the documentation.
//
//  It is checked at COMPILE time and erased at run time. Nothing stops a
//  caller from another assembly, a JSON deserialiser, or a reflection-based
//  binder from handing you a null through a non-nullable parameter. Which is
//  why a public boundary still needs a real guard:
//
//      ArgumentNullException.ThrowIfNull(input);
//
//  And `!` — the null-forgiving operator — silences the compiler without
//  changing anything. It is a promise you are making, not a check.
//
//  This exercise is about teaching the compiler what your helpers do, so
//  callers stop needing `!`.
//
//  hint: `[NotNullWhen(true)]` on an `out` parameter is how `TryParse` lets
//        the caller use the value without a warning
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics.CodeAnalysis;

// Throw ArgumentNullException when name is null, ArgumentException when it
// is blank, otherwise return it trimmed. The parameter is `string?` because
// this method's whole job is to be handed one.
string RequireName(string? name)
{
    throw new NotImplementedException();
}

// True when `text` has real content; `slug` is then the trimmed, lowercased
// form. Annotate the out parameter so the CALLER can use `slug` with no
// warning after a true — that annotation is most of the exercise.
static bool TryNormalize(string? text, out string? slug)
{
    throw new NotImplementedException();
}

// The first non-blank string, or null if there is none.
// Annotate the RETURN so callers know it can be null.
string? FirstNonBlank(params string?[] candidates)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("a good name comes back trimmed", () =>
    Eq(RequireName("  ada  "), "ada"));

Test("null is an ArgumentNullException, and it names the parameter", () =>
{
    var ex = Throws<ArgumentNullException>(() => RequireName(null));
    Eq(ex.ParamName, "name");
});

Test("blank is an ArgumentException, not an ArgumentNullException", () =>
{
    // Different problem, different type — a caller can tell them apart.
    Throws<ArgumentException>(() => RequireName("   "));
    Ok(Throws(() => RequireName("   ")) is not ArgumentNullException);
});

Test("TryNormalize reports success and the slug", () =>
{
    Ok(TryNormalize("  Ada Lovelace ", out var slug));
    Eq(slug, "ada lovelace");
});

Test("blank and null are a clean false, not a throw", () =>
{
    Ok(!TryNormalize("   ", out _));
    Ok(!TryNormalize(null, out _));
});

Test("a failed TryNormalize leaves slug null", () =>
{
    TryNormalize(null, out var slug);
    Eq(slug, null);
});

Test("FirstNonBlank skips nulls and whitespace", () =>
    Eq(FirstNonBlank(null, "   ", "", "ada", "bob"), "ada"));

Test("FirstNonBlank returns null when everything is blank", () =>
    Eq(FirstNonBlank(null, "  ", null), null));

Test("the annotations let a caller use the value without a `!`", () =>
{
    // This block is the real assertion: `slug.Length` compiles with no
    // warning only because the out parameter carries [NotNullWhen(true)].
    // Strip the attribute and the compiler starts complaining right here.
    var total = 0;
    foreach (var text in new[] { "ada", "   ", "bob" })
        if (TryNormalize(text, out var slug))
            total += slug.Length;

    var name = FirstNonBlank(null, "ada");
    total += name?.Length ?? 0;

    Eq(total, 9);
});
