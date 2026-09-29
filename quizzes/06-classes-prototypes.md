# 06 · Classes and Prototypes — the chain, `new`, `super`, fields, privacy

Cover the answer, commit out loud, then reveal. If you hedge, you got it wrong.

---

### Q1 — where methods live

What does this print?

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return this.name + ' makes a sound';
  }
}
const a = new Animal('Rex');
console.log(a.speak());
console.log(Object.keys(a));
console.log(a.hasOwnProperty('speak'), 'speak' in a);
```

<details><summary>Answer</summary>

**`Rex makes a sound`**, **`[ 'name' ]`**, **`false true`** — methods live on `Animal.prototype`, not on the instance.

`class` is syntax over prototypes: `speak` is defined once on the prototype object and every instance reaches it by lookup, which is why 10,000 animals cost 10,000 `name` properties and exactly one `speak` function. Only what the constructor assigns to `this` becomes an own property, so `Object.keys`, `JSON.stringify`, and spread see `name` and nothing else. `in` follows the prototype chain, `hasOwnProperty` does not.
</details>

---

### Q2 — extends and super

What does this print?

```js
class Animal {
  speak() {
    return 'generic';
  }
}
class Dog extends Animal {
  speak() {
    return 'woof (' + super.speak() + ')';
  }
}
const d = new Dog();
console.log(d.speak());
console.log(d instanceof Dog, d instanceof Animal, d instanceof Object);
```

<details><summary>Answer</summary>

**`woof (generic)`**, then **`true true true`** — `super.method()` calls the parent's version with `this` still bound to the instance.

`extends` sets `Dog.prototype`'s prototype to `Animal.prototype`, so lookup walks `d` → `Dog.prototype` → `Animal.prototype` → `Object.prototype` → `null`. `instanceof` is exactly that walk: it asks whether the right-hand side's `.prototype` object appears anywhere in the left-hand side's chain. That's why all three are `true`, and also why `instanceof` lies across iframes or across two copies of a library — different realms, different `Object.prototype`.
</details>

---

### Q3 — getters and toString

What does this print?

```js
class Rect {
  constructor(w, h) {
    this.w = w;
    this.h = h;
  }
  get area() {
    return this.w * this.h;
  }
  toString() {
    return `Rect(${this.w}x${this.h})`;
  }
}
const r = new Rect(2, 3);
console.log(r.area);
console.log(`${r}`);
console.log(String(r), r + '');
console.log(Object.keys(r));
```

<details><summary>Answer</summary>

**`6`**, **`Rect(2x3)`**, **`Rect(2x3) Rect(2x3)`**, **`[ 'w', 'h' ]`** — a getter is called like a property, with no parentheses.

`get area()` defines an accessor on the prototype, so `r.area` runs the function; writing `r.area()` would throw because you'd be calling the number `6`. Getters are for cheap derived values — if it's expensive or has side effects, make it a method so callers can see the cost. Overriding `toString` controls what template literals, string concatenation, and `String()` produce. Note the getter is *not* an own property, so it doesn't appear in `Object.keys` or in `JSON.stringify` output.
</details>

---

### Q4 — instance versus static

What does this print?

```js
class Widget {
  size = 10;
  static made = 0;
  constructor() {
    Widget.made += 1;
  }
  area() {
    return this.size * this.size;
  }
  static reset() {
    Widget.made = 0;
    return 'reset';
  }
}
const w1 = new Widget();
const w2 = new Widget();
console.log(w1.area(), Widget.made);
console.log(w1.made, typeof w1.reset);
console.log(Widget.reset(), Widget.made);
```

<details><summary>Answer</summary>

**`100 2`**, **`undefined undefined`**, **`reset 0`** — statics live on the class itself and are invisible from instances.

`size = 10` is an instance field: it runs per construction and becomes an own property of each object. `static made` and `static reset` are properties of the `Widget` constructor function, and instances do not inherit from their class — they inherit from `Widget.prototype`. So `w1.made` is `undefined`. Statics are the right home for counters, factories (`static from(json)`), and constants shared by all instances.
</details>

---

### Q5 — classes are not hoisted

What does this print?

```js
class Thing {}
console.log(typeof Thing);
try {
  Thing();
} catch (e) {
  console.log(e.constructor.name + ': ' + e.message);
}
try {
  new Early();
} catch (e) {
  console.log(e.constructor.name + ': ' + e.message);
}
class Early {}
```

<details><summary>Answer</summary>

**`function`**, **`TypeError: Class constructor Thing cannot be invoked without 'new'`**, **`ReferenceError: Cannot access 'Early' before initialization`** — a class is a function with guardrails.

`typeof` still reports `function` because that's what a class desugars to. But the constructor carries an internal flag that makes a plain call a hard error, which is the fix for the "forgot `new`" bug from module 02. And class declarations obey the same temporal dead zone as `let`/`const`, so unlike function declarations they cannot be used above their definition. Class bodies are also always strict mode, whether or not the surrounding file is.
</details>

---

### Q6 — the pre-class version

What does this print?

```js
function Legacy(name) {
  this.name = name;
}
Legacy.prototype.greet = function () {
  return 'hi ' + this.name;
};
const l = new Legacy('Ada');
console.log(l.greet());
console.log(Object.getPrototypeOf(l) === Legacy.prototype);
console.log(Legacy.prototype.constructor === Legacy);
console.log(l.__proto__.__proto__ === Object.prototype);
console.log(Object.getPrototypeOf(Object.prototype));
```

<details><summary>Answer</summary>

**`hi Ada`**, then **`true`, `true`, `true`, `null`** — this is exactly what `class` compiles to.

Keep the two words straight: **`prototype`** is a property of a *constructor function* and holds the object that instances will inherit from; **`__proto__`** (properly `Object.getPrototypeOf`) is the link on an *instance* pointing at that object. `new Legacy()` sets `l.__proto__ = Legacy.prototype`. Every `.prototype` object gets a `constructor` back-reference for free. And the chain terminates: `Object.prototype`'s prototype is `null`, which is what makes a missing property return `undefined` instead of looping forever.
</details>

---

### Q7 — shadowing a prototype property

What does this print?

```js
function Counter() {}
Counter.prototype.count = 0;
const a = new Counter();
const b = new Counter();
a.count = 5;
console.log(a.count, b.count);
console.log(a.hasOwnProperty('count'), b.hasOwnProperty('count'));
Counter.prototype.count = 100;
console.log(a.count, b.count);
```

<details><summary>Answer</summary>

**`5 0`**, **`true false`**, **`5 100`** — writes always create an own property; only *reads* walk the chain.

`a.count = 5` does not modify the prototype; it defines a new own property on `a` that shadows it. `b` never wrote, so it still reads through to the prototype and sees the later change to `100`. This asymmetry is why putting **mutable** data on a prototype is a trap: `Counter.prototype.items = []` gives every instance the same array until one of them reassigns, and `a.items.push(x)` mutates it for everyone. Put state in the constructor, behavior on the prototype.
</details>

---

### Q8 — Object.create and null prototypes

What does this print?

```js
const proto = { greet() { return 'hi'; } };
const o = Object.create(proto);
console.log(o.greet(), Object.getPrototypeOf(o) === proto);
const bare = Object.create(null);
bare.x = 1;
console.log(bare.x, typeof bare.toString);
console.log(Object.getPrototypeOf(bare));
```

<details><summary>Answer</summary>

**`hi true`**, **`1 undefined`**, **`null`** — `Object.create(proto)` builds an object with that exact prototype, and `null` gives you one with no inheritance at all.

A null-prototype object has no `toString`, no `hasOwnProperty`, no `constructor` — so `console.log(bare)` prints `[Object: null prototype]` and `bare + ''` throws. That emptiness is the point: it's the safest possible dictionary for untrusted keys, because a key named `__proto__`, `constructor`, or `toString` can't collide with anything or trigger prototype pollution. `Object.create` is also how inheritance was wired by hand before `class`.
</details>

---

### Q9 — method versus arrow field

What does this print?

```js
class Handler {
  label = 'H';
  method() {
    return this.label;
  }
  arrow = () => this.label;
}
const h = new Handler();
const m = h.method;
const ar = h.arrow;
console.log(h.method(), h.arrow());
try {
  console.log(m());
} catch (e) {
  console.log('method detached:', e.constructor.name);
}
console.log('arrow detached:', ar());
console.log(h.hasOwnProperty('arrow'), h.hasOwnProperty('method'));
```

<details><summary>Answer</summary>

**`H H`**, **`method detached: TypeError`**, **`arrow detached: H`**, **`true false`** — an arrow class field is a per-instance function that captured `this` at construction time.

Class bodies are strict mode, so a detached method's `this` is `undefined` and `this.label` throws instead of silently reading a global. The arrow field is assigned in the constructor, one closure per instance, permanently bound — which is why it survives being passed as an event handler or a `setTimeout` callback. The cost: it's an own property, so it's duplicated per instance, invisible to subclass `super`, and not on the prototype for testing or patching. Use methods by default; use arrow fields for callbacks you hand to someone else.
</details>

---

### Q10 — private fields

What does this print?

```js
class Account {
  #balance = 0;
  deposit(n) {
    this.#balance += n;
    return this;
  }
  get balance() {
    return this.#balance;
  }
  set balance(v) {
    throw new Error('read only');
  }
}
const acc = new Account();
acc.deposit(50).deposit(25);
console.log(acc.balance);
console.log(Object.keys(acc), JSON.stringify(acc));
try {
  acc.balance = 5;
} catch (e) {
  console.log('setter:', e.message);
}
```

<details><summary>Answer</summary>

**`75`**, **`[] {}`**, **`setter: read only`** — `#` fields are genuinely private, invisible to every reflection API, and absent from JSON.

