# 18 · Node HTTP APIs

Express is about 1,500 lines of JavaScript. Fastify is bigger, mostly
because it compiles its routes and schemas. Neither one does anything you
cannot do with `node:http` and an afternoon — and until you have done it,
every one of them is a black box you debug by guessing. This module builds
a toy Express from nothing: response helpers, a route table, the middleware
chain, body parsing, cookies, CORS, rate limiting, static files, caching,
compression, and a client to call the whole thing. Twenty exercises, zero
dependencies. At the end you assemble the pieces into `createApp()` and run
a real notes API on it.

Module 12 showed you `http.createServer` and a two-route server. This is
what happens next.

## The mental model

**1 · A server is a function from a request to a response.** Everything
else in this module is a way of organising that one function so it stays
readable past four routes.

```js
http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('hello');
});
```

`req` is a readable stream with headers stapled to it. `res` is a writable
stream with a status line stapled to it. There is no framework here, and
there does not have to be.

**2 · Middleware is an array and a cursor.** `use(fn)` pushes onto a list;
`next()` moves a cursor forward by one. That is the entire onion.

```js
const stack = [];
const dispatch = (i) => {
  if (i >= stack.length) return notFound(res);
  stack[i](req, res, () => dispatch(i + 1));   // ← next()
};
```

Control only ever moves forward because somebody called `next()`. A
middleware that neither answers nor calls `next()` is a request that hangs
forever — the most common bug in hand-written middleware, and it does not
throw, it just stops.

**3 · Routing is not special.** A router is the last middleware in the
chain: it looks for a handler, and if it finds none it calls `next()`,
which falls off the end, which is your 404. Once you see that, `app.use`
order stops being folklore: a logger registered after your routes never
logs a routed request, and a body parser registered after them leaves
`req.body` undefined.

**4 · Headers are where most of HTTP lives.** The body is the boring part.
Content type, caching, compression, cookies, CORS, rate limits and
redirects are all header work — which is why half this module is about
strings you never see in the browser window.

```js
res.writeHead(304, { etag });      // "you already have this" — no body
res.setHeader('vary', 'Accept');   // "this response depends on that header"
```

## The details that bite

1. **Every request needs exactly one `res.end()`.** Miss it and the client
   hangs until it times out; do it twice and Node throws
   `ERR_STREAM_WRITE_AFTER_END` — from a callback, where it is hardest to
   see. `if (res.writableEnded) return;` is a cheap guard.
2. **The body stream is consumed once.** Read it twice and the second read
   is `''`, not an error: `await readText(req)` → `'hi'`, then `''`. That
   is why body parsing lives in one middleware that stashes `req.body`.
3. **Decode after concatenating, never per chunk.** `chunk.toString()` in
   a loop splits multi-byte characters across chunk boundaries;
   `Buffer.concat(chunks).toString('utf8')` cannot.
4. **`Content-Length` is bytes.** `'café'.length` → `4`,
   `Buffer.byteLength('café')` → `5`. A length one byte short truncates
   the body on the wire.
5. **Incoming header names are lowercased for you.** `req.headers.Accept`
   is always `undefined`; `req.headers.accept` is the one that works.
6. **`req.url` is a path plus a query string, not a URL.**
   `'/health?x=1' === '/health'` is `false`. Parse it once, at the edge.
7. **A content-type is not an equality check.** The header that really
   arrives is `'application/json; charset=utf-8'`, so
   `type === 'application/json'` silently fails on every real client.
8. **204 and 304 must not carry a body.** They mean "nothing follows"; a
   body after one is a protocol error some proxies punish by hanging.
9. **`fetch` does not throw on 404.** It throws when the request could not
   be made at all. `if (!res.ok) throw` is your job.
10. **`fetch` also rewrites your URL and gunzips your body.**
    `fetch('http://h/../x')` sends `/x`, and a gzipped response arrives
    already decompressed — which is why two exercises here drop to a raw
    `http.request` to see what is actually on the wire.
11. **A thrown error inside an async middleware is not caught by a
    try/catch around the call.** You have to `.catch()` the promise it
    returned. Express 4 does not, which is the entire reason
    `express-async-errors` exists.
12. **Never let a client string become a filesystem path.** Resolve it to
    an absolute path first, then check it is still inside the root —
    `'%2e%2e%2f'` is `'../'` with different bytes.
13. **Headers must be set before they are flushed.** After `writeHead`,
    `setHeader` throws `ERR_HTTP_HEADERS_SENT`. Decide the whole head
    first, then write it.
14. **A listening server keeps the process alive — and so do its open
    sockets.** `server.close()` stops new connections but waits for
    existing keep-alive ones. In tests, `server.closeAllConnections()`
    first, or the file hangs at the end and you blame the test runner.

## Cheat table

