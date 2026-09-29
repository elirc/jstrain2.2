// ─────────────────────────────────────────────────────────────────────────
//  09 · TypedStack & Registry — SOLUTION                  ★★☆ core
//  run: node ../run.js solutions/09-generic-classes.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `class TypedStack<T>` declares T once for the whole
//  instance — the field, the parameters and the return types all share
//  it. That is the difference from a generic function, where every call
//  gets a fresh T: here `new TypedStack<number>()` pins it, and the
//  instance is a `TypedStack<number>` forever.
//
//  `pop(): T | undefined` is the design decision worth arguing about. The
//  array method it wraps really can return nothing, so the type says so,
//  and callers are forced to handle it. Writing `pop(): T` and returning
//  `this.items.pop()!` compiles and lies — the `!` moves the crash from
//  the compiler to production.
//
//  `new TypedStack()` with no type argument gives `TypedStack<unknown>`,
//  which pushes anything and pops something you cannot use. Annotate the
//  variable or instantiate explicitly; see exercise 10 for the version
//  that supplies a friendlier fallback.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export class TypedStack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

export class Registry<T> {
  private store = new Map<string, T>();

  set(key: string, value: T): void {
    this.store.set(key, value);
  }

  get(key: string): T | undefined {
    return this.store.get(key);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('pops in last-in-first-out order', () => {
  const s = new TypedStack<number>();
  s.push(1);
  s.push(2);
  eq(s.pop(), 2);
  eq(s.pop(), 1);
});

test('popping an empty stack gives undefined', () => {
  eq(new TypedStack<string>().pop(), undefined);
});

test('peek looks without removing', () => {
  const s = new TypedStack<string>();
  s.push('a');
  eq(s.peek(), 'a');
  eq(s.size, 1);
});

test('two instances keep separate storage', () => {
  const a = new TypedStack<number>();
  const b = new TypedStack<number>();
  a.push(1);
  eq(b.size, 0);
});

test('the registry stores and returns values by key', () => {
  const r = new Registry<{ hp: number }>();
  r.set('goblin', { hp: 7 });
  eq(r.get('goblin'), { hp: 7 });
  eq(r.get('dragon'), undefined);
});

test('the registry reports keys and membership', () => {
  const r = new Registry<number>();
  r.set('a', 1);
  r.set('b', 2);
  eq(r.has('a'), true);
  eq(r.has('zz'), false);
  eq(r.keys(), ['a', 'b']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<TypedStack<number>['pop']>, number | undefined>>;
type _r2 = Expect<Equal<ReturnType<Registry<string>['get']>, string | undefined>>;

function _typeTests() {
  const stack = new TypedStack<number>();
  stack.push(1);
  const top = stack.pop();
  type _t = Expect<Equal<typeof top, number | undefined>>;
  use(top);

  // @ts-expect-error — this stack was fixed to number at `new`
  stack.push('one');

  // @ts-expect-error — pop() may be empty, so it is not just a number
  const n: number = stack.pop();
  use(n);

  // no argument, no annotation, nothing to infer from
  const bare = new TypedStack();
  type _b = Expect<Equal<typeof bare, TypedStack<unknown>>>;
  use(bare);

  const registry = new Registry<{ hp: number }>();
  const found = registry.get('goblin');
  type _f = Expect<Equal<typeof found, { hp: number } | undefined>>;
  use(found);

  // @ts-expect-error — the value must match the registry's T
  registry.set('goblin', 7);
}
use(_typeTests);