Unlike the old `_underscore` convention, `#balance` is enforced by the language: it's not a property name at all, it's a separate slot, so `Object.keys`, `JSON.stringify`, spread, and `Object.getOwnPropertyNames` can't see it and `acc['#balance']` doesn't reach it. That invisibility to `JSON.stringify` is the practical gotcha — serialize with an explicit `toJSON()` method. Returning `this` from `deposit` is what makes the calls chain. A setter that throws is one way to make a getter-only property loud rather than silent.
</details>

---

### Q11 — this before super

What does this print?

```js
class Base {
  constructor() {
    this.tag = 'base';
  }
}
class Child extends Base {
  constructor() {
    try {
      this.x = 1;
    } catch (e) {
      console.log(e.constructor.name + ': ' + e.message.slice(0, 40));
    }
    super();
    this.x = 1;
  }
}
const c = new Child();
console.log(c.tag, c.x);
```

<details><summary>Answer</summary>

**`ReferenceError: Must call super constructor in derived c...`**, then **`base 1`** — in a derived class, `this` does not exist until `super()` returns.

The parent constructor is what actually creates the object; the derived constructor's `this` is in a temporal dead zone until then. So `super()` must come before any `this` access — and it must be called at all, or the constructor throws on return. This is also why a derived class with *no* constructor gets an implicit `constructor(...args) { super(...args); }`, and why omitting `super(...args)` when you do write one silently drops the parent's arguments.
</details>

