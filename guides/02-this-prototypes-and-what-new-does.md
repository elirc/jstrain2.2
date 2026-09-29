# 02 · `this`, Prototypes, and What `new` Does

Most people learn `this` as a list of exceptions, which is why it never sticks.
There are no exceptions — one algorithm, four branches, run at the call site
every single time. Learn the algorithm and every "surprising" `this` becomes
boring, which is the goal.

Same story one level down. JavaScript has no classes. It has objects holding a
hidden pointer to another object and a lookup rule that follows it; `class`,
`new`, `super`, `extends` and `instanceof` are five spellings of that one
mechanism. This takes the sugar apart member by member and puts a number on the
parts that cost you something.

Module 05's README gives you the working model in ten minutes; this is the
version with receipts. Every claim was executed on Node v22.16.0 (Windows) before
it was written down, and every timing measured on this machine. One well-known
piece of folklore did not survive the measurement; it is in here too.

---

## The one sentence

> **`this` is not part of the function. It is part of the call.**

The same function body produces a different `this` depending on how you invoke
it, because `this` is an argument — an invisible one the call site supplies. When
you detach a method from its object you did not "lose" anything from the
function; you stopped passing that argument.

```js
function who() { return this; }
const obj = { name: 'obj', who };
obj.who();          // => { name: 'obj', who: [Function: who] }
who();              // => undefined   (in a module — strict mode)
who.call({ n: 1 }); // => { n: 1 }    ← one function, three `this` values
```

---

## The four binding rules

Checked in priority order, first match wins. That order is the whole rulebook,
and it is worth memorising as a ladder rather than a list.

### Rule 4 (lowest priority): the default binding

No receiver, no explicit binding, no `new`. What `this` becomes depends entirely
on strict mode, and this is the one place where the answer differs between your
files:

```js
function who() { return this; }
who();   // .mjs (strict, verified): undefined   — module top-level `this` too
         // .cjs (sloppy, verified): globalThis  — and top-level `this` is module.exports
```

Two consequences worth internalising. **ESM is always strict**, no opt-out — in a
`"type": "module"` project like `bootcamp/`, sloppy behaviour only shows up in old
code, as `Cannot read properties of undefined` rather than a silent global write.
And **sloppy mode boxes primitives**: verified, `who.call(7)` is an `object` in
sloppy and a `number` in strict, `who.call(null)` is `globalThis` in sloppy and
`null` in strict. Strict passes exactly what you gave it — why everything modern
leaves it on.

### Rule 3: implicit binding — the receiver

If the call has a dot in front of it, `this` is whatever is left of the **last**
dot. Not the owner of the function. Not where it was defined. The last dot.

```js
const outer = { name: 'outer', inner: { name: 'inner', who } };
outer.inner.who().name;   // => 'inner'   ← the LAST dot, not the owner
```

"Left of the last dot" is the phrase to keep — it explains the detachment bug
later: `const f = obj.who` has no dot at the call site at all, so rule 3 cannot
apply and you fall through to rule 4.

### Rule 2: explicit binding — `call`, `apply`, `bind`

You supply the receiver. `call` takes arguments individually, `apply` as an
array, `bind` returns a new function with the receiver welded on permanently.

```js
who.call({ name: 'call' }).name;    // => 'call'
who.apply({ name: 'apply' }).name;  // => 'apply'
who.bind({ name: 'bind' })().name;  // => 'bind'
```

**`bind` is permanent** — rebinding a bound function is a no-op, the first
binding wins forever (verified). It also does partial application:

```js
function add(a, b, c) { return a + b + c; }
const add5 = add.bind(null, 5);
add5(1, 2);   // => 8      add5.name → 'bound add'    add5.length → 2
```

And the classic borrow — a method used on an object never meant to have it,
because it only cares that `this` has the right shape. The last line is the
cross-realm-safe type tag, and why
`bootcamp/01-language-core/exercises/02-type-tag.js` exists:

