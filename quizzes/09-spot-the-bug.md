# 09 · Spot the Bug — one classic defect per snippet

Cover the answer, name the bug and the fix out loud, then reveal. Every snippet has exactly one.

---

### Q1 — leaderboard

What does this print, and what is the bug?

```js
function topScores(scores) {
  return scores.sort().slice(0, 3);
}
console.log(topScores([5, 100, 20, 3, 45]));
```

<details><summary>Answer</summary>

**`[ 100, 20, 3 ]`** — the bug is **`sort` without a comparator**, which sorts lexicographically.

With no comparator, every element is converted to a string, so `'100' < '20' < '3'`. Two further problems ride along: `sort` is descending here only by accident, and it **mutates the caller's array**. The fix does all three jobs at once: `return [...scores].sort((a, b) => b - a).slice(0, 3);`. This bug hides in tests that only use single-digit numbers.
</details>

---

### Q2 — the last three

What does this print, and what is the bug?

```js
function lastThree(items) {
  const out = [];
  for (let i = items.length - 3; i <= items.length; i++) {
    out.push(items[i]);
  }
  return out;
}
console.log(lastThree(['a', 'b', 'c', 'd', 'e']));
```

<details><summary>Answer</summary>

**`[ 'c', 'd', 'e', undefined ]`** — the bug is **off-by-one**: `i <= items.length` runs one index past the last element.

Valid indices are `0` through `length - 1`, so a forward loop's condition is `i < length`, always. Reading past the end doesn't throw, it returns `undefined` — so the array is one item too long and the corruption travels downstream instead of crashing here. Fix the condition, or delete the loop entirely: `return items.slice(-3);`.
</details>

---

### Q3 — adding tax

What does this print, and what is the bug?

```js
function addTax(cart) {
  cart.push({ name: 'tax', price: 5 });
  return cart;
}
const myCart = [{ name: 'book', price: 20 }];
const withTax = addTax(myCart);
console.log(withTax.length, myCart.length, withTax === myCart);
```

<details><summary>Answer</summary>

**`2 2 true`** — the bug is **mutating the caller's argument**; `withTax` and `myCart` are the same array.

Objects and arrays are passed by reference, so `push` inside the function edits the original. The `return` makes it *look* like a pure transformation, which is what makes this so easy to miss in review. Anything holding `myCart` — React state, a cache, a previous render — now sees the tax line too. Fix: `return [...cart, { name: 'tax', price: 5 }];`. Rule: a function that returns a value should not also mutate its inputs.
</details>

---

### Q4 — greeting a user

What does this print, and what is the bug?

```js
function loadUser(id) {
  return Promise.resolve({ id, name: 'Ada' });
}
function greet(id) {
  const user = loadUser(id);
  return 'Hello, ' + user.name;
}
console.log(greet(1));
```

<details><summary>Answer</summary>

**`Hello, undefined`** — the bug is a **missing `await`**: `user` is a Promise, and a Promise has no `name`.

No error, no warning — just `undefined` concatenated into a user-visible string. The fix is two edits, not one: `async function greet(id)` and `const user = await loadUser(id)`, which also means `greet` now returns a promise and every caller needs updating. That ripple is why "just add await" is never a one-line fix. Tells: a value that logs as `Promise { <pending> }`, or `undefined` where an object should be.
</details>

---

### Q5 — building handlers

What does this print, and what is the bug?

```js
function makeButtons(labels) {
  const handlers = [];
  for (var i = 0; i < labels.length; i++) {
    handlers.push(() => 'clicked ' + labels[i]);
  }
  return handlers;
}
console.log(makeButtons(['save', 'load']).map((h) => h()));
```

<details><summary>Answer</summary>

**`[ 'clicked undefined', 'clicked undefined' ]`** — the bug is a **stale closure over `var`**: all handlers share one `i`, which is `2` after the loop.

`var` is function-scoped, so there is exactly one binding for the whole loop and every arrow closes over it. By the time any handler runs, the loop has finished and `labels[2]` is `undefined`. Change `var` to `let` and the language creates a fresh binding per iteration — a one-word fix. The same defect appears in React as a stale value captured by an effect or callback with a missing dependency.
</details>

---

### Q6 — mapping a method

