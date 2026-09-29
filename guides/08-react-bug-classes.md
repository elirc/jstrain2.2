# React Bugs Are JavaScript Bugs in a Costume

You have spent module 24 learning to name bug classes on sight: stale
closure, off-by-one, shared reference, lost update, race. Then you open a
React file and every one of those names seems to evaporate. The stack
trace points at a hook. The symptom is "the screen shows the wrong
thing". The advice on the internet is a list of rules — *put it in the
dependency array*, *use a stable key*, *return a cleanup function* — with
no mechanism underneath, which means you can follow all of them and still
not see the next bug coming.

The rules are downstream of something simpler. React did not invent any
new bug classes. It built a very specific habitat — a function that runs
again and again, closing over a fresh set of values each time, with the
results reconciled against a tree — and the classes you already know moved
in and grew local variations. Every bug in this guide has a twin in
`bootcamp/24-debug-hunts`, and the twin is named under the section
heading.

Everything below was executed on **React 19.0, jsdom 25, Vitest 2.1.9,
Node v22.16.0** in this repo's `jstrain/` project. The printed outputs are
pasted from real runs. Where a claim is about a browser behaviour jsdom
does not model, it says so.

---

## 1 · The one mechanism: a render is a snapshot

A component function runs top to bottom and returns a description of the
UI. It will run again — many times — and each run gets its **own** copy of
every prop, every state value, and every function defined inside it.

```jsx
function Counter() {
  const [count, setCount] = useState(0);      // this run's `count`
  const onClick = () => setCount(count + 1);  // closes over THIS run's count
  return <button onClick={onClick}>{count}</button>;
}
```

`count` is not a variable that changes. It is a `const` belonging to one
render, and there is a different one belonging to the next. When you read
`count` inside a callback, you are not reading "the current count" — you
are reading *the count as it was when the function that closes over it was
created*.

Hold that sentence. It is the whole guide. React's rules exist to keep you
from accidentally holding an old snapshot after the world has moved, and
its escape hatches (`useRef`, functional updates, `useCallback`) are all
ways of saying "this part must NOT be a snapshot".

The bootcamp version of the same sentence is `07-stale-closure.js`, where
a loop builds validators that all see the last value. React builds a new
closure sixty times a second. Same class, more chances.

---

## 2 · Stale closure in an effect

*Twin: `24-debug-hunts/07-stale-closure.js`*

The most-shipped React bug in the world:

```jsx
function Ticker() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCount(count + 1), 10);
    return () => clearInterval(id);
  }, []);                                      // "run once, on mount"
  return <b>{count}</b>;
}
```

Ran it, five ticks:

```
BUGGY after 5 ticks  → 1
FIXED after 5 ticks  → 5
```

The interval never dies, and it fires all five times. It just computes the
same answer every time: the effect ran during the render where `count` was
`0`, its callback closed over that `0`, and `setCount(0 + 1)` is `1` no
matter how often you run it. The counter is not stuck — it is *pinned to a
render that ended long ago*.

Two honest fixes, and choosing between them is a design decision:

```jsx
// A · the updater form: "I don't need the value, I need the transition"
setCount((c) => c + 1);

// B · tell the truth in the dependency array and let the effect re-run
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 10);
  return () => clearInterval(id);
}, [count]);   // a new interval every tick — correct, and more work
```

A is right here. B is right when the effect genuinely depends on the value
— a subscription keyed by `userId`, say — and it is *always* better than
lying to the dependency array to make a warning go away.

**The tell.** An effect with `[]` whose body mentions a value from the
component body. `[]` means "this closure is created once and will see the
first render's values forever". If that is not what you meant, `[]` is a
bug, not an optimisation.

The lint rule (`react-hooks/exhaustive-deps`) finds most of these
mechanically. Turning it off, or silencing it with an eslint-disable
comment, is how nearly every stale-closure bug in production got there.
Treat the warning as a failing test.

---

## 3 · Keys are identity, not position

