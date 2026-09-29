// ─────────────────────────────────────────────────────────────────────────
//  09 · TypedStack & Registry                             ★★☆ core
//  concepts: generic classes · instance-level type parameters
//  run: node ../run.js exercises/09-generic-classes.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A class type parameter is fixed once, at `new`, and every member sees
//  the same T for the life of the instance.
//
//      const s = new TypedStack<number>();
//      s.push(1); s.push(2);
//      s.pop()      → 2          typed number | undefined
//      s.peek()     → 1
//      s.size       → 1
//
//      const r = new Registry<{ hp: number }>();
//      r.set('goblin', { hp: 7 });
//      r.get('goblin')  → { hp: 7 }   typed { hp: number } | undefined
//      r.get('dragon')  → undefined
//
//  `pop` and `get` must admit they can come back empty — `T | undefined`
//  is the honest return type, and it is what forces callers to check.
//
//  hint: the private storage needs a type too — `T[]` and
//  `Map<string, T>` refer to the class parameter

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export class TypedStack<T> {
  private items: TODO = [];

  push(item: TODO): void {
    throw new Error('TODO');
  }

  pop(): TODO {
    throw new Error('TODO');
  }

  peek(): TODO {
    throw new Error('TODO');
  }

  get size(): number {
    throw new Error('TODO');
  }
}

export class Registry<T> {
  private store: TODO = new Map();

  set(key: string, value: TODO): void {
    throw new Error('TODO');
  }

  get(key: string): TODO {
    throw new Error('TODO');
  }

  has(key: string): boolean {
    throw new Error('TODO');
  }

  keys(): string[] {
    throw new Error('TODO');
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
