# Threat model and authorization matrix

Assets are tenant tasks, restricted guest projects, membership identities, attachment metadata, audit history, and integration secrets. Trust boundaries are browser→API, API→database, and worker→outbound adapter.

| Threat | Control | Residual risk |
| --- | --- | --- |
| IDOR / cross-tenant query | Session-to-membership join, repository `org_id` predicates, indistinguishable 404, isolation tests | A newly added query could omit policy; code review and contract test are required |
| Guest discovery | Explicit `project_members` check on deep links/search | Field-level guest projection is not yet implemented |
| Lost updates/WIP bypass | Version checks + `BEGIN IMMEDIATE` + deterministic race test | Multi-host PostgreSQL needs row/advisory locks |
| Upload abuse/traversal | Strict filename/type/5 MB/checksum validation; generated object key | Bytes and malware engine are simulated |
| Replay/duplicate delivery | Scoped idempotency and unique dedupe keys | Retention cleanup policy is pending |
| Webhook spoofing | HMAC-SHA256 signature and attempt audit | Demo secret is plaintext in local SQLite |
| SQL injection | Parameterized values; allow-listed sort clauses | `%LIKE%` can be computationally expensive at scale |
| Token theft | Hashed stored tokens, expiry, suspended membership checked per request | Demo bearer tokens are visible and lack rotation |
| Sensitive logs | IDs/action names only; no tokens, descriptions, or webhook bodies | Local operators can read SQLite |

## Authorization

| Action | Owner | Admin | Manager | Contributor | Guest* | Viewer |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| Organization/membership admin | ✓ | ✓ | — | — | — | — |
| Configure project/board | ✓ | ✓ | ✓ | — | — | — |
| Read tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit/move tasks | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Comment/attachment | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Project-visible saved view | ✓ | ✓ | ✓ | — | — | — |

*Guests must also have an explicit grant for the target project. All checks require active organization membership.
