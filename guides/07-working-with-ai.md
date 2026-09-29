# Working With AI Without Being Owned By It

The bug this knowledge prevents: shipping code you didn't understand,
because a model wrote it and it looked right. That is the defining failure
mode of the current era of software work, and it is entirely preventable.
The skill that prevents it is the same one this whole bootcamp trains —
reading code faster than you write it, and knowing where bugs hide.

This guide is the one piece of the bootcamp that names its own strategy
out loud. The goal was never "learn to code without AI." It was "become
the kind of engineer who can use AI and stay in command." Those are
different people, and the difference is fundamentals.

## 1 · Why fundamentals matter MORE with AI, not less

The intuition many juniors have — "the model writes the code, so I need to
know less" — is exactly backwards, and it's worth seeing why mechanically.

A model produces the most probable next token given your prompt and its
training. Probable is not the same as correct. On the well-trodden path
(a React form, a CRUD endpoint, a sort) probable and correct almost
coincide, and the output is great. Off that path — your specific edge
case, your unusual constraint, the interaction between two libraries —
the model still produces fluent, confident, plausible code. It does not
know that it left the path. Only you can know that, and only if you can
read what it wrote.

So the value of your fundamentals doesn't drop when you add AI. It moves.
It stops being "can you produce this code from a blank page" and becomes
"can you tell, in thirty seconds of reading, whether this code is right."
The second skill is rarer and more valuable than the first, and it is
what separates an engineer who is accelerated by AI from one who is
quietly sabotaged by it.

```
Without the skill:  prompt → paste → hope → ship → incident
With the skill:     prompt → READ → catch the lie → fix → ship
```

The debug-hunt modules (24, 25, 26) are this skill, drilled directly.
Every hour you spend there is an hour spent becoming un-foolable by
plausible-but-wrong code — which is precisely what a model generates when
it's wrong.

## 2 · Review generated code the way you hunt a bug

You already have the method: it's the four-step hunt from module 24. Point
it at the model's output instead of a teammate's.

1. **Name what the code CLAIMS before you read how it works.** What is
   this function's contract — inputs, output, edge cases, error behavior?
   The model rarely states it; make yourself say it first, so you have
   something to check the body against.
2. **Follow one concrete value through it.** Pick the input you actually
   care about — the empty list, the duplicate key, the concurrent call —
   and trace it. Don't trust the shape; run it in your head, or better,
   run it for real.