```js
Array.prototype.join.call({ 0: 'a', 1: 'b', length: 2 }, '-');  // => 'a-b'
Object.prototype.toString.call(null);                            // => '[object Null]'
Object.prototype.toString.call(new Date(0));                     // => '[object Date]'
```

### Rule 1 (highest priority): `new`

`new` builds a fresh object and makes it `this`, and it outranks everything —
including a `bind` that came first:

```js
function Ctor() { this.tag = 'from new'; }
const BoundCtor = Ctor.bind({ tag: 'from bind' });
new BoundCtor().tag;            // => 'from new'   ← new beats bind

function P(x, y) { this.x = x; this.y = y; }
const P1 = P.bind({ ignored: true }, 1);
JSON.stringify(new P1(2));      // => '{"x":1,"y":2}'
```

`new` discards a bound **receiver** but keeps bound **arguments**.

### The exception that proves there are only four rules: arrow functions

An arrow has **no `this` binding of its own**. Not "it gets the outer one at
creation" — it genuinely has no slot, so `this` inside an arrow resolves up the
scope chain like any closed-over variable. That is why none of the four rules
apply and why `call`/`apply`/`bind` cannot move it:

```js
const arrowOnly = () => this;
arrowOnly.call({ nope: true });   // still the enclosing `this`, not { nope: true }
```

The subtlety that trips people: you cannot move the arrow, but you *can* move the
function it closes over, and the arrow follows along.

```js
const holder = {
  name: 'holder',
  method() { const arrow = () => this.name; return arrow(); },
};
holder.method();                       // => 'holder'
holder.method.call({ name: 'moved' }); // => 'moved'  ← the arrow moved with it
```

Rule of thumb worth having an opinion about: **arrows for callbacks, methods for
methods.** An arrow as a callback is almost always right — it inherits the `this`
you already have. An arrow as an object-literal method is almost always wrong:
no enclosing method to inherit from, so you get module scope, which in ESM is
`undefined`.

### The flowchart

Run it top to bottom at the whiteboard. First match wins.

```
   ARROW function?  ──yes──▶  NO BINDING AT ALL. `this` resolves lexically,
        │                     like any closed-over variable.
        no                    call / apply / bind CANNOT change it.
        ▼
   1. called with `new`?  ──yes──▶  this = the brand-new object
        │                           (beats an earlier .bind)
        no
        ▼
   2. .call / .apply / bound?  ──yes──▶  this = what you passed
        │                                strict: exactly that
        no                               sloppy: boxed; null/undefined → globalThis
        ▼
   3. is there a dot?  ──yes──▶  this = whatever is left of the LAST dot
        │   obj.fn() / a[i]()
        no
        ▼
   4. default binding:  strict → undefined      sloppy → globalThis
```

Ninety percent of real bugs are a call that fell from rule 3 to rule 4 because
somebody moved the function where the dot did not follow.

---

## Delegation: objects that point at objects

Every object has a hidden slot, `[[Prototype]]`, holding a reference to another
object or `null`. Read a property the object does not own and the engine follows
that pointer to the next object. Miss again, follow again. Hit `null`, return
`undefined`. That is inheritance here — not copying. Nothing is duplicated into
the instance, which **borrows** at the moment of the call. Hence:

```js
Animal.prototype.later = function () { return 'added after rex was born'; };
rex.later();     // => 'added after rex was born'
```

Walking `Object.getPrototypeOf` until `null` prints the real chain — `rex`
(own: `name`) → `Dog.prototype` (`constructor`, `speak`) → `Animal.prototype`
(`constructor`, `speak`) → `Object.prototype` (twelve built-ins) → `null`.

Drawn, with the back-pointers that confuse everybody:

```
   rex ──[[Proto]]─▶ Dog.prototype ──[[Proto]]─▶ Animal.prototype ─▶ Object.prototype ─▶ null
   {name:'Rex'}      {constructor,speak}         {constructor,speak}
                            │                            │
                     .constructor                 .constructor
                            ▼                            ▼
                           Dog ──[[Proto]]───────────▶ Animal ──[[Proto]]─▶ Function.prototype
                     (the class itself)          (the class itself)
```

