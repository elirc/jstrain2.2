# DOM API

Selecting, building, styling, and listening to the document — plus forms, storage, and observers.

## Top of mind

| Need | Use | Note |
| --- | --- | --- |
| One element | `document.querySelector('.x')` | `null` when nothing matches — always guard |
| Many, then `.map` | `[...document.querySelectorAll('.x')]` | `NodeList` has `forEach` but **no** `map`/`filter` |
| Handle clicks on a list | one listener on the parent + `e.target.closest('.item')` | Survives items added later |
| Insert user text | `el.textContent = s` | `innerHTML` with untrusted input is an XSS hole |
| Remove many listeners | `{ signal: ac.signal }` then `ac.abort()` | Beats keeping every function reference around |

---

## Selecting

| Call | Returns | Notes |
| --- | --- | --- |
| `document.querySelector(sel)` | First match or `null` | Any CSS selector; invalid selector throws `SyntaxError` |
| `document.querySelectorAll(sel)` | **Static** `NodeList` (a snapshot) | Later DOM changes do **not** update it |
| `el.querySelector(sel)` | First match **inside** `el` | Selector is still matched against the whole doc — use `:scope > .x` for direct children |
| `document.getElementById(id)` | Element or `null` | Fastest; **only** on `document`, not on elements |
| `document.getElementsByClassName(c)` | **Live** `HTMLCollection` | Re-queries as you read it — deleting while looping skips items |
| `document.getElementsByTagName(t)` | **Live** `HTMLCollection` | Same liveness trap |
| `el.closest(sel)` | Nearest **self-or-ancestor** matching, or `null` | The delegation workhorse |
| `el.matches(sel)` | `boolean` | "Is this element a `.item`?" |
| `a.contains(b)` | `boolean` | An element **contains itself** (`el.contains(el)` → `true`) |
| `el.children` | Live `HTMLCollection` of **elements** | What you almost always want |
| `el.childNodes` | Live `NodeList` incl. **text and comment** nodes | Whitespace in your HTML shows up here as text nodes |
| `el.parentElement` | Parent element or `null` | `parentNode` can also be a `Document`/`DocumentFragment` |
| `el.nextElementSibling` / `previousElementSibling` | Element or `null` | `nextSibling` walks text nodes too |
| `el.firstElementChild` / `lastElementChild` | Element or `null` | `firstChild` may be a whitespace text node |

**`NodeList` is not an array.** It has `forEach`, `entries`, `keys`, `values`, `length`, and is iterable —
but no `map`, `filter`, `find`, or `reduce`. `HTMLCollection` has none of them, not even `forEach`.

```js
[...document.querySelectorAll('li')].map(li => li.textContent);   // spread, then array methods
Array.from(document.querySelectorAll('li'), li => li.dataset.id); // one pass, same result
```

---

## Creating & inserting

| Call | Does | Notes |
| --- | --- | --- |
| `document.createElement('div')` | New detached element | Nothing renders until you insert it |
| `document.createTextNode('hi')` | New text node | Never parses HTML — safe by construction |
| `node.cloneNode(deep)` | Copy of the node | Defaults to `false` = **shallow**. Never copies event listeners. Copies `id` — fix it |
| `parent.append(...nodes)` | Add at the end | Takes **multiple** args, and plain strings become text nodes. Returns `undefined` |
| `parent.prepend(...nodes)` | Add at the start | Same signature |
| `el.before(...)` / `el.after(...)` | Insert as siblings | Called on the element, not the parent |
| `el.replaceWith(...)` | Swap the element out | Multiple replacements allowed |
| `el.remove()` | Detach from the DOM | No parent lookup needed |
| `parent.appendChild(node)` | Add one `Node` at the end | Old API: **one** Node, no strings, returns the node |
| `parent.insertBefore(new, ref)` | Insert before `ref` | `ref === null` → appends |
| `el.insertAdjacentHTML(pos, html)` | Parse HTML at a position | Does **not** re-parse siblings, so it keeps their listeners |
| `el.insertAdjacentElement(pos, el2)` | Same, with an element | Returns the inserted element |
| `el.insertAdjacentText(pos, str)` | Same, as text | The safe variant of `insertAdjacentHTML` |

