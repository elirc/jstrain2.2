# 23 — Node reinforcement drills

## Outcome

Retrieve Node APIs and resource-lifecycle reasoning under mixed, production-like
constraints rather than isolated API prompts.

## The 80/20 model

The transfer skill is not recalling `fs`, stream, event, URL, HTTP, or crypto
syntax independently. It is selecting and composing them while maintaining
limits, cleanup, cancellation, errors, portability, and testability.

Reinforcement should target observed weaknesses. Alternate implementation,
prediction, and debugging. Rebuild from contracts after a delay. Use injected
time/I/O where waiting or real global state would slow feedback.

Treat command-line, filesystem, network, and process behavior as public
contracts. Verify exit codes, stderr/stdout, partial files, disconnects, and
signals—not only returned values.

## Common traps

- API trivia studied without composition.
- Real timers/files/network making drills slow or flaky.
- Happy-path-only resource use.
- Rebuilding exact memorized reference structure.
- No explanation of why a Node primitive was selected.

## Optimized exercises

1. **Mixed build:** read JSONL from stream, validate records, hash accepted
   content, atomically write summary, and support abort with cleanup.
2. **Crash drill:** diagnose a process that hangs after output, a stream that
   loses errors, and an HTTP handler that writes twice.
3. **Application:** recreate one RelayDesk Node boundary in a 50-line isolated
   harness, then compare its lifecycle/limits with production code.

## Exit gate

For mixed Node code, enumerate active resources, owners, failure paths,
backpressure/limits, and process-exit consequences.

More reps: `../../bootcamp/23-node-drills/`.