What does this print, and what is the bug?

```js
class Cart {
  constructor() {
    this.items = [];
  }
  add(item) {
    this.items.push(item);
    return this.items.length;
  }
}
const cart = new Cart();
const incoming = ['a', 'b'];
console.log(incoming.map(cart.add));
```

<details><summary>Answer</summary>

**`TypeError: Cannot read properties of undefined (reading 'items')`** — the bug is a **detached method losing its `this`**.

`cart.add` extracts the function without its receiver; `map` then calls it with no `this`, and because class bodies are always strict mode, `this` is `undefined` rather than the global object. Fixes, in order of preference: `incoming.map((x) => cart.add(x))`, `incoming.map(cart.add.bind(cart))`, or define `add` as an arrow class field. The same crash appears with `setTimeout(obj.method, 0)` and with any method passed as an event handler.
</details>

---

### Q7 — saving rows

What does this print, and what is the bug?

```js
async function saveAll(rows) {
  const saved = [];
  rows.forEach(async (row) => {
    await new Promise((r) => setTimeout(r, 5));
    saved.push(row);
  });
  return saved;
}
saveAll([1, 2, 3]).then((r) => console.log('saved:', r, 'count:', r.length));
```

<details><summary>Answer</summary>

**`saved: [] count: 0`** — the bug is **`forEach` with an async callback**: it discards the returned promises and returns immediately.

`saveAll` returns before a single save has finished, so the caller gets an empty array and believes the work is done. Worse, any error inside those callbacks becomes an unhandled rejection nobody can catch. Two correct shapes: `await Promise.all(rows.map(save))` for concurrency, or `for (const row of rows) await save(row)` for sequential order. `forEach`, `map` without `Promise.all`, and `filter` with an async predicate are all in this family — note `filter` is worse still, since every promise is truthy.
</details>

---

### Q8 — average age

What does this print, and what is the bug?

```js
function averageAdultAge(people) {
  const adults = people.filter((p) => p.age >= 18);
  const total = adults.reduce((sum, p) => sum + p.age);
  return total / adults.length;
}
console.log(averageAdultAge([{ age: 20 }, { age: 40 }]));
console.log(averageAdultAge([{ age: 10 }]));
```

<details><summary>Answer</summary>

**`NaN`**, then **`TypeError: Reduce of empty array with no initial value`** — the bug is **`reduce` without an initial value**.

With no seed, the first *element* becomes the accumulator — here an object `{age: 20}` — so the first addition is `{age:20} + 40`, which stringifies and then divides to `NaN`. And when `filter` returns nothing, `reduce` has neither seed nor element and throws outright. `reduce((sum, p) => sum + p.age, 0)` fixes both cases, and you still want a guard for `adults.length === 0` so you return `0` instead of dividing by zero.
</details>

---

### Q9 — user settings

What does this print, and what is the bug?

```js
const defaultSettings = { theme: 'dark', notify: { email: true, sms: false } };
function makeUserSettings(overrides) {
  const settings = { ...defaultSettings, ...overrides };
  settings.notify.sms = true;
  return settings;
}
const a = makeUserSettings({ theme: 'light' });
console.log(a.notify.sms, defaultSettings.notify.sms);
const b = makeUserSettings({});
console.log(b.theme);
```

<details><summary>Answer</summary>

**`true true`**, then **`dark`** — the bug is **assuming spread is a deep copy**: `settings.notify` is the same object as `defaultSettings.notify`.

Writing to `settings.notify.sms` corrupts the shared default for every future caller — a global config quietly rewritten by one function. Note `b.theme` is still `'dark'` only because the top level *was* copied; the corruption is one level down, which is exactly why it survives casual testing. Fix with `structuredClone(defaultSettings)`, an explicit nested spread (`notify: { ...defaultSettings.notify, ...overrides.notify }`), or by freezing the defaults so the write throws.
</details>

---

### Q10 — quantity label

What does this print, and what is the bug?

```js
function label(qty) {
  const count = qty || 1;
  return count + ' item(s)';
}
console.log(label(3), '|', label(0), '|', label(undefined));

function pageTitle(name) {
  return 'Welcome ' + (name || 'guest');
}
console.log(pageTitle(''), '|', pageTitle('Ada'));
```