**`appendChild` and `append` MOVE, they don't copy.** If the node is already in the document it is
removed from its old parent first. Use `cloneNode(true)` when you want two of them.

```js
const li = document.querySelector('li');
listB.appendChild(li);          // li leaves listA — one node, one place
listB.appendChild(li.cloneNode(true));   // this one is a copy
```

### The four position strings

```txt
<!-- beforebegin -->
<div>
  <!-- afterbegin -->
  existing content
  <!-- beforeend -->
</div>
<!-- afterend -->
```

`beforebegin` and `afterend` need the element to have a parent, otherwise nothing happens.

### `innerHTML` vs `textContent` vs `innerText`

| Property | Reads | Writes | Watch out |
| --- | --- | --- | --- |
| `innerHTML` | Serialized HTML of the children | **Parses** the string as HTML | **XSS.** Never pass user input. Also destroys and rebuilds children, killing their listeners |
| `textContent` | Raw text of all descendants, hidden ones included | Sets one text node, no parsing | Fastest and safest. Whitespace comes through exactly as written |
| `innerText` | The **rendered** text — skips `display:none`, collapses whitespace, respects `<br>` | Sets text, honouring line breaks | Reading it can force a **layout reflow**; it is layout-aware, so it is slow in loops |

```js
el.innerHTML = '<img src=x onerror=alert(1)>';  // that onerror DOES fire
el.textContent = '<img src=x onerror=alert(1)>'; // renders as literal text — safe
```

`<script>` tags injected via `innerHTML` do **not** execute — but event-handler attributes like
`onerror` and `onload` do. "No `<script>` tag" is not a defence.

### Batch with a fragment

```js
const frag = document.createDocumentFragment();
for (const t of items) frag.append(Object.assign(document.createElement('li'), { textContent: t }));
list.append(frag);              // one insertion, one reflow; frag is now empty
```

### `<template>`

Content inside `<template>` is parsed but inert — no rendering, no image fetches, no script runs.

```js
const tpl = document.querySelector('#row');
const row = tpl.content.cloneNode(true);   // true = deep, or you get an empty fragment
row.querySelector('.name').textContent = user.name;  tbody.append(row);
```

---

## classList & styles

| Call | Does | Notes |
| --- | --- | --- |
| `el.classList.add('a', 'b')` | Adds classes | Multiple args; adding an existing class is a no-op |
| `el.classList.remove('a', 'b')` | Removes | Removing a missing class is a no-op, not an error |
| `el.classList.toggle('a')` | Flips it | **Returns `true` if the class is present afterwards** |
| `el.classList.toggle('a', cond)` | Force mode | `true` → add, `false` → remove. This replaces most `if/else` class code |
| `el.classList.contains('a')` | `boolean` | — |
| `el.classList.replace('old', 'new')` | Swap one class | Returns `false` if `old` wasn't there |
| `el.className` | The whole `class` attribute as a string | Assigning **wipes every other class**. Prefer `classList` |
| `el.style.backgroundColor = 'red'` | Sets an **inline** style | camelCase; reading gives `''` unless it was set inline |
| `el.style.setProperty('--brand', '#f00')` | Sets a CSS custom property | The only way — `el.style['--brand']` does nothing |
| `getComputedStyle(el)` | Read-only resolved styles | Lengths come back as `px` strings like `'16px'`; use `parseFloat` |
| `getComputedStyle(el).getPropertyValue('--brand')` | Reads a CSS var | May include surrounding whitespace — `.trim()` it |
| `el.dataset` | `data-*` attributes as an object | See the next section |
| `el.getBoundingClientRect()` | `DOMRect` | Fields: `x`, `y`, `top`, `right`, `bottom`, `left`, `width`, `height` |

