// ─────────────────────────────────────────────────────────────────────────
//  30 · optional calls — SOLUTION                               ★★☆ core
//  run: node 30-optional-call.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `target?.[name]?.(payload)` is two guards, and they guard
//  different things. The first says "target might be nullish"; the second
//  says "the hook might be nullish". Drop either one and you get a
//  different TypeError.
//
//  What `?.` does NOT do is check callability. `{ onSave: 'yes' }` has a
//  perfectly non-nullish hook, so the call happens and throws — which is
//  correct: a hook of the wrong type is a bug you want to see, not one to
//  swallow. `?.` is not a try/catch.
//
//  The short-circuit runs to the END of the chain, so in `a?.run(cost())`
//  the argument expression never executes when `a` is nullish. That is why
//  notify uses `listener?.(event)` per slot rather than filtering first.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function fire(target, name, payload) {
  return target?.[name]?.(payload);
}

export function notify(listeners, event) {
  return listeners.map((listener) => listener?.(event));
}

// ──────────────────────────── tests ──────────────────────────────────────

test('fire calls the named hook and returns its result', () => {
  eq(fire({ onSave: (x) => x * 2 }, 'onSave', 21), 42);
  eq(fire({ onSave: () => 'done' }, 'onSave'), 'done');
});

test('a missing hook is undefined, not an error', () => {
  eq(fire({}, 'onSave', 21), undefined);
  eq(fire({ onLoad: () => 1 }, 'onSave'), undefined);
});

test('a nullish target short-circuits before the lookup', () => {
  eq(fire(null, 'onSave', 21), undefined);
  eq(fire(undefined, 'onSave'), undefined);
});

test('?. means nullish, not safe — a non-callable hook still throws', () => {
  eq(fire({}, 'onSave'), undefined);
  throws(() => fire({ onSave: 'yes' }, 'onSave'), 'not a function');
  throws(() => fire({ onSave: 42 }, 'onSave'), 'not a function');
});

test('a short-circuit skips the rest of the chain, arguments too', () => {
  eq(fire(null, 'onSave'), undefined);
  const buildArg = spy(() => 'expensive');
  const missing = null;
  eq(missing?.run(buildArg()), undefined);
  eq(buildArg.callCount, 0, 'the argument was never even built');
});

test('notify calls every listener it was given, in order', () => {
  const seen = [];
  const first = spy((e) => seen.push(`a:${e}`));
  const second = spy((e) => seen.push(`b:${e}`));
  notify([first, second], 'saved');
  eq(first.callCount, 1);
  eq(second.callCount, 1);
  eq(seen, ['a:saved', 'b:saved']);
});

test('notify steps over empty slots instead of throwing', () => {
  const seen = spy(() => 'ok');
  eq(notify([null, seen, undefined], 'saved'), [undefined, 'ok', undefined]);
  eq(seen.callCount, 1);
  eq(notify([], 'saved'), []);
});

test('notify hands each listener the event untouched', () => {
  const event = { kind: 'saved' };
  const listener = spy((e) => e);
  const results = notify([listener], event);
  ok(results[0] === event, 'the same object, not a copy');
  eq(listener.calls, [[event]]);
});
