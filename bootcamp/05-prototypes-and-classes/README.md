# 05 · Prototypes and Classes

JavaScript has no classes. It has objects that point at other objects, and
`class` is a nice way to set up that pointing. Every confusing thing you have
ever hit — `this` is undefined in a callback, `instanceof` says false, a
subclass method mysteriously wins, `hasOwnProperty` disagrees with `in` — is
one of those pointers behaving exactly as designed. Learn the machine once and
the syntax stops surprising you. This module builds it from an object literal
up to a working library system, and never lets you forget what the sugar
melts into.

## The mental model

**1. An object can delegate to another object.** Miss a property, and the
lookup follows the `[[Prototype]]` link and asks the next object up. That is
the entire inheritance system.

```js
const base = { greet() { return `Hi, I am ${this.name}`; } };
const ada = Object.create(base);      // ada --> base --> Object.prototype
ada.name = 'Ada';
ada.greet();                          // 'Hi, I am Ada'  (borrowed, not copied)
Object.hasOwn(ada, 'greet');          // false
```

Two rules do all the work. Lookup happens at **call time**, so adding to the
prototype later is visible immediately. Assignment **never** walks the chain,
so `ada.greet = ...` shadows the shared one for `ada` alone.

**2. `new` is four steps.** Nothing more:

```js
function myNew(Ctor, ...args) {
  const obj = Object.create(Ctor.prototype);   // 1 create + 2 link
  const out = Ctor.apply(obj, args);           // 3 run body with this = obj
  return typeof out === 'object' && out !== null ? out : obj;   // 4 return
}
```

`instanceof` is the mirror image: it walks the chain from the object looking
for `Ctor.prototype`.

**3. `class` is that, spelled better.** These two are the same objects:

```js
class Dog { constructor(n) { this.n = n; }  bark() { return 'woof'; } }

function Dog2(n) { this.n = n; }
Dog2.prototype.bark = function () { return 'woof'; };
```

`bark` is a property of `Dog.prototype`, one copy for all dogs. Differences
worth knowing: class methods are **non-enumerable** (`Object.keys` and
`for...in` skip them), the whole body is strict mode, and the class refuses to
run without `new`. `extends` adds one more link — `Sub.prototype -->
Base.prototype` for methods, plus `Sub --> Base` so statics are inherited too.
`super.m()` starts the lookup at the prototype of the object where the method
was *defined*, while keeping `this`.

**4. Data is per instance, behaviour is shared.** Class fields and anything
the constructor assigns become own properties of each object; methods, getters
and setters live once on the prototype.

```js
class Tag { clicks = 0; render() {} }
const t = new Tag();
Object.keys(t);                       // ['clicks']    own data
Object.keys(Tag.prototype);           // []            non-enumerable methods
Object.hasOwn(Tag.prototype, 'render'); // true
```

## The details that bite

1. **Forgetting `new`.** With a constructor function in a module (strict
   mode) `this` is `undefined` and you get a TypeError — with luck. `class`
   always throws, which is a feature.
   `Counter(5)` → `TypeError: Cannot set properties of undefined`

2. **Arrow methods are not methods.** An arrow class field is an own property
   created per instance, so it costs memory, cannot be overridden by a
   subclass method, and cannot be reached with `super`.
   `class A { m = () => 'field' } class B extends A { m() { return 'method' } }`
   → `new B().m()` is `'field'`: A's field became an own property and
   shadows `B.prototype.m`, so B's method never runs.

3. **`#private` vs `_convention`.** `_balance` is a comment with syntax;
   `#balance` is a slot no outside code can name — invisible to
   `Object.keys`, `getOwnPropertyNames` and `JSON.stringify`, and unreachable
   from subclasses. Test it with `#balance in obj`, never `obj.#balance`.
   `Object.keys(new BankAccount('Ada', 10))` → `['owner']`

4. **Detaching a method loses `this`.** `const f = c.increment; f()` reads the
   function without the receiver. Fix with `bind` in the constructor, an arrow
   field, or a wrapper at the call site: `setTimeout(() => c.increment(), 0)`.

5. **`in` searches the whole chain, `Object.hasOwn` does not.**
   `'toString' in {}` → `true`, `Object.hasOwn({}, 'toString')` → `false`.
   Which is why `counts[word] || 0` on a plain `{}` is a latent bug.

6. **Mixins copied with `Object.assign` land as enumerable properties**,
   unlike real class methods — so they appear in `for...in`.
   `Object.keys(Task.prototype)` → `['serialize']` after mixing.

7. **`this` before `super()` is a ReferenceError**, not a warning. In a
   derived constructor `this` does not exist until `super()` returns.

8. **Field initialisation order.** Base fields, then base constructor body,
   then subclass fields, then subclass body. A base constructor calling an
   overridden method sees the subclass's fields still `undefined`.

9. **`this.constructor.LIMIT`, not `Base.LIMIT`.** Hard-coding the base class
   name silently ignores every subclass override of a static.

10. **`JSON.stringify` ignores getters and `#private` fields.** It serialises
    own enumerable properties only — give the class a `toJSON()` if you want
    a computed view in the output.

11. **Class declarations are not hoisted** the way `function` is: they sit in
    the temporal dead zone until evaluated. `new Foo()` above `class Foo {}`
    throws.

## Cheat table