`getBoundingClientRect()` is **viewport-relative** and reflects CSS transforms. Values are fractional.
For document coordinates add the scroll: `rect.top + window.scrollY`.

| Measure | Includes | Excludes |
| --- | --- | --- |
| `offsetWidth` / `offsetHeight` | content + padding + border + scrollbar | margin |
| `clientWidth` / `clientHeight` | content + padding | border, scrollbar, margin |
| `scrollWidth` / `scrollHeight` | full content **including overflow** | border, margin |

All three are rounded to integers; `getBoundingClientRect().width` is the fractional one.
`el.scrollHeight > el.clientHeight` is the standard "is this element scrollable?" test.

---

## Attributes & data-\*

| Call | Returns | Notes |
| --- | --- | --- |
| `el.getAttribute('href')` | String or **`null`** | Never `undefined` |
| `el.setAttribute('name', v)` | `undefined` | `v` is stringified — `setAttribute('x', 0)` stores `'0'` |
| `el.removeAttribute('name')` | `undefined` | The way to un-set a boolean attribute |
| `el.hasAttribute('name')` | `boolean` | — |
| `el.toggleAttribute('open', force?)` | `boolean` (present afterwards) | For boolean attributes; `force` works like `classList.toggle` |
| `el.attributes` | Live `NamedNodeMap` | `[...el.attributes].map(a => [a.name, a.value])` |

**Attribute vs property.** The attribute is what's in the HTML (the *initial* value); the property is
the element's *current* state. Typing in a field changes `input.value` but leaves
`input.getAttribute('value')` — mirrored as `input.defaultValue` — untouched.

```js
// <input id="q" value="hi">   user then types "hey"
q.value;                  // => 'hey'   the live state
q.getAttribute('value');  // => 'hi'    the markup, unchanged
```

| Case | Attribute | Property |
| --- | --- | --- |
| Text input | `value` = default | `value` = current text |
| Checkbox | `checked` = default | `checked` = current state (`defaultChecked` = the attribute) |
| Link | `getAttribute('href')` = `'/a'` (raw) | `a.href` = `'https://site.com/a'` (resolved absolute URL) |
| Class | `class` | `className` / `classList` |
| Label `for` | `for` | `htmlFor` (`for` is a reserved word) |

**Boolean attributes** (`disabled`, `checked`, `readonly`, `required`, `hidden`, `open`, `selected`)
are true by **presence**. `disabled="false"` is still disabled. Set them through the property:

```js
btn.disabled = false;           // works
btn.setAttribute('disabled', 'false');  // still disabled — the attribute exists
```

### `data-*` ⇄ `dataset`

Strip `data-`, then delete each `-` and uppercase the letter after it.

| Attribute | Property |
| --- | --- |
| `data-id` | `dataset.id` |
| `data-user-id` | `dataset.userId` |
| `data-x-1` | `dataset['x-1']` — only a `-` before a **lowercase letter** is camelised |
| set `dataset.rowIndex = 3` | writes `data-row-index="3"` |

```js
// <div data-user-id="42" data-role="admin">
el.dataset.userId;              // => '42'   ALWAYS a string — coerce with Number()
delete el.dataset.role;         // removes the attribute entirely
```

`aria-*` has no dataset-style shortcut — use `setAttribute('aria-expanded', 'true')` (the value is a
**string**, so `'false'` is truthy in JS but correctly means false to a screen reader). `aria-hidden="true"`
removes an element from the accessibility tree without hiding it visually.

---

## Events

