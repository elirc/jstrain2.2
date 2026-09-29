# 26 — Security hunts

## Outcome

Identify trust-boundary vulnerabilities in plausible code, demonstrate impact,
and implement controls that fail closed without relying on UI behavior.

## The 80/20 model

Trace untrusted actor-controlled data to sensitive operations: SQL syntax,
HTML, filesystem paths, redirects, authorization decisions, logs, tokens, and
expensive parsers. Validate structure, constrain values, and use context-safe
APIs at the sink.

Authentication proves identity; authorization evaluates action plus resource,
ownership, workspace, role, and state. Test direct requests and negative cases.
Security comparisons must establish required values exist before comparing;
`undefined === undefined` is not proof.

Security fixes need exploit/regression evidence and residual-risk notes. A
regex replacement or denylist that blocks one payload often leaves the unsafe
composition intact.

## Common traps

- SQL interpolation and dynamic identifiers from user input.
- UI-only permission checks and IDOR.
- Object spread causing mass assignment.
- `innerHTML`/unsafe rendering of user content.
- Path prefix checks without normalized separator containment.
- Predictable tokens, secret logs, open redirects, ReDoS, and vacuous CSRF.

## Optimized exercises

1. **Data flow:** choose one request and mark every trust boundary, sensitive
   sink, validation, authorization, output, log, and cache step.
2. **Exploit/fix:** complete an unseen security hunt by first writing a request
   that demonstrates impact, then a minimal failing-closed correction.
3. **Application:** threat-model RelayDesk ticket detail or bulk assignment,
   implement top risk controls, and add a negative authorization matrix.

## Exit gate

For one vulnerability, trace attacker input to impact, explain why existing
controls fail, and show a regression test at the real boundary.

More reps: `../../bootcamp/26-security-hunts/`.