Two chains, not one. **The top row**: instances delegate to prototypes — how
methods are found. **The bottom row**: `Dog` itself delegates to `Animal` itself
— how *statics* are inherited. `class B extends A` wires both edges, and the
second one is the edge people forget exists.

Verified: `Object.getPrototypeOf(Dog) === Animal` is `true`, and `Dog.create` is
inherited — a function, but not an own property. Which matters because inside a
static method `this` is the class it was called *on*, not the one it was written
in: `static create(n) { return new this(n); }` on the base correctly builds a
`Dog` for `Dog.create()`. Write `new Animal(n)` there instead and you have
silently broken every subclass.

### The two rules that generate all the behaviour

**1. Lookup walks the chain. Assignment does not.** Writing always creates or
updates an *own* property, shadowing the chain for that object alone:

```js
rex.speak = () => 'shadowed';
rex.speak();                    // => 'shadowed'
delete rex.speak;
rex.speak();                    // => 'Rex barks'   ← never left, just hidden
```

**2. Lookup happens at call time**, not creation time — add to a prototype after
ten thousand instances exist and all ten thousand see it immediately.

### `constructor` is just a property, and it lies if you let it

```js
Object.getOwnPropertyDescriptor(K.prototype, 'constructor');
// => { value: [class K], writable: true, enumerable: false, configurable: true }
```

Non-enumerable, so it stays out of `for...in` — but `writable: true`. An ordinary
property pointing back at the class, so replacing a prototype wholesale
(`Dog.prototype = { bark() {} }`, the old-school way) blows the back-pointer away
and `rex.constructor` starts reporting `Object`. The language sets up the
convention and trusts you not to break it.

### `Object.create(null)`: the object with no chain

Not a party trick — the fix for a real bug class. Every plain `{}` inherits a
dozen properties from `Object.prototype`, so a tally keyed by user input has
landmines:

```js
'toString' in Object.create(null);   // => false     ← no chain at all
'toString' in {};                    // => true
const counts = {};
typeof counts['toString'];           // => 'function'   ← not undefined!
counts['toString'] + 1;              // => 'function toString() { [native code] }1'
```

No error, no `NaN` — just a string that haunts you three services downstream. Use
`Object.create(null)`, a `Map`, or `Object.hasOwn`; never bare `||` on a plain
object keyed by untrusted input.

---

## What `class` desugars to, member by member

`class` is sugar, but not *only* sugar — a few behaviours have no pre-class
equivalent you would write. The whole body, dissected:

