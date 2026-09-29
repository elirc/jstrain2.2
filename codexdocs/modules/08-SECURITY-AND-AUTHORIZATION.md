# Module 08 — Security and authorization

Pair with: RelayDesk increment 7 and every data-returning feature.

## Why this matters

Security is system behavior under an adversarial input or caller. It cannot be
added by a final checklist because trust boundaries, ownership, output, logs,
and dependency choices are embedded in every feature.

Start with assets, actors, entry points, and abuse cases. Then select controls
and tests that fail closed.

## Authentication and authorization are different

- Authentication establishes an identity with a level of confidence.
- Authorization evaluates identity, action, resource, ownership, workspace,
  and current state.

A valid session does not authorize every ticket. A role in a client body does
not establish privilege. Resource ownership must come from trusted data.

## Validate, constrain, and encode at the correct boundary

- Parse input into an accepted structure.
- Parameterize SQL so data cannot become query syntax.
- Use framework output escaping for text in HTML contexts.
- Validate redirect destinations and filesystem containment.
- Limit sizes and complexity before expensive processing.

“Sanitize input” is too vague. The safe transformation depends on the sink and
context.

## Deny by default and test absence

Authorization code often fails through missing values that compare equal,
routes that forgot middleware, cache keys without user context, or response
mappers that include internal fields. Negative tests should prove forbidden
data is absent from status, body, headers, logs, and caches.

## Secrets have a lifecycle

Secrets need unpredictable generation, safe storage/transport, rotation,
redaction, expiration, and revocation. Hash passwords with a password-specific
algorithm; do not encrypt or fast-hash them for later comparison.

## Common failure patterns

- IDOR: loading by resource ID without an ownership/workspace policy.
- Mass assignment from request body into entity.
- SQL injection through interpolated values or dynamic sort fields.
- Stored/reflected XSS through unsafe HTML escape hatches.
- CSRF check where missing expected and supplied tokens compare equal.
- Session fixation, predictable token, missing revocation, or insecure cookie.
- Secret or private content in logs.
- Authorization-blind caches.
- Catastrophic regex/backtracking on unbounded input.

## Exercise 1 — threat model one flow (core)

Threat-model “requester opens ticket detail.”

Constraints:

- Identify assets, actors, entry points, trust boundaries, and abuse cases.
- Include cross-workspace IDs, internal comments, cached responses, logs, and
  browser rendering.
- Rank by likelihood and impact; do not give every threat equal priority.

Proof: data-flow diagram and top-five risk table with controls/evidence.

Debrief: which risk crossed more than one application layer?

AI level: 1 after your first model.

## Exercise 2 — authorization matrix (core)

Create role × resource ownership × action expectations for requester, agent,
and administrator across read, comment, internal comment, assign, transition,
and user management.

Constraints:

- Include unauthenticated, disabled, cross-workspace, missing resource, and
  stale-role cases.
- Decide whether denied reads mask existence.
- Policy implementation is centralized and domain-testable.

Proof: matrix-driven domain and HTTP negative tests.

Debrief: which decisions are product policy rather than universal security
rules?

AI level: 1.

## Exercise 3 — IDOR hunt (applied)

Create a route that authenticates correctly but loads a ticket only by URL ID.
Demonstrate cross-requester or cross-workspace access and fix it.

Constraints:

- Do not trust body/query ownership fields.
- Test a direct HTTP request, not only hidden UI controls.
- Verify internal comments remain absent.
- Review logs and cache behavior too.

Proof: exploit-style failing test and policy/repository correction.

Debrief: why does “all routes require login” fail as an authorization
argument?

AI level: 2, diagnosis only.

## Exercise 4 — mass-assignment and output leak (applied)

Submit a create/update body containing status, requester ID, workspace ID,
version, role, and an unknown internal field. Separately inspect responses for
persistence-only fields.

Constraints:

- Accepted command fields are explicitly selected.
- Unknown-field policy is documented.
- Transport mapping explicitly selects response fields.
- Tests prove forbidden keys have no effect and are not returned.

Proof: HTTP tests plus before/after stored records.

Debrief: why can a permissive object spread create both write and read
vulnerabilities?

AI level: 1.

## Exercise 5 — session and CSRF design (review)

Design a browser session for RelayDesk, including cookie attributes, session
storage, expiry, renewal, logout/revocation, password verification, brute-force
controls, and CSRF protection where relevant.

Constraints:

- Threats and controls are connected explicitly.
- Missing expected security state fails closed.
- Secrets are redacted from logs.
- Development convenience does not silently become production behavior.

Proof: sequence diagram, security tests, and ADR.

Debrief: how would the design differ for bearer tokens used by a non-browser
client?

AI level: 2 after your first design.

## Exercise 6 — dependency and log review (review)

Audit direct runtime/development dependencies and capture structured logs for
successful login, failed login, forbidden ticket, validation failure,
unexpected exception, and webhook delivery.

Constraints:

- For each dependency, record purpose, maintenance signal, transitive risk,
  and removal cost.
- Search logs for secrets, credentials, private comments, and raw payloads.
- Do not apply forced breaking upgrades without testing/migration review.

Proof: dependency decision list, audit result, redaction tests, and upgrade
plan for actionable findings.

Debrief: why are development-server vulnerabilities still relevant even if
the dev server is not deployed as production?

AI level: 2; verify with authoritative advisories/tool output.

## Project transfer

Apply the threat model before RD-701, then use the matrix as executable input
for RD-702–704. Repeat focused threat modeling for bulk assignment and webhook
features rather than trusting the initial review forever.

