# 25 — Codebase debug hunts

## Outcome

Trace symptoms across files and layers, identify the violated boundary, and
fix the owning component without papering over downstream effects.

## The 80/20 model

In real systems, detection and cause are separated. An incorrect database unit
may surface in UI formatting; middleware order may surface as missing context;
a response mapper may expose a service authorization omission.

Map the execution/data path before deep reading. Find where a value first
crosses a contract incorrectly. Use repository search, call hierarchy, tests,
logs, and controlled probes to narrow. Distinguish ownership: the layer that
detects a problem is not necessarily the layer that should correct it.

Avoid changing several layers to make them agree on accidental behavior. Name
the canonical contract and update producers/consumers deliberately.

## Common traps

- Fix at display/crash site while bad state continues.
- Reading whole repository without a path hypothesis.
- Mock hiding cross-module mismatch.
- Duplicated normalization at multiple boundaries.
- Large cross-file cleanup mixed with the defect fix.

## Optimized exercises

1. **Map:** for an unfamiliar failing test, draw entry point, calls, data
   transformations, side effects, and response before selecting files to edit.
2. **Boundary:** diagnose a unit/schema/normalization mismatch whose symptom is
   two modules away; fix the producer or contract owner and add contract test.
3. **Application:** choose a RelayDesk bug crossing UI/API/database, record the
   first incorrect state, minimal correction, and separate cleanup ticket.

## Exit gate

Explain why the visible failure site was downstream of the owning defect and
show evidence locating the first contract violation.

More reps: `../../bootcamp/25-codebase-debug-hunts/`.

