# 13 · DOM and Browser

Every other module in this bootcamp runs in Node. This one runs where your code
actually ships: a browser tab. The exercises are self-contained HTML files —
**double-click one and it opens**. No server, no build step, no internet. Each
file carries its own checks in a panel on the right; you edit the file in your
editor, hit F5 in the browser, and watch amber TODOs turn green.

The DOM is not a hard API. What makes DOM code rot is that it is easy to write
it *without a model* — a handler here, an `innerHTML` there — and end up with a
page where six features quietly disagree about what is true. This module drills
one model until it is boring: **state → render**, plus **one listener where the
events already go**.

---

## The mental model

### 1. The document is a live tree

`document` is a tree of nodes that the browser is already painting. Your changes
land immediately — there is no commit, no flush.

```js
const li = document.createElement('li');   // detached, costs nothing
li.textContent = 'Milk';                   // still detached
list.append(li);                           // now it is on screen
```

Build detached, attach once. And `querySelectorAll` gives you a *static*
NodeList — a snapshot with `forEach` but no `map`/`filter`/`reduce`:

```js
const items = Array.from(document.querySelectorAll('.product'));  // now it is an array
```

### 2. State lives in JavaScript; the DOM is what you painted

The DOM is an output, not a database. Keep the truth in a variable and write one
function that renders it:

```js
let todos = [];                 // the truth

function render() {
  list.textContent = '';        // clear …
  for (const todo of todos) list.append(rowFor(todo));   // … and rerender
}
```

Every handler then does the same four steps: **change the array → save →
`render()` → done**. The alternative — patching the row you can see, then also
patching the counter, then also re-checking the filter — is how UIs start lying.
Reading state back out of the DOM (`Number(count.textContent)`) works right up
until the text says "5 clicks".

The clear-and-rerender step is not optional. A render function that only appends
gives you six copies of your list by lunchtime.

### 3. Events bubble — so listen where they arrive

A click on a `<button>` inside an `<li>` inside a `<ul>` fires on the button,
then the li, then the ul, then `body`, `document`, `window`. That is what makes
**event delegation** work: one listener on the container handles every child,
including children that do not exist yet.

```js
list.addEventListener('click', (event) => {
  const button = event.target.closest('.delete');   // null if the click missed
  if (!button) return;
  button.closest('li').remove();
});
```

`event.target` is what was clicked. `event.currentTarget` is what the listener
is attached to. `closest(selector)` walks up from the target and returns `null`
when nothing matches — that null check *is* your filter.

This also solves the rerender problem: if you attach listeners to every row,
every rerender throws them away and attaches new ones. Delegate once, outside
the render, and the whole question disappears.

### 4. Text is text; markup is a decision

```js
el.textContent = userInput;   // characters. always safe.
el.innerHTML   = userInput;   // runs the HTML parser. only for strings you wrote.
```

`innerHTML` with somebody else's string is how pages get hijacked —
`<img src=x onerror="...">` executes even though it is not a `<script>` tag.
Build structure with `createElement`, fill text with `textContent`.

---

## The details that bite

1. **NodeList is not an Array.** `document.querySelectorAll('li').map(...)` →
   *TypeError: not a function*. Wrap it: `Array.from(...)` or `[...nodes]`.
2. **Listeners pile up on rerender.** Attaching in a render function means the
   second render has two handlers and every click fires twice. Attach once in
   setup, on a container that survives the render.
3. **`innerHTML` is a parser, not an assignment.** It also destroys and
   recreates every child — killing focus, scroll position, and any listener
   attached to the old nodes.
4. **`event.target` is the deepest element, not the one you wired.** Click an
   icon inside a button and `target` is the icon. `closest('.btn')` fixes it.
5. **`hidden` loses to `display`.** `hidden` works because of a UA rule
   `[hidden] { display: none }` — and *any* `display` you set beats it.
   If you style `.backdrop { display: flex }`, you owe it
   `.backdrop[hidden] { display: none }`. (Exercise 14.)
6. **A click on the backdrop and a click on the dialog are the same event.**
   The inner one bubbles out to your backdrop listener. Test
   `event.target === backdrop` before you close.
7. **The click that opens a menu also reaches your outside-click listener** and
   closes it again, instantly. Guard with `dropdown.contains(event.target)`
   rather than `stopPropagation()`, which silently kills unrelated listeners
   higher up the tree.
8. **`input` vs `keyup`.** `input` catches typing, pasting, cutting and undo.
   `keyup` misses everything done with a mouse.
9. **`event.key`, not `keyCode`.** It is a string: `'Enter'`, `'Escape'`,
   `'a'`, `' '`. And Shift+Enter means "newline" — check `event.shiftKey`.