<details><summary>Answer</summary>

**`3 item(s) | 1 item(s) | 1 item(s)`**, then **`Welcome guest | Welcome Ada`** — the bug is **`||` swallowing valid falsy values**.

`0` is a real quantity and `''` is a real (if empty) name, but `||` treats every falsy value as "missing" and substitutes the default. So a cart with zero items claims to have one. Use `??`, which only defaults on `null` and `undefined`: `qty ?? 1`. The same defect hides in `const port = config.port || 3000` (port 0), `timeout || 5000` (no timeout), and `if (count)` (zero is invisible).
</details>

---

### Q11 — readiness check

What does this print, and what is the bug?

```js
function isReady(count) {
  if (count == '0') return 'zero-ish';
  return 'has items';
}
console.log(isReady(0), isReady('0'), isReady(false), isReady([]));
console.log(isReady(null), isReady(1));
```

<details><summary>Answer</summary>

**`zero-ish zero-ish zero-ish has items`**, then **`has items has items`** — the bug is **`==` coercion**: three unrelated values all match `'0'`.

Loose equality converts both sides toward numbers, so `0 == '0'` and `false == '0'` are both `0 == 0`. `[]` escapes only because it stringifies to `''`, not `'0'` — the rules aren't even self-consistent. `===` compares type first and none of these would match. Use `===` everywhere; the single defensible exception is `x == null`, which is a deliberate "null or undefined" check.
</details>

---

### Q12 — building a grid

What does this print, and what is the bug?

```js
function buildGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const line = [];
    for (c = 0; c < cols; c++) {
      line.push(r + ':' + c);
    }
    grid.push(line);
  }
  return grid;
}
console.log(buildGrid(2, 2));
console.log('leaked global c =', typeof c !== 'undefined' ? c : 'none');
```

<details><summary>Answer</summary>

**`[ [ '0:0', '0:1' ], [ '1:0', '1:1' ] ]`**, then **`leaked global c = 2`** — the bug is an **accidental global**: the inner loop's `c` has no `let`.

The output is correct, which is the trap — the defect is invisible until a second function uses `c`, or until two calls interleave across an `await` and clobber each other's counter. In sloppy mode, assigning to an undeclared name creates a property on the global object instead of throwing. Add `let`. Then make it impossible: ES modules and `'use strict'` turn this exact line into a `ReferenceError`, and a linter's `no-undef` catches it before you ever run the code.
</details>

---

### Q13 — removing even numbers

What does this print, and what is the bug?

```js
function removeEven(nums) {
  nums.forEach((n, i) => {
    if (n % 2 === 0) nums.splice(i, 1);
  });
  return nums;
}
console.log(removeEven([1, 2, 4, 6, 7]));
```

<details><summary>Answer</summary>

**`[ 1, 4, 7 ]`** — the bug is **mutating an array while iterating it**: every removal shifts the remaining elements left, so the loop skips one.

At index 1 it removes `2`; `4` slides into index 1, but the iterator has already moved on to index 2, which now holds `6`. So `4` is never examined. The correct tool is a non-mutating filter: `return nums.filter((n) => n % 2 !== 0);`. If you must remove in place, iterate **backwards** — indices ahead of you don't move when you splice behind you. The same hazard applies to deleting keys from an object you're iterating.
</details>

---

### Q14 — the broken chain

What does this print, and what is the bug?

```js
function fetchThenLog(id) {
  return Promise.resolve({ id })
    .then((user) => {
      Promise.resolve('profile-of-' + user.id);
    })
    .then((profile) => {
      console.log('profile:', profile);
      return profile;
    });
}
fetchThenLog(7).then((v) => console.log('final:', v));
```

<details><summary>Answer</summary>

**`profile: undefined`**, then **`final: undefined`** — the bug is a **missing `return` inside a `.then`**, which breaks the chain.

The first handler creates a promise and throws it away; its own return value is `undefined`, so that's what flows to the next link. The inner promise still runs — unobserved and unawaited, so any rejection inside it becomes an unhandled rejection. Add `return` (or drop the braces: `.then((user) => Promise.resolve(...))`). This is the `.then` twin of the missing `await` in Q4, and it's why an arrow with a block body deserves a second look.
</details>

