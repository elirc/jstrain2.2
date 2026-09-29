# 06 · Errors and Robustness

Every function you write has two contracts: what it does when things go
right, and what it does when they don't. Juniors write the first one and
leave the second to chance — a stray `catch {}` here, a `|| null` there —
and the result is software that fails silently, loses data, and produces
bug reports that say "it just didn't work". Robustness isn't paranoia or
defensive `if`s everywhere. It's a small set of habits: throw where the
problem is, add context on the way up, never lie about what happened, and
be strict exactly once — at the edge where data comes in.

## The mental model

**1. Errors are for exceptional states, not for control flow.**
An error means "I cannot do my job and I don't know who can". A user
typing a bad email is not exceptional — it is the most predictable thing
in your system. Expected outcomes are values; unexpected ones are throws.

```js
// expected → a value the caller must look at
findUser(id)      // → { ok: false, error } when there's no such user
// unexpected → a throw nobody in this file can handle
JSON.parse(configFileTheAppCannotRunWithout)
```

**2. Throw early, catch late.**
Throw the instant reality disagrees with your assumptions — the stack is
still standing there, pointing at the cause. Then let it travel. Only one
layer, usually the outermost (a request handler, a CLI main, a job
runner), turns errors into responses. Everything in between should either
add context or get out of the way.

```js
function withdraw(balance, amount) {
  if (amount > balance) throw new Error('insufficient funds'); // early
  return balance - amount;
}
```

**3. Wrap with `cause`, never replace.**
Each layer knows something the one below it doesn't. Add that, and carry
the original along — `'ECONNREFUSED'` is true but useless, `'saving
invoice 91 failed'` is useful but hides the truth. You want both.

```js
try {
  await db.write(invoice);
} catch (err) {
  throw new Error(`saving invoice ${invoice.id} failed`, { cause: err });
}
```

**4. Parse, don't validate.**
`isValidAge(input)` returns `true` and hands you back the same messy
string. A parser returns something you can trust — or throws. Do it once,
at the boundary, and everything downstream stops second-guessing.

```js
const age = parseAge(req.body.age); // an integer 0-149 from here on
```

## The details that bite

1. **`catch (e) {}` swallows your own bugs.** A catch block catches
   everything, including the `TypeError` from your typo three lines up.
   ```js
   try { retrun risky(); } catch { return null; } // your bug, now silent
   ```
   Catch what you recognise, rethrow the rest: `if (err.code !== 'ENOENT') throw err;`

2. **Async errors escape a synchronous try.** The try block finishes
   before the promise settles, so the catch is long gone.
   ```js
   try { doAsync(); } catch { /* never runs */ }   // needs `await`
   ```

3. **`return` inside `finally` eats everything.** It replaces the return
   value *and* swallows an in-flight throw.
   ```js
   function bad() { try { throw new Error('x'); } finally { return 2; } }
   bad(); // → 2. The error is gone forever.
   ```

4. **You can throw anything, and libraries do.** A thrown string has no
   stack, no `.name`, no `.code`.
   ```js
   catch (err) { err.message.toUpperCase(); } // TypeError if err is null
   ```
   Normalize at the boundary: `err instanceof Error ? err : new Error(String(err))`.

5. **`||` for defaults throws away valid falsy values.**
   ```js
   JSON.parse('0') || 'fallback';  // → 'fallback'. 0 was correct.
   ```
   Use `??`, or better, branch on an explicit `ok` flag.

6. **Coercion lies during validation.** `Number('')`, `Number(null)` and
   `Number([])` are all `0`; `Number(true)` is `1`.
   ```js
   Number('') === 0;  // a blank form field is now a valid quantity
   ```
   Check for missing input *before* you convert.

7. **`Object.freeze` is shallow.** The object is locked; the array inside
   it is not.
   ```js
   const s = Object.freeze({ tags: ['js'] });
   s.tags.push('oops'); // works fine
   ```

8. **Matching on message text is a time bomb.** `err.message.includes('not found')`
   breaks the day someone improves the wording. Branch on `instanceof` or
   a `code` property.

9. **`array.forEach(async ...)` never waits and never catches.** Each
   callback returns a floating promise; `forEach` drops it on the floor.
   Use a `for...of` loop with `await`, or `Promise.all(array.map(...))`.

## Cheat table