*Twins: `24-debug-hunts/01-off-by-one-pagination.js` and the browser hunt
`13-dom-and-browser/exercises/36-debug-delete-index.html`*

`key` answers one question during reconciliation: *is this the same thing
as last time, or a different thing in the same place?* Answer it with an
array index and you have told React that the thing in slot 0 is always the
same thing — so when the list shifts, React keeps the DOM node, keeps the
state attached to it, and swaps the text underneath.

Three rows, each with a text input. Type into the first, then remove the
first item:

```
INDEX KEY rows       → ["grace","linus"] ["note for ada",""]
STABLE KEY rows      → ["grace","linus"] ["",""]
```

Ada's note is now sitting in Grace's row. Nothing about that is a React
quirk: with `key={i}`, "row 0" is a *position*, and the position survived
the deletion even though the item did not. With `key={item.id}`, identity
travelled with the data and React unmounted the row that actually left.

Index keys are safe in exactly one case: a list that is append-only and
never reordered, filtered, or deleted from. That case is rarer than the
code assuming it. And the failure is invisible in a list of plain text — it
needs state attached to a row (an input, a checkbox, focus, an animation)
before anything looks wrong, which is why it survives review.

**The tell.** `key={index}` on a list that any code path splices, sorts,
filters, or prepends to. Grep for it; it is a two-minute audit that finds
real bugs.

---

## 4 · Cleanup, and the leak it prevents

*Twin: `24-debug-hunts/19-listener-leak.js`*

An effect that subscribes must return a function that unsubscribes.

```jsx
useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize); // not optional
}, []);
```

Skip the return and every mount adds a listener nothing removes. The
handler still references that render's `setWidth`, so the component cannot
be collected either; the app gets slower with each visit to the page and
nobody blames the resize handler.

Note *why* removing works here and does not in hunt 19:
`removeEventListener` matches on function identity. `onResize` is defined
inside the effect, so the cleanup closes over the same function object
that was added. Define the handler inline in both calls and you have added
one function and removed a different one — the same bug, dressed as a fix.

**StrictMode is a free test for this.** In development, React mounts every
effect, unmounts it, and mounts it again. Executed:

```
STRICTMODE mount     → ["subscribe","unsubscribe","subscribe"]
STRICTMODE + unmount → ["subscribe","unsubscribe","subscribe","unsubscribe"]
```

That is not React being broken; it is React proving your effect is
*symmetric* — that setup, cleanup, setup leaves the world in the same
state as one setup. An effect that doubles a counter, appends a row twice,
or opens two sockets under StrictMode was already wrong; StrictMode made
it fail on your machine instead of in production, on a route the user
navigates back to. (The double-invoke is development-only; it does not
happen in a production build.)

---

## 5 · The stale response race

*Twins: `24-debug-hunts/14-stale-response-race.js` and
`18-cleanup-before-await.js`*

Type `a`, then `b`. Two requests are in flight. If `a` is slow, `a` comes
back *last* — and the naive effect writes it into state, over the correct
answer:

```jsx
useEffect(() => { search(q).then(setResult); }, [q]);   // last to land wins
```

Executed, with the "a" request resolving after the "b" request:

```
RACE buggy shows     → "results for a"
RACE fixed shows     → "results for b"
```

The fix is four lines, and it is the same discipline as any cancellation
in plain JavaScript: the cleanup function marks this run abandoned, and
the continuation checks before it writes.

```jsx
useEffect(() => {
  let ignore = false;
  search(q).then((r) => { if (!ignore) setResult(r); });
  return () => { ignore = true; };
}, [q]);
```

`ignore` works because each effect run gets its own `let` — one snapshot
per run, again — and React calls the previous run's cleanup before the
next run starts. An `AbortController` passed to `fetch` is strictly better
where the API supports it (it stops the request, not just the write), but
the `ignore` flag generalises to anything awaitable.

The deeper rule, straight from hunt 18: **an `await` is a place where the
world moves on without you.** Anything you checked before it — that the
component is still mounted, that this is still the current query, that the
row still exists — is a fact about the past by the time you resume.