```js
class Widget {
  id = 1;                                        // field
  #secret = 'hidden';                            // private field
  static registry = [];                          // static field
  constructor(name) { this.name = name; }
  render() { return 'render'; }                  // prototype method
  get label() { return `#${this.id}`; }          // accessor pair
  set label(v) { this.id = Number(v); }
  static make() { return new Widget('made'); }   // static method
  reveal() { return this.#secret; }
  static has(o) { return #secret in o; }         // brand check
}
```

Where does each member actually live? Measured, not assumed — own props of the
instance are `['id','name']`, of the prototype `['constructor','render','label',
'reveal']` (and `Object.keys(prototype)` is **empty**), of the class
`['length','name','prototype','make','has','registry']`.

| member | lives on | enumerable | equivalent by hand |
| --- | --- | --- | --- |
| `constructor` body | the class function itself | — | `function Widget(name) {…}` |
| `render()` | `Widget.prototype` | **no** | `Widget.prototype.render = fn` + `defineProperty` to hide it |
| `get`/`set label` | `Widget.prototype` (one accessor pair) | **no** | `Object.defineProperty(Widget.prototype, 'label', {get, set})` |
| `id = 1` | **each instance** | yes | `this.id = 1` as the first line of the constructor |
| `#secret` | each instance, in a slot with no name | invisible | *(nothing — no equivalent exists)* |
| `static make()` | `Widget` | **no** | `Widget.make = fn` |
| `static registry` | `Widget` | yes | `Widget.registry = []` |

### Methods are non-enumerable; fields are not

The difference that bites when you serialise or iterate:

```js
Object.getOwnPropertyDescriptor(Widget.prototype, 'render');
// => { value: [Function: render], writable: true, enumerable: false, configurable: true }
Object.getOwnPropertyDescriptor(w, 'id');
// => { value: 1, writable: true, enumerable: true, configurable: true }

const seen = []; for (const k in w) seen.push(k);
seen;                 // => [ 'id', 'name' ]        ← fields only, no methods
JSON.stringify(w);    // => '{"id":1,"name":"w1"}'  ← own enumerable only
```

Hand-rolled prototype methods (`C.prototype.m = fn`) and `Object.assign` mixins
land as **enumerable**, so they leak into `for...in` where real class methods do
not — the whole reason
`bootcamp/05-prototypes-and-classes/exercises/18-mixins.js` makes you check
`Object.keys(Task.prototype)` afterwards.

### `#private` is a brand, not a naming convention

`_balance` is a comment with syntax. `#balance` is a different mechanism: a
per-instance slot that is not a property at all. No key, so no reflection finds
it (verified: invisible to `getOwnPropertyNames`, absent from JSON). And it is
not merely hidden — it is a **brand**. Reading `#secret` from an object this
class did not construct is a `TypeError` (`Cannot read private member #secret
from an object whose class did not declare it`), not `undefined`. Which is why
the `in` form exists — an unforgeable type check:

```js
class Real { #brand; static is(o) { return #brand in o; } }
Real.is(new Real());                                  // => true
Real.is(Object.setPrototypeOf({}, Real.prototype));   // => false  ← forgery detected
```

Hold onto that last line — it comes back at `instanceof`.

### `super` is resolved by HomeObject, not by `this`

Everybody's first model of `super.m()` is "`Object.getPrototypeOf(this).m()`".
That model is wrong, and you can prove it in four lines. Every method defined with method shorthand carries a hidden
`[[HomeObject]]` slot pointing at the object it was **defined in**. `super` looks
up the prototype of *that*, ignoring `this` entirely.

```js
class A { hello() { return 'A.hello'; } }
class B extends A { hello() { return 'B -> ' + super.hello(); } }

const detached = { hello: B.prototype.hello };
detached.hello();   // => 'B -> A.hello'
```

The receiver is a plain object literal whose prototype is `Object.prototype`,
which has no `hello`. Under the naive model this throws. It doesn't, because
`super` was resolved against `B.prototype`'s prototype — `A` — when the method
was *defined*. Verified: even rewiring the receiver's prototype to something with
a competing `hello` does not move `super`. Two practical consequences:

- Object literals get a HomeObject too, so `super` works in them —
  `{ __proto__: parent, greet() { return super.greet(); } }` prints
  `child -> parent`.
- `greet: function () { return super.greet(); }` is **not** method shorthand, so
  it has no HomeObject and no `super`. This is a *parse-time* error, so a
  `try/catch` around it never even runs:

```
SyntaxError: 'super' keyword unexpected here
```

### Field initialisation order

Fields are assignments injected into the constructor at a specific point.
Instrumented, the order is: **base field → base constructor body → derived field
→ derived constructor body.**

Step 2 is the bug you will actually hit: a base constructor that calls an
overridden method sees the subclass's fields **not yet initialised**. The
subclass method runs — polymorphism is fine — but every field it touches is
`undefined`. Don't call overridable methods from a constructor; if you must, pass
values as arguments rather than reading fields.

And `this` is unavailable before `super()` because the object does not exist yet
— in a derived constructor, `super()` is what creates it.

### The small print

Three behaviours `class` gives you that the function form does not:

```js
Widget('x');      // TypeError: Class constructor Widget cannot be invoked without 'new'
new w.render();   // TypeError: w.render is not a constructor
new Later();      // ReferenceError: Cannot access 'Later' before initialization
class Later {}
```

Class bodies are strict mode unconditionally, classes are in the temporal dead
zone rather than hoisted, and methods are not constructable. Also: a plain
function has *both* a `prototype` property (what it hands to its instances) and a
`[[Prototype]]` (its own link to `Function.prototype`) — unrelated things spelled
roughly the same, which is a solid share of the confusion in this topic. Arrows
and class methods have no `prototype` property at all, which is exactly why they
cannot be constructed.

---

## The four steps of `new`

```
new Ctor(args)
  1. CREATE   a fresh empty object
  2. LINK     its [[Prototype]] to Ctor.prototype
  3. RUN      Ctor's body with `this` = that object
  4. RETURN   that object — UNLESS the body returned an object, which wins
```

```js
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype);          // 1 + 2
  const out = Reflect.apply(Ctor, obj, args);         // 3
  return (typeof out === 'object' && out !== null) || typeof out === 'function'
    ? out : obj;                                      // 4
}
```

Verified against the real thing: same own properties, same prototype,
`instanceof` agrees, methods work.

### Step 4 is the one nobody remembers

Return an object and it silently replaces the instance — prototype link and all.
Return a primitive and it is ignored completely:

```js
function Sneaky()  { this.a = 1; return { b: 2 }; }
function Ignored() { this.a = 1; return 42; }
JSON.stringify(new Sneaky());     // => '{"b":2}'   ← your object is gone
new Sneaky() instanceof Sneaky;   // => false
JSON.stringify(new Ignored());    // => '{"a":1}'   ← primitive ignored
```

Not trivia — it is the mechanism behind the classic singleton, where the
constructor returns the cached instance and `new Config() === new Config()` is
`true`.

### `new.target`: the honest way to ask

Guarding with `if (!(this instanceof Ctor))` is the old, defeatable trick.
`new.target` is the real answer — `undefined` on a plain call, the constructor on
a `new` call, and when subclassed **the most-derived class** (verified: inside
`Base2`, `new Sub2()` reports `Sub2`). That last property is how abstract bases
are enforced: `if (new.target === Shape) throw new Error('abstract')`.

Note what `myNew` **cannot** do: `Reflect.apply` cannot call a class
(`TypeError: Class constructor Modern cannot be invoked without 'new'`), by
design. The complete modern equivalent is `Reflect.construct(Ctor, args)`, whose
third argument even runs one constructor's body against another's prototype.
Write `myNew` once by hand (exercise 06), then use `Reflect.construct`.

---

## Losing `this`: the bug, and three fixes with real costs

The bug has one cause — a call that fell from rule 3 to rule 4 — and a hundred
disguises:

```js
class Counter {
  count = 0;
  increment() { this.count += 1; return this.count; }
}
const c = new Counter();

const f = c.increment; f();   // TypeError: Cannot read properties of undefined
setTimeout(c.increment, 0);   // TypeError, from a stack trace with no useful frames
[1, 2].map(c.increment);      // TypeError
```

All three pass the *function* and leave the *receiver* behind. The version that
should scare you is the one that does **not** throw:

```js
const proxyish = { count: 100, increment: c.increment };
proxyish.increment();   // => 101   ← mutated the WRONG object
c.count;                // => 0     ← the real counter never moved
```

No error, wrong data. Rule 3 applied perfectly; it just found a receiver you did
not intend.

### Fix A — `bind` in the constructor

```js
class BoundCounter {
  count = 0;
  constructor() { this.increment = this.increment.bind(this); }
  increment() { return ++this.count; }
}
```

Verified: detached calls work, own props are `['count','increment']`, the
prototype still has `increment`, and a subclass can still `super` it.

The method stays on the prototype; the instance gets an own bound *wrapper*. That
distinction is what keeps subclassing working — an override still wins and
`super.increment()` still reaches the base. Costs: one extra function object per
instance per bound method, plus a line of ceremony in every constructor, easy to
forget when you add method number four.

### Fix B — a class field arrow

```js
class ArrowCounter { count = 0; increment = () => ++this.count; }
```

Least typing, and two consequences people do not price in.

**It is not on the prototype at all** — verified: own props are
`['count','increment']`, the prototype holds only `constructor`. So it
**cannot be overridden by a subclass**, and `super` cannot reach it either:

```js
class ArrowSub extends ArrowCounter { increment() { return 'never runs'; } }
new ArrowSub().increment();   // => 1   ← the parent's field won
```

**And it costs measurable memory.** 200,000 instances, `--expose-gc`, heap delta
around the allocation, identical across repeated runs on this machine:

```
prototype method   7.63 MB total,  40.0 bytes/instance
arrow field       27.47 MB total, 144.0 bytes/instance
```

A prototype method is one function object for the whole program; an arrow field
is a fresh closure per instance — **104 extra bytes each, 3.6× the footprint**,
for a class with one method. Nothing for a hundred components; 100 MB for a
million-instance data structure.

### Fix C — a wrapper arrow at the call site

```js
setTimeout(() => c.increment(), 0);
[1, 2].map(() => c.increment());
```

The dot is back, so rule 3 applies and nothing else changes: no per-instance
allocation, no prototype surgery, subclassing untouched. The cost is that it is
per call site, so you must remember every time — and it is easy to forward
arguments wrong (`.map(x => f(x))` vs `.map(f)` matters when `map` passes an
index).

### Verdict

| | detached calls work | subclass can override | per-instance cost | you must remember it |
| --- | --- | --- | --- | --- |
| `bind` in constructor | yes | **yes** | one function (~104 B) | once per class |
| arrow class field | yes | **no** | one closure (~104 B, measured) | once per class |
| wrapper at call site | yes | yes | none | **every call site** |

My opinion, and not the popular one: **default to the call-site wrapper**, use
`bind` in the constructor when a class hands the same method to many subscribers,
and reach for the arrow field only when you have decided you will never subclass.
The arrow field is the most fashionable and the least reversible — it silently
opts your class out of polymorphism, and you find out two refactors later.

---

## `instanceof` and the three ways it lies

`instanceof` is not a type check. It is a chain walk you can write yourself:

```js
function myInstanceof(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  for (let p = Object.getPrototypeOf(obj); p !== null; p = Object.getPrototypeOf(p)) {
    if (p === Ctor.prototype) return true;
  }
  return false;
}
```

Verified to agree with the built-in on every case — and because it is only a
chain walk, it inherits three weaknesses.

### Lie 1 — another realm

A realm is a separate copy of all the built-ins: `node:vm`, a browser iframe, a
worker thread. Objects from another realm have a *different* `Array.prototype`,
so the walk never finds yours — verified: `Array.isArray(foreign)` is `true`
while `foreign instanceof Array` is `false`, and its `constructor` is named
`Array` but is a different function object. Same for `Error` across a worker
boundary, which is why libraries check
`Object.prototype.toString.call(x) === '[object Array]'` instead of the obvious
thing.

### Lie 2 — `setPrototypeOf`

```js
const fake = Object.setPrototypeOf({}, Dog.prototype);
fake instanceof Dog;    // => true   ← no constructor ran, no fields, no invariants
```

### Lie 3 — `Symbol.hasInstance`

`instanceof` is not even an operator with fixed behaviour — it consults a symbol
method a class can define. Abused, `42 instanceof Anything` can be `true`. Used
deliberately, it builds a duck-type check that reads like a type check:

```js
class Duck { static [Symbol.hasInstance](o) { return typeof o?.quack === 'function'; } }
({ quack() {} }) instanceof Duck;   // => true
({}) instanceof Duck;               // => false
```

### The honest primitives

When you need the truth, use a tool that answers exactly one question:

| you want to know | use | why |
| --- | --- | --- |
| is X anywhere in this object's chain | `Proto.isPrototypeOf(obj)` | no `Symbol.hasInstance` hook |
| what is the immediate link | `Object.getPrototypeOf(obj)` | one step, no walk |
| was this really built by my class | `#brand in obj` | unforgeable, defeats `setPrototypeOf` |
| what kind of built-in is it | `Object.prototype.toString.call(x)` | realm-safe |
| is it an array | `Array.isArray(x)` | realm-safe |

The private-field brand check is the strongest of these and the least known —
verified above: it says `true` for a real instance and `false` for a
`setPrototypeOf` forgery.

---

## Shapes, inline caches, and why any of this is fast

"Walk a chain of hash maps on every property read" would be far too slow to run a
browser. V8 avoids it with two ideas.

**Shapes (hidden classes).** V8 does not store keys in each object. It stores
values in a flat array and keeps the key→offset map — the *shape* — in a shared
structure. Objects built the same way share one shape; adding a property
transitions to a new one, and transitions are cached, so a million objects from
one constructor share exactly one shape object.

**Inline caches.** A property read like `obj.x` in a hot loop remembers "last
time, the object had shape S and `x` lived at offset 2" — if the shape matches,
it is a pointer dereference instead of a lookup. How many distinct shapes one
call site has seen determines its state:

```
  1 shape        monomorphic   → fast path, one comparison
  2–4 shapes     polymorphic   → a small linear scan of remembered shapes
  5+ shapes      megamorphic   → gives up, falls back to a global hash lookup
```

You cannot see any of this from JavaScript — no API shows you a shape. But the
*consequences* are measurable, so measure rather than repeat folklore. Below:
5,000,000 property reads, median of 9 runs, `perf_hooks`, this laptop, with the
spread across three consecutive runs shown so the noise is visible.

```
                       fast path     slow path       ratio (3 runs)
  key order (1 vs 2 shapes)  ~48ms       ~67ms        1.18 – 1.63×
  inline cache (mono vs mega) ~50ms      ~490ms       8.6 – 10.8×
  delete (clean vs deleted)  ~47ms      ~380ms        7.8 – 8.2×
```

Read that honestly, because it does not say what the blog posts say.

**Megamorphic access costs about 9–10×.** Real, large, reproducible — and the
intermediate step is too: four shapes at one call site measured 2.1–2.3×
monomorphic. A hot function fed many shapes (a generic serialiser, a
`formatCell(value)` called with fifty record types) is where this shows up in a
profile as "slow for no visible reason".

**`delete` costs about 8×.** It can push an object out of shape tracking into
dictionary mode, permanently. Strongest practical result here: **assign
`undefined` instead of deleting** in hot code, or build a new object without the
key. `delete` is fine in cold code, a cliff in a loop.

**Key order: real but small.** Reversed keys genuinely produce a second shape, so
the call site goes polymorphic rather than megamorphic — 1.18–1.63×, with visible
noise. Worth being consistent about; not worth restructuring code over.

**And one piece of folklore that did not survive.** "Always declare every field
in the constructor rather than bolting properties on later" measured 2.83× on the
first run — a great result, and bogus. Second run: 0.86×. Isolated properly
(first key vs last key, nine runs): 0.98× and 1.11×. The objects converge to the
same shape and access costs the same. Still good hygiene; the performance claim
behind it did not reproduce. Which is exactly why the bootcamp rule is "run it,
don't recall it" — the first measurement agreed with the folklore, and the first
measurement was wrong.

### What to actually do

1. Build objects of a given kind the **same way every time** — same keys, same
   order, one constructor or factory. Free, and it keeps call sites monomorphic.
2. **Do not `delete` in hot code.** Assign `undefined`, or rebuild the object.
3. If a hot function must handle many shapes, give it **one** — normalise at the
   boundary rather than branching inside the loop.
4. **Do not micro-optimise on faith.** Profile, then change code.

---

## Now go do

| file | what it drills |
| --- | --- |
| [`bootcamp/05-prototypes-and-classes/exercises/06-my-new.js`](../bootcamp/05-prototypes-and-classes/exercises/06-my-new.js) | Write `new` from scratch. Get step 4 right and the rest of this essay stops being abstract. |
| [`07-object-create-delegation.js`](../bootcamp/05-prototypes-and-classes/exercises/07-object-create-delegation.js) | Delegation with no `class` in sight: shared methods, shadowing, assignment never walking the chain. |
| [`10-class-is-sugar.js`](../bootcamp/05-prototypes-and-classes/exercises/10-class-is-sugar.js) | The X-ray tools applied to a real class — the member-by-member table above, as a drill. |
| [`16-this-binding.js`](../bootcamp/05-prototypes-and-classes/exercises/16-this-binding.js) | Lose `this` in a callback, then fix it all three ways and feel the tradeoffs. |
| [`bootcamp/02-functions-and-closures/exercises/07-my-bind.js`](../bootcamp/02-functions-and-closures/exercises/07-my-bind.js) | Implement `bind`, including "`new` beats bind". Write it once and the priority ladder is permanent. |

Then say the answers out loud against `quizzes/06-classes-prototypes.md`.

## Self-test

**1.** `const { increment } = new Counter(); increment();` throws, but
`const proxyish = { count: 100, increment: c.increment }; proxyish.increment();`
returns `101` and throws nothing. Explain both using the same rule, and say which
one you would rather find in production.

<details>
<summary>Answer</summary>

Both are rule 3 resolving differently, not two different bugs.

In the first, destructuring copies the *function* out with no receiver. No dot at
the call site, so rule 3 cannot apply and it falls to rule 4: strict mode →
`this` is `undefined` → `TypeError`. In the second there *is* a dot, so rule 3
applies perfectly and binds `this` to `proxyish`, which happens to have a
`count` — it increments the wrong object and returns a plausible number.

You want the first. A `TypeError` at the call site reports itself with a stack
trace; the second silently corrupts state and surfaces later as "the dashboard
number is wrong", with nothing in the logs. Loud failures are cheaper.
</details>

**2.** You have `class A { hello() { return 'A'; } }` and
`class B extends A { hello() { return 'B->' + super.hello(); } }`. You copy
`B.prototype.hello` onto a plain object literal whose prototype is
`Object.prototype`, then call it. Does it throw? Why?

<details>
<summary>Answer</summary>

It does not throw — it returns `'B->A'`.

`super` is not `Object.getPrototypeOf(this).hello`. Every method defined with
method shorthand carries a hidden `[[HomeObject]]` slot pointing at the object it
was *defined in* — here `B.prototype`. `super.hello()` looks up
`Object.getPrototypeOf(B.prototype)`, which is `A.prototype`, and calls `hello`
from there with the current `this`.

So the receiver is irrelevant to *finding* the method; it only matters to what
the method does with `this` once running. Verified: rewire the object's prototype
to something with a competing `hello` and `super` still resolves to `A`.

Corollary: `greet: function () { return super.greet(); }` is not method
shorthand, so it has no HomeObject — a `SyntaxError` at parse time, not a runtime
error you can catch.
</details>

**3.** A code reviewer says "convert all these bound-in-constructor methods to
arrow class fields, it is cleaner." Give two concrete, measurable objections.

<details>
<summary>Answer</summary>

**Objection 1 — it disables subclass overrides.** An arrow class field is an own
property, so it shadows anything on the prototype chain. A subclass defining
`increment()` will *never* have it called, and `super.increment()` cannot reach
it either. Verified: `new ArrowSub().increment()` returns `1` from the parent's
field, not `'never runs'`. Bind-in-constructor keeps the method on the prototype
and a bound wrapper on the instance, so both still work.

**Objection 2 — measurable per-instance memory.** Measured here with 200,000
instances and `--expose-gc`: 40.0 bytes/instance with a prototype method versus
144.0 with an arrow field — 104 extra bytes each, 3.6× total heap, for one
method. Irrelevant for a hundred components; 100 MB for a million-instance data
structure.

Honest summary: for a leaf class you will never subclass, the arrow field is fine.
As a blanket refactor across a hierarchy it trades polymorphism for a line of
syntax, and the trade stays invisible until someone tries to override.
</details>

---
**Pairs with:** [`bootcamp/05-prototypes-and-classes`](../bootcamp/05-prototypes-and-classes/) · **Cheatsheet:** [`js-gotchas.md`](../cheatsheets/js-gotchas.md) · **Next guide:** [`03-values-references-and-memory.md`](03-values-references-and-memory.md)
