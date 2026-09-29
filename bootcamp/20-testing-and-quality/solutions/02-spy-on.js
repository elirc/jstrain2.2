// ─────────────────────────────────────────────────────────────────────────
//  02 · spyOn — SOLUTION                                        ★★☆ core
//  run: node 02-spy-on.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: patching is three moves — remember, replace, restore — and
//  the whole exercise is in "remember" being harder than it looks.
//  `obj[method]` finds the function even when it lives on the prototype,
//  so a naive restore (`obj[method] = original`) plants an OWN copy on the
//  instance. The object still behaves, so nothing goes red today; the leak
//  shows up months later as a test that only fails in a certain order.
//  `Object.hasOwn` before patching is the fix: own property → assign back,
//  inherited → `delete`.
//  The spy is a `function` and not an arrow because `this` must stay the
//  receiver: `obj.method()` calls the spy with `this === obj`, and
//  `original.apply(this, args)` hands that straight through. An arrow would
//  capture the module scope and every `this.x` inside the real method would
//  explode.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function spyOn(obj, method, impl) {
  const original = obj[method];
  if (typeof original !== 'function') {
    throw new TypeError(`${String(method)} is not a method`);
  }
  const hadOwn = Object.hasOwn(obj, method);
  let restored = false;

  const s = function (...args) {
    s.calls.push(args);
    s.callCount = s.calls.length;
    const result = impl ? impl.apply(this, args) : original.apply(this, args);
    s.returns.push(result);
    return result;
  };

  s.calls = [];
  s.returns = [];
  s.callCount = 0;
  s.original = original;
  s.restore = () => {
    if (restored) return;
    restored = true;
    if (hadOwn) obj[method] = original;
    else delete obj[method];
  };

  obj[method] = s;
  return s;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the spy calls through to the original by default', () => {
  const api = { double: (n) => n * 2 };
  const s = spyOn(api, 'double');
  eq(api.double(21), 42);
  eq(s.callCount, 1);
});

test('the spy records arguments and return values', () => {
  const api = { double: (n) => n * 2 };
  const s = spyOn(api, 'double');
  api.double(1);
  api.double(5);
  eq(s.calls, [[1], [5]]);
  eq(s.returns, [2, 10]);
});

test('`this` is still the object the method was called on', () => {
  const counter = {
    count: 0,
    bump(n) {
      this.count += n;
      return this.count;
    },
  };
  spyOn(counter, 'bump');
  eq(counter.bump(2), 2);
  eq(counter.bump(3), 5);
  eq(counter.count, 5);
});

test('restore puts the exact original function back', () => {
  const double = (n) => n * 2;
  const api = { double };
  const s = spyOn(api, 'double');
  ok(api.double !== double, 'the method should be patched while spying');
  s.restore();
  ok(api.double === double, 'restore should put the original back');
});

test('restoring an inherited method leaves no own property behind', () => {
  const proto = {
    greet() {
      return 'hi';
    },
  };
  const obj = Object.create(proto);
  const s = spyOn(obj, 'greet');
  eq(obj.greet(), 'hi');
  s.restore();
  eq(Object.hasOwn(obj, 'greet'), false);
  eq(obj.greet(), 'hi');
});

test('a replacement implementation runs instead of the original', () => {
  let realRan = false;
  const api = {
    save() {
      realRan = true;
      return 'real';
    },
  };
  const s = spyOn(api, 'save', () => 'stubbed');
  eq(api.save(), 'stubbed');
  eq(realRan, false);
  eq(s.callCount, 1);
});

test('calls made after restore are not recorded', () => {
  const api = { double: (n) => n * 2 };
  const s = spyOn(api, 'double');
  api.double(1);
  s.restore();
  api.double(2);
  eq(s.callCount, 1);
});

test('restore twice is harmless, and spying on a non-method throws', () => {
  const api = { double: (n) => n * 2, version: '1.0' };
  const s = spyOn(api, 'double');
  s.restore();
  s.restore();
  eq(api.double(4), 8);
  throws(() => spyOn(api, 'version'));
});