| Event | Fires when | Key properties |
| --- | --- | --- |
| `click` | Primary activation — mouse, tap, and Enter/Space on buttons and links | `target`, `clientX/Y`, `pageX/Y`, `offsetX/Y`, `ctrlKey`/`shiftKey`/`altKey`/`metaKey`, `detail` (click count) |
| `dblclick` | Two rapid clicks | Fires **after** two `click` events, not instead of them |
| `mousedown` / `mouseup` | Button pressed / released | `button` (`0` left, `1` middle, `2` right), `buttons` (bitmask of held buttons) |
| `mousemove` | Pointer moves | Fires *constantly* — throttle with `requestAnimationFrame` |
| `mouseover` / `mouseout` | Pointer crosses **any** boundary, children included | **Bubbles.** `relatedTarget` = the element you came from / went to |
| `mouseenter` / `mouseleave` | Pointer enters / leaves the element as a whole | **Does not bubble**, and ignores child boundaries. This is the one you usually want for hover state |
| `keydown` | Key pressed | `key` (`'a'`, `'A'`, `'Enter'`, `'ArrowUp'`, `' '`), `code` (physical: `'KeyA'`, `'Space'`), `repeat`, modifier flags, `isComposing` |
| `keyup` | Key released | Same properties; `repeat` is always `false` |
| `input` | Value changes **as it happens** — typing, paste, drag-drop, autofill | `target.value`. Bubbles. Use for live search, counters, validation |
| `change` | Text fields: on **blur/commit**. Checkbox, radio, select, file: **immediately** | `target.value` / `target.checked`. The reason a "why doesn't it update while typing" bug is always this |
| `submit` | Form is submitted | `e.preventDefault()`, `e.submitter` (the button used). `form.submit()` does **not** fire it |
| `focus` / `blur` | Element gains / loses focus | **Do not bubble.** `relatedTarget` = the other element |
| `focusin` / `focusout` | Same moments, but they **bubble** | Use these when delegating focus handling to a container |
| `scroll` | Scroll position changed | Read `el.scrollTop` / `window.scrollY`. Not cancellable — `preventDefault` does nothing |
| `resize` | Window size changed (`window` only) | `window.innerWidth` / `innerHeight`. For elements use `ResizeObserver` |
| `DOMContentLoaded` | On `document`: HTML parsed and deferred scripts have run | Does **not** wait for images, fonts, or subframes |
| `load` | On `window`: everything, images included. Also per-element on `img`/`script`/`iframe` | Pair with `error` for image fallbacks |
| `pointerdown` / `pointermove` / `pointerup` / `pointercancel` | Unified mouse + touch + pen | `pointerId`, `pointerType` (`'mouse'`/`'pen'`/`'touch'`), `isPrimary`, `pressure`, plus all mouse props. `el.setPointerCapture(e.pointerId)` keeps events coming during a drag |
| `wheel` | Wheel or trackpad scroll gesture | `deltaX`/`deltaY`, `deltaMode` (`0` px, `1` line, `2` page). Often **passive by default** — pass `{ passive: false }` if you need `preventDefault` |
| `contextmenu` | Right-click or the menu key | `preventDefault()` to replace the native menu |
| `copy` / `cut` / `paste` | Clipboard action on the document or a field | `e.clipboardData.getData('text/plain')`; `preventDefault()` + `setData` to override |
| `dragstart` / `dragover` / `drop` | HTML5 drag and drop | `e.dataTransfer` — `setData`/`getData`, `files`, `dropEffect`. **You must `preventDefault()` in `dragover` or `drop` never fires** |
| `dragenter` / `dragleave` / `dragend` | Entering / leaving a target, gesture finished | `dragleave` fires on child boundaries too — count enters/leaves or check `relatedTarget` |
| `transitionend` | A CSS transition finished | `propertyName`, `elapsedTime`. Fires **once per property**, and never if the transition was interrupted or never started |
| `animationend` / `animationstart` / `animationiteration` | CSS animation lifecycle | `animationName`, `elapsedTime` |
| `visibilitychange` | On `document`: tab hidden or shown | Read `document.visibilityState` (`'visible'` / `'hidden'`). Pause timers, video, polling here |
| `beforeunload` | Page is about to close | `e.preventDefault()` shows the browser's **generic** confirm dialog. Custom text is ignored; unreliable on mobile — save on `visibilitychange` instead |
| `popstate` | On `window`: back/forward within the history | `e.state`. **Not** fired by your own `pushState`/`replaceState` calls |
| `hashchange` | On `window`: the `#fragment` changed | `oldURL`, `newURL` |
| `storage` | `localStorage`/`sessionStorage` changed **in another tab** | `key` (`null` on `clear()`), `oldValue`, `newValue`, `url`, `storageArea` |