---

### Q12 — extending Error

What does this print?

```js
class MyError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'MyError';
    this.code = 42;
  }
}
try {
  throw new MyError('bad');
} catch (e) {
  console.log(e instanceof MyError, e instanceof Error);
  console.log(e.name, e.message, e.code);
  console.log(String(e));
}
```

<details><summary>Answer</summary>

**`true true`**, **`MyError bad 42`**, **`MyError: bad`** — `super(msg)` is what populates `.message` and the stack trace.

Custom error classes are the right way to let callers branch on failure type: `catch (e) { if (e instanceof NotFoundError) ... }`, which beats string-matching on messages. Set `this.name` explicitly, because `Error.prototype.toString` uses it and it's what appears in logs. Extra fields like `code`, `statusCode`, or `cause` ride along fine. (One historical trap: transpiling to ES5 breaks `instanceof` for built-in subclasses — a non-issue on any modern runtime.)
</details>

---

### Q13 — static inheritance

What does this print?

```js
class A {
  static who() {
    return 'A';
  }
  static describe() {
    return 'I am ' + this.who();
  }
}
class B extends A {
  static who() {
    return 'B';
  }
}
console.log(A.describe(), B.describe());
console.log(Object.getPrototypeOf(B) === A);
```

<details><summary>Answer</summary>

