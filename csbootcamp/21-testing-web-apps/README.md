# 21 · Testing Web Apps

You have been running tests since module 01 — this is the module about
*writing* them. Specifically about the three things that decide whether a
suite is an asset or a liability: **where the seams are**, **what you
substitute**, and **what you assert**.

## The mental model

**1. Testable code is code with seams.**

A seam is a place a test can substitute a collaborator. In C# it is almost
always a constructor parameter with an interface type — the same mechanism
ASP.NET Core's DI uses. **Designing for testability and designing for DI are
the same activity.**

```csharp
public class Notifier(IEmailService email, ILog log) { … }   // testable
```

Code that `new`s up its own `SmtpClient` has no seam: you cannot assert on it,
and you cannot simulate the server being down — which is the case you most
need to test.

**2. Fakes over mocks. Results over calls.**

A **fake** is a real working implementation with a shortcut — an in-memory
list instead of SMTP. Ten lines, no library.

```csharp
Eq(email.Sent[0].To, "ada@example.com");     // ✅ what happened
mock.Verify(m => m.Send(It.IsAny<string>()), Times.Once);   // ❌ how it happened
```

Result-based tests survive a refactor. Call-based tests pin the
implementation — rename the method, batch two sends, reorder the calls, and
they break while the behaviour is identical. That trains people to update
tests reflexively instead of reading them.

**3. Substitute across process boundaries you don't own.**

| Substitute | Keep real |
| --- | --- |
| payment providers, email, third-party APIs | your routing, binding, serialisation |
| the clock, randomness, generated ids | your business logic |
| sometimes the database | your validation and status codes |

Fake too little and the suite is slow and flaky. Fake too much and you are
testing your mocks.

**4. Time is a dependency. Inject it.**

`DateTime.UtcNow` is a hidden global. `TimeProvider` is the framework's
abstraction — `TimeProvider.System` in production, a controllable one in
tests:

```csharp
clock.Advance(TimeSpan.FromMinutes(16));   // a 15-minute scenario, instantly
```

The alternatives are both bad: `Thread.Sleep(15 minutes)` is a correct test
nobody runs, and shortening the timeout for tests means testing code you don't
ship.

**5. Assert in this order.**

1. the **status code** — it is the API's contract
2. the **body shape** — field names and types clients depend on
3. the **side effect** — what the fake recorded

Never the internal call sequence.

## The details that bite

1. **A test that needs a mail server isn't a unit test, it's an outage
   waiting to happen.** Two constructor parameters fix it.

2. **Test the boundary, not near it.** With a controllable clock, "exactly at
   15 minutes" and "one tick past" are free to test — and they pin down `>`
   vs `>=`, which a `Sleep(16 minutes)` test can never distinguish.

3. **Keep reads side-effect free.** A `GetUser` that also deletes expired
   entries is a nasty surprise the day someone calls it inside a `Where`.

4. **Don't assert wall-clock thresholds.** "under 100ms" passes on your laptop
   and fails on loaded CI. Assert *structure* (how many calls were in flight)
   or *relative* timing.

5. **`decimal` carries its scale.** `Math.Round(9.1m, 2)` serialises as
   `9.10`, not `9.1`. For money that's a feature; for an assertion it's a
   surprise once.

6. **Distinguish your 400s from the framework's.** A negative amount is your
   rule — you write the check. A non-numeric one is a binding failure that is
   already a 400. Don't reimplement it.

7. **A failure test is the one the fake exists for.** If your suite has no
   "the upstream is down" case, the fake is doing half its job.

8. **`static` means one per *type*, not one per instance.** Two `new` objects
   sharing a static field is the classic "passes alone, fails in the suite"
   bug. Build fixtures inside the test — a local cannot be shared.

9. **Seed with one `DbContext`, assert with another.** The seeding context
   still tracks what you inserted, so relationship fixup populates navigations
   with no query. A test that only passes on the seeding context is testing
   the change tracker, while production — a context per request — returns
   empty collections.

10. **Prefer real SQLite over `UseInMemoryDatabase`.** The in-memory provider
    is not relational: it does not enforce foreign keys or unique constraints,
    so it passes tests a real engine would fail.

## Web.Serve vs WebApplicationFactory

This track's `Web.Serve` builds an app inline on a real loopback port. The
BCL answer is `WebApplicationFactory<TEntryPoint>` from
`Microsoft.AspNetCore.Mvc.Testing` (already in the local NuGet cache), with
`WithWebHostBuilder` + `ConfigureTestServices` to swap fakes, running
in-memory over `TestServer`.

| | `Web.Serve` (this track) | `WebApplicationFactory` |
| --- | --- | --- |
| Pipeline | configured in the test | your real `Program.cs` |
| Transport | a real socket | in-memory `TestServer` |
| Speed | slower | faster |
| Best for | self-contained exercises | production codebases |

**In a real project, prefer `WebApplicationFactory`** — testing the
`Program.cs` you actually ship is worth more than the realism of a socket.

There is no `WebApplicationFactory` exercise here, and the reason is
structural rather than an omission: it builds the host by invoking the app
assembly's **entry point**, and in this track the entry point *is* the test
file's top-level statements. It would re-run every test in the file,
recursively. Reach for it in a normal project with a real `Program.cs`; it
cannot be demonstrated in a single-file app.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-seams-and-fakes.cs` | ★★☆ | refactor untestable code into seams; write the fakes |
| 02 | `02-testing-time.cs` | ★★☆ | a `TimeProvider` fake; a 400-day scenario in microseconds |
| 03 | `03-testing-endpoints.cs` | ★★★ | swap a service through DI; test status, shape, and leakage |
| 04 | `04-test-isolation.cs` | ★★☆ | why `static` breaks a suite; fixtures built per test |
| 05 | `05-testing-with-a-database.cs` | ★★★ | a database per test, and why you must assert from a fresh context |

Do them in order. **02 is the one that changes how you write anything with an
expiry**, 03's "the 503 body does not leak" test is module 14's security
lesson turned into something a build can enforce, and **05 catches the test
that passes for the wrong reason** — the one most likely to be hiding in a
codebase you inherit.

---

**Stuck?** `cheatsheets/aspnetcore-api.md` (DI lifetimes, status codes) · **Self-check:** `quizzes/06-aspnetcore-basics.md` · **Next:** `csbootcamp/22-configuration-and-hosting`