| you want | prototype era | class era |
| --- | --- | --- |
| shared method | `C.prototype.m = fn` | `class C { m() {} }` |
| per-object data | `this.x = 1` in ctor | field `x = 1` or ctor |
| link two types | `Object.setPrototypeOf(S.prototype, B.prototype)` | `class S extends B` |
| call the parent | `B.call(this, a)` | `super(a)` / `super.m()` |
| private state | closure variable | `#field` |
| type check | `obj instanceof C` | same, or `#brand in obj` |
| own vs inherited | `Object.hasOwn(o, k)` vs `k in o` | same |
| class-level value | `C.count = 0` | `static count = 0` |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-object-methods.js` | ★☆☆ | a rectangle literal with methods, `this` and chaining |
| 02 | `02-computed-keys.js` | ★☆☆ | `tally` / `renameKey` with computed keys — and the inherited-key trap |
| 03 | `03-temperature-getters.js` | ★☆☆ | a thermometer with a celsius/fahrenheit getter-setter pair |
| 04 | `04-factory-functions.js` | ★☆☆ | a counter factory with closure-private state |
| 05 | `05-constructor-functions.js` | ★☆☆ | the same counter with `new` and `Counter.prototype` |
| 06 | `06-my-new.js` | ★★★ | `myNew(Ctor, ...args)` — `new` implemented from scratch |
| 07 | `07-object-create-delegation.js` | ★★☆ | `Object.create` delegation, shared methods, shadowing |
| 08 | `08-own-vs-inherited.js` | ★★☆ | `hasOwn` vs `in`, and a walk of the whole chain |
| 09 | `09-playlist-class.js` | ★★☆ | a Playlist class that protects a no-duplicates invariant |
| 10 | `10-class-is-sugar.js` | ★★☆ | X-ray tools proving where fields and methods really live |
| 11 | `11-private-fields.js` | ★★☆ | a BankAccount whose `#balance` nothing outside can reach |
| 12 | `12-static-members.js` | ★★☆ | `User.create` with a static registry, id counter and validator |
| 13 | `13-shape-hierarchy.js` | ★★☆ | Shape/Circle/Rectangle/Square: `extends`, `super`, abstract base |
| 14 | `14-super-overrides.js` | ★★☆ | a three-deep order chain layered with `super.total()` |
| 15 | `15-accessor-validation.js` | ★★☆ | setters that validate, so an invalid Product cannot exist |
| 16 | `16-this-binding.js` | ★★☆ | losing `this` in a callback, and all three fixes with their costs |
| 17 | `17-custom-errors.js` | ★★☆ | `AppError`/`NotFoundError`/`ValidationError` and catching by type |
| 18 | `18-mixins.js` | ★★★ | `Serializable` + `Comparable` composed onto a class |
| 19 | `19-money-toprimitive.js` | ★★★ | a Money class that formats itself via `Symbol.toPrimitive` |
| 20 | `20-library-capstone.js` | ★★★ | Book/Member/StaffMember/Library with real lending rules |

Do the warm-ups and core in order. Stretch if time allows.

Run one file at a time — `node exercises/09-playlist-class.js` — and keep
going until it says `all green`. `node bootcamp/progress.js 05` shows the
scoreboard; `solutions/` has the same tests plus a walkthrough of the why.

### Extra reps

Optional drills on the same machinery, from a different angle. Take them in
any order once 01–20 are green.

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 21 | `21-iterable-deck.js` | ★★☆ | a Deck with `[Symbol.iterator]` that spreads, for-ofs and destructures |
| 22 | `22-tostringtag-brands.js` | ★★☆ | `Symbol.toStringTag` vs a real `#brand` check that look-alikes fail |
| 23 | `23-vector-value-object.js` | ★★☆ | a frozen Vec2 with `equals` and a `key()` for value-based dedupe |
| 24 | `24-duration-compare.js` | ★★☆ | Duration with `parse`/`compareTo`, so sorting comes free |
| 25 | `25-clone-patterns.js` | ★☆☆ | copy constructor, `static from()`, and a `clone()` subclasses survive |
| 26 | `26-fluent-query-filter.js` | ★★☆ | an immutable QueryFilter builder you can branch and re-run |
| 27 | `27-instance-registry.js` | ★★★ | `Airport.for(code)` interning one frozen instance per code |
| 28 | `28-compose-over-inherit.js` | ★★★ | the Bird/Penguin kata refactored into granted capabilities |
| 29 | `29-template-method.js` | ★★☆ | a Report base owning the algorithm, subclasses owning the hooks |
| 30 | `30-loose-vs-private.js` | ★☆☆ | the same counter with `_count` and `#count`, and every visible difference |
| 31 | `31-safe-merge.js` | ★★★ | a deep merge that refuses `__proto__` and `constructor` |
| 32 | `32-behaviour-delegation.js` | ★★☆ | stacked behaviour objects: 500 entities, one copy of each method |
| 33 | `33-custom-instanceof.js` | ★★★ | `Symbol.hasInstance` for `Even`, `Iterable` and runtime interfaces |
| 34 | `34-cached-getters.js` | ★★★ | a cached `total` getter and the invalidation that keeps it honest |
| 35 | `35-mixin-factories.js` | ★★☆ | `Serializable(Comparable(Doc))` — mixins as real links in the chain |
| 36 | `36-temperature-units.js` | ★★☆ | Temperature with kelvin/celsius/fahrenheit accessors and one guard |

---

**Stuck?** `cheatsheets/js-gotchas.md` (detached `this`, `instanceof` across realms) · **Deep dive:** `guides/02-this-prototypes-and-what-new-does.md` · **Self-check:** `quizzes/06-classes-prototypes.md` · **Next:** `bootcamp/06-errors-and-robustness`
