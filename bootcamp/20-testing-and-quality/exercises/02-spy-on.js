// ─────────────────────────────────────────────────────────────────────────
//  02 · spyOn                                                   ★★☆ core
//  concepts: monkey patching · this-binding · cleanup
//  run: node 02-spy-on.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Sometimes you cannot inject the collaborator — it is a method on an
//  object you were handed. So you patch it, watch it, and put it back.
//  Every mocking library on earth is this function plus paperwork.
//
//      const s = spyOn(api, 'save');       // patched, still calls through
//      api.save({ id: 1 });
//      s.calls        → [[{ id: 1 }]]
//      s.returns      → ['ok']             // what the real method returned
//      s.callCount    → 1
//      s.restore();                        // api.save is the real one again
//
//      spyOn(api, 'save', () => 'stubbed') // 3rd arg replaces the body:
//                                          // the original never runs
//
//  Rules: the original must still receive the right `this`; restore() must
//  leave the object EXACTLY as it was found and be safe to call twice;
//  spying on something that is not a function throws.
//
//  hint: `Object.hasOwn(obj, name)` before you patch. A method that lived
//  on the prototype must be `delete`d on restore, not assigned back.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function spyOn(obj, method, impl) {
  throw new Error('TODO');
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
