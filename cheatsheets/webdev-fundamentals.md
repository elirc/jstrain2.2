# Web dev fundamentals

The theory an interviewer probes: the request lifecycle, HTTP, caching, CORS, bundlers, rendering.

## Top of mind

| Question | Answer |
| --- | --- |
| `no-cache` vs `no-store` | `no-cache` = store it, but **revalidate every time**. `no-store` = never write it down at all |
| 401 vs 403 | 401 = "I don't know who you are" (authenticate and retry). 403 = "I know, and you still can't" |
| Why does CORS block me but curl works? | CORS is **browser-enforced**. The server already ran your request; the browser just won't hand you the response |
| Polyfill or transpile? | New **syntax** → transpile (build time). Missing **API** → polyfill (ship code that defines it) |
| Which properties animate cheaply? | `transform` and `opacity` — composite only. `width`/`top` re-run layout for the whole page |

---

## What happens when you load a URL

1. **Parse the URL.** Split into scheme, host, port, path, query, fragment. The `#fragment` is
   client-side only — it is never sent to the server.
2. **HSTS check.** If the host is on the browser's HSTS list (preloaded, or from a previous
   `Strict-Transport-Security` header), `http://` is rewritten to `https://` before anything leaves the machine.
3. **DNS resolution.** Browser cache → OS cache and `hosts` file → the configured resolver (ISP, `1.1.1.1`).
   On a miss the resolver walks root → TLD (`.com`) → the domain's authoritative nameserver.
4. **The records.** `A` = IPv4, `AAAA` = IPv6, `CNAME` = alias the resolver must follow to another name.
   Every answer carries a **TTL** in seconds — that's why a DNS change isn't instant.
5. **TCP handshake.** SYN → SYN-ACK → ACK: one full round trip before a single byte of HTTP moves.
   HTTP/3 skips this — QUIC runs over UDP and folds transport and crypto setup into one handshake.
6. **TLS handshake.** `ClientHello` (TLS versions, cipher suites, **SNI** hostname, **ALPN** protocol list)
   → `ServerHello` + the certificate chain.
7. **Certificate validation.** Browser walks the chain to a trusted root in its store, and checks the
   hostname, the validity dates, and revocation. Any failure = the interstitial warning, no request sent.
8. **Keys and protocol.** An ECDHE key exchange derives session keys; ALPN picks `h2` or `http/1.1`.
   TLS 1.3 is one round trip, and session resumption can make a repeat visit cost zero.
9. **HTTP request.** Method + path + version, then headers (`Host`, `User-Agent`, `Accept`,
   `Accept-Encoding`, `Cookie`), then an optional body. HTTP/2 sends this as HPACK-compressed binary
   frames, multiplexed over the one connection.
10. **The middle.** CDN edge → reverse proxy → load balancer → app server. A CDN cache hit answers here
    and your origin never hears about it.
11. **Response.** Status line, headers (`Content-Type`, `Content-Encoding: br`, `Cache-Control`, `ETag`,
    `Set-Cookie`), then the body. **TTFB** is measured at the first byte of this.
12. **HTML parsing.** The browser streams the bytes into tokens into a **DOM** tree as they arrive —
    it does not wait for the whole document.
13. **Preload scanner.** A second, lightweight parser races ahead of the main one and starts fetching
    `<img>`, `<script src>`, and `<link>` URLs early — which is why hiding assets behind JS costs you.
14. **CSS.** `<link rel="stylesheet">` is **render-blocking**: CSS is parsed into the **CSSOM** and nothing
    paints until it is complete, because a later rule can change everything above it.
15. **JavaScript.** A plain `<script>` stops the parser dead (it might `document.write`), and it must also
    wait for any pending CSS, because it can read computed styles. `defer` and `async` don't block. See the table below.
16. **Render tree.** DOM + CSSOM merged, minus `display: none` nodes, plus pseudo-elements. Only what
    will actually be drawn.
17. **Layout, paint, composite.** Layout computes every box's size and position; paint fills pixels into
    layers; the compositor (GPU) assembles the layers → first pixels on screen.
18. **Milestones and the tail.** **FCP** = first content painted; **LCP** = the largest above-the-fold
    element finished. Meanwhile images, fonts, and `fetch` calls continue; `DOMContentLoaded` fires when
    parsing and deferred scripts are done, `load` when every subresource is.

### `async` vs `defer` vs blocking

