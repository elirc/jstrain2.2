// ─────────────────────────────────────────────────────────────────────────
//  03 · inheritance and dispatch — SOLUTION               ★★★ stretch
//  concepts: virtual/override · abstract · new vs override · sealed
//  run: dotnet run 03-inheritance-and-dispatch.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  C# methods are NOT virtual by default — unlike Java. A base method has to
//  opt in with `virtual` (or `abstract`), and the derived one with
//  `override`. Get that pairing wrong and the compiler offers you `new`,
//  which compiles, looks similar, and does something completely different:
//
//      override   → the DERIVED method runs, whatever the variable's type
//      new        → the method for the VARIABLE's type runs
//
//  So `new` gives you two behaviours for one object depending on how you are
//  holding it, which is almost never what anyone wants. It exists to stop a
//  base-class change from silently breaking you, not as a design tool.
//
//  Implement the shapes and watch the dispatch.
//
//  Walkthrough:
//  The two dispatch tests are the module. Same object, same call, and the
//  answer depends on the STATIC type of the variable — but only for `new`.
//
//      Hider held as Hider  → "hider"
//      Hider held as Base   → "base"        ← two behaviours, one object
//      Overrider either way → "overrider"   ← one behaviour, as intended
//
//  `override` puts the derived method in the type's virtual slot, so the
//  runtime finds it however you are holding the object. `new` creates a
//  *separate* method that merely shares a name, and the compiler picks one at
//  the call site from the variable's declared type. Anything that stores your
//  object as the base type — a `List<Base>`, a parameter, a LINQ projection —
//  silently gets the base behaviour.
//
//  `new` exists so that adding a method to a base class cannot break a
//  derived class that already had one with that name. It is a compatibility
//  escape hatch, not a design tool. When the compiler suggests `new`, it is
//  almost always telling you that you meant `virtual` + `override` and
//  forgot one of them.
//
//  `abstract` is `virtual` with no default and a compiler-enforced
//  obligation: you cannot instantiate `Shape`, and you cannot write a
//  concrete subclass that forgets `Area`. That is strictly better than a
//  `virtual` method that throws `NotImplementedException` — the failure moves
//  from runtime to compile time.
//
//  `Describe` shows the other half: a `virtual` member WITH a default. Square
//  inherits it; Circle overrides and calls `base.Describe()` to reuse the
//  part it does not want to rewrite. `base.X()` is a non-virtual call, so it
//  always reaches the parent rather than recursing.
//
//  `sealed override` ends the chain — the method can no longer be overridden
//  further down. Worth using when an override establishes an invariant a
//  subclass must not be able to break, and it lets the JIT devirtualise the
//  call.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("each shape computes its own area", () =>
{
    Approx(new Square(3).Area(), 9);
    Approx(new Circle(1).Area(), Math.PI);
});

Test("virtual dispatch runs the DERIVED method through a base reference", () =>
{
    // The variable is Shape; the object is Square. Square.Area() runs.
    Shape shape = new Square(4);
    Approx(shape.Area(), 16);
});

Test("polymorphism over a mixed collection", () =>
{
    List<Shape> shapes = [new Square(2), new Circle(1), new Square(3)];
    Approx(shapes.Sum(s => s.Area()), 4 + Math.PI + 9, 1e-9);
});

Test("a non-overridden virtual falls back to the base implementation", () =>
{
    // Square does not override Describe, so Shape.Describe runs.
    Eq(new Square(2).Describe(), "a shape of area 4");
});

Test("an override can call back into the base", () =>
{
    // Circle overrides Describe and delegates part of the work upward.
    Eq(new Circle(1).Describe(), "a round shape of area 3.14");
});

Test("abstract members force every subclass to implement them", () =>
{
    // Shape.Area is abstract, so there is no Shape to construct and no
    // subclass that can forget it. The compiler does the reminding.
    Ok(typeof(Shape).IsAbstract);
    Ok(typeof(Shape).GetMethod(nameof(Shape.Area))!.IsAbstract);
});

Test("new HIDES rather than overrides — dispatch follows the VARIABLE", () =>
{
    var hider = new Hider();

    Eq(hider.Name(), "hider");            // held as Hider
    Eq(((Base)hider).Name(), "base");     // same object, held as Base
});

Test("override does NOT do that — dispatch follows the OBJECT", () =>
{
    var overrider = new Overrider();

    Eq(overrider.Name(), "overrider");
    Eq(((Base)overrider).Name(), "overrider");   // same answer either way
});

Test("sealed stops further overriding", () =>
{
    // Circle.Area is sealed, so no subclass of Circle can change it.
    var method = typeof(Circle).GetMethod(nameof(Circle.Area))!;
    Ok(method.IsFinal, "Area should be sealed");
});

// ──────────────────────────── types ──────────────────────────────────────

// Area is ABSTRACT: no body, and every concrete shape must supply one.
// Describe is VIRTUAL: it has a default that subclasses may replace.
public abstract class Shape
{
    public abstract double Area();

    public virtual string Describe() => $"a shape of area {Area():0.##}";
}

public class Square(double side) : Shape
{
    public override double Area() => side * side;
}

public class Circle(double radius) : Shape
{
    // sealed: this override is the last word, even for a subclass of Circle.
    public sealed override double Area() => Math.PI * radius * radius;

    // base.Describe() is a NON-virtual call, so it reaches Shape rather
    // than recursing back into this override.
    public override string Describe() => base.Describe().Replace("a shape", "a round shape");
}

public class Base
{
    public virtual string Name() => "base";
}

// Uses `new`: hides the base method rather than overriding it.
public class Hider : Base
{
    public new string Name() => "hider";
}

public class Overrider : Base
{
    public override string Name() => "overrider";
}
