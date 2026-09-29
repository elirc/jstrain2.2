// ─────────────────────────────────────────────────────────────────────────
//  04 · tuple patterns                                    ★★☆ core
//  concepts: switching on several values at once · transition tables
//  run: dotnet run 04-tuple-patterns.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  A switch expression can take a tuple, which lets you match on several
//  values at once instead of nesting `if`s:
//
//      (a, b) switch
//      {
//          (0, 0) => "origin",
//          (_, 0) => "on the x axis",
//          (0, _) => "on the y axis",
//          _      => "somewhere else",
//      }
//
//  The payoff is a **state machine written as a table**. A transition rule is
//  "in state S, event E takes you to state T", which is exactly one arm — and
//  the whole set of rules ends up readable in one screen instead of scattered
//  across an if/else tree where nobody can see which combinations are
//  missing.
//
//  You are building the state machine for an order:
//
//      Draft      + Submit  → Submitted
//      Submitted  + Approve → Approved
//      Submitted  + Reject  → Draft
//      Approved   + Ship    → Shipped
//      any state  + Cancel  → Cancelled     (except Shipped — too late)
//
//  Anything not listed is not a legal transition and leaves the state alone.
//
//  hint: put the specific arms first — `(_, Event.Cancel)` will shadow
//        everything below it if you lead with it
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The next state, or the SAME state when the transition is not legal.
State Next(State state, Event happened)
{
    throw new NotImplementedException();
}

// True when the transition is legal. Do not duplicate the table — ask Next.
bool CanDo(State state, Event happened)
{
    throw new NotImplementedException();
}

// Classify a point: "origin", "x axis", "y axis", "quadrant 1".."quadrant 4".
// Quadrants are the usual anticlockwise numbering starting at (+,+).
string Locate(int x, int y)
{
    throw new NotImplementedException();
}

// ──────────────────────────── tests ──────────────────────────────────────

Test("the happy path walks all the way to shipped", () =>
{
    var state = State.Draft;

    foreach (var happened in new[] { Event.Submit, Event.Approve, Event.Ship })
        state = Next(state, happened);

    Eq(state, State.Shipped);
});

Test("rejection sends it back to draft", () =>
    Eq(Next(Next(State.Draft, Event.Submit), Event.Reject), State.Draft));

Test("an illegal transition leaves the state alone", () =>
{
    Eq(Next(State.Draft, Event.Approve), State.Draft);
    Eq(Next(State.Draft, Event.Ship), State.Draft);
    Eq(Next(State.Approved, Event.Submit), State.Approved);
});

Test("cancel works from any state that has not shipped", () =>
{
    Eq(Next(State.Draft, Event.Cancel), State.Cancelled);
    Eq(Next(State.Submitted, Event.Cancel), State.Cancelled);
    Eq(Next(State.Approved, Event.Cancel), State.Cancelled);
});

Test("a shipped order cannot be cancelled", () =>
{
    // The specific arm has to come BEFORE the catch-all cancel arm, or this
    // is the test that catches you.
    Eq(Next(State.Shipped, Event.Cancel), State.Shipped);
});

Test("CanDo agrees with Next without repeating the table", () =>
{
    Ok(CanDo(State.Draft, Event.Submit));
    Ok(CanDo(State.Approved, Event.Cancel));
    Ok(!CanDo(State.Draft, Event.Ship));
    Ok(!CanDo(State.Shipped, Event.Cancel));
});

Test("cancelled is terminal", () =>
{
    foreach (var happened in Enum.GetValues<Event>())
        Eq(Next(State.Cancelled, happened), State.Cancelled);
});

Test("the origin and the axes are distinguished", () =>
{
    Eq(Locate(0, 0), "origin");
    Eq(Locate(3, 0), "x axis");
    Eq(Locate(0, -2), "y axis");
});

Test("the four quadrants", () =>
{
    Eq(Locate(1, 1), "quadrant 1");
    Eq(Locate(-1, 1), "quadrant 2");
    Eq(Locate(-1, -1), "quadrant 3");
    Eq(Locate(1, -1), "quadrant 4");
});

// ──────────────────────────── types ──────────────────────────────────────

public enum State { Draft, Submitted, Approved, Shipped, Cancelled }
public enum Event { Submit, Approve, Reject, Ship, Cancel }
