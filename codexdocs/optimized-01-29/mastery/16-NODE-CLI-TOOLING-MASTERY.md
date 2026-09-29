# 16 — Node CLI tooling mastery bank

Deepen: command contracts, argument parsing, streams, process lifecycle, safe filesystem work, and operator-friendly automation.

## Explain

- [ ] Explain the separate contracts of arguments, stdin, stdout, stderr, and exit codes.
- [ ] Explain why library logic should not call `process.exit` or read global process state directly.
- [ ] Explain shell quoting and why `spawn(command, args)` is safer than interpolated shell strings.
- [ ] Explain TTY detection and how interactive behavior should change when output is redirected.
- [ ] Explain graceful shutdown for signals, open handles, buffered output, and partial work.

## Predict

- [ ] Predict `process.argv` for quoted, empty, spaced, and flag-like arguments on your shell.
- [ ] Predict what a pipeline receives when a CLI mixes diagnostics into stdout.
- [ ] Predict the observable result of setting `exitCode` versus calling `process.exit()` immediately.
- [ ] Predict how a slow downstream pipe affects a producer that ignores stream backpressure.
- [ ] Predict the files left behind if an overwrite crashes between truncate, write, and rename.

## Implement

- [ ] Build a typed argument parser with flags, values, defaults, `--`, help, and useful errors.
- [ ] Refactor a CLI into injectable parse, execute, and render boundaries with a tiny entry point.
- [ ] Build a streaming stdin-to-stdout JSON Lines filter that respects backpressure.
- [ ] Add dry-run, confirmation, atomic output, and overwrite protection to a destructive command.
- [ ] Build a multi-command task CLI with config precedence, structured errors, and stable exit codes.

## Test

- [ ] Unit-test parser equivalence classes including missing, duplicate, unknown, and malformed options.
- [ ] Spawn the real CLI and assert stdout, stderr, exit status, cwd, and environment behavior.
- [ ] Test piped and TTY-like execution without relying on manual terminal input.
- [ ] Test signal cancellation and prove temporary files and child processes are cleaned up.
- [ ] Test large streaming input with a deliberately slow consumer and bounded memory expectations.

## Debug and review

- [ ] Repair a CLI whose logs corrupt machine-readable stdout and define its output contract.
- [ ] Diagnose output lost by an early `process.exit()` and prove the lifecycle fix.
- [ ] Find and remove a shell-injection path while preserving spaces and Unicode in arguments.
- [ ] Diagnose a command that finishes its work but hangs because an open handle remains.
- [ ] Review a progress renderer for non-TTY, narrow terminal, color-disabled, and CI behavior.

## Apply

- [ ] Create a RelayDesk import command with validation, rejected-row reporting, and dry run.
- [ ] Create a migration command that is repeatable, versioned, locked, and safely resumable.
- [ ] Create an export command that streams data and writes a checksum plus manifest.
- [ ] Write an operator runbook covering examples, exit codes, recovery, and rollback.
- [ ] Record a two-minute demo that defends the CLI boundaries and one deliberate tradeoff.