**`I am A I am B`**, then **`true`** — statics are inherited too, and `this` inside a static method is the class it was called on.

`extends` sets up *two* prototype links: `B.prototype.__proto__ = A.prototype` for instance members, and `B.__proto__ = A` for statics. So `B.describe` is found on `A`, but it's invoked with `this === B`, and `this.who()` resolves to `B`'s override. That's late binding at the class level — the same polymorphism instance methods get. It's also why hardcoding `A.who()` inside `describe` would break subclasses; prefer `this.` in statics when you want them to be overridable.
</details>

---

### Q14 — returning from a constructor

What does this print?

```js
function Ctor() {
  this.a = 1;
  return { b: 2 };
}
function Ctor2() {
  this.a = 1;
  return 42;
}
console.log(new Ctor());
console.log(new Ctor2());
```

<details><summary>Answer</summary>

**`{ b: 2 }`**, then **`Ctor2 { a: 1 }`** — returning an *object* from a constructor overrides the newly created `this`; returning a primitive is ignored.

That's step four of what `new` does: build the object, link its prototype, run the function with `this` bound, then return `this` **unless** the function explicitly returned an object. The escape hatch is used deliberately by singletons, object pools, and proxy wrappers. Returning `42` doesn't match the rule, so you get the normal instance — printed with its constructor name, which is how `console.log` shows a non-plain object.
</details>

---

### Q15 — extending Array

What does this print?

```js
class Stack extends Array {}
const s = new Stack();
s.push(1, 2);
console.log(s.length, s instanceof Array, s instanceof Stack);
const mapped = s.map((n) => n * 2);
console.log(mapped instanceof Stack, mapped instanceof Array);
```

<details><summary>Answer</summary>

**`2 true true`**, then **`true true`** — array methods that build a new array use `Symbol.species`, which defaults to the subclass.

So `map`, `filter`, and `slice` on a `Stack` hand you back a `Stack`, not a plain `Array`. That's usually what you want, but it surprises people who expect a plain array — and it breaks if your subclass constructor requires arguments, because the species constructor is called with just a length. Override `static get [Symbol.species]() { return Array; }` to opt out. Note also that a `length` property with magic behavior is why extending `Array` works at all — you cannot fake it with a plain object.
</details>

---

### Q16 — reassigning prototype

What does this print?

```js
function Old() {}
const inst = new Old();
console.log(inst instanceof Old);
Old.prototype = { fresh: true };
const inst2 = new Old();
console.log(inst instanceof Old, inst2 instanceof Old);
console.log(inst2.fresh, inst.fresh);
```

<details><summary>Answer</summary>

**`true`**, **`false true`**, **`true undefined`** — `instanceof` checks against the constructor's *current* `.prototype`, so replacing it disinherits existing instances.

`inst` still points at the original prototype object, which is no longer `Old.prototype`, so the chain walk never finds a match and `instanceof` goes `false` for an object that genuinely was made by `Old`. This is why the old advice was to *augment* (`Old.prototype.x = ...`) rather than *replace* the prototype, and if you must replace it, restore `constructor`. `class` closes the hole: `Dog.prototype` is non-writable.
</details>

---

### Q17 — spread loses the prototype

What does this print?

```js
class Config {
  constructor() {
    this.value = 1;
  }
}
const c = new Config();
const clone = { ...c };
console.log(clone instanceof Config, clone.value);
const clone2 = Object.assign(Object.create(Object.getPrototypeOf(c)), c);
console.log(clone2 instanceof Config, clone2.value);
```

<details><summary>Answer</summary>

**`false 1`**, then **`true 1`** — spread copies own enumerable properties into a *plain object literal*; it does not preserve the prototype.