---

### Q15 — finding a user

What does this print, and what is the bug?

```js
function findUser(users, id) {
  for (let i = 0; i < users.length; i++) {
    if (users[i].id = id) {
      return users[i];
    }
  }
  return null;
}
const users = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
console.log(findUser(users, 2));
console.log(users);
```

<details><summary>Answer</summary>

**`{ id: 2, name: 'a' }`**, then **`[ { id: 2, name: 'a' }, { id: 2, name: 'b' } ]`** — the bug is **assignment (`=`) instead of comparison (`===`)** inside the condition.

`users[i].id = id` overwrites the first record's id with `2`, and the expression evaluates to `2`, which is truthy — so the loop returns the *wrong* record on its very first pass, having silently corrupted the data on the way. Two records now share id `2`. The fix is `===`. Prevention: any linter's `no-cond-assign` rule flags this, and `users.find((u) => u.id === id) ?? null` removes the hand-written loop entirely.
</details>

---

### Q16 — the parallel save

What is the bug?

```js
async function saveAll(records) {
  const saved = [];
  records.forEach(async (r) => {
    saved.push(await db.insert(r));
  });
  return saved;
}
```

<details><summary>Answer</summary>

**`saveAll` returns `[]`** — the bug is **`forEach` with an async callback**. `forEach` does not await anything; it fires all the callbacks and returns immediately, so the function returns `saved` while it is still empty and the inserts finish later, into nothing anyone is waiting on.

`forEach` ignores the promises its callback returns. Use `await Promise.all(records.map((r) => db.insert(r)))` to run them concurrently and wait, or a `for...of` loop with `await` inside to run them in sequence. This is one of the most common async bugs in real code, and it fails silently — no error, just missing data. (Drilled in `bootcamp/24-debug-hunts/10`.)
</details>

---

### Q17 — one flaky call

What is the bug, and what breaks?

```js
async function dashboard(teamIds) {
  const data = await Promise.all(teamIds.map((id) => fetchTeam(id)));
  return data;
}
```

<details><summary>Answer</summary>

**One rejected `fetchTeam` rejects the whole dashboard** — the bug is **`Promise.all` where partial failure should be tolerated**.

`Promise.all` is all-or-nothing: the first rejection rejects the combined promise and discards every result that already succeeded, so one flaky team blanks the entire board. When you want every result regardless of individual failures, use `Promise.allSettled` and map over `{ status, value | reason }`, rendering an error tile for the rejected ones. Reach for `all` only when partial success is genuinely useless to you. (Drilled in `bootcamp/24-debug-hunts/17`.)
</details>

---

### Q18 — the search box

What is the bug, and why is it dangerous?

```js
function search(db, term) {
  return db.prepare(`SELECT * FROM users WHERE name LIKE '%${term}%'`).all();
}
```

<details><summary>Answer</summary>

**SQL injection** — the bug is **user input concatenated into the query string**.

A `term` of `' OR 1=1 --` closes the string literal, adds an always-true clause, and comments out the rest, returning every row; worse payloads read other tables or drop them. The value became part of the program instead of data. The fix is a parameterized query — a `?` placeholder with the value bound separately, and the wildcards added on the JavaScript side: `WHERE name LIKE ?` bound with `` `%${term}%` ``. Parameterize every value, always, even the "obviously safe" ones. (Drilled in `bootcamp/26-security-hunts/01`.)
</details>

---

### Q19 — the profile update

What is the bug, and what does an attacker do with it?

```js
function updateProfile(user, patch) {
  return { ...user, ...patch };
}
```

<details><summary>Answer</summary>

**Mass assignment / privilege escalation** — the bug is **spreading a request body wholesale onto a domain object**.

If `patch` comes from a request, `{ ...patch }` copies every key the client sent — including `role: 'admin'` or `balance: 1000000` — straight onto the user. The fix is an allowlist: pull only the fields users may edit (`for (const k of ['name', 'email']) if (k in patch) safe[k] = patch[k]`) and ignore the rest by construction. Allowlist, never denylist — a blocklist ships a hole the day someone adds a column. (Drilled in `bootcamp/26-security-hunts/06`.)
</details>

---

