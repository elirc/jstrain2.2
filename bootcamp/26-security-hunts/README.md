# 26 · Security Hunts

The same bug-hunt format as module 24, aimed at a different target: code
that **runs perfectly and is still dangerous**. Every exercise here works
for well-behaved input and passes a naive review. The failing tests play
the attacker — they paste a quote into a search box, put `../` in a
filename, change an id in a URL — and prove the door is open. Your job is
to close it with the smallest change.

This is not paranoia drilling. Injection, XSS, broken access control, and
their neighbours are the top of the OWASP list year after year, they are
where real CRUD apps get breached, and they are exactly the questions a
mid-level interview uses to tell "writes features" from "ships to
production". Knowing the *name* and the *one-line fix* for each is the
bar.

## The mental model

Almost every web vulnerability is one sentence: **untrusted input crossed
a boundary without being treated as untrusted.** The boundaries differ,
the shape does not:

| the boundary input crosses | the attack | the discipline |
| --- | --- | --- |
| into an SQL query | injection | parameterize — data is never code |
| into HTML output | XSS | encode at output, for the context |
| into a filesystem path | traversal | resolve, then prove containment |
| into a privileged field | mass assignment | allowlist what may be set |
| an authorization check | IDOR / broken access | authorize every object, per caller |
| a secret's randomness | guessable tokens | draw from a CSPRNG, never Math.random |
| into a redirect target | open redirect | resolve it, then prove it's your origin |
| into a regex engine | ReDoS | keep the match unambiguous, cap the input |
| into a log line | data exposure | project the fields you allow, drop the rest |
| a state-changing request | CSRF | require a token that exists AND matches |

Two rules run underneath all of them:

1. **Allowlist, never denylist.** Name what is permitted (these two
   fields, these known columns, this base directory) and reject the
   rest by construction. A blocklist ships a hole the day someone adds
   a column.
2. **Trust boundaries are where the input changes hands, not where it
   arrives.** The value looks innocent at the edge; it turns dangerous
   the moment it's concatenated, resolved, or spread. Guard the
   crossing, not the front door.

## The details that bite

1. **"Works for normal input" is the vulnerability's disguise, not its
   absence.** Every hole here passes the happy path. Read the code
   asking "what if this string is hostile?", not "does this run?".
2. **A denylist is a list of the attacks you have already thought of.**
   `delete entry.password`, "reject anything starting with http",
   "strip `<script>`" — each one ships the hole its author forgot.
   Turn every one of them around: name what is allowed and build the
   result from that list, so tomorrow's new field is invisible by
   default rather than exposed by default.
3. **A check that compares two absent values is not a check.**
   `undefined !== undefined` is false, so a missing token matches a
   missing token and the guard waves the request through. Assert the
   secret EXISTS before you assert the two are equal.
4. **Availability is a security property too.** A validator that takes
   four seconds on a 30-byte string is a denial-of-service primitive,
   no injection required. Nested quantifiers in a regex are the usual
   source.
5. **Sanitizing input is the weaker half; encoding output is the
   reliable half.** You cannot guess every downstream context at the
   input; you always know the context at the output. Escape there.
6. **Authentication ≠ authorization.** Knowing who the caller is does
   nothing until you check whether THIS caller may touch THIS object.
   The userId being in scope is not the same as using it.
7. **Unique is not unguessable.** Counters and timestamps are unique and
   trivially predictable. Secrets need cryptographic randomness.
8. **The same error for "missing" and "forbidden."** A distinct
   "exists but not yours" message is a yes/no oracle an attacker runs
   over every id. Fail identically.

## Exercises

| # | file | ★ | the hole |
| --- | --- | --- | --- |
| 01 | `01-sql-injection.js` | ★★☆ | a search term that rewrites the query |
| 02 | `02-html-escaping.js` | ★★☆ | a comment that ships a `<script>` to every reader |
| 03 | `03-path-traversal.js` | ★★☆ | a filename that climbs out of its folder |
| 04 | `04-idor-ownership.js` | ★★☆ | an id in the URL that reads a stranger's data |
| 05 | `05-predictable-token.js` | ★★☆ | reset links you can count up to |
| 06 | `06-mass-assignment.js` | ★★★ | a profile edit that quietly sets `role: admin` |
| 07 | `07-open-redirect.js` | ★★☆ | a login link that lands on somebody else's site |
| 08 | `08-redos.js` | ★★☆ | a validator one visitor can pin a core with |
| 09 | `09-secrets-in-logs.js` | ★★☆ | a request log half the company can read |
| 10 | `10-csrf-vacuous-check.js` | ★★★ | a token check that passes when there is no token |

```
node exercises/01-sql-injection.js     # red — the attack succeeds
node solutions/01-sql-injection.js     # the fix + walkthrough
node ../verify.js 26                    # the whole module
node ../progress.js 26                  # the scoreboard
```

The browser half of hunt 02 lives in module 13 as
`exercises/37-debug-escaping.html` — the same injection, rendered live,
graded in the page. Do them back to back if you want the server and
client sides of escaping in one sitting.

As in module 24, red is the starting state and 🐛 in the scoreboard means
"still exploitable". Read the solution's walkthrough after your attempt —
it names the vulnerability class (the term an interviewer wants to hear),
the tell, the minimal fix, and where the class shows up in the wild.

One honesty note kept from the codebase's rules: these are teaching-sized
reductions. Real defense is layered — a parameterized query AND least
privilege AND input validation — and you should lean on your framework's
built-in protections (auto-escaping templates, ORM parameter binding,
auth middleware) rather than hand-rolling. The point here is to recognize
the shape, so you notice when a layer is missing.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `bootcamp/27-sql-data`, or `bootcamp/13-dom-and-browser/exercises/37-debug-escaping.html` for the browser side of hunt 02