So the clone has your data but none of your methods, `instanceof` fails, and every call to a class method throws "not a function". Same for `JSON.parse(JSON.stringify(x))` and for `structuredClone`, which also returns a plain object for class instances. The manual fix is the second line: create an object with the right prototype, then copy own properties onto it. Better still, give the class a real `clone()` or `static from()` method rather than treating instances as bags of data.
</details>

---

### Q18 — field initialization order

What does this print?

```js
class Shape {
  constructor() {
    console.log('Shape ctor, this is', this.constructor.name);
    this.init();
  }
  init() {
    this.kind = 'shape';
  }
}
class Circle extends Shape {
  radius = 5;
  init() {
    this.kind = 'circle';
  }
}
const c = new Circle();
console.log(c.kind, c.radius);
```

<details><summary>Answer</summary>

**`Shape ctor, this is Circle`**, then **`circle 5`** — the parent constructor runs *before* the subclass's field initializers, but method lookup is already polymorphic.

`this.init()` in the base constructor resolves to `Circle.prototype.init`, because the object's prototype was set to `Circle.prototype` from the start — so `kind` is `'circle'`. Then `super()` returns and only *then* does `radius = 5` run. The dangerous version of this: if `Circle` had declared `kind = 'default'` as a field, that initializer would run after `init()` and silently overwrite it. Never call an overridable method from a constructor — the subclass isn't finished being built yet.
</details>

---

### Q19 — instanceof is overridable

What does this print?

```js
class Even {
  static [Symbol.hasInstance](n) {
    return typeof n === 'number' && n % 2 === 0;
  }
}
console.log(4 instanceof Even, 5 instanceof Even, 'x' instanceof Even);
const Duck = { [Symbol.hasInstance]: (o) => o != null && typeof o.quack === 'function' };
console.log({ quack() {} } instanceof Duck, {} instanceof Duck);
```

<details><summary>Answer</summary>

**`true false false`**, then **`true false`** — `instanceof` is not a prototype-chain walk when the right-hand side defines `Symbol.hasInstance`.

The operator's real algorithm is: if the right operand has a `Symbol.hasInstance` method, call it with the left operand and coerce the result to a boolean; only otherwise do the chain walk from Q2. That's why the right-hand side doesn't even have to be a constructor — a plain object with that key works, and `4 instanceof Even` is `true` despite `4` being a primitive with no relationship to `Even.prototype`. `Array.isArray` and `Symbol.hasInstance` are the two escape hatches from cross-realm `instanceof` failures, but overriding it makes a fundamental operator lie, so keep it to library-grade type guards.
</details>

---

### Q20 — the real type tag

What does this print?

```js
const tag = (x) => Object.prototype.toString.call(x);
class Plain {}
class Tagged {
  get [Symbol.toStringTag]() { return 'Tagged'; }
}
console.log(tag([]), tag(new Map()), tag(null));
console.log(tag(new Plain()), tag(new Tagged()));
console.log(String(new Tagged()), new Plain().constructor.name);
```

<details><summary>Answer</summary>

**`[object Array] [object Map] [object Null]`**, **`[object Object] [object Tagged]`**, **`[object Tagged] Plain`** — `Object.prototype.toString` reads `Symbol.toStringTag`, and every class without one is just `Object`.

This is the old `typeof`-that-actually-works: it distinguishes `Array`, `Date`, `RegExp`, `Map`, `Set`, `Promise`, and even `null` and `undefined`, which is why library `getType` helpers are built on it. Your own classes get no free tag — `Plain` reports `[object Object]`, so the string is useless for user-defined types unless you add the symbol. Note `console.log` answers a third way: Node's inspector leads with the constructor name and appends the tag in brackets only when the two differ, so this class prints `Tagged {}` but a class named `Foo` tagged `'Bar'` prints `Foo [Bar] {}`. `String(x)` picks up the tag through the inherited `toString`.
</details>

---

### Q21 — mixin factories

What does this print?

