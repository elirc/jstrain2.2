# Existing material map

This map extracts the highest-transfer material from the current repository.
Do not complete every file by default. Use the smallest set that repairs a
demonstrated project weakness.

## JavaScript and runtime behavior

| Need | Start here | Return to the project when |
| --- | --- | --- |
| Coercion and defaults | `bootcamp/01-language-core` exercises 03–11, 21–23, 29–35 | You can predict the edge cases before running them |
| Closures and function boundaries | `bootcamp/02-functions-and-closures` exercises 06–21, 24–26, 40 | You can build and test one stateful closure |
| Data transformation | `bootcamp/03-arrays-and-objects` exercises 05–15, 31–35, 39–48 | You can express the project query without mutation confusion |
| Error modeling | `bootcamp/06-errors-and-robustness` exercises 01–10, 14–17, 26, 29 | Expected and unexpected failures have distinct paths |
| Async behavior | `bootcamp/07-async-mastery` exercises 01–03, 10–28, 35, 41–45, 50–52 | You can explain ordering, cancellation, and concurrency limits |

## TypeScript

| Need | Start here | Initially skip |
| --- | --- | --- |
| Everyday types | `tsbootcamp/01-types-and-annotations` | Enum trivia unless encountered |
| Boundary safety | `tsbootcamp/02-narrowing` | Nothing; this module is high value |
| Reusable APIs | `tsbootcamp/03-generics` exercises 01–15 | Variance and const type parameters until needed |
| Object transformations | `tsbootcamp/04-utility-and-mapped-types` exercises 01–10 | Puzzle-like recursive extensions |
| Job-shaped typing | `tsbootcamp/06-typing-real-code` exercises 01–13 | Harness/module-augmentation work unless relevant |
| Plausible type lies | `tsbootcamp/08-debug-hunts` | Nothing; use as review practice |

Do not prioritize `tsbootcamp/05-conditional-types-and-infer` before you can
comfortably model the RelayDesk domain and its boundaries. Advanced types are
useful, but they are not the bottleneck for ordinary product delivery.

## Node, HTTP, data, and testing

| Project problem | Existing module |
| --- | --- |
| HTTP mechanics | `bootcamp/12-node-fundamentals` exercises 12–22 and 28–30 |
| Middleware and API structure | `bootcamp/18-node-http-apis` exercises 01–14 and 18–20 |
| Persistence mechanics | `bootcamp/19-node-persistence` exercises 07–10 and 14–18 |
| SQL correctness | `bootcamp/22-sql-joins` and `bootcamp/27-sql-data` |
| External APIs | `bootcamp/28-api-consumer` |
| Test design | `bootcamp/20-testing-and-quality` exercises 01–09 and 12–16 |
| Writing the missing test | `bootcamp/29-write-the-test` |

## React

Use `jstrain` selectively and run one test file at a time:

```bash
cd jstrain
npx vitest run tests/react/01-components-and-props.test.tsx
npx vitest run tests/react/02-state-and-events.test.tsx
npx vitest run tests/react/03-effects-and-data.test.tsx
npx vitest run tests/react/04-hooks.test.tsx
npx vitest run tests/react/05-context-and-composition.test.tsx
npx vitest run tests/react/06-building-a-feature.test.tsx
```

Recommended routing:

- Markup and props: React 01.
- Forms and immutable updates: React 02.
- Network state, cancellation, and response races: React 03.
- Reducers, refs, custom hooks, and performance: React 04.
- Shared state and composition: React 05.
- Feature integration: React 06 and the two capstones.

## Debugging and security

These are the highest-value reinforcement modules in the repository:

1. `bootcamp/24-debug-hunts`
2. `bootcamp/25-codebase-debug-hunts`
3. `bootcamp/26-security-hunts`
4. `tsbootcamp/08-debug-hunts`
5. `bootcamp/29-write-the-test`

Do two hunts per week. Before changing code, name the suspected bug class and
the observation that would disprove it.

## Reference reading

- `guides/01-the-event-loop-all-the-way-down.md`
- `guides/05-http-from-first-principles.md`
- `guides/06-how-node-actually-runs-your-code.md`
- `guides/07-working-with-ai.md`
- `guides/08-react-bug-classes.md`
- `cheatsheets/typescript.md`
- `cheatsheets/node-api.md`
- `cheatsheets/patterns-swe.md`
- `cheatsheets/interview-behavioral.md`

The test for useful reading is a changed decision or a successful explanation.
If a document produces neither, stop reading and build.

