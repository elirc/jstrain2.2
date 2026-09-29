// ─────────────────────────────────────────────────────────────────────────
//  06 · a typed event emitter                              ★★★ stretch
//  concepts: generic classes · keyof · tuple payloads · rest params
//  run: node ../run.js exercises/06-typed-emitter.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  The classic. Node's EventEmitter takes `(event: string, ...args:
//  any[])` and every typo is a silent no-op. The typed version takes a
//  map of event name → payload TUPLE, and then `emit` is as strict as a
//  normal function call.
//
//      const bus = new Emitter<{ message: [text: string]; close: [] }>();
//      bus.on('message', text => ...)   // text is a string, inferred
//      bus.emit('message', 'hi')        // ok
//      bus.emit('message')              // error: missing payload
//      bus.emit('close', 1)             // error: close takes nothing
//      bus.on('closed', ...)            // error: no such event
//
//  `on` returns an unsubscribe function; `off` removes one listener;
//  `listenerCount` reports how many are attached.
//
//  hint: the payload type is a TUPLE, so `...args: E[K]` spreads it into
//  real parameters. The listener store wants a mapped type — an ordinary
//  `Record<keyof E, Function[]>` forgets which payload goes where

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

// the constraint every event map must satisfy
export type EventMap = TODO;

export class Emitter<E extends EventMap> {
  private listeners: TODO = {};

  on(event: TODO, listener: TODO): TODO {
    throw new Error('TODO');
  }

  off(event: TODO, listener: TODO): TODO {
    throw new Error('TODO');
  }

  emit(event: TODO, ...args: TODO[]): TODO {
    throw new Error('TODO');
  }

  listenerCount(event: TODO): TODO {
    throw new Error('TODO');
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
