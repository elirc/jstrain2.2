# 05 · HTTP From First Principles

HTTP is a text protocol you could type by hand, wrapped in forty years of
accumulated policy about caching, identity, and who is allowed to talk to
whom. Frameworks hide the text; the policy leaks out anyway, usually as a
bug at 4pm on a Friday — a 304 that returns nothing when you expected JSON,
a preflight that fails only in the browser, a retry that charges a customer
twice.

This guide rebuilds it from the bytes up. Everything is demonstrated with
`node:net` and `node:http` on loopback — no internet required, which is the
point. Run the snippets on the plane; they only ever talk to `127.0.0.1`.

Verified on **Node v22.16.0** (Windows). Where something is browser-only —
actual CORS enforcement, cookie jars — it is flagged as **not executed
here** and stated conservatively.

---

## 1 · What is actually on the wire

Start by refusing to use an HTTP server at all. Here is a raw TCP socket,
printing the exact bytes `fetch` sends it:

```js
import net from 'node:net';

const server = net.createServer((sock) => {
  sock.on('data', (buf) => {
    console.log(buf.toString('utf8'));           // ← the literal request
    sock.end('HTTP/1.1 204 No Content\r\n\r\n');
  });
});
server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  await fetch(`http://127.0.0.1:${port}/orders/42?fields=id`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"qty":2}',
  });
  server.close();
});
```

Real output, with every line ending annotated (each `<CRLF>` is the two
bytes `0x0D 0x0A`):

```
POST /orders/42?fields=id HTTP/1.1 <CRLF>
host: 127.0.0.1:58257 <CRLF>
connection: keep-alive <CRLF>
content-type: application/json <CRLF>
accept: */* <CRLF>
accept-language: * <CRLF>
sec-fetch-mode: cors <CRLF>
user-agent: node <CRLF>
accept-encoding: gzip, deflate <CRLF>
content-length: 9 <CRLF>
 <CRLF>
{"qty":2} <CRLF>
```

That is the entire protocol in twelve lines:

```
  ┌──────────────────────────────────────────────────────────┐
  │ METHOD  SP  request-target  SP  HTTP/1.1        <CRLF>   │  request line
  ├──────────────────────────────────────────────────────────┤
  │ name: value                                     <CRLF>   │  headers,
  │ name: value                                     <CRLF>   │  any number
  ├──────────────────────────────────────────────────────────┤
  │                                                 <CRLF>   │  ← blank line
  ├──────────────────────────────────────────────────────────┤  ends the head
  │ body bytes … exactly content-length of them              │
  └──────────────────────────────────────────────────────────┘
```

Five things worth noticing in that dump, because each one is a bug you will
meet:

1. **The request target is a path, not a URL.** `/orders/42?fields=id` —
   the host went into a *header*. That header is what makes virtual hosting
   possible: one IP, one port, a thousand sites.
2. **`content-length: 9` is bytes, not characters.** `fetch` computed it
   from the encoded body. Get this wrong yourself and the peer either
   truncates your body or waits forever for bytes that never come.
3. **`connection: keep-alive`** — the socket is meant to be reused. §5.
4. **`accept-encoding: gzip, deflate`** was added for you, which is why a
   gzipped response arrives already decompressed and you never see it.
5. **Header names arrive lowercased** in Node (`req.headers.Accept` is
   always `undefined`). HTTP/1.1 field names are case-insensitive; HTTP/2
   requires lowercase on the wire. Just always use lowercase.

### The chain before the first byte

```
  fetch('https://api.example.com/orders')
        │
        ├─ 1. URL parse        →  scheme, host, port (443 implied), path
        ├─ 2. DNS              →  A/AAAA lookup, cached by TTL
        ├─ 3. TCP handshake    →  SYN → SYN-ACK → ACK        (1 round trip)
        ├─ 4. TLS handshake    →  ClientHello … Finished     (1–2 round trips)
        ├─ 5. REQUEST bytes    →  the block you just saw
        ├─ 6. server thinks    →  your handler runs
        ├─ 7. RESPONSE bytes   →  status line, headers, body
        └─ 8. keep alive, or close
```

Steps 2–4 are why the *first* request to a new origin is slow and the next
nine are fast, and why "the API is slow" is sometimes "we open a new TCP
connection per call". Measured in §5.

**HTTP/2 and /3 change steps 5–8, not the model.** /2 keeps the same
methods, statuses and header semantics but multiplexes many concurrent
streams over one TCP connection and compresses headers with HPACK — which
kills head-of-line blocking at the HTTP layer but not at the TCP layer.
/3 moves to QUIC over UDP, which removes the TCP-level blocking too and
folds the TLS handshake into the transport. Everything in this guide about
methods, status codes, caching and CORS applies unchanged to all three.
*(Not executed here — Node's built-in loopback demos are HTTP/1.1.)*

---

## 2 · The response, and how the body is framed

The response is the same shape with a status line on top. Speaking HTTP by
hand to a real `node:http` server:

```js
const sock = net.connect(port, '127.0.0.1', () =>
  sock.write('GET /hello HTTP/1.1\r\nhost: x\r\nconnection: close\r\n\r\n'));
```

gives, verbatim:

```
HTTP/1.1 200 OK
content-type: application/json
content-length: 27
Date: Sat, 22 Aug 2026 10:20:40 GMT
Connection: close

{"ok":true,"path":"/hello"}
```

Now the interesting one. Same server, but the handler streams — it calls
`res.write()` before it knows the total size:

```js
res.writeHead(200, { 'content-type': 'text/plain' });   // no content-length
res.write('chunk-one ');
setTimeout(() => res.end('chunk-two'), 20);
```

```
HTTP/1.1 200 OK
content-type: text/plain
Date: Sat, 22 Aug 2026 10:20:40 GMT
Connection: close
Transfer-Encoding: chunked

a
chunk-one
9
chunk-two
0

```

Node switched framing automatically. **`a`** is hexadecimal 10 — the byte
length of `'chunk-one '` — then the chunk, then `9` for `'chunk-two'`, then
a `0`-length chunk that means "done".

There are exactly two ways to know where a body ends:

| framing | when | cost |
| --- | --- | --- |
| `content-length: N` | you know the size up front | must buffer the whole thing first |
| `transfer-encoding: chunked` | you're streaming | a few bytes per chunk, first byte goes out immediately |

That's the real trade: **time-to-first-byte versus knowing the size**. A
progress bar needs `content-length`; a log tail needs chunked. You cannot
have both, and choosing to buffer a 200 MB file just to set a length header
is how servers run out of memory (see guide 03).

---

## 3 · Methods: three properties that matter

Forget "GET reads, POST writes". The properties that drive real behaviour
in caches, proxies, and retry logic are these three, and they are
independent:

| method | safe? | idempotent? | cacheable? | body? |
| --- | --- | --- | --- | --- |
| GET | yes | yes | yes | no |
| HEAD | yes | yes | yes | no |
| OPTIONS | yes | yes | no | no |
| PUT | no | **yes** | no | yes |
| DELETE | no | **yes** | no | rarely |
| POST | no | **no** | rarely | yes |
| PATCH | no | **no** | no | yes |

- **Safe** = no intended side effect. Crawlers, prefetchers and browser
  "preload" will fire safe methods without asking you. If your `GET
  /orders/42/cancel` cancels an order, a link prefetcher will eventually
  cancel it for a user who merely hovered.
- **Idempotent** = doing it N times leaves the same *state* as doing it
  once. Not the same *response* — `DELETE` returning 204 then 404 is still
  idempotent, because the state after both calls is identical. This is the
  single property that decides whether a client may safely retry (§9).
- **Cacheable** = a shared cache may store the response. Effectively
  GET/HEAD, unless you go out of your way.

**PUT vs PATCH vs POST** is about those properties, not about syntax:

```
  PUT   /orders/42     "make the resource exactly this"      → idempotent
  PATCH /orders/42     "apply this change"                   → depends on you
  POST  /orders        "process this; you decide the URL"    → not idempotent
```

A `PATCH` with body `{ "status": "shipped" }` is idempotent. A `PATCH` with
`{ "increment": 1 }` is not. The method doesn't decide — your semantics do,
and the spec only promises what the *method* promises.

---

## 4 · Status codes that change client behaviour

Most codes are documentation. These actually alter what the other side
does, and they're worth knowing exactly.

**201 Created** must carry a `Location` header pointing at the thing you
made. That's the difference between an API that's discoverable and one
where the client has to guess the URL.

**204 No Content** and **304 Not Modified** must not carry a body. Node
enforces this for you — a body written after a 204 is silently dropped:

```js
res.writeHead(204, { 'content-type': 'application/json' });
res.end('this body should not exist');
// client sees: status 204 | body: "" | content-type: application/json
```

Silently is the operative word. The header you wrongly sent still goes out;
the bytes don't. Some proxies are less forgiving and simply hang, waiting
for a body they were told to expect.

**Redirects rewrite your method — sometimes.** This is the one everybody
gets wrong, and it's easy to verify:

```js
await fetch(base + '/moved302', { method: 'POST', body: 'x' });
// landing sees: method=GET     ← your POST became a GET, body dropped
await fetch(base + '/moved307', { method: 'POST', body: 'x' });
// landing sees: method=POST    ← preserved
```

| code | meaning | method preserved? |
| --- | --- | --- |
| 301 | moved permanently | no (historically rewritten to GET) |
| 302 | found / temporary | **no** |
| 303 | see other | no — explicitly "GET the other thing" |
| **307** | temporary redirect | **yes** |
| **308** | permanent redirect | **yes** |

If you redirect a form POST with a 302, the body is gone and the method is
GET. Use 307/308 when the method matters. Note also that `fetch` follows
redirects *automatically* (`redirect: 'follow'` is the default) and
`res.url` reflects the final URL, with `res.redirected === true` — verified
above. Your "the API returned 200" log may be hiding three hops.

**401 vs 403** is "I don't know who you are" vs "I know exactly who you are
and no". A 401 must include `WWW-Authenticate`; sending 401 for a
permissions failure sends clients into a pointless re-login loop.

**405** must include `Allow: GET, POST`. **409** is a state conflict (edit
collision, duplicate). **422** is "syntactically fine, semantically wrong" —
useful when 400 would be a lie. **429** should carry `Retry-After`, and
**503** should too; both are the server telling the client *how* to retry,
which is the only thing that stops a retry storm (§9).

---

## 5 · Connection lifecycle and keep-alive

In HTTP/1.0 every request paid for a fresh TCP handshake. HTTP/1.1 made
persistent connections the default: `connection: keep-alive` is implied,
and the socket stays open for the next request.

Measured on loopback — the same 10 requests, issued two ways:

```
10 sequential requests ->  2 TCP connection(s), 443 ms total
10 parallel   requests ->  9 TCP connection(s)
```

Sequential requests reuse the socket (Node's `fetch` — undici — keeps a
pool per origin, and Node 19+ has `keepAlive` on by default in the classic
`http.globalAgent` too). Parallel requests can't: **one HTTP/1.1 connection
carries one request at a time**. That is head-of-line blocking, and it is
the entire reason HTTP/2 multiplexing exists.

```
  HTTP/1.1 keep-alive           HTTP/2 multiplexing
  ┌──────────────────┐          ┌──────────────────────────┐
  │ req1 ─────▶      │          │ req1 ──▶ ┐               │
  │      ◀───── res1 │          │ req2 ──▶ ├─ interleaved  │
  │ req2 ─────▶      │          │ req3 ──▶ ┘   on ONE conn │
  │      ◀───── res2 │          │      ◀── res2, res1, res3│
  └──────────────────┘          └──────────────────────────┘
   one at a time,                any order, no waiting
   or open more sockets
```

### The shutdown trap

`server.close()` stops accepting *new* connections and waits for existing
ones to drain. Idle keep-alive sockets are "existing", so:

```js
server.close(() => console.log('closed'));   // may not fire for seconds
server.closeAllConnections();                // ← forces the idle ones shut
```

This is why a test file that starts a server sometimes hangs at the end and
you blame the test runner. In tests: `closeAllConnections()` then `close()`.
In production, do the opposite — that grace period is what makes rolling
deploys not drop requests. Node also exposes `server.keepAliveTimeout`
(default 5 s) and `headersTimeout`; if you sit behind a load balancer, the
server's keep-alive timeout should be *longer* than the balancer's, or you
will race it and serve occasional 502s.

---

## 6 · Caching, as a story

Monday. A browser asks for `/app.js` and gets it, plus two extra headers:

```
cache-control: max-age=31536000, immutable
etag: "8f3a1c9b"
```

`max-age` is a **freshness lifetime**: for one year, the browser may use
this copy with *no network at all*. Not a fast request — zero requests.
`immutable` adds "don't even revalidate on reload". That's only safe
because the filename is content-hashed; the deploy that changes the file
changes the URL.

Tuesday. The same browser asks for `/api/notes`, which is data, not an
asset. The server sends:

```
cache-control: no-cache
etag: "NboBrwihMYLo57uv"
```

`no-cache` does **not** mean "don't cache". It means "cache it, but
revalidate before every use". (The one that means don't store anything is
`no-store` — that's the one for account statements.) So Wednesday, the
browser asks again and includes what it has:

```
if-none-match: "NboBrwihMYLo57uv"
```

The server compares, and answers with the smallest useful response in HTTP:

```js
if (req.headers['if-none-match'] === etag) {
  res.writeHead(304, { etag });
  return res.end();                 // ← no body at all
}
```

Verified round trip:

```
first  : 200 etag= "NboBrwihMYLo57uv" bytes= 16
second : 304 body length= 0 | server hits: 2
```

Two server hits, one body. That's the deal a 304 makes: you still pay for
the round trip and the handler still runs, but you don't pay for the bytes.
For a 2 KB JSON list that's a rounding error; for a 400 KB bundle over a
mobile link it's the difference between snappy and not.

The model in one picture:

```
   have a cached copy?
        │
    no ─┴─ yes ──▶ still fresh?  (age < max-age)
    │                   │
    │              yes ─┴─ no ──▶ have a validator? (etag / last-modified)
    │               │                    │
    ▼               ▼               yes ─┴─ no
  GET (200)     USE IT, no          │        │
                network at all   conditional  GET (200)
                                 GET → 304 (use cache)
                                       or 200 (replace)
```

Vocabulary worth being precise about:

- **`ETag` strong vs weak.** `"abc"` promises byte-for-byte identity;
  `W/"abc"` promises only semantic equivalence. Range requests require a
  strong one. Compute cheaply — hashing a 4 MB response on every request to
  save sending it is a bad trade; hash at write time and store it.
- **`Last-Modified` / `If-Modified-Since`** is the older validator, with
  one-second resolution — two writes in the same second are
  indistinguishable. Prefer `ETag`, keep `Last-Modified` as a fallback.
- **`s-maxage`** overrides `max-age` for *shared* caches (CDNs) only.
  **`private`** means "browser may store, CDN may not" — the header that
  stops a CDN serving user A's dashboard to user B.
- **`stale-while-revalidate=60`** lets a cache serve a stale copy
  immediately while it refreshes in the background. It is the single best
  latency-per-effort header on this list.
- **`Vary: Accept-Encoding, Origin`** tells caches which *request* headers
  change the response. Forget it and a CDN will hand a gzipped body to a
  client that can't decompress, or one origin's CORS headers to another's
  request.

---

## 7 · Cookies vs tokens

A cookie is a string the server hands out and the browser then attaches to
every matching request, automatically, forever. That automatic attachment
is both the feature and the entire security problem.

```
set-cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1209600
```

| attribute | what it buys |
| --- | --- |
| `HttpOnly` | JavaScript cannot read it — an XSS bug can't exfiltrate the session |
| `Secure` | HTTPS only, so it never crosses the wire in plaintext |
| `SameSite=Lax` | not sent on cross-site POSTs; sent on top-level navigations (the sane default) |
| `SameSite=Strict` | never sent cross-site — safest, and it logs you out when you follow a link in from elsewhere |
| `SameSite=None` | sent everywhere; **requires** `Secure`. Only for deliberate cross-site APIs |
| `Path` / `Domain` | scope. `Domain` widens to subdomains — widen deliberately, never by habit |
| `Max-Age` / `Expires` | lifetime; no lifetime = session cookie, dies with the tab |

The honest comparison:

|  | cookie session | bearer token (JWT etc.) |
| --- | --- | --- |
| sent automatically | yes — convenient, and the reason CSRF exists | no — you attach it |
| readable by JS | not with `HttpOnly` | yes, wherever you stored it |
| XSS exposure | low for the cookie itself | high if in `localStorage` |
| CSRF exposure | **real** — mitigate with `SameSite` + a token | none (nothing is automatic) |
| revocation | trivial — delete the server-side session | hard — it's valid until it expires |
| scaling | needs a session store (Redis) | stateless, verify the signature |
| size on the wire | ~30 bytes | 300–1000 bytes, on *every* request |

**Opinion, stated as one:** for a browser app talking to your own backend,
use an `HttpOnly; Secure; SameSite=Lax` session cookie with server-side
state. You get instant revocation, tiny requests, and no "where do I store
the token" conversation. Reach for bearer tokens when there is no browser
(mobile, service-to-service, CLI) or when a third party must verify without
calling you. And if you do use a JWT, keep it short-lived with a refresh
token — a 24-hour JWT is a 24-hour window where "log this user out" is a
lie you tell your security team.

*(Cookie-jar behaviour is browser-only and not executed here. Node's
`fetch` does not keep cookies between calls at all — which is exactly why
`bootcamp/18-node-http-apis/exercises/11-cookies.js` makes you parse and
serialise the headers by hand.)*

---

## 8 · CORS is the browser's rule, not the server's

The single most misunderstood thing in web development, so let's be blunt:

> **CORS protects the *user's browser session*, not your server.** It stops
> `evil.com`'s JavaScript from reading a response your browser fetched
> *with your cookies attached*. It is a rule the browser enforces on
> itself. Nothing else on the internet is affected.

Proof, on a server that sends no CORS headers whatsoever, called from Node
with a hostile `Origin`:

```js
const res = await fetch(base + '/nocors', { headers: { origin: 'https://evil.example' } });
// status 200 | ACAO header: null | body: no CORS headers here
```

Full 200, full body, no CORS headers involved. `curl` behaves the same. A
Python script behaves the same. **CORS never once entered the picture**,
because there was no browser to enforce it. If your API is protected only
by CORS, it is not protected.

What a browser would do instead: make the request (for simple ones), then
refuse to hand the response to JavaScript because
`Access-Control-Allow-Origin` didn't match. The request still *happened* —
which is exactly why CSRF is a separate problem needing a separate fix.

**Simple vs preflighted.** A request is "simple" if it's GET/HEAD/POST,
carries only safelisted headers, and its content type is one of
`text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`.
Anything else — `content-type: application/json`, a custom
`x-request-id`, a `PUT` — triggers a **preflight**:

```
    browser                                    server
       │  OPTIONS /orders                        │
       │  origin: https://app.example            │
       │  access-control-request-method: PUT     │
       │  access-control-request-headers: content-type
       │ ───────────────────────────────────────▶│
       │                                         │
       │  204 No Content                         │
       │  access-control-allow-origin: https://app.example
       │  access-control-allow-methods: GET, PUT │
       │  access-control-allow-headers: content-type
       │  access-control-max-age: 600            │
       │  vary: Origin                           │
       │ ◀───────────────────────────────────────│
       │                                         │
       │  ...only now the real PUT goes out      │
```

Three rules people learn the hard way:

1. **`Access-Control-Allow-Origin: *` and credentials are illegal
   together.** With `credentials: 'include'`, the browser requires a
   literal origin plus `Access-Control-Allow-Credentials: true`. So you
   must echo the origin — which means you must maintain a whitelist, which
   means…
2. **`Vary: Origin` is mandatory when you echo.** Without it, a cache
   stores the response with origin A's header and serves it to origin B,
   and your allowlist silently becomes an allow-everyone.
3. **`Access-Control-Max-Age` caches the preflight.** Without it you double
   your request count for every non-simple call.

`bootcamp/18-node-http-apis/exercises/13-cors.js` builds all three.

---

## 9 · Idempotency and retries

Retries are the most common way a well-meaning client turns a small outage
into a large one. Two questions before you add one.

**Question 1: is this operation idempotent?** GET, HEAD, PUT, DELETE: retry
freely. POST and PATCH: not without help. The failure mode is not
theoretical — the response is what got lost, not the request, so "it timed
out" and "it succeeded and the ACK vanished" are indistinguishable from the
client side. Retrying `POST /charges` charges twice.

The fix is an **idempotency key**: the client generates a UUID, sends it as
a header, and the server stores `key → response` for some window. The
retry returns the stored response instead of doing the work again.

```
  client                             server
    │ POST /charges                    │  key not seen → do the work,
    │ idempotency-key: 7f3e…           │  store result under 7f3e…
    │ ───────────────────────────────▶ │
    │           ✗ response lost        │
    │ POST /charges   (retry)          │  key SEEN → return stored
    │ idempotency-key: 7f3e…  (same!)  │  response, charge nothing
    │ ───────────────────────────────▶ │
```

The client must reuse the same key on retry — a fresh key per attempt is
just a duplicate charge with extra steps.

**Question 2: how do you back off?** Not "every 100ms", which is a
denial-of-service tool aimed at a server that is already unwell. Exponential
delays, plus **jitter** so that a thousand clients that failed together
don't return together:

```js
async function withRetry(url, { tries = 4, baseMs = 5 } = {}) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url);
    if (res.status !== 503) return res;
    const wait = Math.round(baseMs * 2 ** i * (0.5 + Math.random() / 2));  // ← jitter
    await sleep(wait);
  }
  throw new Error('exhausted');
}
```

Against a loopback server that fails twice then succeeds:

```
  attempt 1: 503, sleeping ~4ms
  attempt 2: 503, sleeping ~7ms
final  : 200 ok after 3
```

(Tiny delays so the demo runs instantly; production starts at hundreds of
milliseconds.) Four rules around it:

- **Honour `Retry-After`** when the server sends one. It knows more than
  your exponent does.
- **Only retry what's retryable.** 429, 503, 502, 504, and network errors.
  Never 4xx — a 400 will be a 400 forever, and retrying it is just load.
- **Budget the retries**, don't just cap attempts. If more than ~10% of
  your calls are retries, stop retrying entirely (a circuit breaker) — that
  is the difference between a blip and a **retry storm**, where N clients
  each triple their load exactly when the server can least afford it.
- **Timeout every request.** A retry policy without a timeout just queues
  hung sockets: `AbortSignal.timeout(5000)` as the `signal`.

Note the asymmetry the demo shows: `fetch` **does not throw on 503**, or on
404, or on 500. It throws only when the request could not be made at all.
`if (!res.ok) throw` is your job, every time.

---

## 10 · How this maps onto module 18

Every concept above is one exercise in `bootcamp/18-node-http-apis`:

| concept from this guide | exercise |
| --- | --- |
| §2 status line, headers, framing | `01-response-helpers.js` — `sendJson`, `redirect`, `noContent` |
| §1 path vs URL, query parsing | `02-request-context.js` |
| §3 method semantics, 404 vs 405 + `Allow` | `03-route-table.js` |
| §2 reading a body stream, `content-length` limits, 413 | `08-body-text.js` |
| §2 + §4 JSON parsing, 400 on malformed | `09-body-json.js` |
| §6 `Accept`, q-values, `Vary` | `10-content-negotiation.js` |
| §7 `Cookie` / `Set-Cookie` and every attribute | `11-cookies.js` |
| §7 tamper-proofing without a session store | `12-signed-cookies.js` |
| §8 origin whitelist, `Vary`, preflight 204 | `13-cors.js` |
| §4 + §9 429, `Retry-After`, token bucket | `14-rate-limit.js` |
| §6 ETag, `If-None-Match`, 304 | `16-etag-conditional.js` |
| §1 `accept-encoding` → `content-encoding` | `17-gzip-response.js` |
| §9 typed errors, timeouts, retry with backoff | `19-api-client.js` |
| all of it, assembled | `20-mini-express.js` |

Do them in the order 01 → 05 → 09 → 20 for the spine, then fill in.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/12-node-fundamentals/exercises/21-http-server.js`](../bootcamp/12-node-fundamentals/exercises/21-http-server.js) and [`22-json-api.js`](../bootcamp/12-node-fundamentals/exercises/22-json-api.js) | The bare `http.createServer` loop, before any abstraction. Start here if §1 was new. |
| [`bootcamp/18-node-http-apis/exercises/09-body-json.js`](../bootcamp/18-node-http-apis/exercises/09-body-json.js) | Streams → string → JSON, with the byte-limit and malformed-body cases from §2. |
| [`bootcamp/18-node-http-apis/exercises/13-cors.js`](../bootcamp/18-node-http-apis/exercises/13-cors.js) | §8 as code: whitelist, `Vary: Origin`, preflight 204. |
| [`bootcamp/18-node-http-apis/exercises/16-etag-conditional.js`](../bootcamp/18-node-http-apis/exercises/16-etag-conditional.js) | The §6 story, implemented — and `bootcamp/23-node-drills/exercises/09-conditional-response.js` for cold reps. |
| [`bootcamp/18-node-http-apis/exercises/19-api-client.js`](../bootcamp/18-node-http-apis/exercises/19-api-client.js) | §9: timeouts, typed errors, backoff — the client half nobody writes carefully. |
| [`bootcamp/18-node-http-apis/exercises/20-mini-express.js`](../bootcamp/18-node-http-apis/exercises/20-mini-express.js) | Assemble the lot into `createApp()`. The capstone this guide exists to prepare you for. |

## Self-test

**1.** Your SPA calls `POST /api/orders` and it works from Postman but
fails in the browser with a CORS error — yet your server log shows **no**
`POST` at all. What happened, and what are the two headers that fix it?

<details>
<summary>Answer</summary>

The `POST` sends `content-type: application/json`, which is not one of the
three safelisted content types, so it is **not a simple request**. The
browser sent a **preflight** — `OPTIONS /api/orders` with
`access-control-request-method: POST` and
`access-control-request-headers: content-type` — first. Your server didn't
answer it acceptably (probably 404 or 405, since most hand-rolled routers
have no `OPTIONS` route), so the browser never sent the real `POST`. That's
why the log has no POST: the request you're looking for was never made.

Postman works because Postman is not a browser and enforces nothing (§8).

The fix, on the `OPTIONS` response: `Access-Control-Allow-Origin` (echoing
your app's origin, not `*`, if you send credentials) and
`Access-Control-Allow-Headers: content-type`. In practice you also want
`Access-Control-Allow-Methods`, `Access-Control-Max-Age` so it isn't
re-asked every call, and `Vary: Origin` so a cache doesn't reuse one
origin's answer for another.
</details>

**2.** A teammate adds retries to your HTTP client: three attempts, 100 ms
apart, on any non-2xx. Name three separate ways this makes an incident
worse.

<details>
<summary>Answer</summary>

**It retries POSTs.** Non-idempotent by default, and a timeout is
indistinguishable from "succeeded but the response was lost" — so a flaky
network becomes duplicate orders. Needs idempotency keys, or a rule that
only retries safe/idempotent methods.

**It retries 4xx.** A 400, 401, 403, 404 or 422 will return the same answer
forever; retrying triples the load and delays the real error by 200 ms. Only
429/5xx/network errors are retryable, and 501 isn't even that.

**Fixed 100 ms with no jitter is a synchronised stampede.** When a server
degrades, every client fails at roughly the same moment and every client
retries at exactly +100 ms and +200 ms — three coordinated waves of traffic
aimed at a server that is already failing. This is the retry storm, and it
routinely turns a 30-second blip into a 10-minute outage. Exponential
backoff *with jitter*, honouring `Retry-After`, plus a retry budget or
circuit breaker.

Bonus fourth: no timeout. Three attempts against a hung socket is a
30-second call from the user's perspective, and it holds a connection from
your pool the entire time.
</details>

**3.** You add `ETag` support and a client starts getting 304s. Your
frontend then reports "the API returns an empty body". Both sides are
behaving correctly — what's the actual bug, and where does `Cache-Control`
fit in?

<details>
<summary>Answer</summary>

A 304 is *supposed* to have no body — that's the entire point (§4, §6). The
bug is that something in the chain is treating the 304 as the response
payload instead of as an instruction to reuse the cached copy. Two usual
suspects: a hand-rolled client that sends `If-None-Match` but has no cache
to fall back on (so it must never send the header in the first place), or
code doing `await res.json()` unconditionally on a status it never checked.

The correct client logic is: on 304, use the previously stored body; only
parse a body on 200. `fetch` in a browser handles this transparently — the
browser cache replays the stored body and your JS sees a 200 — which is
precisely why this bug shows up in Node clients and server-to-server calls
rather than in the browser.

`Cache-Control` fits in as the *other half* of the mechanism. `ETag` alone
only enables revalidation; `Cache-Control` decides whether a revalidation
happens at all. With `no-cache` you get a conditional request every time —
correct for data. With `max-age=300` you get no request at all for five
minutes, then a conditional one. With `no-store` the client shouldn't keep a
copy, so it can't send `If-None-Match` and can never receive a 304.
Shipping `ETag` without a deliberate `Cache-Control` is how you end up
guessing at which of those three you got.
</details>

---
**Pairs with:** [`bootcamp/18-node-http-apis`](../bootcamp/18-node-http-apis/) · **Cheatsheet:** [`webdev-fundamentals.md`](../cheatsheets/webdev-fundamentals.md) · **Next guide:** [`06-how-node-actually-runs-your-code.md`](06-how-node-actually-runs-your-code.md)
