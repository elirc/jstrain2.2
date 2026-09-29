# 23 — Node drills mastery bank

Deepen: rapid retrieval and integration of Node modules, files, events, streams, processes, servers, persistence, and tests.

## Explain

- [ ] Explain CommonJS and ESM loading, caching, live bindings, resolution, and interop pitfalls.
- [ ] Explain Buffer versus string boundaries and how encoding errors corrupt data.
- [ ] Explain EventEmitter listener lifecycle, error events, reentrancy, and leak warnings.
- [ ] Explain Node process startup, active handles, signals, exit codes, and shutdown.
- [ ] Explain how one inbound HTTP request flows through Node into persistent state.

## Predict

- [ ] Predict module initialization and output for a small cyclic dependency.
- [ ] Predict byte lengths and decoded output for ASCII, Unicode, truncated, and invalid sequences.
- [ ] Predict event order when listeners add, remove, throw, or emit recursively.
- [ ] Predict results of concurrent filesystem operations sharing paths and temporary names.
- [ ] Predict event-loop ordering across timers, I/O callbacks, immediates, promises, and next ticks.

## Implement

- [ ] In 20 minutes, build an ESM module with public exports, private helpers, and dependency injection.
- [ ] In 25 minutes, build a bounded file transformer preserving bytes, metadata, and failure safety.
- [ ] In 25 minutes, build an event-driven component with subscribe/unsubscribe and typed payloads.
- [ ] In 35 minutes, build a cancellable stream pipeline with useful progress metrics.
- [ ] In 45 minutes, build a small HTTP endpoint with validation, persistence, and errors.

## Test

- [ ] Write module-boundary tests that avoid reaching into private implementation.
- [ ] Test filesystem code with isolated temporary directories and verified cleanup.
- [ ] Test emitter behavior for listener errors, removal, duplicate registration, and reentrancy.
- [ ] Test stream success and every stage failing, including source and destination cleanup.
- [ ] Test a Node service process from startup through readiness, request, signal, and exit.

## Debug and review

- [ ] Diagnose `ERR_REQUIRE_ESM` or an interop issue without converting the whole project blindly.
- [ ] Repair mojibake or truncated Unicode by finding the incorrect byte/string boundary.
- [ ] Diagnose an EventEmitter memory-leak warning and remove the lifecycle defect.
- [ ] Find the active resource keeping a completed Node script alive.
- [ ] Profile one slow drill and distinguish CPU time, I/O wait, allocation, and algorithmic cost.

## Apply

- [ ] Complete five randomly selected Node drills on separate days under a 30-minute cap.
- [ ] Combine modules, events, and streams into a reusable RelayDesk import subsystem.
- [ ] Package a Node library with a deliberate public API, types, exports, and usage example.
- [ ] Review one earlier Node solution and reduce global state, hidden I/O, and error ambiguity.
- [ ] Maintain a Node failure notebook with symptoms, root causes, proof, and prevention patterns.
