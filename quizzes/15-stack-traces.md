# 15 · Reading Stack Traces — find the culprit line

Nobody teaches this on purpose, and every on-call shift and every
interview debugging round needs it. Each question shows a real Node error
plus the code it came from. Read the trace, then say — out loud — WHICH
line is the culprit and WHY, before you reveal. The skill is not "what's
the error", it's "where do I look first, and where do I NOT."

The one rule that does most of the work: **your stack trace reads top to
bottom, newest call first. The top frame in YOUR code — skip `node:` and
`node_modules` frames — is almost always where to start.** The error
often OCCURS one call below where it was CAUSED; the trace points at the
crash, you walk back to the cause.

---

### Q1 — where do I even look?

```
TypeError: Cannot read properties of undefined (reading 'name')
    at formatUser (/app/format.js:3:19)
    at /app/routes.js:12:20
    at Array.map (<anonymous>)
    at listUsers (/app/routes.js:12:14)
```

Which file and line do you open first, and what is the likely cause?

<details><summary>Answer</summary>

**Open `format.js:3` first** — it's the top frame in your own code, and
the column (`:19`) points at the `.name` access. But the *cause* is
usually one frame down: `routes.js:12` is doing `.map(formatUser)` over an
array that contains an `undefined` element (or `formatUser` is being
called with a missing argument). Read `format.js:3` to confirm it assumes
its argument exists, then walk to `routes.js:12` to see why it didn't.
`Array.map (<anonymous>)` is a built-in frame — skip it, it's never the
bug. The trace shows you the crash; the fix is usually at the caller.
</details>

---

### Q2 — the async cliff

```
Error: ECONNREFUSED
    at TCPConnectWrap.afterConnect (node:net:1595:16)
```

Two lines. Where's YOUR code, and what does that tell you?

<details><summary>Answer</summary>

**Your code isn't in the trace at all** — every frame is `node:` internal.
That's the signature of an error thrown from an async boundary (a socket,
a timer, a lost `await`) where the stack that led there has already
unwound. The lesson is diagnostic: an all-internal trace means you're
looking at *what* failed (a refused connection) but not *where you called
it*. Fixes: `await` the call so the rejection attaches to your stack,
wrap it in try/catch to add context, or enable async stack traces. The
error itself (`ECONNREFUSED`) says the service you dialed isn't
listening — check the host/port and whether it's up.
</details>

---

### Q3 — reading past your own frame

```
RangeError: Maximum call stack size exceeded
    at isEqual (/app/eq.js:2:14)
    at isEqual (/app/eq.js:5:12)
    at isEqual (/app/eq.js:5:12)
    at isEqual (/app/eq.js:5:12)
    ... (repeated thousands of times)
```

What's the bug class, and where is it?

<details><summary>Answer</summary>

**Infinite recursion** — `isEqual` calls itself with no base case that
terminates, or with a cyclic input it doesn't guard. The same frame
repeating is the unmistakable signature; the line numbers (`2` then `5`
over and over) tell you the recursive call is at `eq.js:5` and the entry
is `:2`. Open `eq.js` and find the recursion at line 5: either the base
case is missing/wrong, or the data has a cycle (an object referencing
itself) that a naive deep-equal follows forever. Fix: a correct base
case, or a `seen` set for cycles. `RangeError: Maximum call stack` is
*always* this class — you never need to read past the first repeated
frame.
</details>

---

### Q4 — the message lies about the location

```
SyntaxError: Unexpected end of JSON input
    at JSON.parse (<anonymous>)
    at loadConfig (/app/config.js:8:26)
    at startup (/app/config.js:20:18)
```

`JSON.parse` is a built-in. So where's the bug, really?

<details><summary>Answer</summary>

**`config.js:8`** — the top frame in your code, where `JSON.parse` was
called. `JSON.parse (<anonymous>)` is the built-in doing exactly what you
asked; the bug is the *input you handed it*. "Unexpected end of JSON
input" specifically means the string was empty or truncated — so line 8 is
parsing a file that didn't exist (read returned `''`), a response that was
empty, or a partial read. Don't debug `JSON.parse`; debug what produced
its argument. Classic causes: `fs.readFile` on a missing path, an
un-awaited fetch body, a 204 response with no body.
</details>

---

### Q5 — two files, one symptom

```
TypeError: total.toFixed is not a function
    at renderReceipt (/app/view.js:14:31)
    at checkout (/app/cart.js:40:22)
```

The crash is in `view.js`. Is the bug?

<details><summary>Answer</summary>

**Probably not — the bug is likely in `cart.js` (or earlier).**
`total.toFixed is not a function` means `total` isn't a number when
`view.js:14` tries to format it — it's a string, undefined, or an object.
`view.js` is the victim: it received bad data. Walk down to `cart.js:40`,
which called `renderReceipt(total)`, and check what `total` is there —
very likely a string from a form field or a query param that was never
converted with `Number()`. This is the multi-file lesson from module 25:
the crash site tells you which VALUE is wrong; you follow that value back
across the call to find where it went wrong.
</details>

---

### Q6 — the frame that matters is buried

```
Error: Validation failed: email is required
    at validate (/app/validate.js:22:11)
    at createUser (/app/users.js:9:3)
    at POST /users (/app/routes.js:55:20)
    at Layer.handle (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
```

Which frame do you read, and which do you ignore?

<details><summary>Answer</summary>

**Read `routes.js:55` and `users.js:9`; ignore everything under
`node_modules/express`.** The error is a *deliberate* throw from your
`validate` (`validate.js:22`) — that's not a bug, that's validation
working. The real question is why `email` was missing, so you walk up your
OWN frames: `users.js:9` called `createUser`, `routes.js:55` is the
handler that took the request. The bug (if any) is that the route didn't
require the field, or the client didn't send it. The framework frames
(`Layer.handle`, `next`) are plumbing — a good trace-reader's eye slides
straight past `node_modules` to the nearest line they own.
</details>

---

### Q7 — no stack at all

```
UnhandledPromiseRejection: This error originated either by throwing
inside of an async function without a catch, or by rejecting a promise
which was not handled with .catch()
```

There's no useful line number. What happened and how do you get one?

<details><summary>Answer</summary>

**A promise rejected and nobody caught it** — and because it escaped the
synchronous call stack, the trace can't point at your code. This is the
async version of "swallowed error" (module 24, file 11) turned inside
out: the error is loud but locationless. To get a real trace: find the
promise you didn't `await` or `.catch()` — the usual culprit is a
fire-and-forget call (`doThing()` with no await), a `.then()` with no
`.catch()`, or a `forEach(async …)` (module 24, file 10). Add the
`await`/`catch`, or register `process.on('unhandledRejection', …)` to log
the reason with its stack. The fix is almost never where the message
appears — it's wherever a promise was launched and abandoned.
</details>

---

*Related: `bootcamp/24-debug-hunts` (the bug classes these traces point
at), `bootcamp/25-codebase-debug-hunts` (crash here, cause there),
`guides/01-the-event-loop-all-the-way-down.md` (why async traces lose
their stack). Answers verified against Node 22 error text.*
