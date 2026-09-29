# 13 — DOM and browser mastery bank

Deepen: DOM tree, events, forms, focus, accessibility, rendering security,
observers, browser storage, network lifecycle, identity, and cleanup.

## Explain

- [ ] Explain capture/target/bubble, currentTarget/target, delegation, and propagation control.
- [ ] Explain semantic element behavior and accessible name computation basics.
- [ ] Explain focus order, modal focus ownership, restoration, and live error messaging.
- [ ] Explain textContent versus HTML interpretation and context-specific output safety.
- [ ] Explain listener/observer/timer/network cleanup across page/component lifecycle.

## Predict

- [ ] Trace nested event handlers through phases with stop/prevent behavior.
- [ ] Predict form submission/button defaults and browser validation interactions.
- [ ] Predict focus after element removal, dialog open/close, and validation failure.
- [ ] Predict DOM identity bugs after list insert/delete/reorder with index mapping.
- [ ] Predict storage/network state across refresh, back/forward, offline, and abort.

## Implement

- [ ] Implement delegated dynamic list with keyboard and pointer controls.
- [ ] Implement accessible modal/dialog with focus containment and restoration.
- [ ] Implement validated form with field summary, focus, and progressive enhancement.
- [ ] Implement sortable table with semantic headers, keyboard control, and announced order.
- [ ] Implement abortable incremental loading with loading/empty/error/retry states.

## Test

- [ ] Test behavior through roles, names, keyboard actions, focus, and visible state.
- [ ] Test dynamic list identity across reorder, edit, and delete.
- [ ] Test user text renders as text and unsafe HTML cannot execute/alter structure.
- [ ] Test listener cleanup after repeated mount/unmount-like lifecycle.
- [ ] Manually audit zoom, reduced motion, keyboard-only, and screen-reader naming.

## Debug and review

- [ ] Diagnose duplicate handler caused by repeated registration.
- [ ] Find wrong-row deletion from index-based identity.
- [ ] Review clickable non-semantic element and enumerate missing browser behaviors.
- [ ] Diagnose focus lost behind modal or after async error.
- [ ] Review user-content rendering for XSS escape-hatch misuse.

## Apply

- [ ] Audit RelayDesk primary flow using keyboard and semantic queries.
- [ ] Add useful focus movement to form failure/success and conflict recovery.
- [ ] Verify stable domain keys through list filtering/reorder.
- [ ] Trace React abstractions to actual DOM events/attributes for one component.
- [ ] Close one accessibility defect with behavior test and manual evidence.

