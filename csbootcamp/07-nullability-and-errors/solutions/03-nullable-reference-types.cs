// ─────────────────────────────────────────────────────────────────────────
//  03 · nullable reference types — SOLUTION               ★★☆ core
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
//  Walkthrough:
//  Three signatures, and the interesting content is all in the annotations
//  rather than the bodies.
//
//  **`ArgumentNullException.ThrowIfNull` knows the parameter's name.** It is
//  marked `[CallerArgumentExpression]`, so it fills in "name" from the call
//  site with no string literal for you to get out of sync. The old
//  `if (name is null) throw new ArgumentNullException(nameof(name))` does the
//  same thing in four times the space.
//
//  **Null and blank are different failures.** Null means the caller did not
//  pass anything; blank means they passed something useless. `ArgumentNull-
//  Exception` derives from `ArgumentException`, so a caller catching the
//  latter still gets both — but one that wants to tell them apart can.
//
//  **`[NotNullWhen(true)]` is the whole point of the middle method.** It tells
//  the compiler's flow analysis "if this returns true, the out parameter is
//  not null", which is exactly the contract every `TryParse` in the framework
//  has. Without it, the caller writes `slug!.Length` — and a `!` is a promise
//  with nothing behind it, the thing you are trying to stop needing.
//
//  Related attributes worth knowing, all in
//  `System.Diagnostics.CodeAnalysis`:
//
//      [NotNullWhen(true)]     out param is non-null when the method returns true
//      [MaybeNullWhen(false)]  the mirror image, for a `T` out param
//      [NotNullIfNotNull(…)]   the return is non-null if THAT argument was
//      [DoesNotReturn]         this method always throws — code after it is dead
//      [MemberNotNull(…)]      after this runs, these fields are set
//
//  Each one is a fact the compiler cannot work out for itself. Supplying them
//  is how a library stops its callers from reaching for `!`.
//
//  And the thing to keep in the back of your mind: **none of this survives to
//  run time.** The annotations are erased. A caller in an unannotated
//  assembly, a JSON deserialiser, or a model binder can still hand you a null
//  through a `string` parameter, which is why `RequireName` guards at all
//  rather than trusting its own signature.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;
using System.Diagnostics.CodeAnalysis;

// Throw ArgumentNullException when name is null, ArgumentException when it
// is blank, otherwise return it trimmed. The parameter is `string?` because
// this method's whole job is to be handed one.
string RequireName(string? name)
{
    // Fills in "name" for you via [CallerArgumentExpression].
    ArgumentNullException.ThrowIfNull(name);

    if (string.IsNullOrWhiteSpace(name))
        throw new ArgumentException("name must not be blank", nameof(name));

    return name.Trim();
}

// True when `text` has real content; `slug` is then the trimmed, lowercased
// form. Annotate the out parameter so the CALLER can use `slug` with no
// warning after a true — that annotation is most of the exercise.
static bool TryNormalize(string? text, [NotNullWhen(true)] out string? slug)
{
    if (string.IsNullOrWhiteSpace(text))
    {
        slug = null;
        return false;
    }

    slug = text.Trim().ToLowerInvariant();

    return true;
}

// The first non-blank string, or null if there is none.
// Annotate the RETURN so callers know it can be null.
string? FirstNonBlank(params string?[] candidates) =>
    candidates.FirstOrDefault(candidate => !string.IsNullOrWhiteSpace(candidate));

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