---

## Event mechanics

```js
el.addEventListener('click', handler, { once: true, passive: true });
el.removeEventListener('click', handler);      // the SAME function reference
```

| Option | Type | Effect |
| --- | --- | --- |
| `capture` | `boolean` | Run during the capture phase instead of bubble. A bare third-arg boolean means this |
| `once` | `boolean` | Auto-removes itself after the first call |
| `passive` | `boolean` | Promises you won't call `preventDefault()`, so scrolling never waits on you. Ignored `preventDefault` warns in console |
| `signal` | `AbortSignal` | `ac.abort()` removes **every** listener registered with that signal |

```js
const ac = new AbortController();
el.addEventListener('click', f1, { signal: ac.signal });
window.addEventListener('resize', f2, { signal: ac.signal });   // ac.abort() kills both
```

**`removeEventListener` needs the identical function.** An inline arrow creates a new function every
call, so `removeEventListener('click', () => {})` silently removes nothing. Store the reference, or use
`signal`. The `capture` flag must match too — a capturing listener is removed only with `{ capture: true }`.

### The three phases

```txt
              window                     1. CAPTURE  window → … → parent
                 |  \                    2. TARGET   listeners on the element itself
             document  \                 3. BUBBLE   parent → … → window
                 |      \  capture
               <body>    v               e.eventPhase: 1 | 2 | 3
                 |      /
               <div>   /  bubble
                 |    ^
             <button>  <-- event originates here (e.target)
```

Most events bubble. These do **not**: `focus`, `blur`, `mouseenter`, `mouseleave`, `load`, `scroll`
(on an element). Capture is the only way to see a non-bubbling event from an ancestor.

| Expression | Is | Changes during propagation? |
| --- | --- | --- |
| `e.target` | Where the event originated — the deepest element | No, constant |
| `e.currentTarget` | The element whose listener is running right now | Yes. `null` once the handler returns — don't stash it in a `setTimeout` |

| Method | Stops | Does **not** stop |
| --- | --- | --- |
| `e.preventDefault()` | The browser's default action: navigation, submit, checkbox toggle, context menu, text selection | Propagation. Other listeners still run |
| `e.stopPropagation()` | The event reaching any **other node** | The default action, and other listeners **on this same node** |
| `e.stopImmediatePropagation()` | Other nodes **and** remaining listeners on this node | The default action |

`preventDefault()` only works if `e.cancelable` is `true`; check `e.defaultPrevented` afterwards.
Returning `false` from an `addEventListener` handler does nothing (that was an inline-handler / jQuery trick).

### Custom events

```js
el.dispatchEvent(new CustomEvent('cart:add', { detail: { id: 7 }, bubbles: true }));
document.addEventListener('cart:add', e => console.log(e.detail.id));   // logs: 7
```

`bubbles` defaults to **`false`** — the number one reason a custom event "doesn't fire" on an ancestor.
`dispatchEvent` is synchronous and returns `false` if a listener called `preventDefault()` (needs `cancelable: true`).

### Delegation pattern

```js
list.addEventListener('click', e => {
  const item = e.target.closest('.item');
  if (!item || !list.contains(item)) return;    // clicked the gap, or a closest() outside list
  remove(item.dataset.id);
});
```

Why: one listener instead of N, and it works for items added to the DOM **after** you bound it.
The `list.contains(item)` guard matters when `list` is itself nested inside another `.item`.

---

## Forms