| you want | use | why |
| --- | --- | --- |
| a bug, an outage, a broken invariant | `throw` | nobody here can fix it |
| a bad form field, a cache miss | a Result value | the caller has a next move |
| context added on the way up | `new Error(msg, { cause: err })` | keeps type, stack, code |
| tell failures apart | `instanceof` / `err.code` | survives reworded messages |
| guaranteed cleanup | `try { } finally { }` | no catch needed |
| a genuinely optional value | `try/catch` → default | only if the default is correct |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-throw-and-catch.js` | ★☆☆ | `describeThrow` / `toError` — what can be thrown, and how to survive it |
| 02 | `02-rethrow-selectively.js` | ★★☆ | claim the cache miss, rethrow the outage |
| 03 | `03-finally-cleanup.js` | ★★☆ | `withFile` — close the resource on every path out |
| 04 | `04-custom-error-classes.js` | ★★☆ | `ValidationError` / `NotFoundError` with real fields |
| 05 | `05-wrap-with-cause.js` | ★★☆ | `wrap` / `rootCause` / `causeChain` |
| 06 | `06-layered-propagation.js` | ★★★ | repository → service → handler, ending in a safe `{ status, body }` |
| 07 | `07-assert-invariant.js` | ★☆☆ | `assert` and a `withdraw` built out of guards |
| 08 | `08-parse-dont-validate.js` | ★★☆ | `parseAge` / `parseUser` — trustworthy values at the edge |
| 09 | `09-collect-all-problems.js` | ★★★ | report every broken field at once, not just the first |
| 10 | `10-try-catch-result.js` | ★★☆ | `tryCatch` / `unwrapOr` — failure as a value |
| 11 | `11-map-chain-results.js` | ★★★ | `mapResult` / `chainResult` pipelines that short-circuit |
| 12 | `12-safe-wrappers.js` | ★☆☆ | `safeJsonParse` / `getOrDefault` without the falsy trap |
| 13 | `13-attempt-with-retries.js` | ★★☆ | `attempt(fn, retries, onError)` — retry, but out loud |
| 14 | `14-defensive-boundary.js` | ★★★ | a settings module callers cannot corrupt |
| 15 | `15-async-error-bridge.js` | ★☆☆ | `runSafely` — rejections and throws are the same thing |
| 16 | `16-forgot-to-await.js` | ★★☆ | the missing `await` that makes a catch block a lie |

Exercises 15–16 are the only async ones here: they use promises and
`await`. If those are still new, do `bootcamp/07-async-mastery` first and
come back for the last two.

Do the warm-ups and core in order. Stretch if time allows.

Run any file directly:

```
node exercises/01-throw-and-catch.js
```

Unwritten work shows up as `todo`, not as a failure. When a file says
`all green — next file!`, compare your version with `solutions/` — the
walkthrough at the top names the classic wrong turn even when your tests
already pass.

### Extra reps

Second helpings. No new theory — the same four habits (throw where the
problem is, add context on the way up, never lie about what happened, be
strict once at the edge), pushed into the shapes production code actually
takes: wire formats, retry policies, breakers, disposers, boundaries.
Most of these are async, so do `bootcamp/07-async-mastery` first if
promises are still new.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 17 | `17-serialize-error.js` | ★★★ | `serializeError` — an error that survives JSON, cause chain and all |
| 18 | `18-deserialize-error.js` | ★★☆ | `deserializeError` — a registry turns a payload back into a real Error |
| 19 | `19-aggregate-failures.js` | ★★☆ | `runAll` / `formatFailures` — every parallel failure, in one report |
| 20 | `20-retry-policy-filter.js` | ★★☆ | `retryOn` — retry the blip, give up on the 400 |
| 21 | `21-circuit-breaker-lite.js` | ★★★ | closed → open → half-open on an injected clock |
| 22 | `22-exhaustive-switch.js` | ★☆☆ | `assertUnreachable` — the case you forgot, made loud |
| 23 | `23-rule-combinators.js` | ★★☆ | `required` / `minLen` / `matches` composed, all errors at once |
| 24 | `24-sequence-and-traverse.js` | ★★☆ | `sequenceResults` / `traverseResults` — all-or-first-error |
| 25 | `25-map-error-recover.js` | ★★★ | `mapError` / `recover` / `recoverWith` — the failure rail |
| 26 | `26-wrap-with-context.js` | ★★☆ | `wrapWithContext` — structured context, secrets redacted |
| 27 | `27-with-resource.js` | ★★★ | `withResource` — release on every path, including the async ones |
| 28 | `28-handler-error-boundary.js` | ★★☆ | `safeHandler` — logs, returns undefined, never rethrows |
| 29 | `29-error-taxonomy.js` | ★☆☆ | `isRetryable` / `isUserError` / `classify` — three buckets |
| 30 | `30-graceful-degradation.js` | ★★★ | `withFallbacks` — degrade on purpose, and say why |

Warm-ups first (22, 29), then the core set in order. The stretch five
(17, 21, 25, 27, 30) are the ones worth redoing from a blank file a week
later. 21 injects its own clock — the same trick as module 23's token
bucket, `23-node-drills/exercises/11-token-bucket-clock.js`.

---

**Stuck?** `cheatsheets/patterns-swe.md` (the error-handling section) · **Deep dive:** `guides/04-coercion-without-tears.md` · **Self-check:** `quizzes/09-spot-the-bug.md` · **Next:** `bootcamp/07-async-mastery`