```js
const Serializable = (Base) => class extends Base {
  toJSON() { return { ...this, kind: 'ser' }; }
};
const Countable = (Base) => class extends Base {
  constructor(...args) {
    super(...args);
    this.n = (this.n ?? 0) + 1;
  }
};
class Core {
  constructor() { this.id = 1; }
}
class Widget extends Serializable(Countable(Core)) {}
const w = new Widget();
console.log(JSON.stringify(w));
console.log(w instanceof Widget, w instanceof Core);
```

<details><summary>Answer</summary>

**`{"id":1,"n":1,"kind":"ser"}`**, then **`true true`** — a mixin is a function that takes a base class and returns a subclass, so composing them just builds a taller chain.

JavaScript has single inheritance, and this is the standard way around it: `Serializable(Countable(Core))` produces an anonymous class whose prototype chain is `Widget` → `Serializable` → `Countable` → `Core`. Because every layer is a real class, `super()` works normally (which is why `Countable` must forward `...args`), `instanceof` sees through the whole stack, and method overriding follows the usual lookup order. The cost is a deeper chain and anonymous classes in stack traces; name them with `static name` or a `const` if that matters.
</details>

---

### Q22 — the merge that moves your prototype

What does this print?

```js
function naiveMerge(target, src) {
  for (const k in src) target[k] = src[k];
  return target;
}
const payload = JSON.parse('{"a":1,"__proto__":{"admin":true}}');
const out = naiveMerge({}, payload);
console.log(out.a, Object.getPrototypeOf(out) === Object.prototype);
console.log(out.admin, {}.admin);
```

<details><summary>Answer</summary>

**`1 false`**, then **`true undefined`** — assigning to the key `'__proto__'` doesn't create a property, it calls the inherited setter and *replaces the object's prototype*.

`JSON.parse` really does produce an own `__proto__` data property (an object literal would not), so it survives into your loop as an ordinary key, and `target['__proto__'] = {...}` re-parents `out`. Now `out.admin` is `true` through a prototype you never intended, while global `Object.prototype` is untouched here — a recursive merge that walks into `target['__proto__']` is the version that poisons every object in the process. Two fixes, both cheap: build onto `Object.create(null)`, where `__proto__` has no setter and lands as an inert own key, and skip anything failing `Object.hasOwn(src, k)`.
</details>

---

### Q23 — brand checking with a private field

What does this print?

```js
class Money {
  #cents = 0;
  static isMoney(x) { return #cents in x; }
  static read(x) { return x.#cents; }
}
console.log(Money.isMoney(new Money()), Money.isMoney({}));
try {
  Money.read({});
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`true false`**, then **`TypeError: Cannot read private member #cents from an object whose class did not declare it`** — `#field in obj` is the ergonomic brand check, and reading the field directly is the loud version.

Private fields are per-class slots installed by the constructor, so their presence is unforgeable proof that an object was really built by this class — better than `instanceof`, which lies across realms and can be defeated by `Object.setPrototypeOf`. Before ES2022 you had to write the `try/catch` you see here to test for the brand; `in` gives you a boolean with no exception. Note the syntax is only legal inside the class body that declares `#cents`.
</details>

---

### Q24 — static initialization blocks

What does this print?

```js
const order = [];
class Registry {
  static items = (order.push('field'), []);
  static {
    order.push('block');
    Registry.items.push('seeded');
  }
  static count = (order.push('after'), Registry.items.length);
}
console.log(order.join(','), Registry.items, Registry.count);
```

<details><summary>Answer</summary>

**`field,block,after [ 'seeded' ] 1`** — static fields and `static {}` blocks run once, at class-definition time, strictly in source order.

A static block is the answer to "I need real statements to set up a static member": try/catch, loops, or access to a sibling that has to exist first. It runs with `this` bound to the class, and it can reach the class's own private fields, which is how you grant one class privileged access to another's internals. Because everything runs in written order, `count` sees the seeded array — moving the block below `count` would silently give you `0`.
</details>

---

### Q25 — an inherited setter creates nothing

What does this print?

