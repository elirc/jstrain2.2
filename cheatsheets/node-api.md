# Node.js standard library

Modules, fs, path, process, url, crypto, events, streams, http — verified on Node **v22.16.0**, Windows.

## Top of mind

| Question | Answer |
| --- | --- |
| `__dirname` in ESM? | `import.meta.dirname` (Node ≥20.11). Fallback: `fileURLToPath(import.meta.url)` |
| `readFile` gave me a Buffer | Pass the encoding: `readFile(p, 'utf8')` |
| Make/remove a directory tree | `mkdir(p, { recursive: true })` · `rm(p, { recursive: true, force: true })` |
| Am I the entry script? | CJS: `require.main === module`. ESM: compare `import.meta.url` to `pathToFileURL(process.argv[1]).href` — **`import.meta.main` does not exist in 22.16** |
| Read env from a file, no deps | `node --env-file=.env app.js` |
| Is `fetch` global? | Yes. So are `AbortController`, `structuredClone`, `Blob`, `FormData`, `WebSocket`, `crypto` |

---

## Module systems

| Topic | CommonJS | ESM |
| --- | --- | --- |
| Import | `const fs = require('node:fs')` | `import fs from 'node:fs'` |
| Named import | `const { join } = require('node:path')` | `import { join } from 'node:path'` |
| Export | `module.exports = x` · `exports.y = y` | `export const y = …` · `export default x` |
| File extension | `.cjs`, or `.js` with no `"type"` / `"type":"commonjs"` | `.mjs`, or `.js` with `"type":"module"` in the nearest `package.json` |
| Dir of current file | `__dirname` | `import.meta.dirname` |
| Path of current file | `__filename` | `import.meta.filename` |
| URL of current file | `pathToFileURL(__filename).href` | `import.meta.url` (`file:///C:/…`) |
| Portable fallback | — | `fileURLToPath(import.meta.url)` — works on every Node that has ESM |
| Resolve a specifier | `require.resolve('pkg')` | `import.meta.resolve('pkg')` → a `file://` URL string |
| `require` from the other side | native | `const require = createRequire(import.meta.url)` (`node:module`) |
| Load the other format | `require('./x.mjs')` **works in 22.16** unless the graph has top-level `await` (→ `ERR_REQUIRE_ASYNC_MODULE`) | `import x from './y.cjs'` — `x` is the whole `module.exports`; named exports are best-effort static analysis |
| Dynamic import | `await import('./x.mjs')` (returns a promise, fine in CJS) | `await import(specifier)` — the only way to import a computed path |
| Top-level `await` | not allowed | allowed; importers wait for it |
| JSON | `require('./data.json')` — just works | `import cfg from './data.json' with { type: 'json' }` — the value is on `.default` |
| Bindings | **snapshot copy** — `const {n} = require(m)` never updates | **live bindings** — imported `let` reflects later changes in the exporter |
| Circular deps | you get a **partial** `module.exports` (often `undefined`), plus a runtime warning | hoisted, but *using* a binding before its module ran throws `ReferenceError: Cannot access 'x' before initialization` |
| "Am I main?" | `if (require.main === module) main()` | `if (import.meta.url === pathToFileURL(process.argv[1]).href) main()` |
| Loading | synchronous, cached in `require.cache` | asynchronous, resolved+linked before any code runs |

```js
import { pathToFileURL } from 'node:url';
export const isMain = import.meta.url === pathToFileURL(process.argv[1]).href;
// node lib.mjs => true   ·   imported from app.mjs => false
```

**Gotcha.** Always prefix core modules with `node:` (`node:fs`, not `fs`). It is
unambiguous, unshadowable by an npm package, and required for `node:test`.

---

## node:fs/promises

`import fs from 'node:fs/promises'` — every function returns a promise. The sync
variants live on `node:fs` with a `Sync` suffix; the callback variants on `node:fs`.