| Form | Downloads | Executes | Blocks the parser? | Order |
| --- | --- | --- | --- | --- |
| `<script src>` | Immediately, parser paused | The moment it arrives | **Yes**, twice: download + execute | Document order |
| `<script defer src>` | In parallel with parsing | After the HTML is parsed, just before `DOMContentLoaded` | No | Document order — guaranteed |
| `<script async src>` | In parallel with parsing | As soon as *it* finishes downloading | Only during execution | **Whatever finishes first** |
| `<script type="module">` | In parallel | Deferred by default | No | Document order |
| Inline `<script>` | — | Immediately | Yes | Document order |

Default choice: `defer`, at the end of `<head>`. Use `async` only for independent things like analytics.

---

## HTTP methods

**Safe** = intended to be read-only; it doesn't change server state.
**Idempotent** = doing it N times leaves the same *state* as doing it once (the response may differ —
the second `DELETE` may honestly return `404`).

| Method | Purpose | Safe? | Idempotent? | Body? | Cacheable? |
| --- | --- | --- | --- | --- | --- |
| `GET` | Fetch a representation | yes | yes | no (servers ignore it) | yes |
| `HEAD` | `GET` with headers only, no body | yes | yes | no | yes |
| `POST` | Create, submit, or an RPC-style action | no | **no** | yes | Only with explicit freshness headers — in practice, no |
| `PUT` | Replace the whole resource at a known URL | no | yes | yes | no |
| `PATCH` | Partial update | no | **not guaranteed** | yes | no |
| `DELETE` | Remove the resource | no | yes | optional | no |
| `OPTIONS` | Ask what's allowed; the CORS preflight | yes | yes | no | no |

Idempotency is why a proxy or a client may safely retry `GET`/`PUT`/`DELETE` on a timeout but must not
retry `POST` — that's what idempotency keys are for.

---

## Status codes

### 1xx — informational

| Code | Name | When you'd send it |
| --- | --- | --- |
| `100` | Continue | Client sent `Expect: 100-continue`; you're telling it the big body is welcome |
| `101` | Switching Protocols | Upgrading the connection to WebSocket |

### 2xx — success

| Code | Name | When you'd send it |
| --- | --- | --- |
| `200` | OK | Normal success with a body |
| `201` | Created | A `POST` made a new resource — include a `Location` header pointing at it |
| `202` | Accepted | Queued for async work, not done yet. Give them a status URL |
| `204` | No Content | Success, deliberately no body — `DELETE`, or a `PUT` you don't echo |
| `206` | Partial Content | Answering a `Range` request: video seeking, resumable downloads |

### 3xx — redirection

| Code | Name | When you'd send it |
| --- | --- | --- |
| `301` | Moved Permanently | Permanent new URL. **Clients historically rewrite `POST` → `GET`** — don't use it on APIs |
| `302` | Found | Temporary. Same `POST` → `GET` rewriting in practice |
| `303` | See Other | "Go `GET` this other URL." The Post/Redirect/Get pattern after a form submit |
| `304` | Not Modified | Conditional request matched — no body, keep using your cached copy |
| `307` | Temporary Redirect | Like `302` but the **method and body must be preserved** |
| `308` | Permanent Redirect | Like `301` but the **method and body must be preserved** |

The pairs: `301`/`302` are the legacy ones that may turn your `POST` into a `GET`; `308`/`307` are the
explicit modern versions that keep the method. Permanence is the `301`/`308` axis; method preservation
is the `307`/`308` axis. Browsers cache `301`/`308` aggressively — a wrong one is very hard to take back.

### 4xx — client error

| Code | Name | When you'd send it |
| --- | --- | --- |
| `400` | Bad Request | Malformed syntax — unparseable JSON, missing required param |
| `401` | Unauthorized | Really *unauthenticated*. Include `WWW-Authenticate`; the client should log in and retry |
| `403` | Forbidden | Authenticated, but not allowed. Retrying with the same credentials will not help |
| `404` | Not Found | No such resource — also the polite answer when you don't want to confirm it exists |
| `405` | Method Not Allowed | The URL exists, the verb doesn't. Must include an `Allow` header |
| `409` | Conflict | Version conflict, duplicate unique field, state machine violation |
| `410` | Gone | It existed and was deliberately removed, permanently. Stronger than `404` |
| `415` | Unsupported Media Type | You sent XML, the endpoint only takes `application/json` |
| `422` | Unprocessable Content | Syntax is fine, the **meaning** is invalid — the validation-error code |
| `429` | Too Many Requests | Rate limited. Include `Retry-After` |

