# 26 · Security Hunts

**These exercises ship broken.** Red on the first run, by design.

Every bug here passes code review. None of them is a missing `[Authorize]`,
an unparameterised query, or anything else a scanner would flag. They are the
vulnerabilities that survive precisely *because* the obvious controls are
present and correct.

## How to work these

1. **Read the tests as a threat model.** Each one names something an attacker
   should not be able to learn or do.
2. **Ask "who is allowed to know this?"** — not "is this response accurate?".
   That single reframe finds most of what is here.
3. **Smallest fix.** Every defect is one or two lines.
4. **Name the class.** These shapes recur in every codebase you will touch.

## The bug classes in this module

| # | file | Classes |
| --- | --- | --- |
| 01 | `01-the-helpful-error.cs` | user enumeration · information disclosure in errors |
| 02 | `02-the-authenticated-stranger.cs` | IDOR · mass assignment |

## Why these survive review

**Being helpful is the vulnerability.** `404 "no account with that email"` is
a better error message *and* it tells an attacker which of a million leaked
addresses are your customers. Echoing `ex.Message` makes debugging easier
*and* ships your connection string. Neither line looks wrong on its own.

**`[Authorize]` answers the wrong question.** It establishes *who you are*.
It says nothing about whether you may have *this row*. An endpoint can be
fully authenticated and hand every customer's invoice to anyone who changes
the number in the URL — which is #1 on the OWASP Top Ten and the most common
serious flaw in real APIs.

## The rules these teach

- **Every failed login returns the same status and the same body.** Whether
  the account is missing or the password is wrong. The genuine user who
  typo'd their email gets a vaguer message; that is the trade, and every
  serious login page makes it. (Equalise *timing* too — bailing out early on
  an unknown email leaks the same bit.)
- **Log the exception, send a fixed string.** The detail is not lost, it is
  just no longer public.
- **Put ownership in the query, not in an `if` after it.** Then no code path
  can return a row the caller does not own.
- **"Not yours" is 404, not 403.** A 403 confirms the record exists and lets
  an attacker enumerate ids.
- **Server-controlled fields belong off the input type entirely.** Not a
  validation rule — a type that cannot express the attack. `Owner` comes from
  the identity, `Status` from a constant, `Id` from the server.

Both files share one root cause: **trusting the request for something the
server already knows.**

## Where the mechanisms are explained

Module 19 (auth and security) and module 14/03 (error handling that does not
leak) — but work the hunt first.

---

**No "Stuck?" line here, on purpose** — recognising which control is missing, and going to find it, is the retrieval this module trains. · **Next:** `csbootcamp/27-sql-and-data`
