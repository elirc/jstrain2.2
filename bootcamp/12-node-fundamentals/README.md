# 12 · Node Fundamentals

The language you already know does not change when you run it in Node. What
changes is what is in the room with it: a file system, a network stack, a
process with arguments and environment variables, an event loop keeping it
all moving. This module is a tour of the standard library you will actually
reach for — `process`, `path`, `fs/promises`, `Buffer`, `URL`, `crypto`,
`events`, `stream`, `zlib`, `http` — with zero dependencies, because every
one of those is already installed. Learn these and most npm packages stop
looking like magic and start looking like conveniences.

## The mental model

**1 · Node = JavaScript + an event loop + system APIs.** Nothing here is new
syntax. It is objects and functions that happen to talk to the operating
system. When you feel lost, the question is always "which module owns this?"

```js
import fs from 'node:fs/promises';   // disk
import path from 'node:path';        // path strings
import http from 'node:http';        // network
// the 'node:' prefix says "standard library", never a package from npm
```

**2 · Almost every system API comes in three flavours, and you want the
promise one.** `fs.readFileSync` blocks the whole process. `fs.readFile(cb)`
is the old callback style. `fs/promises` is what modern code uses.

```js
import { readFileSync } from 'node:fs';          // blocks everything
import fs from 'node:fs/promises';               // ← default choice
const text = await fs.readFile('a.txt', 'utf8'); // top-level await, ESM
```

Sync is fine in a one-shot script before the server starts. Inside a running
server it is a bug: while it blocks, nothing else in the process can run.

**3 · Streams are arrays spread out over time.** An array gives you all the
items at once and costs all the memory at once. A stream hands them over one
piece at a time, so a 4 GB file costs 64 KB of RAM. Same loop, different
keyword.

```js
for (const chunk of ['a', 'b']) { /* array: all of it, now */ }
for await (const chunk of readable) { /* stream: as it arrives */ }
```

Chunk boundaries are arbitrary. They land mid-line, mid-word and mid-
character, so a stream stage either buffers the leftovers itself or corrupts
the data.

**4 · Anything long-lived is an EventEmitter, and it must be closed.** A
server, a socket, a timer and a listener all keep the event loop alive. Node
exits when nothing is pending — so a server you forgot to close is a program
that never ends.

```js
server.close();      // stop listening
clearTimeout(timer); // stop waiting
emitter.off(name, handler); // stop listening (by identity!)
```

## The details that bite

1. **Separators differ per OS.** `path.join` knows which one; string
   concatenation does not.
   `path.join('a', 'b')` → `'a/b'` on Linux, `'a\b'` on Windows.
2. **A dotfile has no extension.** `path.extname('.gitignore')` → `''`, and
   `path.extname('a.tar.gz')` → `'.gz'`, not `'.tar.gz'`.
3. **`startsWith` is not containment.** `'/repo/src-extra'.startsWith('/repo/src')`
   → `true`. Ask `path.relative` instead and check for `'..'`.
4. **fs failures are thrown Errors carrying a `.code`.** Handle the one code
   you expect and rethrow the rest: `if (err.code !== 'ENOENT') throw err;`.
   A bare `catch { return null }` turns a permissions bug into "file looks
   empty" and then overwrites it.
5. **`readFile` without an encoding returns a Buffer.**
   `(await fs.readFile('a.txt')) + ''` works until the first accented letter.
6. **Bytes, characters and `.length` are three numbers.**
   `'👋'.length` → `2`, `[...'👋'].length` → `1`, `Buffer.byteLength('👋')` → `4`.
7. **Decode after you have all the bytes.** Calling `.toString()` on each
   chunk splits multi-byte characters in half; `Buffer.concat(chunks).toString()`
   does not.
8. **An `'error'` event with no listener throws.** `emitter.emit('error', e)`
   on a bare emitter crashes the process — that is by design.
9. **`off()` matches by function identity.** Register `handler`, remove
   `handler`. Register `(...a) => handler(...a)` and you can never remove it.
10. **`req.url` is a path *plus query string*, not a URL.** `'/health?x=1'`
    fails `=== '/health'`; parse it with `new URL(req.url, 'http://127.0.0.1')`.
11. **An absolute path replaces the base.** `new URL('/users', 'https://x.dev/v1/')`
    → `'https://x.dev/users'`; the `/v1` is gone.
12. **`pipe()` leaks on error, `pipeline()` does not.** Use
    `pipeline` from `node:stream/promises` and let it destroy the whole chain.

## Cheat table

