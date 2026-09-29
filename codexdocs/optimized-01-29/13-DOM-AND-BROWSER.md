# 13 — DOM and browser

## Outcome

Build accessible browser interactions while understanding events, DOM state,
security boundaries, and lifecycle beneath React.

## The 80/20 model

The DOM is a mutable tree. Events travel through capture, target, and bubble
phases; delegation uses that path to handle dynamic descendants. Listeners,
observers, and timers require cleanup when their owning UI disappears.

Prefer semantic HTML because buttons, forms, labels, headings, tables, and
links carry behavior and accessibility contracts. Manage focus deliberately
after dialogs, errors, additions, and navigation.

Text insertion and HTML interpretation are different security contexts.
Prefer `textContent` for untrusted text. If rich HTML is truly required, use a
well-reviewed context-aware sanitization strategy rather than handcrafted
replacement.

## Common traps

- Clickable `div` replacing a button.
- Index-based identity after reorder/delete.
- Re-registering listeners without removing originals.
- `innerHTML` with user content.
- Form button defaults causing accidental submission.
- Visual hiding without focus/assistive-technology behavior.

## Optimized exercises

1. **Events:** build a delegated editable list; handle dynamic items and prove
   correct target/currentTarget use and cleanup.
2. **Accessibility:** implement a modal with labeled structure, initial focus,
   focus containment, Escape close, and focus restoration.
3. **Application:** manually and automatically audit one RelayDesk React flow
   for semantics, keyboard use, focus, accessible names, and safe text output.

## Exit gate

Explain event propagation, semantic-control behavior, focus ownership, and why
React does not remove DOM security/accessibility responsibilities.

More reps: `../../bootcamp/13-dom-and-browser/`.

