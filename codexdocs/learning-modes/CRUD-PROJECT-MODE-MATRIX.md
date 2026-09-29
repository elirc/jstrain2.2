# CRUD project mode matrix

Use modes at the increment level. Do not designate an entire project “visual”
or “hands-on”; different risks benefit from different entry and review methods.

## Project routing

| Project | Best motivational entry | Hardest mechanism mode | Review mode | Required simulation |
| --- | --- | --- | --- | --- |
| Inventory/orders | Build-first stock adjustment | Visual transaction timeline | Challenge/debug | Two reservations compete for final unit |
| Project management | Build-first board/task slice | Visual tenant/cache/ordering model | Collaborative | Guest exposure and concurrent WIP move |
| Appointment scheduling | Visual interval/zone model | Example-first recurrence cases | Challenge/debug | DST slot plus last-slot booking race |
| Help desk | Simulation of agent/requester flow | Visual SLA/business-time model | Collaborative | Ingestion backlog and private-note exposure |
| Learning management | Example-first publish snapshot | Visual revision/attempt model | Verbal | Draft changes during active learner attempt |
| Expense approvals | Pattern comparison of workflows | Example-first exact-money allocation | Collaborative | Concurrent approval and duplicate settlement |
| Property maintenance | Simulation across tenant/vendor/manager | Visual visibility/state model | Challenge/debug | Private note/file exposure and slot race |
| E-commerce operations | Outcome-first checkout claim | Visual outbox/payment sequence | Simulation | Lost response and reordered webhooks |

## Phase routing for every project

| Phase | Recommended mode | Prompt | Exit artifact |
| --- | --- | --- | --- |
| Product charter | Outcome-first | What professional claim should this increment prove? | Claim, non-goals, five risks |
| Domain discovery | Pattern/analogy | Which workflows look alike, and where do invariants differ? | Terms, states, counterexamples |
| Data model | Visual | Which rows own truth and which states must be impossible? | ERD, constraints, example rows |
| First slice | Build-first | What is the smallest real user outcome across all layers? | Running vertical behavior |
| New mechanism | Example-first | Which decisions can a small complete example expose? | Annotated/faded/transfer solutions |
| API contract | Reading/reference | What does the protocol/library actually guarantee? | Wire examples and integration tests |
| React workflow | Build-first + Visual | Which async/user states exist and who owns each? | State model and behavior tests |
| Concurrency | Visual + Challenge | What exact interleaving violates the invariant? | Timeline and deterministic race test |
| Authorization | Simulation + Collaborative | Which actor attempts which action on whose resource? | Matrix and negative integration tests |
| Background job | Visual + Challenge | What happens after every crash boundary or duplicate? | Durable state model and recovery tests |
| Migration | Simulation | Which app/schema versions coexist during rollout? | Compatibility matrix and fixture tests |
| Incident | Challenge + Verbal | What is fact, hypothesis, mitigation, cause, and prevention? | Incident report and regression |
| Release | Outcome-first | Can a skeptical engineer reproduce every claim? | README, demo, limitations, defense |

## Example: inventory increment through modes

1. **Outcome-first:** claim that available stock cannot become negative.
2. **Visual:** draw two transactions reading and reserving the last unit.
3. **Example-first:** study a minimal conditional-update transaction and fade it.
4. **Build-first:** implement reservation from UI to database.
5. **Challenge:** force the dangerous interleaving and duplicate retry.
6. **Collaborative:** review authorization, crash points, and compatibility.
7. **Verbal:** defend locking/version choice and scale threshold.
8. **Adaptive:** split these steps across sustainable sessions if needed, then
   perform one independent end-to-end verification.

## Example: React feature through modes

1. Draw initial, loading, empty, success, stale, validation, permission,
   conflict, retryable, and fatal states.
2. Build one user action with server validation and a real repository.
3. Compare a worked cancellation/request-identity example.
4. Force out-of-order responses and a stale version.
5. Review keyboard, focus, announcement, and recovery behavior.
6. Explain state ownership and why duplicated derived state was rejected.

## Completion rule

An increment is not complete because it was experienced through several modes.
It is complete when the selected modes produce the brief's required running,
test, security, compatibility, operational, and explanation evidence.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/CRUD-PROJECT-MODE-MATRIX-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