| you want | module | the call |
| --- | --- | --- |
| args and env | `process` | `process.argv.slice(2)`, `process.env.PORT` |
| build a path | `node:path` | `path.join`, `path.resolve`, `path.relative` |
| pick a path apart | `node:path` | `path.parse`, `basename`, `extname` |
| read/write files | `node:fs/promises` | `readFile`, `writeFile`, `appendFile` |
| list a directory | `node:fs/promises` | `readdir(dir, { withFileTypes: true })` |
| create directories | `node:fs/promises` | `mkdir(dir, { recursive: true })` |
| bytes ↔ text | `Buffer` (global) | `Buffer.from(s, 'utf8').toString('base64')` |
| parse/build a URL | `URL` (global) | `url.pathname`, `url.searchParams` |
| hash something | `node:crypto` | `createHash('sha256').update(x).digest('hex')` |
| pub/sub in-process | `node:events` | `on`, `once`, `emit`, `off` |
| stream from data | `node:stream` | `Readable.from(iterable)` |
| wire streams up | `node:stream/promises` | `await pipeline(a, b, c)` |
| compress | `node:zlib` | `promisify(gzip)`, `promisify(gunzip)` |
| serve http | `node:http` | `createServer(handler).listen(0, '127.0.0.1')` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-env-config.js` | ★☆☆ | read env vars with defaults, types and validation |
| 02 | `02-parse-argv.js` | ★★★ | a real CLI arg parser → `{ flags, positionals }` |
| 03 | `03-path-basics.js` | ★☆☆ | join, basename, stem and extension drills |
| 04 | `04-path-parse.js` | ★★☆ | swap extensions, relative paths, `isInside` containment |
| 05 | `05-fs-text.js` | ★☆☆ | read, write, append and split a text file |
| 06 | `06-fs-json-db.js` | ★★☆ | a JSON file as a tiny database: read-modify-write |
| 07 | `07-fs-dirs.js` | ★★☆ | `pathExists`, recursive `mkdir`, list by extension |
| 08 | `08-fs-walk.js` | ★★★ | walk a whole tree, collecting files and tallying types |
| 09 | `09-fs-copy-tree.js` | ★★★ | copy a directory tree by hand, structure intact |
| 10 | `10-buffer-encodings.js` | ★☆☆ | utf8 ↔ base64 ↔ hex round trips |
| 11 | `11-buffer-bytes.js` | ★★☆ | bytes vs characters; truncate without splitting an emoji |
| 12 | `12-url-parse.js` | ★★☆ | pull a URL apart; query strings with repeated keys |
| 13 | `13-build-url.js` | ★★☆ | `buildUrl(base, path, params)` and merging query params |
| 14 | `14-crypto-hash.js` | ★★☆ | sha256 fingerprints, content comparison, uuid shape |
| 15 | `15-event-emitter.js` | ★☆☆ | subscribe, collect, once, and the unsubscribe habit |
| 16 | `16-event-promise.js` | ★★☆ | `waitForEvent` with a timeout + a typed bus wrapper |
| 17 | `17-stream-collect.js` | ★★☆ | `Readable.from`, collecting a stream to text safely |
| 18 | `18-transform-upper.js` | ★★★ | an uppercasing Transform, wired with `pipeline()` |
| 19 | `19-line-splitter.js` | ★★★ | chunks in, whole lines out — the one everyone gets wrong |
| 20 | `20-zlib-gzip.js` | ★★☆ | gzip/gunzip round trip via `promisify` |
| 21 | `21-http-server.js` | ★★★ | a two-route JSON server, started on an ephemeral port |
| 22 | `22-json-api.js` | ★★★ | a notes API routed by method + path, with request bodies |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time:

```
node exercises/01-env-config.js
```

Every test should say `todo` before you start and `all green — next file!`
when you are done. The `solutions/` copy of each file has the same tests
plus a walkthrough comment explaining why the solution is shaped that way —
read it after your own attempt, not before.

Exercises 05–09 write real files. They create them under
`12-node-fundamentals/tmp-test/<uuid>/` and delete them again in a `finally`,
so a failing test never leaves litter behind.

### Extra reps

Sixteen more of the same, one layer deeper. Reach for these when a topic
above did not stick, or when you want the harder version of it — nothing
here needs a module you have not already met.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 23 | `23-fs-rm-filter.js` | ★★☆ | delete only the files a predicate picks, then prune the empty dirs |
| 24 | `24-fs-dir-diff.js` | ★★★ | diff two trees into added / removed / changed by size + mtime |
| 25 | `25-fs-du-report.js` | ★★☆ | a `du`-style byte total per directory, plus human-readable sizes |
| 26 | `26-glob-lite.js` | ★★★ | compile `*`, `?` and `**` to a RegExp and match walked paths |
| 27 | `27-binary-header.js` | ★★☆ | read and write a fixed binary header: magic, version, length |
| 28 | `28-hmac-sign.js` | ★★☆ | HMAC-sign a message and verify it without leaking timing |
| 29 | `29-timing-safe.js` | ★☆☆ | constant-time comparison that survives unequal lengths |
| 30 | `30-scrypt-password.js` | ★★★ | scrypt password hashing with a per-user salt, and verify |
| 31 | `31-url-resolve.js` | ★☆☆ | resolve relative references against a base URL |
| 32 | `32-url-template.js` | ★★☆ | fill `{id}` templates with encoding, then expand to a full URL |
| 33 | `33-stream-counter.js` | ★★☆ | a pass-through Transform that counts bytes and lines |
| 34 | `34-stream-tee.js` | ★★★ | tee one stream into two, backpressure and errors included |
| 35 | `35-zlib-file.js` | ★★☆ | stream a file to `.gz` and back with `pipeline` |
| 36 | `36-machine-report.js` | ★☆☆ | a machine report over an injected `os` facade |
| 37 | `37-sigint-shutdown.js` | ★★★ | graceful SIGINT shutdown: run-once cleanup, then exit |
| 38 | `38-env-cascade.js` | ★★☆ | `.env` + `.env.local` + real env, merged and type-checked |

Exercises 23–26, 35 and 38 write real files, under the same
`tmp-test/<uuid>/` directory and with the same `finally` cleanup as 05–09.

---

**Stuck?** `cheatsheets/node-api.md` (`fs/promises`, `path`, `process`, the CJS↔ESM table) · **Deep dive:** `guides/06-how-node-actually-runs-your-code.md` + `guides/05-http-from-first-principles.md` · **Self-check:** `quizzes/08-node-and-web.md` · **Next:** `bootcamp/13-dom-and-browser`

Going deeper? Modules 16–20 continue the Node arc: CLIs (16), async internals (17), a toy Express (18), persistence (19), testing (20) — see FLIGHTPLAN-NODE-TS.md.