3. **Name the bug class you'd expect here.** Async code? Look for the
   dropped await and the `Promise.all` collapse. A query? Look for
   injection and the LEFT-JOIN-turned-inner. User input? Look for the
   missing validation and the missing escape. You know the families now
   (module 24's table); the model falls into all of them.
4. **Make it prove itself with a test.** The single highest-leverage move
   with generated code: write the test yourself, especially the edge
   case (module 29 is this skill). If you let the model write both the
   code and the test, they share the same blind spot and both pass.

The uncomfortable rule underneath all four: **never ship code you can't
explain to another person.** If you can't say why it's correct, you
haven't reviewed it — you've laundered it.

## 3 · Prompting IS spec-writing (you already know the format)

Look at any exercise file in this bootcamp. The prompt states the
real-world setup, gives concrete input→output examples, names the edge
cases, and lists the constraints. That is not a coincidence of format —
that is what a complete specification looks like, and it is exactly what
turns a vague model response into a correct one.

A weak prompt and a weak bug report are the same document:

```
weak:    "make a function to handle the dates"
strong:  "parse an ISO date string to a Date in UTC; return null (don't
          throw) on malformed input; '2024-13-01' is malformed; the empty
          string is malformed; leap seconds are out of scope."
```

The strong version isn't longer for its own sake — every clause closes a
door the model would otherwise fill with a plausible guess. Writing it
forces YOU to decide the edge cases, which is the part of the work that
was always yours. The model can write the code for a decision; it cannot
make the decision, because the decision depends on your system, your
users, and your constraints, none of which are in its training data.

This is why fundamentals make you a better prompter, not a lazier one:
you can only specify the edge cases you know exist.

## 4 · What to delegate, and what never to

A simple division that has held up:

**Delegate freely** — the stuff where probable and correct coincide, and
where you can verify the result cheaply:
- boilerplate and scaffolding you've written a hundred times
- syntax and API recall ("what's the args order for `reduce`")
- translating between formats, first drafts of tests, regex you'll verify
- explaining an unfamiliar codebase or error to you

**Never delegate** — the parts that ARE the engineering:
- the decision about what the edge cases are and how they behave
- the failing test that pins the real requirement
- the final judgment that the code is correct
- the understanding itself

The tell that you've crossed the line: you're about to paste something you
couldn't have written and couldn't now explain. Stop there. Either
understand it or don't ship it. "The AI wrote it" has never once been an
acceptable answer to "why does this do that," and it never will be.

## 5 · The trap gallery

Concrete failure modes, so you recognize them in the wild. Each is a bug
class you've hunted; the model just produces them faster.

- **The confident hallucinated API.** A method, flag, or package that
  reads perfectly and does not exist. Fluency is not evidence. Check it
  against the actual docs / the actual types.
- **The happy-path-only implementation.** Correct for the example you
  gave, silent on the empty input, the error case, the concurrent call.
  This is why you supply the edge cases and write the edge test.
- **The subtly-wrong-for-your-version answer.** Right for an older (or
  newer) version of the library than yours. The model averages over all
  versions in its training; your project is one specific version.
- **The security hole that looks clean.** String-concatenated SQL,
  unescaped output, `Math.random()` for a token — all of module 26,
  generated without a flicker of doubt, because the insecure version is
  well-represented in training data.
- **The plausible number.** A timeout, a retry count, a cache TTL that
  sounds reasonable and was never derived from anything. Ask where the
  number came from; if the answer is "it seemed right," it's a guess.

The through-line: the model's output is a strong first draft written by
someone brilliant, tireless, and occasionally confidently wrong, who will
never tell you which parts they were unsure about. Your job is the part
they can't do — knowing which parts to doubt. That judgment is
fundamentals, and fundamentals are what this whole repo is for.

## Now go do

Reading this without practicing the underlying skill is entertainment.
Go drill the thing that makes AI safe to use:

1. `bootcamp/24-debug-hunts` — the reading-and-catching skill, whole.
2. `bootcamp/25-codebase-debug-hunts` — the same, across files, where a
   symptom and its cause sit apart (how real generated code fails).
3. `bootcamp/26-security-hunts` — the holes a model generates most
   confidently. Learn to see them without thinking.
4. `bootcamp/29-write-the-test` — write the edge-case test the model
   would skip. This is your single strongest check on generated code.

## Self-test

Say your answer out loud before you expand each one.

<details>
<summary>A model hands you a 40-line function that passes the two tests
it also wrote. What do you do before trusting it?</summary>

Write your own test first — specifically for the edge cases the model
didn't mention (empty input, boundary values, error path, concurrent
use). Code and tests written together share a blind spot; a green suite
that both came from the same source proves they AGREE, not that they're
correct. Then read the body against the contract you'd state for it. If
you can't explain why it's right, you haven't finished reviewing.
</details>

<details>
<summary>Why does adding AI raise the value of knowing coercion, the event
loop, and SQL joins, rather than lowering it?</summary>

Because the model produces plausible code, and those topics are exactly
where plausible and correct diverge — `==` surprises, dropped awaits,
LEFT-JOIN-turned-inner all read fine and behave wrong. The rarer, more
valuable skill in an AI workflow is catching wrong-but-plausible output
in seconds, and that skill IS your fundamentals. The model shifts the
demand from "produce the code" to "judge the code"; the second needs
deeper understanding, not less.
</details>

<details>
<summary>You're tempted to paste a clever solution you don't fully
understand. Name the rule and the reason.</summary>

The rule: never ship code you can't explain to another person. The
reason: "the AI wrote it" is not an answer to "why does this do that,"
and the moment there's an incident, the understanding you skipped is the
understanding you now need at 2am with the site down. Either understand
it before shipping, or don't ship it. Reconstructing it from the idea (as
this bootcamp trains) is how you turn a paste into knowledge.
</details>

---
*Part of the jstrain2.2 bootcamp. The skill this guide depends on is
drilled in [`../bootcamp/24-debug-hunts`](../bootcamp/24-debug-hunts/),
[`25`](../bootcamp/25-codebase-debug-hunts/),
[`26`](../bootcamp/26-security-hunts/), and
[`29`](../bootcamp/29-write-the-test/). Schedules in
[`../FLIGHTPLAN.md`](../FLIGHTPLAN.md).*
