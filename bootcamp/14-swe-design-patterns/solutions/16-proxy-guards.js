// ─────────────────────────────────────────────────────────────────────────
//  16 · Proxy traps — SOLUTION                               ★★★ stretch
//  concepts: Proxy · Reflect · interception
//  run: node solutions/16-proxy-guards.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — stand in for an object and intercept the operations done to
//  it, without the object (or its users) knowing.
//  Each trap follows the same shape: handle the case you care about,
//  then hand everything else to `Reflect`, which does exactly what would
//  have happened without the proxy. Skipping that fallback is how people
//  break `length`, `push` and `map` by accident.
//  `withDefault` uses `Reflect.has`, not `?? fallback` — the whole point
//  is that a stored `0`, `''` or `null` is a real value and only an
//  *absent* key gets the default.
//  Note `Reflect.set(target, prop, value)` is called without a receiver;
//  passing the proxy back in re-enters the machinery and surprises you.
//  When NOT to use: a proxy makes reads and writes ~an order of
//  magnitude slower and makes debugging spooky ("this line assigns a
//  number and throws?"). For validation you own, a normal setter method
//  is clearer. Reach for Proxy when you must intercept an object whose
//  call sites you do not control.
//  In the wild: Vue 3 reactivity, MobX observables, `immer` drafts,
//  Jest's automock, Cloudflare/Node ORM lazy row objects.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function validated(target, rules) {
  return new Proxy(target, {
    set(obj, prop, value) {
      const rule = rules[prop];
      if (!rule) throw new Error(`unknown property: ${String(prop)}`);
      if (!rule(value)) {
        throw new TypeError(`invalid ${String(prop)}: ${String(value)}`);
      }
      return Reflect.set(obj, prop, value);
    },
  });
}

export function withDefault(target, fallback) {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (Reflect.has(obj, prop)) return Reflect.get(obj, prop, receiver);
      return fallback;
    },
  });
}

export function negativeIndex(array) {
  return new Proxy(array, {
    get(obj, prop, receiver) {
      if (typeof prop === 'string' && /^-\d+$/.test(prop)) {
        return obj[obj.length + Number(prop)];
      }
      return Reflect.get(obj, prop, receiver);
    },
  });
}

const RULES = {
  name: (v) => typeof v === 'string' && v.length > 0,
  age: (v) => Number.isInteger(v) && v >= 0,
};

// ──────────────────────────── tests ──────────────────────────────────────

test('valid writes and reads pass straight through', () => {
  const user = validated({ name: 'Ada', age: 36 }, RULES);
  user.age = 37;
  eq(user.age, 37);
  eq(user.name, 'Ada');
  eq({ ...user }, { name: 'Ada', age: 37 });
});

test('a value that fails its rule is rejected, and nothing changes', () => {
  const raw = { name: 'Ada', age: 36 };
  const user = validated(raw, RULES);
  throws(() => {
    user.age = -1;
  }, 'invalid age');
  eq(user.age, 36);
  eq(raw.age, 36);
});

test('an unknown property is rejected by name', () => {
  const user = validated({ name: 'Ada', age: 36 }, RULES);
  throws(() => {
    user.nmae = 'typo';
  }, 'unknown property: nmae');
});

test('withDefault fills in only what is missing', () => {
  const counts = withDefault({ a: 1 }, 0);
  eq(counts.a, 1);
  eq(counts.zzz, 0);
  counts.b = 5;
  eq(counts.b, 5);
});

test('withDefault does not confuse missing with falsy', () => {
  const counts = withDefault({ a: 0, b: '', c: null }, 99);
  eq(counts.a, 0);
  eq(counts.b, '');
  eq(counts.c, null);
  eq(counts.d, 99);
});

test('negativeIndex counts back from the end', () => {
  const letters = negativeIndex(['x', 'y', 'z']);
  eq(letters[-1], 'z');
  eq(letters[-3], 'x');
  eq(letters[-4], undefined);
});

test('negativeIndex leaves the array otherwise intact', () => {
  const letters = negativeIndex(['x', 'y', 'z']);
  eq(letters[0], 'x');
  eq(letters.length, 3);
  letters.push('w');
  eq(letters.length, 4);
  eq(letters[-1], 'w');
  eq(letters.map((c) => c.toUpperCase()), ['X', 'Y', 'Z', 'W']);
  ok(Array.isArray(letters));
});