| Call | Returns / does | Notes |
| --- | --- | --- |
| `form.elements` | Live `HTMLFormControlsCollection` | Index by name or id: `form.elements.email`. A radio group by name gives a `RadioNodeList` whose `.value` is the checked one |
| `new FormData(form)` | Iterable of `[name, value]` pairs | Skips unnamed and **disabled** controls, and unchecked checkboxes. File inputs yield `File` objects |
| `Object.fromEntries(fd)` | Plain object | **Loses duplicate keys** — with two `name="tag"` boxes you keep only the last |
| `fd.getAll('tag')` | Array of every value for that name | The fix for checkbox groups and `<select multiple>` |
| `fd.get`, `fd.has`, `fd.append`, `fd.set`, `fd.delete` | The rest of the API | `append` adds, `set` replaces all values for that name |
| `input.value` | Always a **string** | `''` when empty, even for `type="number"` |
| `input.valueAsNumber` | `number`, or `NaN` if unparseable/empty | Works for `number`, `range`, and date-family inputs |
| `input.checked` | `boolean` | For checkbox and radio |
| `input.files` | `FileList` (array-like) | `[...input.files]`, then `file.name` / `.size` / `.type` |
| `select.value` | Value of the selected option | A single `<select>` auto-selects its first option, so this is rarely `''` |
| `select.selectedOptions` | `HTMLCollection` of selected `<option>`s | The one to use with `multiple` |
| `form.reset()` | Restores every control to its default | Fires a `reset` event |
| `form.requestSubmit(btn?)` | Submits **like a real button** | Runs validation and fires `submit`. `form.submit()` skips both |

```js
form.addEventListener('submit', e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));   // verified: last duplicate key wins
});
```

`e.submitter` on the submit event is the button that triggered it — use it to tell Save from Delete
in a form with two buttons.

### Constraint validation