```js
const protoWithSetter = {
  set v(n) { this._v = n; },
  get v() { return this._v; },
};
const a = Object.create(protoWithSetter);
a.v = 5;
console.log(a.v, Object.hasOwn(a, 'v'), Object.hasOwn(a, '_v'));
const protoWithData = { w: 1 };
const b = Object.create(protoWithData);
b.w = 5;
console.log(b.w, Object.hasOwn(b, 'w'), protoWithData.w);
```

<details><summary>Answer</summary>

**`5 false true`**, then **`5 true 1`** — assignment finds an inherited *accessor* and calls it; it finds an inherited *data* property and shadows it.

This is the asymmetry that Q7's shadowing rule leaves out. When `[[Set]]` walks the chain and finds a setter, the setter runs and no own property is created — here it wrote `_v` instead, which is why `hasOwn(a, 'v')` is `false`. When it finds a plain data property, the write becomes a fresh own property on the receiver and the prototype keeps its value. The practical consequence: `{ ...a }` copies `_v` and loses `v`, so spreading an object whose state lives behind accessors gives you the wrong shape.
</details>

---

### Q26 — an abstract base

What does this print?

```js
class Shape {
  constructor() {
    if (new.target === Shape) throw new TypeError('Shape is abstract');
    this.kind = new.target.name;
  }
}
class Circle extends Shape {}
console.log(new Circle().kind);
try {
  new Shape();
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
```

<details><summary>Answer</summary>

**`Circle`**, then **`TypeError: Shape is abstract`** — through `super()`, `new.target` stays pointed at the most-derived constructor, so the base can tell who is really being built.

JavaScript has no `abstract` keyword, and this three-line guard is the whole implementation. It works because `new Circle()` sets `new.target` to `Circle` and the implicit `super()` forwards that value unchanged, so the equality test only fires on direct construction. The same value gives you the subclass name for free. Pair it with a method that throws (`render() { throw new Error('not implemented'); }`) to get the other half of what an abstract class means.
</details>

---

### Q27 — super is bound to the home object

What does this print?

```js
const base = { who() { return 'base'; } };
const child = {
  __proto__: base,
  shorthand() { return 'shorthand->' + super.who(); },
};
console.log(child.shorthand());
const detached = child.shorthand;
console.log(detached.call({ who: () => 'other' }));
console.log(Object.getPrototypeOf(child) === base);
```

<details><summary>Answer</summary>

**`shorthand->base`** twice, then **`true`** — `super` resolves through the *home object* the method was defined in, not through `this`.

Every method shorthand carries a hidden `[[HomeObject]]` link to the literal or prototype that contains it, and `super.who` means "look up `who` starting at that home object's prototype". Changing the receiver with `call` changes `this` but cannot change where `super` looks, so the foreign `who` is never reached. The corollary is a real gotcha: `super` is a syntax error in a `function`-expression property and in arrows, because only concise methods get a home object — `{ m() {} }` can use `super`, `{ m: function () {} }` cannot.
</details>

---

### Q28 — a field shadows an inherited accessor

What does this print?

```js
const log = [];
class Base {
  set label(v) { log.push('setter ' + v); this._label = v; }
  get label() { return this._label; }
}
class Declared extends Base {
  label = 'field';
}
class Plain extends Base {}
const d = new Declared();
const p = new Plain();
p.label = 'assigned';
console.log(log);
console.log(d.label, Object.hasOwn(d, 'label'));
console.log(p.label, Object.hasOwn(p, 'label'));
```

<details><summary>Answer</summary>

**`[ 'setter assigned' ]`**, **`field true`**, **`assigned false`** — a class field is *defined*, not assigned, so it silently replaces an inherited accessor with a plain own data property.

Field initializers use `[[DefineOwnProperty]]`, which skips the prototype chain entirely — the parent's setter is never invoked (note the log holds only the `Plain` assignment) and `d` ends up with an own `label` that shadows both accessors, so validation, change tracking, and reactivity in the base class are all dead for that subclass. `Plain`'s ordinary assignment goes through `[[Set]]`, finds the setter, and creates no own property, exactly as in Q25. This is the single most surprising consequence of class fields, and it's why TypeScript has `declare` and `useDefineForClassFields`.
</details>
