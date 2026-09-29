# 19 · Persistence — Files, Formats and a Real Database

Everything your program knows dies when the process does, unless you wrote
it down. Writing it down looks trivial — `fs.writeFile`, done — and then
one day a laptop lid closes mid-save and a user's file is zero bytes.
This module builds the ladder that stands between "I called writeFile" and
"the data is still there tomorrow": a format that survives round trips, a
write that cannot be interrupted halfway, a log you can replay after a
crash, and finally the thing that does all of it properly — an embedded
database, which Node ships in the box as `node:sqlite`. By the end you
will know exactly what a database is doing for you, because you will have
built a worse version of each part yourself.

## The mental model

**1 · Durability is layers, not a function call.** Each layer fixes the
failure the one below it has. Skip a layer and you are betting that the
failure never happens.

```
format      →  can I read back what I wrote?      JSON, CSV, JSONL, framing
atomicity   →  can a crash leave half a file?     tmp file + rename
log         →  can I recover the last write?      append-only WAL + replay
database    →  can I stop hand-rolling all this?  node:sqlite
```

**2 · Never write over live data.** `fs.writeFile` truncates the target to
zero and then writes. The gap between those two is where files die. Write
somewhere else and swap the name — a rename inside one directory is a
single filesystem operation, so a reader sees the old file or the new one,
never a mix.

```js
await fs.writeFile(tmp, data);   // the target is still untouched
await fs.rename(tmp, file);      // one step: old contents → new contents
```

**3 · Appending is the cheap, safe write.** You cannot corrupt data you do
not touch. So record what changed instead of rewriting what is: one JSON
value per line, and the newline at the end is the commit marker. A crash
can only cost you the final, incomplete line.

```js
await fs.appendFile(log, JSON.stringify({ op: 'set', key, value }) + '\n');
const state = replay(log);       // state is a projection of the log
```

The price is that the log grows forever and startup means replaying it.
The fix is compaction: snapshot the current state, empty the log, keep
going. Snapshot first, truncate second — the other order loses writes.

**4 · A database is that, plus indexes, plus better manners.** sqlite is a
write-ahead log, a B-tree per index, a query planner and a transaction
manager in one file, tested by a few billion installs. You did not want to
write a B-tree today.

```js
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('app.db');            // or ':memory:'
db.exec('BEGIN'); /* … */ db.exec('COMMIT');      // all or nothing
db.prepare('SELECT * FROM notes WHERE tag = ?').all('work');
```

The moment you find yourself adding a second index to your JSON file, or a
"only one process at a time" rule, or a way to change half a record
atomically — stop. That is the line, and sqlite is on the other side of
it.

## The details that bite

1. **JSON is lossy in silence.** A Date comes back a string, `undefined`
   and functions vanish, `NaN` becomes `null`, and a `Map` serialises to
   `{}` with the data gone.
   `JSON.parse(JSON.stringify({ m: new Map([['a', 1]]) }))` → `{ m: {} }`
2. **`JSON.stringify` returns `undefined`, not text, for what it cannot
   represent.** That is the test for "this key will disappear":
   `JSON.stringify(undefined) === undefined` → `true`
3. **Key order is not content, but it is bytes.** `{a:1,b:2}` and
   `{b:2,a:1}` hash differently. Canonicalise before you fingerprint.
4. **`JSON.parse` on a truncated file throws, and it throws too late** —
   you already lost the data that used to be there. Parse errors are
   recovery events, not validation errors.
5. **A blanket `catch { return null }` turns a permissions bug into "the
   file is empty", and then you overwrite it.** Handle the one code you
   expect: `if (err.code !== 'ENOENT') throw err;`
6. **`split(',')` cannot parse CSV.** A comma inside quotes is data.
   `'"Bond, James",007'.split(',')` → 3 fields, two of them wrong.
7. **`split('\n')` always returns one more piece than there are complete
   lines.** That last piece is `''` after a clean write and a torn record
   after a crash — which is exactly how you detect the crash.
8. **Bytes are not characters.** A length prefix must count bytes:
   `'👋'.length` → `2`, `Buffer.byteLength('👋')` → `4`.
9. **Check-then-act is not a lock.** `if (!exists) create()` loses the
   race. `fs.writeFile(p, data, { flag: 'wx' })` is one atomic
   create-or-fail — and it is the entire lock.
10. **Locks go stale.** A process that crashed still "holds" its lockfile
    forever. Record `{ pid, at }` so a lock older than N ms can be stolen.
11. **`rename` is atomic only within a filesystem.** A temp file in
    `os.tmpdir()` and a target on another drive fails with `EXDEV`. Put
    the temp beside the target.
12. **Atomic is not durable.** `rename` orders your writes; it does not
    force them to the platter. Real durability needs `fsync` on the file
    AND on its directory. Most tools skip it and accept the risk — sqlite
    does not, which is a large part of why it is worth using.
13. **String-concatenated SQL is remote code execution.** `WHERE name =
    '${name}'` with `' OR 1 = 1 --` returns the whole table. Parameters
    are not "escaping done well"; they compile the query *before* the
    value exists, so a value can never become syntax.