**401 vs 403.** 401 says *who are you?* — the fix is credentials. 403 says *I know exactly who you are
and the answer is no* — the fix is permissions. Sending 401 for an expired token and 403 for a
non-admin is the convention clients rely on to decide whether to trigger a re-login.

### 5xx — server error

| Code | Name | When you'd send it |
| --- | --- | --- |
| `500` | Internal Server Error | An unhandled exception. Log it; never leak the stack trace |
| `501` | Not Implemented | The server doesn't support that method at all |
| `502` | Bad Gateway | You're a proxy and the upstream returned garbage or refused the connection |
| `503` | Service Unavailable | Overloaded, down, or in maintenance. Include `Retry-After` |
| `504` | Gateway Timeout | You're a proxy and the upstream never answered in time |

---

## Headers

### Request headers

| Header | Means |
| --- | --- |
| `Host` | Which virtual host you want — the one header HTTP/1.1 makes mandatory |
| `User-Agent` | Client identification string; a pile of historical lies, don't branch on it |
| `Accept` | Media types you can handle, with `q=` preferences (`application/json, */*;q=0.8`) |
| `Accept-Encoding` | Compressions you support: `gzip, br, zstd` |
| `Accept-Language` | Preferred locales, for content negotiation |
| `Authorization` | Credentials: `Bearer <jwt>` or `Basic <base64>` |
| `Cookie` | Every cookie matching this domain and path, sent automatically on every request |
| `Content-Type` | The media type of the **body you are sending** (`application/json`, `multipart/form-data`) |
| `Content-Length` | Body size in bytes; omitted when using `Transfer-Encoding: chunked` |
| `Origin` | Scheme + host + port of the page making the request. Sent on cross-origin and all `POST`s. Check it for CSRF |
| `Referer` | The page you came from (misspelled in the spec, permanently). Trimmed by `Referrer-Policy` |
| `If-None-Match` | Cache revalidation with an `ETag` — "only send a body if it isn't this version" |
| `If-Modified-Since` | Same, by date. Weaker: one-second resolution and clock-dependent |
| `Range` | Ask for a byte range: `bytes=0-1023`. Gets a `206` back |
| `Connection` | `keep-alive` / `close`. Meaningless in HTTP/2+, which multiplexes one connection |

### Response headers

