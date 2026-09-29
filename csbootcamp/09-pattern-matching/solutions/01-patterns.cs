// ─────────────────────────────────────────────────────────────────────────
//  01 · patterns — SOLUTION                               ★★☆ core
//  concepts: switch expressions · type/property/relational patterns
//  run: dotnet run 01-patterns.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A switch EXPRESSION returns a value, so it composes where a switch
//  statement cannot:
//
//      var label = n switch { < 0 => "neg", 0 => "zero", _ => "pos" };
//
//  The pattern vocabulary is worth knowing in full — most of these compose
//  with each other:
//
//      Circle c            type pattern, binds c
//      { Radius: > 10 }    property pattern
//      > 100               relational
//      1 or 2 or 3         disjunctive
//      > 0 and < 10        conjunctive
//      not null            negated
//      (1, 2)              positional (needs Deconstruct)
//      [1, .., 9]          list pattern
//      var x               always matches, binds
//
//  The compiler checks EXHAUSTIVENESS: a switch expression with no `_` arm
//  that misses a case is a warning, and throws at runtime if it happens.
//
//  Walkthrough:
//  Every one of these replaces a chain of `if`s with something the compiler
//  can check. That is the real argument for pattern matching: not brevity,
//  but exhaustiveness — the compiler warns when a switch expression cannot
//  handle a case, and an `if` chain never will.
//
//  `Bucket` uses relational patterns, and **arm order is the logic**. Arms
//  are tried top to bottom, so `< 0` must precede `< 10` — otherwise `-5`
//  matches "small" and the negative arm is dead code. (The compiler catches
//  a *fully* unreachable arm, but not one merely shadowed for some inputs.)
//
//  `Area` uses type patterns that BIND: `Square s` narrows the type and
//  gives you `s` in one step, with no cast. Before this existed you wrote
//  `if (shape is Square) { var s = (Square)shape; ... }` — a test and a cast
//  that could drift apart.
//
//  `Postage` is the one that pays off most in real code. Four business rules
//  as four arms, each reading like the rule it encodes, with the property
//  pattern `{ Express: true, Kilos: > 10 }` matching straight into the
//  object. The equivalent nested `if`s are three levels deep and much easier
//  to get subtly wrong. Note `null` is just another arm — no separate guard
//  clause at the top.
//
//  The "arm order matters" test is deliberate: move the `{ Express: true }`
//  arm above the combined one and express+heavy silently costs 15 instead of
//  25. Nothing errors. That is the one hazard of switch expressions, and it
//  is why the specific cases go first.
//
//  `Where` uses positional patterns, which need a `Deconstruct` — records
//  generate one free. The diagonal case uses `when` because "the two values
//  are equal to each other" is a relationship between them, not a pattern
//  either one matches. `when` is the escape hatch for exactly that.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// "small" (< 10), "medium" (10..99), "large" (>= 100), "negative" (< 0).
string Bucket(int n) => n switch
{
    < 0 => "negative",      // must come FIRST — < 10 would swallow it
    < 10 => "small",
    < 100 => "medium",
    _ => "large",
};

// Area by shape, using a type pattern.
double Area(Shape shape) => shape switch
{
    // Type patterns narrow AND bind, with no cast.
    Square s => s.Side * s.Side,
    Circle c => Math.PI * c.Radius * c.Radius,
    Rectangle r => r.Width * r.Height,
    _ => throw new ArgumentOutOfRangeException(nameof(shape)),
};

// Postage rules, using PROPERTY patterns on one object:
//   express + over 10kg     → 25
//   express                 → 15
//   over 10kg               → 10
//   anything else           → 5
//   a null parcel           → 0
int Postage(Parcel? parcel) => parcel switch
{
    null => 0,
    // The most specific rule first, or the one below shadows it.
    { Express: true, Kilos: > 10 } => 25,
    { Express: true } => 15,
    { Kilos: > 10 } => 10,
    _ => 5,
};

// Describe a coordinate using positional patterns:
//   (0, 0)          → "origin"
//   (_, 0)          → "on the x axis"
//   (0, _)          → "on the y axis"
//   both equal      → "diagonal"
//   otherwise       → "somewhere"
string Where(Point point) => point switch
{
    (0, 0) => "origin",
    (_, 0) => "on the x axis",
    (0, _) => "on the y axis",
    // `when` expresses a relationship BETWEEN the parts, which no single
    // pattern can.
    var (x, y) when x == y => "diagonal",
    _ => "somewhere",
};

// ──────────────────────────── tests ──────────────────────────────────────

Test("relational patterns bucket numbers", () =>
{
    Eq(Bucket(-5), "negative");
    Eq(Bucket(0), "small");
    Eq(Bucket(9), "small");
    Eq(Bucket(10), "medium");
    Eq(Bucket(99), "medium");
    Eq(Bucket(100), "large");
});

Test("type patterns dispatch on the runtime type", () =>
{
    Approx(Area(new Square(3)), 9);
    Approx(Area(new Circle(1)), Math.PI);
});

Test("a type pattern binds the narrowed variable", () =>
    Approx(Area(new Rectangle(2, 5)), 10));

Test("property patterns read into the object", () =>
{
    Eq(Postage(new Parcel(true, 12)), 25);
    Eq(Postage(new Parcel(true, 1)), 15);
    Eq(Postage(new Parcel(false, 12)), 10);
    Eq(Postage(new Parcel(false, 1)), 5);
});

Test("a null pattern is just another arm", () =>
    Eq(Postage(null), 0));

Test("arm order matters — specific before general", () =>
{
    // If the "express" arm came first, express+heavy would never reach 25.
    Eq(Postage(new Parcel(true, 99)), 25);
});

Test("positional patterns deconstruct", () =>
{
    Eq(Where(new Point(0, 0)), "origin");
    Eq(Where(new Point(5, 0)), "on the x axis");
    Eq(Where(new Point(0, 5)), "on the y axis");
});

Test("a `when` clause handles what a pattern cannot express", () =>
    Eq(Where(new Point(4, 4)), "diagonal"));

Test("the fallback catches the rest", () =>
    Eq(Where(new Point(1, 2)), "somewhere"));

// ──────────────────────────── types ──────────────────────────────────────

public abstract record Shape;
public record Square(double Side) : Shape;
public record Circle(double Radius) : Shape;
public record Rectangle(double Width, double Height) : Shape;

public record Parcel(bool Express, double Kilos);
public record Point(int X, int Y);
