# RelayDesk setup playbook

Use this during RD-101. The goal is a boring, reproducible workspace—not a
week of tooling research.

## Prerequisites

- A maintained Node LTS release.
- npm or one alternative package manager used consistently.
- Git.
- A relational database, preferably isolated for development and tests.
- A container runtime if that is how you will run the database or deployment.

Record versions in the root README or version-manager file. Do not rely on
whatever happens to be installed globally.

## Scaffold sequence

1. Create `relaydesk/` in a workspace you control.
2. Initialize Git and the root package manifest.
3. Configure workspaces for `apps/*` and `packages/*`.
4. Create the API, web, domain, contracts, and test-support packages from the
   topology in `02-PROJECT-BRIEF.md`.
5. Enable strict TypeScript through a shared base configuration.
6. Add package-local `typecheck`, `test`, and `build` scripts.
7. Add root scripts that run formatting, linting, typechecking, tests, and
   builds across the workspace.
8. Commit the lockfile.
9. Add `.env.example`; ignore real environment files.
10. Add one CI workflow that performs a clean install and the root check.

Make a commit after steps 1–4 and another after steps 5–10. The separation
makes scaffold review possible.

## Configuration contract

Create one configuration module that reads environment values once at startup
and returns a typed configuration object. It should:

- begin from untrusted strings;
- validate required values, formats, ranges, and allowed enums;
- use explicit development defaults only where safe;
- fail startup with useful diagnostics for invalid configuration;
- never print secret values;
- be injected into application construction rather than reread everywhere.

Initial values will likely include environment, API port, database URL,
session secret, allowed web origin, log level, and application version.

## Minimum root commands

Choose consistent names so a new engineer does not need to discover each
package separately:

```text
install          install exactly from the lockfile
dev              run API and web development processes
format           write formatting changes
format:check     verify formatting without writes
lint             run static analysis
typecheck        typecheck every workspace
test             run the normal local suite
test:integration run database/HTTP integration tests
test:e2e         run the small browser suite
build            produce deployable builds
check            format:check + lint + typecheck + test + build
```

Exact command syntax depends on the selected tools. The behavioral contract
does not.

## First smoke test

Before domain work begins, prove:

- the API process starts and stops;
- the web process renders a visible application name;
- packages can import through declared workspace dependencies;
- a deliberate type error fails the root typecheck;
- a deliberate test failure makes the root test command non-zero;
- a clean checkout can repeat the setup.

Remove the deliberate failures before committing, but record the checks in the
PR description.

## Safe AI scaffolding prompt

Scaffolding is an appropriate Level-3 task after you own the structure:

```text
Create only the workspace and configuration described below. Do not implement
product features. Explain every generated file, avoid global installs, use
strict TypeScript, add no dependency without naming why it is necessary, and
provide the clean-install/check commands. I will review and run the result.

[paste the selected topology, scripts, and ADR decision]
```

Reject any scaffold that hides the build behind unexplained generated files or
cannot be reproduced from the committed manifest and lockfile.