---

## 6 · Mutation, and why the screen did not change

*Twin: `24-debug-hunts/03-shared-reference.js`*

```jsx
items.push('b');
setItems(items);     // the same array object
```

Executed:

```
MUTATED   screen says → a
COPIED    screen says → a,b
```

React compares new state to old with `Object.is`. You handed it the array
it already had, so it concluded nothing changed and skipped the re-render
— while the array in memory *did* change, so your data and your screen now
disagree. Half a second later some unrelated update triggers a render and
the missing row appears "randomly", which is how this bug gets filed as
flaky.

Copy, then change the copy: `setItems([...items, 'b'])`,
`setUser({ ...user, name })`,
`setRows(rows.map((r) => (r.id === id ? { ...r, done: true } : r)))`.
Watch for the array methods that mutate in place — `sort`, `reverse`,
`splice`, `push`, `pop`, `shift`, `unshift` — and reach for `toSorted`,
`toReversed`, `toSpliced`, `with`, `slice`, and spread instead. That list
is the same one from `bootcamp/03-arrays-and-objects`; nothing here is
React-specific except the consequence.

**A related one, free of charge.** Two `setState` calls in one handler
cause one render, not two:

```
BATCHING  renders for two setState calls → 1   screen: 1/1
```

Which is why reading state right after setting it gives you the old value.
`setCount(count + 1)` twice in a row moves the counter by one, not two —
both calls close over the same snapshot. `setCount((c) => c + 1)` twice
moves it by two, because the updater is applied to the value React holds
rather than the one you captured. That is the lost-update class from
`24-lost-update-race.js`, in miniature and on one thread.

---

## 7 · Two sources of truth

*Twin: `24-debug-hunts/12-cache-key-collision.js` — state that outlives
what it describes*

```jsx
const [items, setItems] = useState(props.items);   // a copy, frozen at mount
const [fullName, setFullName] = useState(first + ' ' + last);  // will drift
```

State initialised from a prop ignores every later value of that prop.
State computed from other state goes stale the moment either input
changes, and the effect people add to "keep them in sync" turns one render
into two and opens a window where the screen shows the old value.

The rule: **if you can calculate it during render, calculate it during
render.** No state, no effect, no synchronisation bug.

```jsx
const fullName = first + ' ' + last;                       // just a variable
const visible = items.filter((i) => i.status === filter);  // just a variable
```

Reach for `useMemo` only when you have measured that the calculation is
expensive — and note that a memo with a wrong dependency array is a stale
closure with a performance justification attached.

Effects have a narrow job: synchronising with something **outside** React
— the network, a subscription, the DOM, a timer, `localStorage`. An effect
whose body only touches React state is nearly always a calculation, an
event handler, or a bug in disguise.

---

## 8 · The security classes, in JSX

*Twins: `26-security-hunts/02-html-escaping.js`, `07-open-redirect.js`,
and the browser hunt `13-dom-and-browser/exercises/37-debug-escaping.html`*

JSX escapes interpolated text for you: `<p>{comment.text}</p>` renders
markup a visitor typed as visible characters. That default is why React
apps have fewer XSS holes than the string-concatenation era — and it means
the holes that remain are always where you opted out.

1. **`dangerouslySetInnerHTML`** is the opt-out, honestly named. Passing
   it anything a user can influence is exactly hunt 02, and the sanitiser
   you write yourself will be weaker than one you can adopt.
2. **URLs in attributes are not protected by escaping.** `<a href={url}>`
   with `url = "javascript:..."` runs a script on click; escaping does
   nothing about it, because the string is fine — it is the *scheme* that
   is hostile. Parse it and check the protocol, the same move as
   `07-open-redirect.js`.
3. **`ref` plus DOM APIs** puts you back in plain-DOM territory, where
   `innerHTML` behaves exactly as it does in hunt 37.