| Function | Does | One-liner |
| --- | --- | --- |
| `readFile(p, enc?)` | whole file into memory | `await fs.readFile('a.txt', 'utf8')` → `'hello\n'` |
| `writeFile(p, data, opts?)` | create/truncate then write | `await fs.writeFile('a.txt', 'hello\n')` |
| `appendFile(p, data)` | write at the end, creating if needed | `await fs.appendFile('log.txt', line + '\n')` |
| `readdir(p, opts?)` | list names in a directory | `await fs.readdir('.')` → `['a.txt', 'nested']` |
| `readdir(p, {withFileTypes:true})` | `Dirent[]` with `.name`, `.isFile()`, `.isDirectory()`, `.parentPath` | avoids an extra `stat` per entry |
| `readdir(p, {recursive:true})` | walk subdirectories, returns relative paths | cheap directory walk, no library |
| `mkdir(p, {recursive:true})` | create the whole chain, no error if it exists | `await fs.mkdir('a/b/c', { recursive: true })` |
| `rm(p, {recursive:true, force:true})` | delete file or tree; `force` ignores ENOENT | the modern `rimraf` |
| `rename(from, to)` | move/rename (same volume only) | `await fs.rename('b.txt', 'c.txt')` |
| `copyFile(src, dst, mode?)` | copy one file | `fs.constants.COPYFILE_EXCL` fails if `dst` exists |
| `cp(src, dst, {recursive:true})` | copy a tree | Node ≥16.7 |
| `stat(p)` | size, times, type | `(await fs.stat(f)).size` → `18`; `.isFile()`, `.mtime` is a `Date` |
| `access(p, mode?)` | resolves (with `undefined`) if permitted, rejects otherwise | `await fs.access(f, fs.constants.R_OK)` |
| `open(p, flags)` | `FileHandle` for partial/positional I/O | `const fh = await fs.open(f,'r'); …; await fh.close()` |
| `mkdtemp(prefix)` | unique temp directory | `await fs.mkdtemp(path.join(os.tmpdir(), 'app-'))` |
| `realpath` / `readlink` | resolve symlinks | |

**Encoding.** No encoding argument → you get a `Buffer`. `readFile(f)` returns
`<Buffer 68 65 …>`; `readFile(f, 'utf8')` returns a string. Same for `readdir` outputs.

**`existsSync` caveat.** `fs.existsSync(p)` is fine for a startup sanity check, but as a
guard before opening it is a TOCTOU race — the file can vanish between the check and the
open. Just do the operation and catch: `catch (e) { if (e.code === 'ENOENT') … }`.
There is deliberately no promise-based `fs.exists`.

**`fs.constants`.** `R_OK` `4`, `W_OK` `2`, `X_OK` `1`, `F_OK` `0` (exists), plus
`COPYFILE_EXCL`, `O_RDONLY`, `O_CREAT`, `O_EXCL`. Errors carry a `.code`: `ENOENT`,
`EEXIST`, `EACCES`, `EPERM`, `EISDIR`, `ENOTEMPTY`.

---

## node:path

Pure string manipulation — it never touches the disk.

| Member | Does | On this Windows box |
| --- | --- | --- |
| `join(...parts)` | join with `sep`, then normalize `.`/`..` | `join('a','b','..','c.txt')` → `'a\\c.txt'` |
| `resolve(...parts)` | absolutize against `cwd()`, right to left | `resolve('src','index.js')` → `'C:\\…\\jstrain2.2\\src\\index.js'` |
| `normalize(p)` | collapse `..`, `.`, duplicate separators | `normalize('src/a/../b/c.js')` → `'src\\b\\c.js'` |
| `basename(p, ext?)` | last segment, optional suffix strip | `basename('C:\\a\\b\\c.txt', '.txt')` → `'c'` |
| `dirname(p)` | everything but the last segment | → `'C:\\a\\b'` |
| `extname(p)` | last `.` onward | `'archive.tar.gz'` → `'.gz'`; `'README'` → `''` |
| `parse(p)` | `{root, dir, base, ext, name}` | `{root:'C:\\', dir:'C:\\a\\b', base:'c.txt', ext:'.txt', name:'c'}` |
| `format(obj)` | inverse of `parse` | `format({dir:'C:\\a', name:'c', ext:'.txt'})` → `'C:\\a\\c.txt'` |
| `relative(from, to)` | how to get from one to the other | `relative('C:\\a\\b','C:\\a\\d\\e')` → `'..\\d\\e'` |
| `isAbsolute(p)` | rooted? | `'C:\\a'` → `true`, `'/a'` → `true`, `'a'` → `false` |
| `sep` | platform separator | `'\\'` here, `'/'` on posix |
| `delimiter` | `PATH` list separator | `';'` here, `':'` on posix |
| `path.posix.*` | force forward-slash rules | `posix.join('a','b','..','c.txt')` → `'a/c.txt'` |
| `path.win32.*` | force backslash rules anywhere | useful in cross-platform tests |