| you want to say | status | the header that carries it |
| --- | --- | --- |
| here it is | 200 | `content-type`, `content-length` |
| made it | 201 | `location: /notes/1` |
| done, nothing to say | 204 | *(no body, no content-type)* |
| you already have it | 304 | `etag` *(no body)* |
| it moved | 301 / 302 | `location` |
| you sent nonsense | 400 | — |
| who are you | 401 / 403 | `www-authenticate` |
| no such thing | 404 | — |
| not with that verb | 405 | `allow: GET, POST` |
| cannot render that | 406 | — |
| that is too big | 413 | — |
| slow down | 429 | `retry-after: 2` |
| we broke | 500 | *(never the stack trace)* |

| concern | request header | response header |
| --- | --- | --- |
| format | `accept` | `content-type`, `vary: Accept` |
| compression | `accept-encoding` | `content-encoding`, `vary` |
| caching | `if-none-match` | `etag`, `cache-control` |
| state | `cookie` | `set-cookie` (one per cookie) |
| cross-origin | `origin` | `access-control-allow-origin`, `vary` |

## Exercises

| # | file | ★ | what you build | the real thing |
| --- | --- | --- | --- | --- |
| 01 | `01-response-helpers.js` | ★☆☆ | `sendJson`, `redirect`, `noContent` | `res.json()`, `res.redirect()` |
| 02 | `02-request-context.js` | ★☆☆ | `req.url` → `{ method, path, query, header() }` | `req.path`, `req.query` |
| 03 | `03-route-table.js` | ★★☆ | method+path matching, 404 vs 405 + `Allow` | the Express router |
| 04 | `04-path-params.js` | ★★☆ | `/users/:id` → `req.params` | `path-to-regexp` |
| 05 | `05-middleware-chain.js` | ★★★ | `use(fn)` and the `next()` cursor | `app.use` |
| 06 | `06-request-logger.js` | ★☆☆ | an access log timed off `res.on('finish')` | `morgan` |
| 07 | `07-error-handler.js` | ★★★ | throws, rejections and `next(err)` → one place | Express error middleware |
| 08 | `08-body-text.js` | ★★☆ | stream → string with a byte limit, 413 | `raw-body` |
| 09 | `09-body-json.js` | ★★☆ | a JSON body parser, 400 on malformed | `express.json()` |
| 10 | `10-content-negotiation.js` | ★★☆ | `Accept` + q-values → json / text / html | `res.format()` |
| 11 | `11-cookies.js` | ★★☆ | parse `Cookie`, serialise `Set-Cookie` | `cookie` |
| 12 | `12-signed-cookies.js` | ★★★ | HMAC signing, tamper detection, timing-safe | `cookie-signature` |
| 13 | `13-cors.js` | ★★☆ | origin whitelist, `Vary`, preflight 204 | `cors` |
| 14 | `14-rate-limit.js` | ★★★ | token bucket per key, 429 + `Retry-After` | `express-rate-limit` |
| 15 | `15-static-files.js` | ★★★ | serve a directory — and defend the `../` attack | `express.static` |
| 16 | `16-etag-conditional.js` | ★★★ | ETag + `If-None-Match` → 304 | Express's `etag` option |
| 17 | `17-gzip-response.js` | ★★☆ | gzip when the client accepts it | `compression` |
| 18 | `18-router-mount.js` | ★★☆ | a sub-router mounted under a prefix | `express.Router()` |
| 19 | `19-api-client.js` | ★★★ | typed errors, timeouts, retry with backoff | `axios`, `ky` |
| 20 | `20-mini-express.js` | ★★★ | assemble all of it, run a notes API on it | Express itself |

Do the warm-ups and core in order. Stretch if time allows. 01 → 05 → 09 →
20 is the spine; the rest hang off it.

Run one file at a time:

```
node exercises/01-response-helpers.js
```

Every test should say `todo` before you start and `all green — next file!`
when you are done. The `solutions/` copy of each file has the same tests
plus a walkthrough explaining why the solution is shaped that way, and
which real-world middleware it is a miniature of — read it after your own
attempt, not before.

Every exercise that needs a server starts one on `127.0.0.1` with port `0`
(the OS picks a free port), makes real `fetch` calls against it, and closes
it in a `finally`. That harness is given to you at the top of each file —
you only write the part under test. Exercise 15 also writes fixture files
under `18-node-http-apis/tmp-test/<uuid>/` and deletes them again in the
same `finally`, so a failing test never leaves litter behind.

---

**Stuck?** `cheatsheets/node-advanced.md` (the HTTP section — loopback tests, ETag/304, gzip) · `cheatsheets/webdev-fundamentals.md` (methods, status codes, CORS) · **Deep dive:** `guides/05-http-from-first-principles.md` · **Self-check:** `quizzes/12-node-advanced.md` and `quizzes/08-node-and-web.md` · **Next:** `bootcamp/19-node-persistence`
