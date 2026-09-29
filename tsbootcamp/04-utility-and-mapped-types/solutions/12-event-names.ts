// ─────────────────────────────────────────────────────────────────────────
//  12 · typed event handlers — SOLUTION                     ★★☆ core
//  run: node ../run.js solutions/12-event-names.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//      type Listeners = {
//        [K in keyof AppEvents as `on${Capitalize<K & string>}`]?:
//          (payload: AppEvents[K]) => void;
//      };
//
//  One source of truth (AppEvents), three derived handler slots. Add an
//  event to the map and `on(listeners, 'onResize', ...)` starts compiling
//  the same day. The `?` is what makes `{}` a valid Listeners.
//
//  Why the payload infers: the `as` clause renames the key but K is still
//  in scope on the value side, so `AppEvents[K]` stays glued to the key it
//  came from. `on` is generic in the HANDLER key N, and
//  `NonNullable<Listeners[N]>` reads the handler type back out with the
//  `| undefined` (from the `?`) removed — which is what gives the arrow's
//  `payload` parameter a contextual type at the call site.
//
//  `emit` has to bridge back the other way, and only at runtime: build
//  `onClick` from `click` with charAt/toUpperCase. tsc cannot follow that
//  string, hence the two casts. Notice the shape of the honest fix — the
//  casts live in ONE five-line function, and every caller stays typed.
//
//  (`K & string` is belt-and-braces here because every key of AppEvents is
//  already a string literal. Keep the habit: over a generic T, `keyof T`
//  can contain symbols and `Capitalize<symbol>` does not compile.)

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface AppEvents {
  click: { x: number; y: number };
  focus: { id: string };
  close: { reason: string };
}

export type Listeners = {
  [K in keyof AppEvents as `on${Capitalize<K & string>}`]?: (
    payload: AppEvents[K]
  ) => void;
};

export function on<N extends keyof Listeners>(
  listeners: Listeners,
  name: N,
  handler: NonNullable<Listeners[N]>
): void {
  listeners[name] = handler;
}

export function emit<K extends keyof AppEvents>(
  listeners: Listeners,
  event: K,
  payload: AppEvents[K]
): void {
  const name = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`;
  const handler = listeners[name as keyof Listeners];
  if (handler) (handler as (p: AppEvents[K]) => void)(payload);
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