4. **Secrets in the bundle.** Anything readable in the client — an env var
   your bundler inlines, a config object, a token in `localStorage` —
   ships to every visitor. Authorization belongs on the server; hiding a
   button is a UI courtesy, not access control (hunt 04, IDOR).

---

## 9 · How to test for these on purpose

The reason these bugs reach production is not that they are subtle. It is
that the tests everyone writes cannot see them. Mount a component, click
once, assert the text: every bug above survives that test.

Each class has a test shape that catches it — this is the
`29-write-the-test` skill, aimed at React:

| bug class | the test that catches it |
| --- | --- |
| stale closure | advance fake timers several times, assert the value MOVED |
| index key | give rows local state, remove a middle row, assert whose state stayed |
| missing cleanup | mount and unmount twice, count subscribes against unsubscribes |
| response race | resolve the SECOND request first, then the first, assert what shows |
| mutation | assert the screen after the update, never the array you passed |
| derived state | change the prop AFTER mount, assert the derived value followed |

Two habits carry all six: **do the second thing** — a second click, a
second mount, a second query — and **control time and order yourself**,
with deferred promises resolved in the order you choose and fake timers,
rather than hoping a real delay reproduces the interleaving. Both are the
techniques from `20-testing-and-quality`, unchanged.

---

## Now go do

1. `jstrain/exercises/react/03-effects-and-data.tsx` — effects, cleanup,
   fetching. Before you write anything, predict which exercise hides §5's
   race.
2. `jstrain/exercises/react/04-hooks.tsx` — custom hooks. Every one you
   write is a closure factory; §1 is the whole test.
3. `bootcamp/24-debug-hunts/exercises/07-stale-closure.js`, then
   `24-lost-update-race.js` — the same two classes with no framework in
   the room.
4. `bootcamp/13-dom-and-browser/exercises/37-debug-escaping.html`, then
   `bootcamp/26-security-hunts/exercises/02-html-escaping.js` — §8 from
   both sides.
5. `bootcamp/29-write-the-test/` — then write one of §9's six tests
   against a component of your own, and watch it fail before you fix it.

## Self-test

Say the answer out loud before you open the arrow.

<details>
<summary>1 · An effect with <code>[]</code> reads <code>userId</code> from
props and subscribes to that user's messages. The user switches accounts
without a page reload. What does the screen show, and what are the two
different bugs in that one line?</summary>

It keeps showing the FIRST user's messages. Two bugs, and they compound:
the effect closed over the first render's `userId` (stale closure — §2),
and because the effect never re-runs, the first subscription is never torn
down and a second is never created (cleanup timing — §4). Fix the
dependency array to `[userId]` and React does both jobs: it runs the
previous cleanup, then subscribes with the new value.
</details>

<details>
<summary>2 · A table is keyed by array index. Everything looks correct in
the demo. What must be true about the rows before the bug becomes
visible?</summary>

The rows must carry state that React or the DOM owns per node — an
uncontrolled input's value, focus, scroll position, a CSS transition, a
child component's own `useState` — AND the list must change in a way that
shifts positions: delete, insert at the top, sort, filter. Rows of plain
text re-render with the right text, because React simply overwrites the
content of the node it kept. That is why this ships: the failure needs two
ingredients and review usually sees neither.
</details>

<details>
<summary>3 · Why does <code>setCount(count + 1)</code> twice in one
handler move the counter by one, while <code>setCount(c =&gt; c + 1)</code>
twice moves it by two?</summary>

Both calls in the first version close over the same render's `count` — say
`0` — so both enqueue "set it to 1", and React batches them into one
render at value 1. It is a lost update (§6, and `24-lost-update-race.js`):
two writers computed from the same stale read. The updater form carries no
value at all; it hands React a transition, and React applies them in order
to whatever it holds — 0 to 1, then 1 to 2. Same reason the SQL fix is
`SET views = views + 1` rather than reading, adding, and writing back.
</details>

---

*Next: nothing — this is the last guide. If §9's table made you want to
write the tests rather than read about them, go to
`bootcamp/29-write-the-test`.*
