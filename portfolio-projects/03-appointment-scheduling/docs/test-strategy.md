# Risk-based test strategy

| Largest risk | Evidence |
| --- | --- |
| Last exclusive slot allocated twice | two database connections compete; one active hold survives |
| DST changes the intended instant | gap, repeat-offset, leap-day table tests |
| Failed reschedule destroys original | conflicting replacement throws; original instant/version unchanged |
| Duplicate delivery causes duplicates | hold/booking unique keys and repeated-confirm integration assertion |
| Cross-role/invalid input exposure | permission unit tests and live HTTP denial/validation smoke |

Domain tests are pure. Repository tests use real temporary SQLite files and migrations. Worker tests inject a clock and failing delivery adapter. HTTP tests listen on an ephemeral real port. Gaps: browser accessibility automation, property testing, capacity-resource constraints, upgrade-fixture migrations, and sustained load tooling.
