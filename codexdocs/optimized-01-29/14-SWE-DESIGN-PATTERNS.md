# 14 — Software design patterns

## Outcome

Use patterns as shared vocabulary for recurring forces, while preferring the
simplest design that protects current change boundaries.

## The 80/20 model

Patterns are named tradeoffs, not mandatory shapes. Strategy selects behavior,
observer distributes events, command represents an action, adapter translates
interfaces, decorator wraps behavior, state machine restricts transitions,
and dependency injection separates construction from use.

First name the pressure: varying policy, replaceable dependency, reversible
operation, notification, or lifecycle. Then implement the smallest form. A
function or object literal may express a pattern without class hierarchies.

Good abstractions reduce the cost of a demonstrated change. Premature patterns
create indirection, configuration, and tests for flexibility nobody needs.

## Common traps

- Pattern selected before problem is stated.
- Repository layer that only renames ORM methods.
- Event bus hiding important synchronous control flow.
- Dependency injection container used as a service locator.
- Strategy classes when one injected function is clearer.
- State transitions scattered despite claiming a state pattern.

## Optimized exercises

1. **Recognition:** map six RelayDesk mechanisms to patterns, naming the force
   and one cost; reject a pattern for one simple case.
2. **Implementation:** create retry strategy and injected clock as functions,
   then compare with class-based designs.
3. **Application:** identify one coupling pain in RelayDesk and introduce the
   smallest adapter/strategy/state boundary with before/after dependency map.

## Exit gate

For a proposed pattern, state the current change it makes cheaper, added
indirection, and evidence that the trade is worthwhile.

More reps: `../../bootcamp/14-swe-design-patterns/`.

