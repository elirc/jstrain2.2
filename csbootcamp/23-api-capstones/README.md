# 23 · API Capstones

Three complete APIs. Nothing in this module is a new mechanism — every piece
appears somewhere in modules 13 through 22. What is new is that you have to
make them agree with each other, in one file, at the same time.

That is the actual difficulty of the job. Knowing what `Skip` and `Take` do is
not the same as knowing that `OrderBy` has to come first or paging is
undefined; knowing what `[Authorize]` does is not the same as knowing it says
nothing about *this row*.

| # | file | Composes |
| --- | --- | --- |
| 01 | `01-the-bookmarks-api.cs` | minimal APIs · EF Core relationships · validation · paging |
| 02 | `02-the-team-notes-api.cs` | JWT auth · ownership · policies · error middleware |
| 03 | `03-the-pricing-service.cs` | caching · stampedes · retries · options · hosted startup |

## How to work these

These are longer than anything before them, and the tests are ordered so you
can go endpoint by endpoint. **Get one test green, then the next.** Trying to
write the whole file before running it is the slowest possible route.

Each file names its rules in the header. They are not style preferences —
every one of them is a test, and most of them are a bug someone shipped.

## What each one is really about

**01 · order of operations.** Validate, *then* check the parent exists, *then*
write. Get that order wrong and a bookmark posted to a missing collection
comes back as a 500 from a foreign-key violation instead of the 404 it is.
Also: `c.Bookmarks.Count` inside a `Select` is a SQL `COUNT`; the same
expression after an `Include` drags every row across the wire for the same
number.

**02 · two different questions.** Authentication asks *who are you* and
answers 401. Authorization asks *may you* and answers 403. Then there is a
third question neither of them asks — *may you have this row* — which no
attribute can answer, because it depends on the row. It goes in the query, not
in an `if` after the lookup, so that no future endpoint can forget it.

**03 · the failure modes of a cache.** A cache with no stampede protection
makes an outage worse: twenty concurrent misses become twenty upstream calls
at exactly the moment the upstream is struggling. A cache that does not store
misses hands an attacker a free path through it. And `GetOrCreateAsync`,
despite the name, is not atomic — that one has bitten a lot of people.

## When you are done

Read your solution against the reference one and look for the places where the
reference does something in a *query* that you did in *C#* — counting,
filtering by owner, ordering. That gap is the single most valuable thing this
module has to teach, and it is worth more than any individual endpoint.

---

**Stuck?** The rules in each file's header map one-to-one onto tests; find the failing test's rule and re-read it. · **Next:** `csbootcamp/24-debug-hunts`