14. **`node:sqlite` rows have a null prototype.** `row instanceof Object`
    is `false` and deep-equality against a literal fails. Spread once at
    the boundary: `{ ...row }`.
15. **An UPDATE that matched nothing is a success.** Read `changes` from
    `run()`, or your API cheerfully 200s on a row that does not exist.
16. **`ORDER BY` with ties is not deterministic.** Add a unique
    tiebreaker or your test passes until the day the planner changes its
    mind.
17. **Migrations are append-only.** Editing a shipped migration only
    changes new databases; every existing one already recorded it as done.

## Cheat table

| you want | the call |
| --- | --- |
| append a record | `fs.appendFile(f, JSON.stringify(r) + '\n')` |
| stream a huge file | `createInterface({ input: createReadStream(f) })` |
| write without corrupting | `writeFile(tmp, d)` then `rename(tmp, f)` |
| create-or-fail (lock) | `fs.writeFile(f, d, { flag: 'wx' })` → `EEXIST` |
| empty a file in place | `fs.writeFile(f, '')` / `fs.truncate(f, 0)` |
| hash content | `createHash('sha256').update(d).digest('hex')` |
| bytes of a string | `Buffer.byteLength(s, 'utf8')` |
| 32-bit LE header | `buf.writeUInt32LE(n, 0)` / `buf.readUInt32LE(0)` |
| open a database | `new DatabaseSync(':memory:')` |
| DDL / no rows back | `db.exec('CREATE TABLE …')` |
| insert with values | `db.prepare('… VALUES (?, ?)').run(a, b)` |
| one row / all rows | `stmt.get(id)` → row or undefined, `stmt.all()` → rows |
| rows affected | `stmt.run(…).changes`, new id: `.lastInsertRowid` |
| all-or-nothing | `db.exec('BEGIN')` … `COMMIT`, or `ROLLBACK` on a throw |
| is my index used? | `db.prepare('EXPLAIN QUERY PLAN …').all()` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-json-round-trip.js` | ★☆☆ | what a JSON round trip destroys, and which keys vanish |
| 02 | `02-stable-stringify.js` | ★☆☆ | canonical JSON: sorted keys, so equal content means equal bytes |
| 03 | `03-csv-stringify.js` | ★★☆ | objects → CSV, with the three quoting rules |
| 04 | `04-csv-parse.js` | ★★★ | a real CSV parser: a char-by-char state machine |
| 05 | `05-jsonl-append.js` | ★★☆ | JSON Lines: append records, read them all back |
| 06 | `06-jsonl-stream.js` | ★★☆ | readline over a stream; count and find with early exit |
| 07 | `07-atomic-write.js` | ★★★ | `writeFileAtomic` via tmp + rename, and proving it |
| 08 | `08-json-store.js` | ★★☆ | a JsonStore class: load-on-open, dirty tracking, atomic save |
| 09 | `09-write-ahead-log.js` | ★★★ | append ops, replay them, survive a torn final record |
| 10 | `10-log-compaction.js` | ★★★ | fold the log into a snapshot without losing a write |
| 11 | `11-binary-records.js` | ★★★ | length-prefixed framing, including a half-arrived record |
| 12 | `12-content-store.js` | ★★☆ | sha256 as the filename: fanout dirs and free dedupe |
| 13 | `13-lockfile.js` | ★★★ | an exclusive lock with `wx`, plus stale-lock recovery |
| 14 | `14-sqlite-basics.js` | ★★☆ | `node:sqlite`: schema, prepared inserts, reads |
| 15 | `15-sqlite-params.js` | ★★☆ | UPDATE/DELETE `changes`, and why placeholders exist |
| 16 | `16-sqlite-transactions.js` | ★★★ | `withTransaction`: a transfer that cannot half-apply |
| 17 | `17-sqlite-queries.js` | ★★☆ | GROUP BY, ORDER BY, LIMIT, and an index that gets used |
| 18 | `18-sqlite-migrations.js` | ★★★ | a migration runner that is safe to run on every boot |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time:

```
node exercises/01-json-round-trip.js
```

Every test should say `todo` before you start and `all green — next file!`
when you are done. The `solutions/` copy of each file has the same tests
plus a walkthrough comment explaining why the solution is shaped that way
— read it after your own attempt, not before.

Exercises 05–10, 12 and 13 write real files. They create them under
`19-node-persistence/tmp-test/<uuid>/` and delete them again in a
`finally`, so a failing test never leaves litter behind.

Exercises 14–18 use `node:sqlite`, which is built into Node 22 — no
install, no flag. It prints an `ExperimentalWarning` on stderr the first
time you import it; that is noise, not a problem. Every one of them opens
`':memory:'`, so the tests are fast and touch no disk at all. Change that
string to a path and the identical code has a durable database file.

---

**Stuck?** `cheatsheets/node-advanced.md` (`node:sqlite`, atomic write + lockfile) · **Self-check:** `quizzes/12-node-advanced.md` · **Next:** `bootcamp/20-testing-and-quality`

Builds on `bootcamp/12-node-fundamentals` — the `fs/promises` half of it especially.