10. **Submit reloads the page.** A form without `event.preventDefault()`
    navigates, and your state is gone. Prevent first, validate after — and never
    trust a disabled button as your only guard.
11. **Attributes are strings.** `dataset.price` is `"12.50"`;
    `Number(...)` it. `aria-pressed` must be the string `"true"`/`"false"`.
12. **`localStorage` throws.** Private windows, blocked cookies, a full quota.
    Wrap reads *and* writes in try/catch, and remember everything comes back as
    a string or `null` — `Number('banana')` is `NaN`, so check
    `Number.isFinite`.
13. **A leaked `setInterval` never stops.** Click start twice and the second id
    overwrites the first; `clearInterval` can no longer reach it and the clock
    runs at double speed until reload. Guard with `if (timer !== null) return`.
14. **`classList.toggle('x')` flips; `classList.toggle('x', cond)` sets.** Use
    the two-argument form inside a render, or rerendering the same state flips
    the class back off.

---

## Cheat table

| Need | Use |
| --- | --- |
| one element | `document.querySelector('#id .cls')` |
| all elements | `document.querySelectorAll(...)` → static NodeList |
| find an ancestor | `el.closest('.selector')` → element or `null` |
| create / fill | `document.createElement('li')`, `el.textContent = s` |
| insert | `parent.append(a, b)`, `parent.prepend(x)`, `parent.insertBefore(x, ref)` |
| move a node | append it somewhere else — the DOM never copies |
| remove / empty | `el.remove()`, `parent.textContent = ''` |
| classes | `add` · `remove` · `toggle(name, cond)` · `contains` |
| data attributes | `el.dataset.userId` ⇄ `data-user-id` |
| show / hide | `el.hidden = true` (mind detail #5) |
| listen | `el.addEventListener('click', fn)` |
| event info | `event.target`, `event.currentTarget`, `event.key`, `event.shiftKey` |
| stop the default | `event.preventDefault()` (submit, link clicks) |
| persist | `localStorage.getItem/setItem/removeItem` — strings only, in try/catch |
| timers | `setTimeout` / `setInterval` → keep the id, `clearInterval(id)` |
| the URL fragment | `location.hash`, `window.addEventListener('hashchange', fn)` |

---

## How to work

1. **Two windows, side by side.** Editor on the left with
   `exercises/01-selectors-and-data.html`, browser on the right with the same
   file open (double-click it, or drag it onto the browser window).
2. **Write your code between the two dividers.** Everything under
   `// ─── TESTS (do not edit) ───` is the harness. Leave it alone.
3. **Save, then press F5.** The checks panel re-runs from scratch on every
   reload. ☐ amber = still a TODO, ✔ green = passing, ✘ red = failing with the
   reason next to it.
4. **Keep the console open (F12).** A typo throws before the checks even run,
   and the console is the only place that says so. `console.log(el)` in a
   handler is a perfectly good debugger; so is clicking an element in the
   Elements tab and typing `$0` in the console.
5. **Stuck for more than ~10 minutes?** Open the same file name in
   `solutions/`. Read the `Walkthrough` comment at the top, close it, then write
   the code yourself. Copying it teaches nothing; reading *why* teaches plenty.

Everything is offline and file-based on purpose: no `npm install`, no dev
server, no internet. The one dependency in this folder is `verify-dom.js`, which
is for checking the module itself, not for studying.

---

## Exercises

| # | file | ★ | checks | what you build |
| --- | --- | --- | --- | --- |
| 01 | selectors-and-data | ★☆☆ | 6 | count matching nodes, read `data-*`, write one summary line |
| 02 | safe-text | ★☆☆ | 7 | render hostile user text so the markup stays inert |
| 03 | render-list | ★☆☆ | 8 | array of objects → list items, plus an empty state |
| 04 | table-and-rerender | ★★☆ | 8 | data → table, and the clear-and-rerender pattern |
| 05 | classlist-active | ★★☆ | 8 | toggle classes, exactly one active item, `aria-pressed` |
| 06 | click-counter | ★☆☆ | 8 | click handlers over a state variable, clamped at zero |
| 07 | input-mirror | ★☆☆ | 8 | live preview and character counter from the `input` event |
| 08 | keyboard-events | ★★☆ | 8 | Enter submits, Shift+Enter does not, Escape clears |
| 09 | delegation-delete | ★★☆ | 9 | **event delegation**: one listener, rows you delete and add |
| 10 | delegation-actions | ★★☆ | 9 | `data-action` dispatch: toggle, delete, move up |
| 11 | form-validation | ★★☆ | 10 | inline errors, a disabled submit, `preventDefault` |
| 12 | tabs | ★★☆ | 8 | tab strip with `aria-selected` and hidden panels |
| 13 | accordion | ★★☆ | 8 | one answer open at a time, `aria-expanded` |
| 14 | modal | ★★☆ | 10 | open, close, backdrop click, Escape |
| 15 | dropdown | ★★☆ | 9 | menu button, choosing an item, the outside-click trap |
| 16 | storage-theme | ★★☆ | 10 | a counter and a theme that survive a reload, in try/catch |
| 17 | stopwatch | ★★☆ | 9 | `setInterval`, `clearInterval`, and the double-start bug |
| 18 | debounce-search | ★★☆ | 8 | write `debounce`, filter a rendered list with it |
| 19 | hash-router | ★★☆ | 9 | three pages from `location.hash` + `hashchange` |
| 20 | todo-app | ★★★ | 17 | the lot: add, toggle, delete, filter, count, persist |

**177 checks in total.** Do 01–08 in order — they are short and each one is a
tool the later files assume. 09 and 10 are the delegation pair; do not skip
either. 12–15 are four components in the same shape, so once one clicks the rest
go fast. 20 is the finale: it uses every pattern in the module and nothing else.

---

## Verifying the module itself

```
node bootcamp/13-dom-and-browser/verify-dom.js        # all 68 files
node bootcamp/13-dom-and-browser/verify-dom.js 14     # just 14-modal
```

It loads every file in a headless jsdom window, waits for the harness to publish
`window.__RESULTS`, and enforces: **solutions → 0 failed, 0 todo**;
**exercises → 0 failed** (all todo). jsdom is borrowed from the sibling
`jstrain/node_modules`; nothing is installed and nothing is downloaded. Because
the checks must run there as well as in your browser, they never measure layout
(no `offsetWidth`, no `getBoundingClientRect`, no `:hover`, no transitions) —
only structure, classes, text, values, events and storage.

---

### Extra reps

Fourteen more components in the same shape, for when you want the reps rather
than a new idea. Every one is state → render plus one listener where the events
already arrive, and every solution opens with a `Walkthrough` naming the pattern
and the classic wrong turn it saves you from. Take them in any order — 27 and 34
are the two that lean on everything else.

| # | file | ★ | checks | what you build |
| --- | --- | --- | --- | --- |
| 21 | toasts | ★★☆ | 9 | notifications that stack and remove themselves — one timer each |
| 22 | char-limit | ★★☆ | 9 | a counter that warns, then refuses to go over the limit |
| 23 | password-field | ★★☆ | 10 | show/hide the field, score it against four rules |
| 24 | sortable-table | ★★☆ | 10 | click headers to sort, with `aria-sort` and arrows |
| 25 | searchable-select | ★★☆ | 10 | filter options as you type, Enter picks the first |
| 26 | keyboard-menu | ★★☆ | 10 | ↑/↓ move a roving highlight that wraps, Enter runs it |
| 27 | form-wizard | ★★★ | 10 | three steps, per-step validation, a summary you can go back and fix |
| 28 | undo-editor | ★★☆ | 9 | a bounded snapshot stack behind one Undo button |
| 29 | reorder-list | ★★☆ | 9 | move the array, not the nodes — then rerender |
| 30 | theme-tokens | ★★☆ | 10 | themes as CSS custom properties, remembered in storage |
| 31 | load-more | ★★☆ | 9 | a paging cursor, appended batches, an exhausted state |
| 32 | inline-edit | ★★☆ | 10 | double-click to edit, Enter commits, Escape cancels |
| 33 | star-rating | ★★☆ | 10 | clicks, arrow keys, `aria-checked` and a roving tabindex |
| 34 | mini-kanban | ★★★ | 10 | three columns, moving cards, live counts, a board that survives a reload |

**135 more checks — 312 in the module.** Same rules as everything above: no
layout measurement, no `:hover`, no transitions, so every check runs in your
browser and in `verify-dom.js` alike.

### Debug hunts (the last three)

Three files here are **bug hunts**, not build tasks: the code is complete
and wrong, and the checks panel starts RED. Read it, find the one planted
bug, fix it with the smallest change until green — the same skill as
module 24, in the browser. (The scoreboard doesn't grade these; open them
and read the panel.)

| # | file | ★ | what's planted |
| --- | --- | --- | --- |
| 35 | 35-debug-tab-group | ★★☆ | a tab strip where the highlight never leaves the old tab |
| 36 | 36-debug-delete-index | ★★★ | a Delete button that removes the wrong row from the middle |
| 37 | 37-debug-escaping | ★★★ | a comment box that renders what a visitor typed — as markup |

---

**Stuck?** `cheatsheets/dom-api.md` (selecting, events, delegation, storage) · `cheatsheets/webdev-fundamentals.md` (HTTP, CORS, the rendering pipeline) · **Self-check:** `quizzes/08-node-and-web.md` · **Next:** `bootcamp/14-swe-design-patterns`