**Windows note.** `path.join` **normalizes forward slashes to `\`**:
`join('src/utils','fmt.js')` → `'src\\utils\\fmt.js'`. So never string-compare a
path you built with a hard-coded `'src/utils/fmt.js'` — compare with `path.join`
on both sides, or normalize with `p.split(path.sep).join('/')`. Node accepts `/`
as input on Windows everywhere; it just hands `\` back. For URLs and glob patterns,
keep `/` — use `path.posix.join`.

---

## process

| Member | Does | Notes |
| --- | --- | --- |
| `process.argv` | `[execPath, scriptPath, ...userArgs]` | your args are `process.argv.slice(2)` |
| `process.env.NAME` | environment variable | always a **string** or `undefined`; `'false'` is truthy |
| `process.cwd()` | working directory of the process | **not** the script's directory — that's `import.meta.dirname` |
| `process.chdir(p)` | change it | not available in worker threads |
| `process.exit(code)` | kill immediately | **truncates pending stdout writes and skips pending work** |
| `process.exitCode = n` | set the code, exit naturally | prefer this over `exit()` |
| `process.platform` | `'win32'` \| `'darwin'` \| `'linux'` | `'win32'` even on 64-bit Windows |
| `process.arch` | `'x64'`, `'arm64'` | |
| `process.version` | `'v22.16.0'` | string, with the `v` |
| `process.versions` | `{node, v8, uv, openssl, …}` | `versions.v8` → `'12.4.254.21-node.26'` |
| `process.pid` / `ppid` | numbers | |
| `process.uptime()` | seconds since start, float | |
| `process.memoryUsage()` | `{rss, heapTotal, heapUsed, external, arrayBuffers}` | bytes; divide by `1024**2` for MB |
| `process.hrtime.bigint()` | monotonic nanoseconds as `BigInt` | for benchmarks; `Date.now()` can jump |
| `process.on('exit', cb)` | last chance before exit; `cb(code)` | **synchronous only** — async work here never runs |
| `process.on('uncaughtException', cb)` | catches sync throws that escaped | log and exit; state is untrustworthy |
| `process.on('unhandledRejection', cb)` | catches promise rejections with no handler | without it, Node ≥15 **crashes** with exit code `1` |
| `process.on('SIGINT', cb)` | Ctrl+C — close servers, then `process.exit(0)` | `SIGTERM` too on POSIX; Windows signal support is partial |
| `process.stdout.write(s)` | write with no trailing newline | returns `false` under backpressure |
| `process.stdout.isTTY` | `true` only when attached to a terminal | gate colour output on it |
| `process.stdin` | a readable stream | `for await (const chunk of process.stdin)` to read piped input |
| `process.nextTick(cb)` | queue ahead of promise microtasks | see [promises-async.md](promises-async.md) |
| `process.execPath` | absolute path to this `node.exe` | use it to spawn a child Node |

```js
process.exitCode = 3;             // process finishes normally, shell sees 3
process.on('exit', c => console.log('bye', c));
```

---

## node:url · URL · URLSearchParams

`URL` and `URLSearchParams` are globals — you only need `node:url` for the file-path helpers.

| Expression | Result |
| --- | --- |
| `const u = new URL('https://ex.com:8443/a/b?q=cats&n=1&n=2#f')` | WHATWG URL object |
| `u.protocol` / `u.hostname` / `u.port` | `'https:'` (with colon) / `'ex.com'` / `'8443'` (string) |
| `u.host` / `u.origin` | `'ex.com:8443'` / `'https://ex.com:8443'` |
| `u.pathname` / `u.search` / `u.hash` | `'/a/b'` / `'?q=cats&n=1&n=2'` / `'#f'` (leading `?`/`#` included) |
| `u.searchParams.get('n')` | `'1'` — the **first** value only |
| `u.searchParams.getAll('n')` | `['1','2']` |
| `u.searchParams.has(k)` / `.set(k,v)` / `.append(k,v)` / `.delete(k, v?)` | `set` replaces all, `append` adds, `delete(k,v)` removes one pair |
| `u.searchParams.toString()` | `'q=dogs+%26+cats&n=2&n=3'` — encodes for you |
| `[...u.searchParams]` | `[['q','dogs & cats'], ['n','2'], ['n','3']]` (decoded) |
| `new URL('../x?y=1', 'https://ex.com/a/b/c')` | `'https://ex.com/a/x?y=1'` — relative resolution |
| `new URL('/root', 'https://ex.com/a/b/c')` | `'https://ex.com/root'` |
| `new URL('nope')` | **throws** `TypeError`, `code: 'ERR_INVALID_URL'` |
| `URL.canParse(s)` | `false` / `true` — check without try/catch |
| `URL.parse(s)` | the URL or `null` (Node ≥22.1) |
| `new URLSearchParams({a:1, b:'x y'}).toString()` | `'a=1&b=x+y'` |
| `fileURLToPath(import.meta.url)` | `'C:\\…\\app.mjs'` — never slice `file://` by hand |
| `pathToFileURL('C:\\a b\\c.txt').href` | `'file:///C:/a%20b/c.txt'` |

