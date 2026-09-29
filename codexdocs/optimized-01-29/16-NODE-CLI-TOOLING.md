# 16 — Node CLI tooling

## Outcome

Build command-line tools with stable arguments, composable streams, correct
exit behavior, and testable separation between logic and terminal effects.

## The 80/20 model

A CLI is an API for humans and scripts. Its contract includes arguments,
stdin/stdout/stderr, exit codes, environment, signals, terminal capabilities,
and filesystem effects. Machine-readable output belongs on stdout; diagnostics
belong on stderr.

Parse raw arguments into a typed command before executing. Keep rendering,
terminal colors, prompts, and progress indicators outside core behavior. Detect
TTY capability and provide non-interactive behavior for automation.

Exit naturally after setting `process.exitCode` so buffered output and cleanup
can finish. Use immediate exit only when intentionally abandoning work.

## Common traps

- Success and error output mixed on stdout.
- Always returning exit code zero.
- Prompting in CI/non-TTY sessions.
- Building shell command strings from user input.
- Progress animation corrupting redirected output.
- Core behavior inseparable from process globals.

## Optimized exercises

1. **Contract:** design commands/options/errors for a ticket import CLI,
   including help, JSON mode, dry run, stdin, and exit codes.
2. **Implementation:** parse argv into a discriminated command and inject
   input/output/filesystem; test without spawning a process.
3. **Application:** add a RelayDesk migration or seed CLI and test one real
   subprocess success, usage failure, signal, and redirected-output path.

## Exit gate

Describe the CLI contract for humans, shell scripts, CI, and signals, and show
how core logic runs without global process state.

More reps: `../../bootcamp/16-node-cli-tooling/`.

