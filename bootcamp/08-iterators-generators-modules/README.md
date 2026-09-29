# 08 · Iterators, Generators & Modules

You already use this machinery every day — `for...of`, `[...spread]`,
destructuring, `Array.from`, `await`. All of it rides on one small
protocol, and once you can implement that protocol you can make your own
objects work with every one of those features. Then generators let you
write the protocol as ordinary top-to-bottom code, which buys you
something arrays cannot give you: sequences that are computed one value
at a time, on demand, possibly forever. The module half of this file is
the other thing every JS file does and few people can explain — what
`import` actually binds.

## The mental model

**1. An iterable is anything that can hand you an iterator.**
Two roles, two names. An *iterator* has `next()` returning
`{ value, done }`. An *iterable* has a `[Symbol.iterator]()` method that
returns one. `for...of` only ever asks for the second.

```js
const range = {
  [Symbol.iterator]() {
    let n = 1;
    return { next: () => (n <= 3 ? { value: n++, done: false }
                                 : { value: undefined, done: true }) };
  },
};
[...range];              // [1, 2, 3]
for (const n of range) { /* 1, 2, 3 */ }
```

Arrays, strings, Sets, Maps, `arguments` and NodeLists are iterable.
Plain objects are not — that is why `[...{a: 1}]` throws.

**2. A generator is a function that can pause.**
`function*` + `yield` writes that whole object for you. Calling it runs
**no code**; it hands back a generator object that is both an iterator
and an iterable. Each `next()` runs until the next `yield` and freezes
there, locals intact.

```js
function* countUpTo(limit) {
  for (let n = 1; n <= limit; n += 1) yield n;
}
[...countUpTo(3)];       // [1, 2, 3]
```

Read `yield` as "hand this value out and wait". Read `yield*` as "hand
out everything from that other iterable, then carry on" — that one star
is how you compose and how you recurse.

**3. Lazy means "compute on pull".**
An array must exist in full before you read element zero. A generator
computes value N when someone asks for value N, so `while (true)` is a
design, not a bug — the consumer sets the pace and decides when to stop.

```js
function* naturals() { let n = 1; while (true) yield n++; }
// take(3, naturals()) → [1, 2, 3]   and the source never runs again
```

That is the whole reason to reach for this: a pipeline of
`filterIter → mapIter → take` touches each value once and never
allocates the intermediate arrays that `arr.filter().map()` does.

**4. An import is a live window onto another module's variable.**
Not a copy. The exporting module can change the value later and every
importer sees the change; importers themselves cannot write through the
window. Modules are cached by resolved URL, so a module is a singleton
and its top-level state is shared state.

```js
// counter.js:  export let count = 0;
//              export const inc = () => { count += 1; };
import { count, inc } from './counter.js';
inc();
count;                   // 1   — the binding is live
```

## The details that bite

1. **A generator object is one-shot.** Spread it twice and the second
   read is empty — it is already at the end.
   `const g = countUpTo(3); [...g]; [...g];` → `[1,2,3]` then `[]`.
2. **Anything that consumes exhausts.** `for...of`, spread, `Array.from`
   and destructuring all drain from wherever the generator currently is.
   `g.next(); [...g];` → `[2, 3]`, not `[1, 2, 3]`.
3. **Calling a generator function runs nothing.** Your `console.log` on
   line 1 of the body will not print until the first `next()`. If your
   generator "does nothing", check whether anyone is pulling.
4. **Forgetting the `*`** turns a generator into a plain function.
   `function countUpTo() { yield 1; }` is a SyntaxError inside a
   module, but the sneakier version — `function*` written correctly and
   the result never iterated — fails silently, doing no work at all.
5. **Spreading an endless generator hangs the process.** `[...naturals()]`
   never returns. Always put a `take` between the source and the sink.
6. **`return` in a generator is not a yielded value.** It rides out on
   the final `{ value, done: true }` step, and `for...of` and spread
   throw that step's value away. Loop on `next()` by hand if you want it.
7. **`break` closes the generator.** for-of calls `.return()` on early
   exit, so a `try/finally` inside the generator runs its cleanup —
   that is the safe place to close a file handle or a DB cursor.
8. **Never yield a buffer you keep mutating.** `yield buffer` hands out a
   reference; if you then `buffer.push(...)`, every result the consumer
   collected changes underneath them. `yield [...buffer]`.
9. **Strings are iterable.** A "flatten anything iterable" helper will
   happily explode `'bc'` into `'b'`, `'c'` — and then recurse forever,
   because `'b'` is an iterable containing `'b'`. Treat strings as atoms.
10. **`for...of` on an async iterable throws a TypeError.** Async values
    live behind `[Symbol.asyncIterator]`; use `for await (const x of ...)`.
    Inside an async generator, `await` and `yield` are both legal.
11. **The first `next(value)` throws its argument away.** There is no
    paused `yield` waiting to receive it yet. Prime with a bare `next()`,
    then start sending.
12. **You cannot assign to an imported binding.** `count = 99` throws
    `TypeError: Assignment to constant variable`, and patching the
    namespace (`ns.count = 99`) throws too — namespace objects are
    read-only. Export a function if the value needs to change.
