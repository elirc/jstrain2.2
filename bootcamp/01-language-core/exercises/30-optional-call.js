// ─────────────────────────────────────────────────────────────────────────
//  30 · optional calls                                          ★★☆ core
//  concepts: fn?.() · optional chaining on calls · short-circuit
//  run: node 30-optional-call.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Plugins implement whatever hooks they feel like, and callbacks are
//  optional by nature. `fn?.()` calls fn when it is there and evaluates to
//  undefined when it is null or undefined — no `typeof` dance, no if.
//
//      fire({ onSave: (x) => x * 2 }, 'onSave', 21)   → 42
//      fire({}, 'onSave', 21)                         → undefined
//      fire(null, 'onSave', 21)                       → undefined
//      fire({ onSave: 'yes' }, 'onSave')              → throws TypeError
//
//  `?.` means "nullish", not "safe": a hook that exists but is not
//  callable is still a bug and must still blow up.
//
//      notify([logA, null, logB], 'saved')  → [resultA, undefined, resultB]
//
//  notify calls each listener with the event, in order, and collects what
//  each one returned — undefined for the empty slots.
//
//  hint: `target?.[name]?.(payload)` — two separate `?.`, one for the
//  object and one for the call. Once a `?.` short-circuits, the REST of
//  the chain is skipped, arguments included.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

export function fire(target, name, payload) {
  throw new Error('TODO');
}

export function notify(listeners, event) {
  throw new Error('TODO');
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