**Gotcha.** Mutating `u.searchParams` mutates `u` — `u.href` updates. And
`searchParams` encodes spaces as `+` in the query (form encoding), while
`encodeURIComponent` uses `%20`. Both decode correctly.

---

## node:crypto

| Call | Does |
| --- | --- |
| `crypto.randomUUID()` | RFC 4122 v4 UUID, 36 chars: `'09ee8f14-38c8-4ffb-bfde-bb9e9591be28'` |
| `crypto.randomBytes(n)` | `Buffer` of CSPRNG bytes; `.toString('hex')` gives `2n` chars |
| `crypto.randomInt(min, max)` | unbiased integer in `[min, max)` |
| `crypto.createHash('sha256').update(x).digest('hex')` | 64 hex chars — `'hello'` → `2cf24dba…938b9824` |
| `…digest('base64url')` | `'LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ'` — URL-safe, no padding |
| `crypto.createHmac('sha256', key).update(msg).digest('hex')` | keyed MAC, 64 hex chars — webhook signatures |
| `crypto.timingSafeEqual(bufA, bufB)` | constant-time compare; **throws** `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH` if lengths differ |
| `crypto.scryptSync(pw, salt, 32)` | memory-hard password KDF → 32-byte `Buffer` (64 hex chars) |
| `crypto.pbkdf2Sync(pw, salt, 100_000, 32, 'sha256')` | iteration-based KDF; use a high, tuned iteration count |
| `crypto.getHashes()` | 52 algorithm names available here, incl. `'sha256'`, `'sha512'`, `'md5'` |
| `globalThis.crypto.subtle` | Web Crypto (`digest`, `sign`, `encrypt`) — async, promise-based |

**Never** store `sha256(password)`. Fast hashes are built to be fast, which is exactly
what an attacker wants. Use `scrypt`/`pbkdf2` (or bcrypt/argon2 from npm) with a
**per-user random salt**, and compare with `timingSafeEqual`, never `===`.

```js
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 32);   // store salt + hash together
```

`createHash` objects are single-use: `update()` as many times as you like, then one
`digest()`. Calling `update` after `digest` throws.

---

## node:events

`EventEmitter` is the backbone of streams, servers, and child processes.

| Call | Does |
| --- | --- |
| `e.on(name, fn)` | subscribe; returns `e` so you can chain |
| `e.once(name, fn)` | subscribe, auto-remove after the first emit |
| `e.off(name, fn)` (= `removeListener`) | unsubscribe — must be the **same function reference** |
| `e.emit(name, ...args)` | call every listener **synchronously**, in registration order. Returns `true` if there was at least one listener |
| `e.prependListener(name, fn)` | insert at the front of the queue |
| `e.listenerCount(name)` / `e.eventNames()` | introspection |
| `e.removeAllListeners(name?)` | nuke one event's listeners, or all of them |
| `e.setMaxListeners(n)` / `EventEmitter.defaultMaxListeners` | default is `10` |
| `await once(emitter, 'ready')` | from `node:events` — resolves with the **array** of emitted args: `['payload']` |
| `on(emitter, 'data')` | async iterator over every emission |