| Piece | Does |
| --- | --- |
| `required`, `min`, `max`, `minlength`, `maxlength`, `pattern`, `type="email"` | Declarative rules in the HTML |
| `input.checkValidity()` | `boolean`. Fires an `invalid` event on failure, shows nothing |
| `input.reportValidity()` | Same check **plus** the browser's error bubble and focus |
| `input.setCustomValidity(msg)` | Non-empty string ⇒ the field is invalid with that message. Pass `''` to clear it — you must, or it stays invalid forever |
| `input.validity` | `ValidityState`: `valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort`, `tooLong`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError`, `valid` |
| `input.validationMessage` | The browser's message string, for rendering yourself |
| `novalidate` on the form / `formnovalidate` on a button | Skips native validation entirely |

```js
pw2.setCustomValidity(pw2.value === pw1.value ? '' : 'Passwords must match');
form.reportValidity();          // => false, and the bubble points at pw2
```

---

## Storage

| | `localStorage` | `sessionStorage` |
| --- | --- | --- |
| Lifetime | Until code or the user clears it | Until the **tab** closes |
| Scope | Origin (scheme + host + port) | Origin **per tab** — a second tab starts empty |
| Survives reload | yes | yes |
| Shared across tabs | yes | no |
| Sent to the server | never | never |

| Call | Returns | Notes |
| --- | --- | --- |
| `localStorage.setItem(k, v)` | `undefined` | `v` is coerced with `String(v)` — an object becomes `'[object Object]'` |
| `localStorage.getItem(k)` | String, or **`null`** when missing | `null`, never `undefined` — so `?? fallback` works, `=== undefined` doesn't |
| `localStorage.removeItem(k)` | `undefined` | No error if the key is absent |
| `localStorage.clear()` | `undefined` | Wipes the whole origin — including other features' keys. Prefix your keys |
| `localStorage.key(i)` | Key name at index `i` | Order is not guaranteed to be stable |
| `localStorage.length` | Number of keys | `Object.keys(localStorage)` also works |

**Strings only.** Round-trip through JSON, and remember `JSON.parse` throws on corrupt data.

```js
localStorage.setItem('user', JSON.stringify({ id: 7 }));
JSON.parse(localStorage.getItem('user')).id;    // => 7
```

**Quota.** Roughly 5 MB per origin (browser-dependent). Going over throws a `QuotaExceededError`
`DOMException` from `setItem`. Access itself can throw too — sandboxed iframes and blocked-storage
settings raise a `SecurityError` on the very first touch. So wrap it:

```js
const get = (k, fb = null) => {
  try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); }
  catch { return fb; }                    // missing, corrupt JSON, or storage unavailable
};
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
```

**The `storage` event fires in the *other* tabs, not the one that wrote.** That's the feature — it's how
you sync logout across tabs — but it means you can't use it to react to your own writes.

```js
window.addEventListener('storage', e => {
  if (e.key === 'token' && e.newValue === null) logout();   // e.key is null on clear()
});
```

Both APIs are **synchronous** — a big `JSON.stringify` + write blocks the main thread. Keep payloads small.
For the cookies-vs-storage trade-off see [webdev-fundamentals.md](webdev-fundamentals.md).

---

## Misc you'll need

| API | Does | Notes |
| --- | --- | --- |
| `document.readyState` | `'loading'` → `'interactive'` → `'complete'` | `'interactive'` = DOM parsed; `'complete'` = `load` has fired. Watch it with `readystatechange` |
| `DOMContentLoaded` vs `load` | DOM ready vs everything ready | Use `DOMContentLoaded` (or just `defer` your script); `load` waits for the last image |
| `requestAnimationFrame(cb)` | Runs `cb` right before the next paint | `cb` gets a timestamp; throttled to the display refresh and paused in hidden tabs. Cancel with `cancelAnimationFrame(id)` |
| `new IntersectionObserver(cb, { root, rootMargin, threshold })` | Async callback when an element enters or leaves a viewport | Lazy-loading and infinite scroll without `scroll` handlers. Entries have `isIntersecting`, `intersectionRatio` |
| `new MutationObserver(cb)` | Callback after DOM changes | `observe(node, { childList, subtree, attributes, attributeFilter, characterData })`; batched, `disconnect()` when done |
| `new ResizeObserver(cb)` | Callback when an element's box changes size | Entries have `contentRect`. The per-element answer to `window.resize` |
| `el.scrollIntoView({ behavior: 'smooth', block: 'center' })` | Scrolls the element into view | `block`/`inline`: `'start' \| 'center' \| 'end' \| 'nearest'` |
| `history.pushState(state, '', '/x')` | Adds a history entry, no navigation | Same-origin URLs only. Does **not** fire `popstate` — call your render yourself |
| `history.replaceState(...)` | Same, but replaces the current entry | For filter/sort state you don't want in the back button |
| `history.back()` / `forward()` / `go(n)` | Navigate the history | `history.state` reads the current state object |
| `location` | `href`, `protocol`, `host`, `hostname`, `port`, `pathname`, `search`, `hash`, `origin` | `assign(url)` navigates; `replace(url)` navigates without a history entry; `reload()` |
| `new URLSearchParams(location.search)` | Query-string parser | `.get`, `.getAll`, `.set`, `.has`, `.toString()` |
| `navigator.clipboard.writeText(s)` | Promise-returning copy | Needs a **secure context** (HTTPS or localhost) and usually a user gesture. `readText()` needs permission |
| `matchMedia('(min-width: 768px)')` | `MediaQueryList` | `.matches` now, plus `addEventListener('change', …)` for later. Also `'(prefers-color-scheme: dark)'` |
| `el.focus({ preventScroll: true })` | Moves focus | Add `tabindex="-1"` to make a non-interactive element programmatically focusable |
| `document.activeElement` | The focused element | Falls back to `<body>` when nothing is focused |
| `dlg.showModal()` | Opens a `<dialog>` modally | Top layer, `::backdrop`, focus trap, Esc closes it (firing `cancel`). `show()` is non-modal |
| `dlg.close(value)` | Closes it | Fires `close`; the value lands in `dlg.returnValue`. A `<form method="dialog">` closes it on submit |

---
*See also: [webdev-fundamentals.md](webdev-fundamentals.md) · [js-gotchas.md](js-gotchas.md)*