| Header | Means |
| --- | --- |
| `Content-Type` | Media type + charset of the body: `text/html; charset=utf-8`. Wrong value = wrong rendering |
| `Content-Length` | Body size in bytes |
| `Content-Encoding` | How the body is compressed: `gzip`, `br` |
| `Set-Cookie` | Store this cookie. One header per cookie; attributes below |
| `Cache-Control` | Who may cache it and for how long. The header that governs caching |
| `ETag` | Opaque version id for the body: `"a1b2"`, or `W/"a1b2"` for a weak (semantically-equal) tag |
| `Last-Modified` | Timestamp of the last change; the fallback validator |
| `Expires` | Absolute expiry date. Legacy — `Cache-Control: max-age` wins where both are present |
| `Location` | Where to go for a `3xx`, or where the new resource lives for a `201` |
| `Access-Control-Allow-*` | The CORS opt-in family — see the CORS section |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` — force HTTPS for this long, no click-through |
| `Content-Security-Policy` | Allowlist of where scripts, styles, images, and frames may come from |
| `X-Content-Type-Options` | `nosniff` — stop the browser guessing a type and executing your upload as script |
| `Vary` | Which request headers change the response, so caches key on them: `Vary: Accept-Encoding, Origin` |
| `Retry-After` | Seconds, or an HTTP date. Pairs with `429` and `503` |

### Caching

| Directive | Means |
| --- | --- |
| `max-age=600` | Fresh for 600 seconds; serve from cache with no network call at all |
| `s-maxage=600` | Same, but for **shared** caches (CDN/proxy) only, and it overrides `max-age` there |
| `no-cache` | **You may store it — but revalidate with the origin before every reuse.** Not "don't cache" |
| `no-store` | **Never write it to memory or disk.** This is the actual "don't cache" — for private data |
| `must-revalidate` | Once stale, never serve it; you must revalidate, even if the origin is down |
| `public` | Any cache may store it, including shared ones, even with an `Authorization` header |
| `private` | Browser only. A CDN or proxy must not store it — the header for per-user pages |
| `immutable` | The body will never change while fresh, so don't revalidate even on reload. For hashed assets |
| `stale-while-revalidate=60` | Serve the stale copy instantly for up to 60s while refreshing in the background |

The pattern that works: `Cache-Control: no-cache` on HTML, and
`Cache-Control: public, max-age=31536000, immutable` on `app.8f3a2c.js` — the HTML is always fresh and
names the current hashed filenames, and the assets are cached forever because a change means a new name.

**Revalidation with an ETag:**

1. First response ships the body plus `ETag: "v3"` (and/or `Last-Modified`).
2. When the copy goes stale the browser re-requests with `If-None-Match: "v3"`.
3. Unchanged → `304 Not Modified`, **no body**, and the cache entry's freshness resets. Changed → `200`
   with the new body and a new `ETag`.

`304` still costs a round trip. `max-age` costs nothing. Prefer freshness over revalidation where you can.

---

## REST conventions

| Concern | Convention | Example |
| --- | --- | --- |
| Collection | Plural noun, no verbs in the path | `/users` |
| Single item | Collection + id | `/users/42` |
| Nested resource | Parent path + child collection | `/users/42/posts` — stop at two levels |
| List | `GET /users` → `200` + array (in an envelope with paging info) | — |
| Create | `POST /users` → `201` + `Location: /users/43` | Server assigns the id |
| Full replace | `PUT /users/42` → `200` or `204` | Send every field; missing fields get cleared |
| Partial update | `PATCH /users/42` → `200` or `204` | Send only what changes |
| Delete | `DELETE /users/42` → `204` | Idempotent: the second call may `404`, that's fine |
| Filtering | Query params | `GET /users?role=admin&active=true` |
| Sorting | One param, `-` for descending | `GET /users?sort=-createdAt,name` |
| Sparse fields | Explicit field list | `GET /users?fields=id,name` |
| Offset pagination | `?limit=20&offset=40` | Simple, jumpable — but slow and it **skips/duplicates rows** when the data shifts under you |
| Cursor pagination | `?limit=20&cursor=eyJpZCI6NDJ9` | Stable under inserts and fast at depth; no "page 7" jump |
| Versioning | `/v1/users`, or `Accept: application/vnd.acme.v1+json` | Path version is uglier and wins on debuggability |
| Idempotency | Client-generated `Idempotency-Key` header on `POST` | The server stores the key and replays the first response — no double charge on a retry |
| HATEOAS | Responses carry links (`"next": "/users?cursor=…"`) so the client follows instead of building URLs | Rare in full form; link-based pagination is the part everyone actually ships |

**When not to be RESTful.** Some things aren't resources, they're verbs: refunds, retries, publishing,
sending. Forcing them into `PATCH /orders/42 {status:'refunded'}` hides the business rules. Just be
honest and use an RPC-shaped sub-resource: `POST /orders/42/refund`, `POST /jobs/9/retry`,
`POST /posts/7/publish`. Also skip REST for real-time (WebSockets), heavily-nested graph reads
(GraphQL), and internal service-to-service RPC (gRPC).

---

## Cookies vs localStorage vs sessionStorage

| Aspect | Cookie | `localStorage` | `sessionStorage` |
| --- | --- | --- | --- |
| Capacity | ~4 KB per cookie, and a per-domain cap on count | ~5 MB per origin | ~5 MB per origin |
| Expiry | `Max-Age`/`Expires`, or session | Never, until cleared | When the tab closes |
| Sent to the server | **Yes, on every matching request** | Never | Never |
| Scope | Domain + path. **Ignores the port**, and without `Secure` is shared with `http://` | Origin: scheme + host + port | Origin, **per tab** |
| Readable by JS | Yes, unless `HttpOnly` | Always | Always |
| Cross-tab | Shared | Shared, and fires a `storage` event in the other tabs | Isolated per tab |
| API | `document.cookie` string parsing, or `Set-Cookie` | `getItem`/`setItem` | `getItem`/`setItem` |
| Typical use | Session/auth tokens the **server** needs | Preferences, cached data, drafts | Per-tab wizard state, scroll restoration |

The security trade: an `HttpOnly` cookie is invisible to XSS but vulnerable to CSRF; a token in
`localStorage` is immune to CSRF but any XSS on your origin can read it. `HttpOnly` + `SameSite` +
a CSRF token is the combination that covers both.