13. **Default vs named is a different door, not a different value.**
    `import x from './m.js'` gets the default; `import { x } from './m.js'`
    gets the export named `x`. In a namespace object the default shows up
    under the key `'default'`.

## Cheat table

| you write | what it means |
| --- | --- |
| `obj[Symbol.iterator]()` | returns an iterator — makes obj for-of-able |
| `it.next()` | `{ value, done }`; `done: true` means the end |
| `it.next(v)` | resumes the paused `yield`, which evaluates to `v` |
| `it.return(v)` | ends it early; `finally` blocks still run |
| `function* f()` | calling `f()` builds a paused generator object |
| `yield x` | hand out one value, freeze here |
| `yield* iterable` | hand out all of its values, then continue |
| `async function* f()` | each pull returns a promise of `{ value, done }` |
| `for await (const x of s)` | awaits every step of an async iterable |
| `[...iterable]`, `Array.from` | drains it completely (careful: endless) |
| `import d, { n as alias }` | default + named, renamed locally |
| `import * as ns` | the namespace object; default is `ns.default` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-manual-iterator.js` | ★☆☆ | `makeIterator` / `drain` — the raw `{ value, done }` contract |
| 02 | `02-range-iterable.js` | ★★☆ | a plain object with `[Symbol.iterator]`, usable in for-of and spread |
| 03 | `03-iterable-tools.js` | ★★☆ | `sumOf` / `toArray` / `nth` over arrays, strings, Sets, Maps, custom |
| 04 | `04-first-generator.js` | ★☆☆ | `countUpTo` / `repeat` — your first `function*` |
| 05 | `05-yield-mechanics.js` | ★★☆ | prove where a generator pauses, one `next()` at a time |
| 06 | `06-yield-delegation.js` | ★★★ | `concatAll` / `deepFlatten` with `yield*` and recursion |
| 07 | `07-take-naturals.js` | ★☆☆ | `naturals` forever + `take(n, iterable)` to make it finite |
| 08 | `08-cycle-fibonacci.js` | ★★☆ | `cycle` / `fibonacci` — endless sources that carry state |
| 09 | `09-map-filter-iter.js` | ★★☆ | lazy `mapIter` / `filterIter`, proved lazy with a pull counter |
| 10 | `10-chunked-windows.js` | ★★☆ | `chunked` / `windows` — buffering inside a generator |
| 11 | `11-zip-enumerate.js` | ★★☆ | `zipIter` / `enumerate` — driving two iterators in lockstep |
| 12 | `12-two-way-generator.js` | ★★★ | `next(value)` — an accumulator you send data into |
| 13 | `13-async-generator.js` | ★★★ | `async function*`, `for await`, `takeAsync` |
| 14 | `14-paginate.js` | ★★★ | walk a paged API lazily — page 2 only if page 1 ran out |
| 15 | `15-module-exports.js` | ★☆☆ | named vs default vs namespace, against a fixture module |
| 16 | `16-live-bindings.js` | ★★★ | live bindings, read-only imports, module singletons |

Do the warm-ups and core in order. Stretch if time allows.

### Extra reps

Same protocol, bigger problems. Take them in any order once the list
above is done — every file stands alone.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 17 | `17-traffic-light.js` | ★★★ | a state machine you drive with `next(event)` |
| 18 | `18-bst-in-order.js` | ★★☆ | in-order walk of a BST + `kthSmallest` that stops early |
| 19 | `19-walk-paths.js` | ★★☆ | `walkPaths` / `flattenConfig` — recursive `yield*` walkers |
| 20 | `20-lazy-sieve.js` | ★★★ | endless primes from an incremental sieve |
| 21 | `21-running-stats.js` | ★☆☆ | running totals and averages, one value at a time |
| 22 | `22-iterator-helpers.js` | ★☆☆ | `dropI` / `takeWhileI` / `dropWhileI` / `concatI` |
| 23 | `23-chain-pipeline.js` | ★★☆ | `chain()` — fluent lazy pipelines, steps vs terminals |
| 24 | `24-lazy-pairs.js` | ★★☆ | every unordered pair, one pass, endless-source safe |
| 25 | `25-permutations.js` | ★★★ | permutations without ever building them all |
| 26 | `26-generator-cleanup.js` | ★★☆ | `return()` / `throw()` / `finally` — closing a handle |
| 27 | `27-prompt-flow.js` | ★★☆ | a wizard that yields questions and receives answers |
| 28 | `28-merge-async.js` | ★★★ | merge async sources in arrival order |
| 29 | `29-buffer-async.js` | ★★☆ | batch an async stream lazily |
| 30 | `30-poller-class.js` | ★★★ | `Symbol.asyncIterator` on a class, stopped by an `AbortSignal` |

---

**Stuck?** `cheatsheets/es2020-plus.md` (`Array.fromAsync`, top-level await, module features) · **Self-check:** `quizzes/01-language-core.md` and `quizzes/08-node-and-web.md` — the lazy-iteration and module questions · **Next:** `bootcamp/09-data-structures`
