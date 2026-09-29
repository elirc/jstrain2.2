// ─────────────────────────────────────────────────────────────────────────
//  12 · typed event handlers                                ★★☆ core
//  concepts: template literal types · Capitalize · payload inference
//  run: node ../run.js exercises/12-event-names.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A React-flavoured convention: the event is called `click`, the prop is
//  called `onClick`, and the handler gets that event's payload and no
//  other. One event map should generate all of it.
//
//      Listeners  →  { onClick?: (p: { x: number; y: number }) => void
//                      onFocus?: (p: { id: string }) => void
//                      onClose?: (p: { reason: string }) => void }
//
//  Build Listeners from AppEvents, then the two functions: `on` registers
//  a handler under its on-name, `emit` computes that name from the event
//  and calls the handler if one is registered.
//
//  hint: every handler is optional, so the value you read back is
//  `((p: ...) => void) | undefined` — NonNullable<T> is the way to say
//  "the handler itself" in `on`'s signature

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface AppEvents {
  click: { x: number; y: number };
  focus: { id: string };
  close: { reason: string };
}

export type Listeners = TODO;

export function on<N extends keyof Listeners>(
  listeners: Listeners,
  name: N,
  handler: NonNullable<Listeners[N]>
): void {
  throw new Error('TODO');
}

export function emit<K extends keyof AppEvents>(
  listeners: Listeners,
  event: K,
  payload: AppEvents[K]
): void {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('emit reaches the handler registered under the on-name', () => {
  const seen: Array<{ x: number; y: number }> = [];
  const listeners: Listeners = {};
  on(listeners, 'onClick', (payload) => {
    seen.push(payload);
  });
  emit(listeners, 'click', { x: 1, y: 2 });
  eq(seen, [{ x: 1, y: 2 }]);
});

test('on stores the handler under the prefixed key', () => {
  const listeners: Listeners = {};
  on(listeners, 'onFocus', () => {});
  eq(Object.keys(listeners), ['onFocus']);
});

test('emitting an event with no handler is a no-op', () => {
  const listeners: Listeners = {};
  emit(listeners, 'close', { reason: 'done' });
  ok(true);
});

test('handlers are independent per event', () => {
  const clicks = spy<[{ x: number; y: number }], void>();
  const closes = spy<[{ reason: string }], void>();
  const listeners: Listeners = {};
  on(listeners, 'onClick', clicks);
  on(listeners, 'onClose', closes);
  emit(listeners, 'close', { reason: 'done' });
  eq(clicks.callCount, 0);
  eq(closes.callCount, 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<keyof Listeners, 'onClick' | 'onFocus' | 'onClose'>
>;
type _t2 = Expect<
  Equal<
    Listeners,
    {
      onClick?: (payload: { x: number; y: number }) => void;
      onFocus?: (payload: { id: string }) => void;
      onClose?: (payload: { reason: string }) => void;
    }
  >
>;
type _t3 = Expect<
  Equal<NonNullable<Listeners['onFocus']>, (payload: { id: string }) => void>
>;

function _typeTests() {
  const listeners: Listeners = {};

  // the payload is inferred from the on-name, no annotation needed
  on(listeners, 'onClick', (payload) => {
    const x: number = payload.x;
    use(x);
  });

  // @ts-expect-error — onScroll is not one of the declared events
  on(listeners, 'onScroll', () => {});

  // @ts-expect-error — the raw event name is not the handler key
  on(listeners, 'click', () => {});

  // @ts-expect-error — a focus handler cannot take a click payload
  on(listeners, 'onFocus', (payload: { x: number; y: number }) => use(payload));

  // @ts-expect-error — emit takes the EVENT name, not the handler key
  emit(listeners, 'onClick', { x: 1, y: 2 });

  // @ts-expect-error — the payload must match the event
  emit(listeners, 'focus', { x: 1, y: 2 });
}
use(_typeTests);