### `Set-Cookie` attributes

| Attribute | Effect |
| --- | --- |
| `HttpOnly` | Invisible to `document.cookie`. The single most valuable attribute for a session cookie |
| `Secure` | Only ever sent over HTTPS |
| `SameSite=Strict` | Never sent on **any** cross-site request, including a link into your site — users arrive logged out |
| `SameSite=Lax` | Sent on top-level **GET navigations** only. What Chromium applies when you omit `SameSite` |
| `SameSite=None` | Sent on all cross-site requests. **Requires `Secure`** or it is rejected |
| `Domain=example.com` | Also sent to subdomains. Omitting it is host-only, and tighter — omit unless you need sharing |
| `Path=/admin` | Only sent for that path prefix. A weak boundary, not a security control |
| `Max-Age=3600` | Lifetime in seconds, relative. Wins over `Expires` where both are present |
| `Expires=<HTTP-date>` | Absolute date; depends on the client's clock being right |
| neither | A **session cookie** — gone when the browser closes (except with session restore) |
| `__Host-` name prefix | The browser rejects the cookie unless it has `Secure`, `Path=/`, and **no** `Domain` — pins it to the exact host |
| `__Secure-` name prefix | Rejected unless `Secure` is set |

---

## CORS in plain words

The same-origin policy lets your page **send** requests anywhere, but lets your JS **read** the response
only from its own origin. CORS is the server's way of saying "this origin may read me."
An origin is **scheme + host + port** — all three, exactly.

| Compared with `https://app.example.com/a` | Same origin? | Why |
| --- | --- | --- |
| `https://app.example.com/b?q=1#z` | yes | Path, query, and fragment are irrelevant |
| `https://APP.example.com/a` | yes | Host is case-insensitive |
| `http://app.example.com/a` | **no** | Different scheme |
| `https://api.example.com/a` | **no** | Different host — a subdomain is a different origin |
| `https://example.com/a` | **no** | Different host |
| `https://app.example.com:8443/a` | **no** | Different port |

### Simple vs preflighted

A request skips the preflight only if **all** of these hold:

| Condition | Simple if… |
| --- | --- |
| Method | `GET`, `HEAD`, or `POST` |
| Headers | Only CORS-safelisted ones (`Accept`, `Accept-Language`, `Content-Language`, `Content-Type`) |
| `Content-Type` | One of `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain` |
| Body | Not a `ReadableStream`, and no upload progress listener attached |

So in practice: **`Content-Type: application/json` triggers a preflight. So does an `Authorization`
header, any `X-` header, and `PUT`/`PATCH`/`DELETE`.** That is most of every real API call.

Preflight = the browser first sends `OPTIONS` with `Origin`, `Access-Control-Request-Method`, and
`Access-Control-Request-Headers`, and only sends the real request if the answer allows it.

| Response header | Means | Preflight only? |
| --- | --- | --- |
| `Access-Control-Allow-Origin` | `*`, or one exact origin echoed back (then add `Vary: Origin`) | no |
| `Access-Control-Allow-Methods` | Methods the real request may use | yes |
| `Access-Control-Allow-Headers` | Every non-safelisted request header you permit | yes |
| `Access-Control-Allow-Credentials: true` | Cookies and `Authorization` may ride along | no |
| `Access-Control-Max-Age` | Seconds to cache this preflight; browsers cap it | yes |
| `Access-Control-Expose-Headers` | Which response headers JS may read. Without it you only get `Cache-Control`, `Content-Language`, `Content-Length`, `Content-Type`, `Expires`, `Last-Modified`, `Pragma` | no |

**Why `credentials: 'include'` forbids `*`.** With credentials on, the browser refuses a wildcard for
`Allow-Origin`, `Allow-Methods`, `Allow-Headers`, and `Expose-Headers`. A wildcard means "anyone may
read this" — combined with the user's cookies that would let any site on the internet read the
victim's logged-in data. So the server must name the exact origin, deliberately.

**The key insight: CORS is enforced by the browser, after the fact.** The request left, the server
received it, and the server ran it — side effects and all. The browser simply refuses to give your JS
the response. That means (a) `curl`, Node, and Postman never see a CORS error, and (b) CORS is not
CSRF protection: use `SameSite` and CSRF tokens for that.

