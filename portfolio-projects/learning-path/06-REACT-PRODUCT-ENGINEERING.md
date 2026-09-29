# React product engineering

## React is the user’s view of distributed state

The server can reject a command after the screen showed it as possible. A mid-level engineer treats loading, empty, validation, permission, stale, conflict, retry, and success states as product behavior—not polish.

## State ownership

Ask for every value:

- Is it server truth, URL/navigation state, form draft, or presentation state?
- What invalidates it?
- Can an older response overwrite a newer organization/selection?
- What remains after a failed mutation?

Project management’s client increments a generation when switching organizations. A response started under the prior generation is rejected, preventing stale tenant data from repainting the screen.

## Accessible interaction

The codebases demonstrate semantic headings, labels, live regions, buttons, tables, and keyboard alternatives. Project task movement cannot rely on pointer drag alone. Scheduling time slots are a list of real buttons with an alternative textual status.

Accessibility review asks:

- Can every action be reached and completed with a keyboard?
- Does focus move somewhere useful after dialogs/errors?
- Are errors connected to fields?
- Does a live region announce asynchronous results without becoming noisy?
- Is status conveyed by text, not color alone?
- Do disabled controls explain why they are unavailable?

## Optimistic versus pessimistic UI

Optimistic UI changes immediately, then rolls back or merges on conflict. It improves speed perception but requires a trustworthy recovery design. These compact UIs mostly wait for server truth or expose explicit conflicts. Never call a UI optimistic merely because it uses local state.

## Read the tests as user stories

- [inventory React test](../01-inventory-orders/tests/react.test.tsx)
- [project board test](../02-project-management/tests/web.test.tsx)
- [project cache isolation](../02-project-management/tests/cache-isolation.test.tsx)
- [scheduling React test](../03-appointment-scheduling/tests/react.test.tsx)

Prefer role/name/text/focus assertions over CSS class or hook implementation assertions.

## Hands-on exercise

Add a retry button to one retryable fetch failure. Write the component test first:

1. first request fails;
2. useful input remains visible;
3. an accessible error and retry control appear;
4. retry succeeds;
5. stale error disappears and focus/status is sensible.

## Teach-back

Choose one component and classify every state variable. Explain what owns it, what invalidates it, and which stale-response bug is possible.
