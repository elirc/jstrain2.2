# 24 · Debug Hunts

**These exercises ship broken.** The tests are red on the first run, by
design. There are no stubs and nothing to write from scratch — the code is
complete, plausible, and wrong.

Your job is the one you actually do at work: read code you did not write,
find the defect, and make the **smallest** fix that turns the tests green.

## How to work these

1. **Read the failing test names first.** They describe the intended
   behaviour, and which ones pass is a strong hint about where the bug is
   not.
2. **Predict before you run.** Form a hypothesis, then check it. Changing
   things until the tests go green teaches nothing.
3. **Make the minimal fix.** Every bug here is one or two lines. Rewriting
   the method may go green without you ever finding the defect.
4. **Name the bug class out loud** when you are done. Recognising the shape
   is what transfers; remembering this specific file does not.

Note that in each file **some tests pass**. That is deliberate and it is the
most realistic part: a bug that broke everything would have been caught
before it shipped. These survive because the happy path works.

## The bug classes in this module

| # | file | Class |
| --- | --- | --- |
| 01 | `01-the-handlers-all-agree.cs` | capturing a `for` loop variable in a closure |
| 02 | `02-the-shared-basket.cs` | a shared mutable "empty" default |
| 03 | `03-the-report-runs-twice.cs` | multiple enumeration of a deferred query |

Each has a counterpart earlier in the track — 02/03, 01/03 and 04/01
respectively. If a hunt is opaque, the teaching module is where the mechanism
is explained.

## Recognising these in the wild

- **A lambda inside a `for` loop that mentions the loop variable.** `foreach`
  is safe (C# 5 changed it); `for` is not. If the lambda outlives the
  iteration — stored, registered, passed to `Task.Run` — copy the variable
  first.
- **A `static` mutable collection used as a default.** "Shared empty" is safe
  for an immutable value and a landmine for a `List<T>`. `readonly` protects
  the reference, never the contents.
- **A local holding a LINQ query, used more than once.** Two aggregate calls
  on the same variable is the giveaway. Harmless on a list; wrong on a
  stream, expensive on a `DbSet`.

## When you are stuck

Read the test that fails *most specifically* — usually the one asserting an
identity or a count rather than a value. In 02 it is "each customer's basket
is a different object"; in 03 it is "it walks the source exactly ONCE". Those
tests exist because they name the mechanism.

---

**No "Stuck?" line here, on purpose** — deciding which reference you need, and
going to find it, is the retrieval this module exists to train. · **Next:** `csbootcamp/25-web-debug-hunts`
