# 26 — security hunts mastery bank

Deepen: threat modeling, trust boundaries, validation, authorization, injection, secrets, web security, dependencies, and safe failure.

## Explain

- [ ] Explain asset, actor, trust boundary, threat, vulnerability, exploit, impact, and mitigation.
- [ ] Explain authentication versus authorization and why UI hiding provides neither authorization nor security.
- [ ] Explain injection across SQL, shell, HTML, URLs, templates, logs, and object-property paths.
- [ ] Explain XSS, CSRF, CORS, cookies, and content security policy as distinct browser concerns.
- [ ] Explain least privilege, secret lifecycle, dependency risk, and defense in depth.

## Predict

- [ ] Trace untrusted input through a supplied feature and predict every interpreter it reaches.
- [ ] Predict authorization results for owner, teammate, administrator, anonymous, and deleted-resource cases.
- [ ] Predict browser behavior for SameSite modes, credentialed CORS, redirects, and preflight requests.
- [ ] Predict information leaked through differing errors, timing, logs, identifiers, and response sizes.
- [ ] Predict exploitability and blast radius for a vulnerable dependency in production and build tooling.

## Implement

- [ ] Create a lightweight threat model for a RelayDesk feature using assets, boundaries, abuse cases, and controls.
- [ ] Centralize server-side authorization and encode deny-by-default ownership rules.
- [ ] Replace SQL and shell string interpolation with parameterized or argument-array APIs.
- [ ] Add bounded validation, output encoding, safe headers, and redacted structured logging.
- [ ] Add secure configuration startup checks without committing, printing, or returning secrets.

## Test

- [ ] Build an authorization matrix test suite across roles, resources, actions, and ownership states.
- [ ] Test injection payloads as regression cases at SQL, shell, HTML, header, and log boundaries.
- [ ] Test body-size, field-count, nesting, timeout, and rate limits for resource-exhaustion resistance.
- [ ] Test cookies, CORS, CSRF protection, redirect targets, and security headers in a real HTTP flow.
- [ ] Scan dependencies and secrets, then manually determine reachability, severity, and remediation evidence.

## Debug and review

- [ ] Hunt an insecure direct object reference where valid authentication bypasses resource ownership.
- [ ] Hunt stored and reflected XSS paths, identifying the exact missing context-sensitive encoding.
- [ ] Hunt prototype pollution or unsafe object merging with attacker-controlled keys.
- [ ] Hunt a path traversal involving decoding, separators, symlinks, and naive prefix checks.
- [ ] Review error handling and telemetry for tokens, credentials, personal data, and enumeration clues.

## Apply

- [ ] Harden one RelayDesk vertical slice and document its threats, mitigations, and residual risk.
- [ ] Write a security review checklist tied to actual trust boundaries in React, Node, API, and data layers.
- [ ] Create a secret rotation and compromised-credential response runbook.
- [ ] Triage five hypothetical findings by exploitability, impact, exposure, and fix urgency.
- [ ] Present a ten-minute security review that distinguishes proven controls from assumptions.