| Console error | Real cause | Fix |
| --- | --- | --- |
| No `Access-Control-Allow-Origin` header is present | Server sent no CORS headers — often because an error handler or 500 path skips them | Add the header on **every** response path, error responses included |
| Response to preflight request doesn't pass access control check | No `OPTIONS` route, or it returns 404/405/500 | Handle `OPTIONS` and return a 2xx with the `Allow-*` headers |
| Request header field `authorization` is not allowed | Missing from `Access-Control-Allow-Headers` | List every custom header there, exactly |
| The value of `Access-Control-Allow-Origin` must not be the wildcard when credentials mode is `include` | `*` plus cookies | Echo the exact `Origin`, add `Vary: Origin` and `Allow-Credentials: true` |
| Works in Postman, fails in the browser | There is no CORS outside a browser | It was always a server-header problem; stop debugging the client |
| Redirect is not allowed for a preflight request | Your `OPTIONS` 301s (often the trailing-slash or http→https redirect) | Call the final URL directly |
| It fails only in production | The origin allowlist has the dev origin only | Make the allowed origin configurable per environment |

---

## Bundlers & transpilers in plain words

| Bundler job | What it does | Why you care |
| --- | --- | --- |
| Module graph → chunks | Walks `import`s from the entry point and emits a few files | One request instead of hundreds; resolves `node_modules` for the browser |
| Tree shaking | Drops exports nothing imports | Needs **static ESM** imports; CommonJS and unmarked side effects defeat it (`"sideEffects": false` helps) |
| Code splitting | `import('./chart.js')` becomes its own chunk, fetched on demand | Route-level and feature-level lazy loading |
| Minification | Shortens names, strips whitespace, removes dead branches | Bytes over the wire, on top of gzip/brotli |
| Source maps | Maps the built bundle back to your original source | Readable stack traces and debugging; don't ship them publicly unless you mean to |
| Content hashing | `app.8f3a2c.js` — filename changes when the content does | Lets you cache assets forever and still deploy instantly |
| Asset pipeline | `import './x.css'`, images, SVG; inlines small files as data URLs | One build step for everything, not just JS |
| Dev server + HMR | Serves modules and swaps only the changed one into the running page | Component state survives your edit; no full reload |

A **transpiler** is source-to-source: it rewrites your code into code an older (or different) engine
understands. Babel, `tsc`, SWC, and esbuild all do it — newer syntax to older, JSX to function calls,
TypeScript to JavaScript with the **types erased** (no runtime checks, no runtime cost, no `import type` output).

### Polyfill vs transpile — the distinction juniors miss

| | Transpile | Polyfill |
| --- | --- | --- |
| Fixes | **Syntax** the old engine cannot parse | **Missing APIs** the old engine doesn't have |
| Examples | `?.`, `??`, `async/await`, class fields, optional catch binding, JSX, TS | `Promise`, `fetch`, `Array.prototype.flat`, `Object.fromEntries`, `structuredClone`, `IntersectionObserver` |
| Done by | Babel / `tsc` / SWC / esbuild, at build time | `core-js`, `whatwg-fetch`, a shim script — real code shipped to the browser |
| Costs | Build time, slightly larger output | **Bundle size at runtime** — polyfills are shipped bytes |
| Failure if absent | `SyntaxError` — the whole file dies at parse time, before one line runs | `TypeError: x.flat is not a function` — only when that line executes |

The rule: **syntax is compiled away; APIs must be shipped.** A transpiler cannot invent
`Object.fromEntries` for you, and a polyfill cannot make an old parser accept `?.`.
`browserslist` in `package.json` is the single source of truth both read to decide how far to go.

| Tool | What it's for |
| --- | --- |
| **webpack** | The mature, plugin-heavy bundler. Most configurable, slowest, still everywhere in older codebases |
| **Vite** | Dev server over native ESM (near-instant HMR) + a Rollup production build. The default choice for new apps |
| **Rollup** | Library bundler: cleanest ESM output, best tree shaking, multiple output formats |
| **esbuild** | Go-based bundler/transpiler/minifier, ~10–100x faster. **Does not type-check** |
| **Parcel** | Zero-config bundler; works from an HTML entry point with no build file |
| **Turbopack** | Rust successor to webpack, built for Next.js dev/build speed |
| **SWC** | Rust Babel replacement — transpile and minify. Used by Next.js and as a Jest transform |
| **Babel** | JS-based transpiler with the deepest plugin/preset ecosystem. Still the answer for custom syntax transforms |
| **tsc** | TypeScript's own compiler — and **the only one in this list that actually type-checks**. The fast tools just strip types |

