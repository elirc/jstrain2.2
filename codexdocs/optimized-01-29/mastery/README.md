# 01–29 mastery banks

Each bank adds thirty exercises to its optimized topic. Combined with the
three exercises in each topic guide, every topic now has thirty-three
exercises—an 11× increase. Across 29 topics this adds 870 new exercises and
creates 957 exercises in the optimized track.

Every problem has four explanations in the
[coaching-note index](../explanations/README.md): why it matters, how to
approach and prove it, the common wrong turn, and a transfer checkpoint.
Attempt the exercise cold before opening its coaching note.

## Six-rung progression

Every bank uses the same learning ladder:

1. **Explain:** retrieve the mental model without code or notes.
2. **Predict:** commit to runtime/output/failure behavior before executing.
3. **Implement:** build a bounded mechanism from a contract.
4. **Test:** create independent evidence and dangerous counterexamples.
5. **Debug/review:** diagnose plausible code and communicate the defect.
6. **Apply:** transfer the mechanism into RelayDesk or equivalent real work.

Each rung has five exercises. Do not complete all thirty in one sitting.
Recommended spacing: rungs 1–2, then 3, then 4–5, then 6 after at least one
night of forgetting.

## Universal proof standard

Every checked exercise requires:

- a prediction, design note, test, diff, diagram, or other inspectable artifact;
- evidence observed before and after the change;
- a two-minute explanation without AI;
- one named limitation or alternative;
- an AI assistance level recorded using `../../05-AI-PROTOCOL.md`.

For implementation exercises, see a relevant test fail before making it pass.
For review exercises, separate confirmed defect, question, tradeoff, and style.
For application exercises, link the commit or PR; a hypothetical answer is
not completion.

## Index

| # | Mastery bank | # | Mastery bank |
| --- | --- | --- | --- |
| 01 | [Language core](01-LANGUAGE-CORE-MASTERY.md) | 16 | [Node CLI tooling](16-NODE-CLI-TOOLING-MASTERY.md) |
| 02 | [Functions and closures](02-FUNCTIONS-AND-CLOSURES-MASTERY.md) | 17 | [Advanced Node async](17-ADVANCED-NODE-ASYNC-MASTERY.md) |
| 03 | [Arrays and objects](03-ARRAYS-AND-OBJECTS-MASTERY.md) | 18 | [Node HTTP APIs](18-NODE-HTTP-APIS-MASTERY.md) |
| 04 | [Strings, regex, collections](04-STRINGS-REGEX-COLLECTIONS-MASTERY.md) | 19 | [Node persistence](19-NODE-PERSISTENCE-MASTERY.md) |
| 05 | [Prototypes and classes](05-PROTOTYPES-AND-CLASSES-MASTERY.md) | 20 | [Testing and quality](20-TESTING-QUALITY-MASTERY.md) |
| 06 | [Errors and robustness](06-ERRORS-AND-ROBUSTNESS-MASTERY.md) | 21 | [Interleaved drills](21-INTERLEAVED-DRILLS-MASTERY.md) |
| 07 | [Async mastery](07-ASYNC-MASTERY-BANK.md) | 22 | [SQL joins](22-SQL-JOINS-MASTERY.md) |
| 08 | [Iterators, generators, modules](08-ITERATORS-GENERATORS-MODULES-MASTERY.md) | 23 | [Node drills](23-NODE-DRILLS-MASTERY.md) |
| 09 | [Data structures](09-DATA-STRUCTURES-MASTERY.md) | 24 | [Debug hunts](24-DEBUG-HUNTS-MASTERY.md) |
| 10 | [Algorithms and patterns](10-ALGORITHMS-PATTERNS-MASTERY.md) | 25 | [Codebase debug hunts](25-CODEBASE-DEBUG-HUNTS-MASTERY.md) |
| 11 | [Functional programming](11-FUNCTIONAL-PROGRAMMING-MASTERY.md) | 26 | [Security hunts](26-SECURITY-HUNTS-MASTERY.md) |
| 12 | [Node fundamentals](12-NODE-FUNDAMENTALS-MASTERY.md) | 27 | [SQL and data](27-SQL-DATA-MASTERY.md) |
| 13 | [DOM and browser](13-DOM-BROWSER-MASTERY.md) | 28 | [API consumer](28-API-CONSUMER-MASTERY.md) |
| 14 | [Design patterns](14-DESIGN-PATTERNS-MASTERY.md) | 29 | [Write the test](29-WRITE-THE-TEST-MASTERY.md) |
| 15 | [Capstones](15-CAPSTONES-MASTERY.md) | | |

Complete Tier-A banks selectively: if you score 4/5 on a rung cold and can
explain all answers, skip to the next rung. Tier-B/C banks are remediation or
specialization, not prerequisites for shipping RelayDesk.
