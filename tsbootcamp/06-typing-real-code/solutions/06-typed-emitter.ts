// ─────────────────────────────────────────────────────────────────────────
//  06 · a typed event emitter — SOLUTION                   ★★★ stretch
//  run: node ../run.js solutions/06-typed-emitter.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the trick is that the payload is a TUPLE type, so
//  `...args: E[K]` expands into real parameters — arity, order and labels
//  all come along. `close: []` means "no arguments", and `bus.emit('close',
//  1)` fails for the same reason any zero-parameter call would.
//
//  The store is a mapped type, `{ [K in keyof E]?: Array<(...args: E[K])
//  => void> }`, not `Record<keyof E, Function[]>`. The mapped version
//  remembers which payload belongs to which key, so inside `emit` the
//  compiler knows `listener(...args)` lines up. Optional (`?`) is what
//  lets the object start out `{}` — and `??=` fills a bucket the first
//  time an event is subscribed to.
//
//  At the call site nobody writes `bus.on<'message'>(...)`: K is inferred
//  from the string literal, and the listener's parameters are then
//  contextually typed. Inference at call sites, annotations at the
//  boundary — the boundary here is the class's own signatures.
//
//  One sharp edge: the constraint is `Record<string, unknown[]>`, and an
//  `interface ChatEvents { ... }` does NOT satisfy it — interfaces get no
//  implicit index signature, type aliases do. This is why event maps in
//  the wild are almost always written with `type`.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

// the constraint every event map must satisfy
export type EventMap = Record<string, unknown[]>;

export class Emitter<E extends EventMap> {
  private listeners: { [K in keyof E]?: Array<(...args: E[K]) => void> } = {};

  on<K extends keyof E>(event: K, listener: (...args: E[K]) => void): () => void {
    (this.listeners[event] ??= []).push(listener);
    return () => {
      this.off(event, listener);
    };
  }

  off<K extends keyof E>(event: K, listener: (...args: E[K]) => void): void {
    const list = this.listeners[event];
    if (!list) return;
    const at = list.indexOf(listener);
    if (at >= 0) list.splice(at, 1);
  }

  emit<K extends keyof E>(event: K, ...args: E[K]): void {
    // copy first: a listener may unsubscribe itself mid-emit
    for (const listener of [...(this.listeners[event] ?? [])]) listener(...args);
  }

  listenerCount<K extends keyof E>(event: K): number {
    return this.listeners[event]?.length ?? 0;
  }
}

type ChatEvents = {
  message: [text: string];
  close: [];
};

// ─────────────────────────── runtime tests ───────────────────────────────

test('emit delivers the payload to every listener, in order', () => {
  const bus = new Emitter<ChatEvents>();
  const seen: string[] = [];
  bus.on('message', (text) => seen.push(`a:${text}`));
  bus.on('message', (text) => seen.push(`b:${text}`));
  bus.emit('message', 'hi');
  eq(seen, ['a:hi', 'b:hi']);
});

test('off removes exactly one listener and leaves the rest', () => {
  const bus = new Emitter<ChatEvents>();
  const seen: string[] = [];
  const first = (text: string) => seen.push(`a:${text}`);
  bus.on('message', first);
  bus.on('message', (text) => seen.push(`b:${text}`));
  bus.off('message', first);
  bus.emit('message', 'hi');
  eq(seen, ['b:hi']);
  eq(bus.listenerCount('message'), 1);
});

test('the unsubscribe returned by on does the same job', () => {
  const bus = new Emitter<ChatEvents>();
  const seen: string[] = [];
  const stop = bus.on('message', (text) => seen.push(text));
  bus.emit('message', 'one');
  stop();
  bus.emit('message', 'two');
  eq(seen, ['one']);
  eq(bus.listenerCount('message'), 0);
});

test('emitting an event nobody listens to is a quiet no-op', () => {
  const bus = new Emitter<ChatEvents>();
  bus.emit('close');
  eq(bus.listenerCount('close'), 0);
});

test('an event with an empty payload tuple still fires', () => {
  const bus = new Emitter<ChatEvents>();
  let closed = 0;
  bus.on('close', () => { closed += 1; });
  bus.emit('close');
  bus.emit('close');
  eq(closed, 2);
});

// ──────────────────────────── type tests ─────────────────────────────────

declare const typedBus: Emitter<ChatEvents>;
type _b1 = Expect<Equal<Parameters<typeof typedBus.emit<'message'>>, ['message', text: string]>>;
type _b2 = Expect<Equal<ReturnType<typeof typedBus.listenerCount<'close'>>, number>>;

function _typeTests() {
  const bus = new Emitter<ChatEvents>();

  bus.on('message', (text) => {
    const inferred: string = text;
    use(inferred);
  });

  // @ts-expect-error — 'closed' is not an event on this bus
  bus.on('closed', () => {});

  // @ts-expect-error — message needs its string payload
  bus.emit('message');

  // @ts-expect-error — the message payload is a string, not a number
  bus.emit('message', 1);

  // @ts-expect-error — close carries no payload at all
  bus.emit('close', 1);

  // @ts-expect-error — the listener is handed a string, not a number
  bus.on('message', (text: number) => use(text));
}
use(_typeTests);
