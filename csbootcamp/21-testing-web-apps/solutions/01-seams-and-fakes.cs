// ─────────────────────────────────────────────────────────────────────────
//  01 · seams and fakes — SOLUTION                        ★★☆ core
//  concepts: dependency injection as a seam · fakes vs mocks
//  run: dotnet run 01-seams-and-fakes.cs
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  The refactor is small and the consequence is total. `LegacyNotifier` news
//  up an `SmtpClient` and writes to a file path, so testing it needs a mail
//  server and a writable disk — and there is *no way at all* to simulate the
//  server being down, which is the case you most want to test. Two
//  constructor parameters later, every one of those problems is gone.
//
//  That is what a SEAM is: a place where a test can substitute a
//  collaborator. In C# it is almost always a constructor parameter with an
//  interface type, which is the same mechanism ASP.NET Core's DI uses — so
//  designing for testability and designing for DI are the same activity.
//
//  `FakeEmail.FailWith` is the payoff. A real SMTP client cannot be asked to
//  fail on cue; a fake can, with one property. Notice the "does not poison
//  the next call" test flips it back mid-test to check recovery — a scenario
//  that is essentially unreachable against a real service.
//
//  **Fakes, not mocks.** Every assertion here is about the RESULT — what
//  ended up in `Sent`, what ended up in `Lines`. None of them says "was
//  `Send` called exactly once with these arguments". That distinction
//  matters more than it sounds:
//
//    · result-based tests survive refactors. Rename the method, batch two
//      sends into one, reorder the calls — the test still passes as long as
//      the right mail goes out.
//    · call-based tests pin the implementation. They break when you change
//      *how* the work is done, even though the behaviour is identical, which
//      trains people to update tests reflexively rather than read them.
//
//  A hand-written fake is ~10 lines and needs no library. Reach for a mocking
//  framework when you need to verify an interaction that has no observable
//  result — and notice how rarely that is actually true.
//
//  The `try/catch` around `Send` is what turns an infrastructure failure into
//  a domain outcome (`false` plus a log line) rather than an exception the
//  caller did not ask for. Whether that is right depends on the caller; what
//  matters is that the fake let you *decide*, and then prove it.
//  Code is testable when you can substitute the parts you cannot control.
//  Those substitution points are SEAMS, and in C# a seam is almost always a
//  constructor parameter with an interface type.
//
//  `LegacyNotifier` at the bottom has none. It news up its own dependencies,
//  so testing it means really sending email and really writing files. There
//  is no assertion you can make and no failure you can simulate.
//
//  Rewrite it as `Notifier`, taking its collaborators as constructor
//  parameters, and write the FAKES to test it against.
//
//  A fake is a real working implementation with a shortcut — an in-memory
//  list instead of an SMTP server. It is not a mock: you assert on the
//  RESULT (what ended up in the list), not on the CALLS (that Send was
//  invoked once with these arguments). Result-based tests survive a
//  refactor; call-based ones break when you rename a method.
//
//  hint: the fake's job is to be inspectable — give it a public list
#:project ../../_lib/Check/Check.csproj

using Bootcamp;
using static Bootcamp.Check;

// ──────────────────────────── tests ──────────────────────────────────────

Test("a successful notification is sent to the right address", () =>
{
    var email = new FakeEmail();
    var log = new FakeLog();
    var notifier = new Notifier(email, log);

    notifier.Notify("ada@example.com", "Welcome");

    Eq(email.Sent.Count, 1);
    Eq(email.Sent[0].To, "ada@example.com");
    Eq(email.Sent[0].Body, "Welcome");
});

Test("a successful notification is logged", () =>
{
    var email = new FakeEmail();
    var log = new FakeLog();

    new Notifier(email, log).Notify("ada@example.com", "Welcome");

    Eq(log.Lines, new[] { "sent to ada@example.com" });
});

