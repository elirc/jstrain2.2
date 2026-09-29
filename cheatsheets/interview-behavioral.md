# Behavioral & System-Design-Lite — the non-code interview

The parts of a CRUD-team interview that aren't a coding screen, compressed
to a reference. You can't cram these the night before the way you can a
syntax table — but you CAN prepare the raw material, and walking in with
six stories and a design template beats improvising every time.

## STAR — the shape of every behavioral answer

Every "tell me about a time…" answer fits one frame. Keep it to ~90
seconds; the interviewer can always ask for more.

| letter | what goes here | length |
| --- | --- | --- |
| **S**ituation | the context, in one or two sentences | 10% |
| **T**ask | what YOU specifically had to do | 10% |
| **A**ction | what you did — the bulk, and always "I", not "we" | 60% |
| **R**esult | the outcome, ideally a number or a lesson | 20% |

The two failure modes: living in the Situation (they don't need the whole
backstory) and hiding in "we" (they're hiring you, not your team — say
what *you* did).

## The six stories to prepare

Prepare one concrete story for each. Most behavioral questions are one of
these in disguise, so six well-told stories cover almost everything.

1. **A hard bug you fixed.** The debug-hunt modules literally generate
   this: how you localized it, the tell you spotted, the minimal fix.
   This is the most common technical-behavioral question and the one you
   can now answer with real method, not vibes.
2. **A conflict or disagreement.** With a teammate, over an approach.
   Land it on how you reached a decision, not on who was right.
3. **Something you shipped end to end.** Scope, your role, the trade-off
   you made, what you'd do differently.
4. **A time you were wrong / failed.** Pick a real one, own it plainly,
   and spend the Result on what you changed afterward. Interviewers trust
   candidates who can do this; they distrust ones who can't.
5. **Learning something hard, fast.** Your process for getting productive
   in an unfamiliar codebase or technology. (This bootcamp is a story.)
6. **Something you improved without being asked.** Initiative — a flaky
   test you fixed, a doc you wrote, a process you tightened.

Write two bullet points per story: the ONE technical detail that proves it
happened, and the ONE number or lesson for the Result. That's enough to
reconstruct the story live without sounding rehearsed.

## Questions to ask them (always have three)

Not asking questions reads as not caring. Good ones, by what they reveal:

- "What does the on-call / incident process look like?" → engineering
  maturity.
- "How does a change get from my machine to production?" → tooling and
  trust.
- "What's the code review culture — what gets pushback?" → how you'll
  actually spend your days.
- "What would you want the person in this role to have shipped in six
  months?" → whether expectations are real.

## System-design-lite

Mid-level CRUD interviews rarely ask you to design Twitter. They ask you
to design a small, concrete thing and talk through it. The template below
handles almost all of them. Talk for three minutes; narrate your
reasoning, don't just state conclusions.

**The four moves, in order:**

1. **Entities** — what are the nouns, and how do they relate? (Draw the
   tables. This is module 27's schema kata: users, orders, line items,
   with the foreign keys and "price at purchase time".)
2. **Endpoints** — the handful of operations. Name the HTTP method and
   path, and which are reads vs writes. Note which writes must be
   idempotent (module 28).
3. **Storage** — one relational table per entity, the keys and indexes,
   how you paginate (keyset, not offset, if it can grow — module 27).
4. **The one hard part** — every design has exactly one interesting
   trade-off. Find it and dwell there; that's what they're actually
   testing. It's usually consistency, a race, caching, or scale.

**Worked example — "design a URL shortener":**

- *Entities:* `links(id, slug UNIQUE, target_url, created_at, owner_id)`.
- *Endpoints:* `POST /links` (create, returns slug), `GET /:slug`
  (redirect — the hot path, by far the most traffic).
- *Storage:* index on `slug` (every redirect is a lookup by it); the slug
  is a short random token, not an auto-increment id (else they're
  guessable and enumerable — module 26's predictable-id lesson).
- *The hard part:* the read path dwarfs the write path by orders of
  magnitude, so you cache slug→url aggressively and accept that a just-
  edited link may serve stale for a few seconds. Name that trade-off
  explicitly — that's the whole point of the question.

**Other prompts that fit the same template:** a todo API, a rate limiter
(the hard part is the counter and the clock — module 17/23), a paginated
feed (the hard part is keyset vs offset), a "like" button (the hard part
is idempotency and the write-heavy counter).

## The meta-rules

- **Think out loud.** Silence reads as stuck. Narrate the options you're
  weighing even when you haven't decided.
- **State assumptions, then proceed.** "I'll assume single-region and a
  relational DB — say if you want me to revisit that." Don't wait for
  permission to start.
- **It's a conversation, not an exam.** Ask clarifying questions; the
  best candidates treat the interviewer as a teammate at a whiteboard.
- **"I don't know, but here's how I'd find out"** is a strong answer.
  Faking knowledge is the weakest one.

---
*Companion to `quizzes/10-interview-verbal.md` (say those out loud) and
the schema/consumer modules `bootcamp/27-sql-data`,
`bootcamp/28-api-consumer`. The bug story writes itself out of
`bootcamp/24-debug-hunts`.*