### Q20 — the report that loses rows

What is the bug?

```sql
SELECT c.name, COUNT(o.id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.total_cents >= 5000
GROUP BY c.id;
```

<details><summary>Answer</summary>

**The `LEFT JOIN` is silently turned back into an inner join** — the bug is **a `WHERE` condition on the right-hand (nullable) table**.

The join keeps every customer, filling `o.*` with NULL for those with no matching orders. Then `WHERE o.total_cents >= 5000` runs, and `NULL >= 5000` is NULL (not true), so every customer without a big order — including those with no orders at all — is filtered out. The fix is to move the condition into the join: `ON o.customer_id = c.id AND o.total_cents >= 5000`, so it decides what MATCHES rather than which rows survive. LEFT JOIN plus a WHERE on the right table is almost always this bug. (Drilled in `bootcamp/24-debug-hunts/21`.)
</details>

---

### Q21 — the five-minute cache

What is the bug? `now()` and `ttl` are both in milliseconds.

```js
const CACHE_FOR = 300; // five minutes
cache.set(key, value, CACHE_FOR);
```

<details><summary>Answer</summary>

**A unit mismatch: `300` is 300 milliseconds, not five minutes** — the bug is **a bare number whose comment names a different unit than the code uses**.

Five minutes is `5 * 60 * 1000 = 300000` ms; `300` expires the entry after a third of a second. No error, correct values, just a cache that barely caches — the symptom is a cost, not a crash. The fix is to write the arithmetic out and put the unit in the name: `const CACHE_FOR_MS = 5 * 60 * 1000;`. Seconds-vs-milliseconds is the classic; cents-vs-dollars and bytes-vs-KB are its siblings. (Drilled in `bootcamp/25-codebase-debug-hunts/03`.)
</details>

---

### Q22 — reset tokens

What is the bug, and why does it matter?

```js
let counter = 1000;
function makeResetToken() {
  return `reset-${(counter++).toString(16)}`;
}
```

<details><summary>Answer</summary>

**Predictable secrets** — the bug is **a security token built from a counter instead of a CSPRNG**.

The tokens are `reset-3e9`, `reset-3ea`, … — unique, but trivially guessable, so an attacker who requests one reset can walk to every other account's token. Unique is not the same as unpredictable. The fix is cryptographic randomness: `crypto.randomBytes(16).toString('hex')` gives 128 bits that are unique in practice AND unguessable. Anything a bearer of the value can act on — session ids, API keys, reset links — needs crypto randomness, never `Math.random()` or a counter. (Drilled in `bootcamp/26-security-hunts/05`.)
</details>

---

### Q23 — the retried charge

What is the bug in this "make it reliable" wrapper?

```js
async function charge(amount) {
  return withRetry(() => paymentApi.charge(amount), { retries: 3 });
}
```

<details><summary>Answer</summary>

**Double (or triple) charging** — the bug is **retrying a non-idempotent operation without an idempotency key**.

If the first charge succeeds but its response is lost to a network blip, `withRetry` sees a failure and charges again — the customer pays twice. Retries make a call reliable but not safe; safety needs an idempotency key: the client sends the same key for one logical charge, and the server performs the work at most once per key, returning the stored result to any repeat. Retry freely for idempotent reads; for writes, pair the retry with a key. (Drilled in `bootcamp/28-api-consumer/04`.)
</details>

---

### Q24 — the ticker that won't stop

What is the bug?

```js
start() { this.feed.on('price', (p) => this.record(p)); }
stop()  { this.feed.off('price', (p) => this.record(p)); }
```

<details><summary>Answer</summary>

**`stop()` removes nothing** — the bug is **`off` given a different function reference than `on` received**.

`on` and `off` compare listeners by identity, and the two arrow functions — even with identical source — are different objects, so `off` finds no match and detaches nothing. After each start/stop cycle a dead listener is left attached, and prices get counted multiple times. The fix is to store the handler once and pass the same reference to both: `this.onPrice = (p) => this.record(p)` in `start`, `this.feed.off('price', this.onPrice)` in `stop`. Same bug as `removeEventListener` with a fresh `this.method.bind(this)`. (Drilled in `bootcamp/24-debug-hunts/19`.)
</details>