Test("Notify reports success", () =>
{
    var notifier = new Notifier(new FakeEmail(), new FakeLog());
    Ok(notifier.Notify("ada@example.com", "hi"));
});

Test("a blank address is rejected without sending", () =>
{
    var email = new FakeEmail();
    var log = new FakeLog();

    Ok(!new Notifier(email, log).Notify("  ", "hi"));

    Eq(email.Sent.Count, 0);
    Eq(log.Lines, new[] { "skipped: no address" });
});

Test("a failure from the email service is caught, not thrown", () =>
{
    // The whole reason to use a fake: you can make it fail on demand.
    var email = new FakeEmail { FailWith = new InvalidOperationException("smtp down") };
    var log = new FakeLog();

    Ok(!new Notifier(email, log).Notify("ada@example.com", "hi"));
});

Test("a failure is logged with the reason", () =>
{
    var email = new FakeEmail { FailWith = new InvalidOperationException("smtp down") };
    var log = new FakeLog();

    new Notifier(email, log).Notify("ada@example.com", "hi");

    Eq(log.Lines, new[] { "failed for ada@example.com: smtp down" });
});

Test("one failure does not poison the next call", () =>
{
    var email = new FakeEmail { FailWith = new InvalidOperationException("smtp down") };
    var log = new FakeLog();
    var notifier = new Notifier(email, log);

    notifier.Notify("a@example.com", "one");
    email.FailWith = null;                       // service recovers
    Ok(notifier.Notify("b@example.com", "two"));

    Eq(email.Sent.Count, 1);
    Eq(email.Sent[0].To, "b@example.com");
});

Test("the fake records enough to assert on the RESULT, not the calls", () =>
{
    // Nothing here asks "was Send called?" — it asks "what got sent?".
    var email = new FakeEmail();
    var notifier = new Notifier(email, new FakeLog());

    notifier.Notify("a@example.com", "one");
    notifier.Notify("b@example.com", "two");

    Eq(email.Sent.Select(s => s.To), new[] { "a@example.com", "b@example.com" });
});

// ──────────────────────────── types ──────────────────────────────────────

public interface IEmailService
{
    void Send(string to, string body);
}

public interface ILog
{
    void Write(string line);
}

// Your fakes. Real implementations with a shortcut, and inspectable.
public class FakeEmail : IEmailService
{
    public List<(string To, string Body)> Sent { get; } = [];

    // Set this to make the next Send throw — that is how you test failure.
    public Exception? FailWith { get; set; }

    public void Send(string to, string body)
    {
        if (FailWith is not null) throw FailWith;   // fail on demand
        Sent.Add((to, body));
    }
}

public class FakeLog : ILog
{
    public List<string> Lines { get; } = [];

    public void Write(string line) => Lines.Add(line);
}

// Rewrite LegacyNotifier as this: same behaviour, collaborators injected.
//   · blank address        → log "skipped: no address", return false
//   · send throws          → log "failed for {to}: {message}", return false
//   · otherwise            → log "sent to {to}", return true
public class Notifier(IEmailService email, ILog log)
{
    public bool Notify(string to, string body)
    {
        if (string.IsNullOrWhiteSpace(to))
        {
            log.Write("skipped: no address");
            return false;
        }

        try
        {
            email.Send(to, body);
        }
        catch (Exception e)
        {
            // Infrastructure failure becomes a domain outcome, not an
            // exception the caller never asked about.
            log.Write($"failed for {to}: {e.Message}");
            return false;
        }

        log.Write($"sent to {to}");
        return true;
    }
}

// ─── the untestable original, for reference — do not modify ───────────────
//
// public class LegacyNotifier
// {
//     public bool Notify(string to, string body)
//     {
//         var smtp = new SmtpClient("mail.example.com");   // ← no seam
//         File.AppendAllText("/var/log/app.log", …);        // ← no seam
//         …
//     }
// }
//
// There is no way to test that without a mail server and a writable disk,
// and no way at all to simulate the server being down.