**The `error` event is special.** `emit('error', err)` with no `'error'` listener
**throws** the error (crashing the process if nothing catches it). Always attach an
`error` handler to emitters you own.

**Max listeners warning.** The 11th listener for the same event name prints
`MaxListenersExceededWarning: Possible EventEmitter memory leak detected`. It is a
warning, not an error — usually it means you're subscribing in a loop without
unsubscribing. Raise the cap only when you genuinely need more.

**Gotcha.** `emit` is synchronous, so a listener that throws propagates straight back
into whoever called `emit`. And an `async` listener's rejection is invisible to `emit` —
handle errors inside the listener.

---

## Streams essentials

| Type | Direction | Examples |
| --- | --- | --- |
| `Readable` | source | `fs.createReadStream`, `process.stdin`, `res` in an http client |
| `Writable` | sink | `fs.createWriteStream`, `process.stdout`, `res` in an http server |
| `Duplex` | both, independent | `net.Socket` |
| `Transform` | Duplex where output is a function of input | `zlib.createGzip()`, `crypto.createHash()` |

| Call | Does |
| --- | --- |
| `createReadStream(p, {encoding, start, end})` | chunked read — constant memory on huge files |
| `createWriteStream(p, {flags:'a'})` | chunked write; `'a'` appends |
| `for await (const chunk of readable)` | consume a readable; each `chunk` is a `Buffer` unless you set an encoding |
| `await pipeline(a, b, c)` | from `node:stream/promises` — wires them up, propagates errors, destroys everything on failure |
| `Readable.from(iterable)` | build a stream from an array / generator / async generator |
| `await readable.toArray()` | drain to an array (small streams only) |
| `readable.map(fn)` / `.filter(fn)` / `.take(n)` | lazy stream operators, async-callback friendly |
| `writable.write(chunk)` | returns `false` when the internal buffer is full |
| `writable.end(chunk?)` | finish; emits `'finish'` |

**Backpressure in one sentence.** `write()` returning `false` means "stop pushing until I
emit `'drain'`" — `pipeline` (and `pipe`) honour that for you, which is why you should
almost never wire streams together by hand.

```js
import { pipeline } from 'node:stream/promises';
await pipeline(createReadStream('in.txt'), createGzip(), createWriteStream('in.txt.gz'));
```

### Read a file line by line

```js
import readline from 'node:readline';
const rl = readline.createInterface({ input: createReadStream('lines.txt'), crlfDelay: Infinity });
for await (const line of rl) console.log(line);   // logs: alpha / beta / gamma (no '\n')
```

`crlfDelay: Infinity` makes Windows `\r\n` count as one line break. Lines come without
the terminator.

---

## HTTP server in 10 lines

```js
import { createServer } from 'node:http';
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, now: Date.now() }));
  }
  res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
});
server.listen(3111, () => console.log('listening on', server.address().port));
```

Run it, then `curl -i http://127.0.0.1:3111/health` →
`HTTP/1.1 200 OK`, `content-type: application/json`, body `{"ok":true,"now":1787279731244}`.
`/nope` → `404` + `not found`.

**Gotcha.** `req.url` is only the path+query (`'/health'`), never absolute — that's why
you build a `URL` with a base. And **you must call `res.end()`** on every path or the
client hangs until timeout.

### The client side

```js
const res = await fetch('http://127.0.0.1:3111/health');   // global fetch: yes in Node 22
console.log(res.status, res.headers.get('content-type'), await res.json());
// logs: 200 application/json { ok: true, now: 1787279731244 }
```

**`fetch` does not throw on 4xx/5xx** — it only rejects on network failure. Check `res.ok`.
Read the body exactly once (`.json()`, `.text()`, `.arrayBuffer()`).

```js
const r = await fetch('https://example.com/api', { signal: AbortSignal.timeout(5000) });
if (!r.ok) throw new Error(`HTTP ${r.status}`);
```

POST JSON: `fetch(url, { method:'POST', headers:{'content-type':'application/json'},
body: JSON.stringify(data) })`. Reach for `node:https` only when you need
low-level control (agents, raw sockets, streaming upload with custom backpressure).

---

## Other stdlib worth knowing

