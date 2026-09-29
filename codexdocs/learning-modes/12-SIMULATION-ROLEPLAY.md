# Simulation and role-play mode

Use this mode when realistic context, constraints, and interaction make abstract
engineering work meaningful. It turns solo study into approximations of product
clarification, code review, on-call response, migration planning, and technical
communication.

## Simulation roles

| Role | Responsibility |
| --- | --- |
| Product owner | Supplies outcome, constraints, and changing requirements |
| Implementer | Clarifies, designs, builds, and provides evidence |
| Reviewer | Challenges correctness, scope, compatibility, and maintainability |
| Security reviewer | Traces identity, authorization, input, secrets, and exposure |
| SRE/on-call | Observes symptoms, mitigates impact, gathers evidence, recovers |
| Database reviewer | Checks invariants, migrations, transactions, and plans |
| User/support agent | Describes actual workflow and confusing recovery states |

One person can rotate roles with written prompts or use AI as the counterpart.
Keep a role boundary: the “product owner” should not leak the intended solution.

## Ninety-minute simulation

1. Receive a short ticket with missing details — 5 minutes.
2. Ask and record clarifying questions — 10 minutes.
3. Write acceptance, risks, and implementation plan — 10 minutes.
4. Build the smallest slice — 30 minutes.
5. Receive a changed condition or injected failure — 10 minutes.
6. Review and revise — 15 minutes.
7. Demo and retrospective — 10 minutes.

## Scenario deck

- A customer retries after the server committed but the response was lost.
- A guest discovers a resource ID from another organization.
- A migration runs while old and new application versions overlap.
- An external provider succeeds but times out locally.
- A React search returns older results after a newer request.
- A worker crashes after performing the effect but before recording success.
- A report doubles totals because two child relationships were joined.
- An accessibility user cannot reach or understand the recovery action.

## Adapt a mastery exercise

Wrap the mechanism in a role prompt. For an HTTP exercise, act as API producer,
client consumer, and reviewer. For a debugging task, separate incident commander
from implementer. For a test task, have the “author” defend the implementation
while the reviewer creates a counterexample.

## Adapt a project increment

Run four required simulations during each large project:

1. ambiguous feature and clarification;
2. adversarial authorization review;
3. compatibility/migration rollout;
4. production incident with mitigation and recovery.

Record decisions and observed evidence. The simulation is incomplete if it
ends at discussion rather than a tested code or runbook improvement.

## AI role

Give AI one role, private constraints, and a rule to reveal information only in
response to appropriate questions or evidence. Ask it to remain consistent and
avoid implementation unless playing the implementer. Verify technical claims
outside the role-play afterward.

## Failure signals and correction

- **The scenario becomes theater:** require executable or operational evidence.
- **AI makes every decision:** assign it stakeholder/reviewer, not implementer.
- **Surprise requirements are arbitrary:** tie them to realistic domain risks.
- **No time for reflection:** preserve the retrospective even if scope shrinks.
- **Only emergencies practiced:** include normal review and change negotiation.

## Exit evidence

Keep the original ticket, clarification log, acceptance/risk plan, diff, review,
changed-condition response, verification, and retrospective.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/12-SIMULATION-ROLEPLAY-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