That last row is the practical gotcha: if your build uses esbuild/SWC, type errors will not fail the
build. Run `tsc --noEmit` in CI separately.

---

## Browser rendering pipeline

```txt
HTML ─► DOM ┐
            ├─► render tree ─► LAYOUT ─► PAINT ─► COMPOSITE ─► screen
CSS  ─► CSSOM┘                (geometry)  (pixels)  (GPU layers)
```

| Change | Triggers | Cost |
| --- | --- | --- |
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`, `display`; adding/removing nodes | **Layout** → paint → composite | Highest — geometry may cascade through the whole subtree |
| `color`, `background-color`, `box-shadow`, `border-radius`, `visibility`, `outline` | **Paint** → composite | Medium — repaint the affected layer |
| `transform`, `opacity` on a composited layer | **Composite** only | Cheapest — runs on the GPU, can skip the main thread entirely |
| Reading `offsetHeight`, `getBoundingClientRect()`, `getComputedStyle()`, `scrollTop` | **Forced synchronous layout** — flushes pending work immediately | Free on its own; brutal interleaved with writes |

**Layout thrashing** is read → write → read → write in a loop: each read forces the browser to redo the
layout your previous write invalidated.

```js
// Bad — every iteration reads (forces layout) then writes (invalidates it)
for (const el of els) el.style.height = el.offsetHeight + 10 + 'px';
```

```js
// Good — batch all reads, then all writes: one layout for the whole loop
const hs = els.map(el => el.offsetHeight);
els.forEach((el, i) => { el.style.height = hs[i] + 10 + 'px'; });
```

`will-change: transform` tells the browser to promote the element to its own compositor layer *before*
the animation starts. It costs memory per layer, so apply it to the few elements that animate, remove
it when they stop, and never put it on a long list.

**The frame budget.** 60 fps = **16.7 ms** per frame, and the browser needs part of that for style,
layout, paint, and composite — so keep your JS under ~10 ms. On a 120 Hz display the budget is 8.3 ms.
Anything longer drops a frame, which is exactly what "janky" means. Split long work with
`requestIdleCallback`, a Web Worker, or chunking across frames.

---

## Security basics

| Threat | What it is | Defence |
| --- | --- | --- |
| **XSS** | Attacker's JS runs inside *your* origin, with your user's cookies, tokens, and DOM | Escape on output; `textContent` instead of `innerHTML`; sanitize if you truly must render HTML; CSP; `HttpOnly` cookies so a stolen page can't read the session |
| **CSRF** | Another site makes the browser fire an authenticated request at you; cookies ride along automatically | `SameSite=Lax`/`Strict`, a per-session CSRF token, verify the `Origin` header, and never mutate state on `GET` |
| **Clickjacking** | Your page loaded in an invisible iframe over a decoy the user clicks | `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'` |
| **MITM / downgrade** | Plaintext HTTP read or rewritten in transit | HTTPS everywhere, `Strict-Transport-Security` with a long `max-age`, redirect `http` → `https` |
| **MIME sniffing** | Browser guesses a type and executes an uploaded "image" as script | `X-Content-Type-Options: nosniff` plus a correct `Content-Type` |
| **Open redirect** | `/go?url=` sends users to an attacker's site under your domain's trust | Allowlist the destinations; never redirect to a raw user-supplied URL |
| **Trusting the client** | Prices, roles, and ids sent from the browser are attacker-controlled | Validate **and authorize** on the server for every request. Client-side checks are UX, never security |

`textContent` beats `innerHTML` because it never invokes the HTML parser: the string becomes literal
text, so `<img src=x onerror=…>` renders as characters instead of executing. Note that stripping
`<script>` tags is not a defence — event-handler attributes execute without one.

**CSP in one line.** `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'`
is a browser-enforced allowlist of where each resource type may load from — the strongest backstop
against XSS you can deploy. Adding `'unsafe-inline'` to `script-src` throws away most of that protection.

**Never trust the client.** The request body, the headers, the cookies, the query string, and the
JavaScript you shipped are all under the attacker's control. The server is the only place a rule is real.

---
*See also: [dom-api.md](dom-api.md) · [promises-async.md](promises-async.md) · [patterns-swe.md](patterns-swe.md)*
