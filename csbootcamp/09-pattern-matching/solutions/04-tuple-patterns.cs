// ─────────────────────────────────────────────────────────────────────────
//  04 · tuple patterns — SOLUTION                         ★★☆ core
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
//  Walkthrough:
//  The transition table IS the switch. Six arms, each one a rule you could
//  read out loud, and the whole state machine visible at once — which is the
//  argument for writing it this way rather than as nested `if`s where the
//  missing combinations are invisible.
//
//  **Arm order encodes precedence.** `(State.Shipped, Event.Cancel)` has to
//  come before `(_, Event.Cancel)`, because the general arm would otherwise
//  swallow it and shipped orders would cancel. There is no `when` and no
//  extra condition — the exception is expressed by being written first. Put
//  the catch-all last and the specific cases above it; that is the pattern-
//  matching version of "most specific rule wins".
//
//  Note what the shipped-cancel arm returns: `State.Shipped`, the same state.
//  It is not a no-op arm you could delete — deleting it would let the
//  catch-all take over.
//
//  **`_ => state` is the illegal-transition rule**, and it is one line rather
//  than an `if` around every caller. An unmatched event leaves the machine
//  where it was, which is the behaviour that makes a state machine safe to
//  drive from untrusted input: nothing an attacker sends can move it
//  somewhere the table does not allow.
//
//  **`CanDo` asks `Next` rather than repeating the table.** Two copies of a
//  transition table drift — someone adds a rule to one and not the other,
//  and the UI offers a button that the domain then refuses. Deriving the
//  question from the answer means there is only one table to be wrong.
//
//  It works because "the state did not change" is exactly what illegal means
//  here. Watch for the edge: a legal transition that returns the SAME state
//  would read as illegal. `(Shipped, Cancel)` is precisely that shape, and it
//  is genuinely illegal, so the two agree — but in a machine with a legal
//  self-transition you would need the table to say so explicitly.
//
//  **`Locate` shows the same ordering rule on plain values.** `(0, 0)` first,
//  then the axes, then the quadrants. Reverse it and every point on an axis
//  gets classified as a quadrant.
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// The next state, or the SAME state when the transition is not legal.
State Next(State state, Event happened) => (state, happened) switch
{
    (State.Draft, Event.Submit) => State.Submitted,
    (State.Submitted, Event.Approve) => State.Approved,
    (State.Submitted, Event.Reject) => State.Draft,
    (State.Approved, Event.Ship) => State.Shipped,

    // BEFORE the general cancel arm, or a shipped order would cancel.
    (State.Shipped, Event.Cancel) => State.Shipped,
    (_, Event.Cancel) => State.Cancelled,

    // Anything not in the table is not a legal move: stay put.
    _ => state,
};

// True when the transition is legal. Do not duplicate the table — ask Next.
// Derived from the table rather than a second copy of it.
bool CanDo(State state, Event happened) => Next(state, happened) != state;

// Classify a point: "origin", "x axis", "y axis", "quadrant 1".."quadrant 4".
// Quadrants are the usual anticlockwise numbering starting at (+,+).
string Locate(int x, int y) => (x, y) switch
{
    (0, 0) => "origin",
    (_, 0) => "x axis",
    (0, _) => "y axis",
    ( > 0, > 0) => "quadrant 1",
    ( < 0, > 0) => "quadrant 2",
    ( < 0, < 0) => "quadrant 3",
    _ => "quadrant 4",
};

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
