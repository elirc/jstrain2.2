# 11 — Functional programming

## Outcome

Use pure transformations, explicit effects, and composition to make behavior
easier to test and change without forcing all code into one style.

## The 80/20 model

A pure function's result depends only on inputs and it does not mutate shared
state or perform hidden I/O. Pure cores make domain rules and transformations
easy to test; impure shells own HTTP, database, clock, randomness, and logs.

Immutability is an ownership strategy. It makes state transitions inspectable
and prevents distant mutation, but copying has costs. Composition works when
functions have clear compatible contracts; long clever pipelines can obscure
errors and domain language.

Higher-order functions can inject effects and policies. Reducers express state
transitions well when actions form a meaningful vocabulary, not when every
assignment becomes ceremonial dispatch.

## Common traps

- Calling a function pure while it reads time or module state.
- Shallow-copying then mutating nested data.
- Point-free pipelines nobody can debug.
- Catching errors inside generic composition.
- Rebuilding classes/objects as awkward reducers without benefit.

## Optimized exercises

1. **Separate:** refactor an I/O-heavy report function into fetch/read shell,
   pure validation/transformation core, and formatting shell.
2. **Compose:** create typed `pipe` for two to four practical transformations;
   compare readability with named intermediate variables.
3. **Application:** model one RelayDesk state transition as a pure function
   and keep persistence/logging outside; prove inputs remain unchanged.

## Exit gate

Identify effects and ownership in one service, then explain which should be
isolated, injected, or left in place and why.

More reps: `../../bootcamp/11-functional-programming/`.