| Module | What you'd use it for |
| --- | --- |
| `node:os` | `platform()` `'win32'`, `arch()`, `cpus().length` (pool size), `totalmem()`, `homedir()`, `tmpdir()`, `EOL` (`'\r\n'` here), `userInfo()` |
| `node:util` — `promisify(fn)` | wrap a `(…args, cb(err,val))` API into a promise-returning one |
| `node:util` — `parseArgs({args, options, allowPositionals})` | zero-dep CLI flags → `{values:{name:'ada',verbose:true}, positionals:['build','x']}` |
| `node:util` — `styleText(style, s)` | ANSI colour without chalk: `styleText('red', 'boom')`, or `styleText(['bold','green'], 'ok')`. No-ops when stdout is not a TTY unless you pass `{validateStream:false}` |
| `node:util` — `inspect(obj, {depth:null, colors:true})` | what `console.log` uses; the fix for `[Object]` at depth 2 |
| `node:util` — `format`, `types.*`, `isDeepStrictEqual` | `format('%s has %d: %j', …)`, runtime type checks |
| `node:assert/strict` | `equal`, `deepEqual`, `ok`, `throws`, `rejects`, `match`. The `/strict` form makes `equal` use `===` |
| `node:test` + `node --test` | built-in runner: `test`, `describe`, `it`, `mock`, `before`/`after`. TAP output, `# pass 5 / # fail 0`. No dependencies |
| `node:worker_threads` | real parallelism for CPU work: `new Worker(url, {workerData})`, `parentPort.postMessage(x)`, `isMainThread` |
| `node:child_process` — `execFile` | run a binary with an **argument array** (no shell → no injection); `promisify` it for `{stdout, stderr}` |
| `node:child_process` — `spawn` | long-running child, stream `child.stdout` / `child.stderr`; `close` event gives the exit code |
| `node:child_process` — `exec` | runs through a shell. Avoid unless you truly need shell features |
| `node:timers/promises` | `import { setTimeout as delay } from 'node:timers/promises'` → `await delay(30)`, `await delay(5, 'payload')`, plus `setInterval` as an async iterator |
| `node:zlib` | `createGzip()`/`createGunzip()` as Transform streams; `promisify(zlib.gzip)` for buffers |
| `node:buffer` | `Buffer.from(s, 'utf8'\|'hex'\|'base64')`, `buf.toString(enc)`, `Buffer.byteLength('héllo')` → `6` while `'héllo'.length` is `5` |
| `node:readline` | line-by-line reading (see Streams) and simple prompts |
| `node:module` | `createRequire`, `register()` for loaders |

---

## Running things

| Command | Does |
| --- | --- |
| `node file.js` | run a script. `.mjs`, or `"type":"module"`, for ESM |
| `node -e 'code'` | run an inline snippet (`--input-type=module` for ESM syntax) |
| `node --test` | auto-discovers `*.test.*`, `*-test.*`, `*_test.*`, `test.*`, `test-*.*`, and everything under a `test/` directory. **`*.spec.js` is NOT discovered.** `node --test path/f.test.js` for one file |
| `node --test --watch` | rerun tests on change; add `--test-name-pattern='adds'` to filter |
| `node --test --experimental-test-coverage` | coverage report, no tooling |
| `node --watch app.js` | restart on file change — logs `Restarting '…'`. `--watch-path=src` to scope it |
| `node --env-file=.env app.js` | load `KEY=value` lines into `process.env`. `--env-file-if-exists=` to not fail when missing |
| `node --run build` | run a `package.json` script without npm's startup overhead (Node ≥22) |
| `npx pkg` | run a package binary, downloading it if needed. `npx --yes` to skip the prompt |
| `NODE_OPTIONS="--max-old-space-size=4096" node app.js` | pass flags via env — for tools that spawn Node for you |
| `node --inspect-brk app.js` | pause on line 1 and wait for a debugger on `127.0.0.1:9229` |
| `node --trace-warnings app.js` | show where a `MaxListenersExceededWarning` etc. was created |

**Gotcha.** `--env-file` does **not** override variables already in the real environment,
and it does no shell expansion — `PATH=$PATH:/x` is stored literally.

---
*See also: [promises-async.md](promises-async.md) · [patterns-swe.md](patterns-swe.md) · [js-gotchas.md](js-gotchas.md)*
