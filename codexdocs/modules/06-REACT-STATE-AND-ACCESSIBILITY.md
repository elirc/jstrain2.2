# Module 06 — React state and accessibility

Pair with: RelayDesk increments 5–6.

## Why this matters

React engineering is largely state modeling and synchronization. A component
can render the happy path while failing users through stale data, lost input,
unreachable controls, misleading loading states, or inaccessible markup.

Build from user-observable states and ownership instead of beginning with a
hook choice.

## Render is a snapshot

Each render computes UI from the props and state visible during that render.
Event handlers and effects created there close over that snapshot. State
updates schedule future renders; they do not rewrite variables in an already
running handler.

Use functional updates when the next value depends on the previous value:

```ts
setSelected((current) => new Set(current).add(ticketId));
```

Do not mutate `current`; create the next owned value.

## Store the source, derive the rest

If filtered tickets can be computed from tickets plus filters, storing both
creates synchronization work and impossible combinations. Store the smallest
authoritative state and derive presentation values during render. Memoize only
when measurement or referential contracts justify it.

## Effects synchronize with external systems

Effects are for network requests, subscriptions, timers, browser APIs, and
other external synchronization. Pure derivation and user-event logic usually
belong elsewhere. Every effect should answer:

- What external resource is synchronized?
- What values define that synchronization?
- How is previous work cleaned up or superseded?

## Accessibility is behavior

Semantic elements provide keyboard behavior, roles, names, and interaction
contracts. A clickable `div` recreates only a fraction of a button. Labels,
focus management, live error announcements, table structure, and meaningful
loading states belong in acceptance criteria and behavior tests.

## Common failure patterns

- Index keys for reorderable data.
- Mutating arrays/objects then setting the same identity.
- Copying props into state and letting them drift.
- Effect loops caused by unstable dependencies.
- Ignoring late responses without handling active-request failure.
- Optimistic UI that reports success before failure reconciliation exists.
- Testing components through implementation details.
- Hiding unauthorized content only with CSS or rendering logic.

## Exercise 1 — state inventory (core)

For the RelayDesk queue screen, list every candidate value and classify it as
server state, URL state, local input state, derived state, or transient UI
state.

Constraints:

- Include filters, current page/cursor, selected row, tickets, loading, error,
  and permission-derived controls.
- Assign one owner to every value.
- Remove at least one redundant stored value.

Proof: state table and component/data-flow sketch.

Debrief: which values should survive refresh, navigation, or sharing a URL?

AI level: 0.

## Exercise 2 — accessible async form (core)

Build a create-ticket form with title, description, priority, submit, and
server field errors.

Constraints:

- Every field has a programmatic label and error relationship.
- Keyboard-only completion works.
- Submitting communicates pending state and prevents accidental duplication.
- Focus moves usefully after server validation failure and after success.

Proof: behavior tests using roles/labels and a manual keyboard checklist.

Debrief: which accessibility behaviors did semantic elements provide without
custom event code?

AI level: 1.

## Exercise 3 — derived queue (core)

Implement search, status filter, and sorting over ticket data while keeping
the source collection unchanged.

Constraints:

- Filter state lives in the URL.
- Empty query and “all statuses” have deliberate serialization.
- Stable ties use ticket ID.
- No effect synchronizes purely derived filtered data.

Proof: pure-function tests plus navigation/component behavior tests.

Debrief: when should filtering move to the server, and what UI contract should
remain stable?

AI level: 1.

## Exercise 4 — out-of-order response race (applied)

Create a queue whose first request resolves after its second. Show the stale
result bug, then fix it using cancellation or request identity.

Constraints:

- No real timer sleeps.
- Active-request failure still renders an error.
- Superseded failure does not replace current success.
- Cleanup survives component unmount.

Proof: deterministic deferred-promise component tests and a request timeline.

Debrief: what is the difference between cancelling work and preventing stale
rendering?

AI level: 1.

## Exercise 5 — identity and keys hunt (review)

Render editable comments keyed by array index, modify the second input, then
insert a comment at the top. Demonstrate state moving to the wrong row and fix
identity.

Constraints:

- The test uses user-visible input values.
- The fix uses stable domain identity.
- Reordering and deletion are also checked.

Proof: failing interaction test and corrected render.

Debrief: why are keys not merely a warning-suppression mechanism?

AI level: 2, diagnosis only.

## Exercise 6 — optimistic conflict UX (applied)

Optimistically assign a ticket, then simulate a server version conflict.

Constraints:

- Pending and failure states are visible.
- User intent is retained or explicitly restored.
- The user can load current state and retry consciously.
- A generic “something went wrong” is insufficient.

Proof: component/integration test covering success, ordinary failure, and
conflict with current server representation.

Debrief: when is pessimistic UI the better product choice?

AI level: 2 after state transitions are written.

## Project transfer

Use the state inventory before RD-501. Apply the race and conflict exercises
directly to RD-603 and RD-604. Review every screen for all required states in
the project brief.

