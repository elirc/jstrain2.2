// ─────────────────────────────────────────────────────────────────────────
//  02 · socket message match                                ★★★ stretch
//  concepts: mapped types · Extract · handler maps
//  run: node ../run.js exercises/02-socket-message-match.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-02 and TS-04.
//
//  A socket emits four messages, each with its own payload:
//
//      open  { url }              data  { payload, seq }
//      error { code, reason }     close { clean }
//
//  Write the union, then `Handlers<R>` — one handler per kind, each typed
//  to see ONLY its own variant — and a `match(msg, handlers)` that routes.
//
//      match({ kind: 'data', payload: 'hello', seq: 3 }, toLine)
//                                            → 'data #3 (5b)'
//      match({ kind: 'close', clean: false }, toLine)
//                                            → 'closed abruptly'

import { test, eq, ok, spy } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type SocketMessage = TODO;

export type MessageKind = TODO;

export type Handlers<R> = TODO;

export function match<R>(msg: SocketMessage, handlers: Handlers<R>): R {
  throw new Error('TODO');
}

export const toLine: Handlers<string> = {
  open: () => {
    throw new Error('TODO');
  },
  data: () => {
    throw new Error('TODO');
  },
  error: () => {
    throw new Error('TODO');
  },
  close: () => {
    throw new Error('TODO');
  },
};

export function logLine(msg: SocketMessage): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('every kind routes to its own handler', () => {
  eq(logLine({ kind: 'open', url: 'wss://api.test/s' }), 'open wss://api.test/s');
  eq(logLine({ kind: 'data', payload: 'hello', seq: 3 }), 'data #3 (5b)');
  eq(logLine({ kind: 'error', code: 1006, reason: 'lost' }), 'error 1006: lost');
  eq(logLine({ kind: 'close', clean: true }), 'closed cleanly');
});

test('the close handler reads its own boolean payload', () => {
  eq(logLine({ kind: 'close', clean: false }), 'closed abruptly');
});

test('match returns whatever the handlers return', () => {
  const weight: Handlers<number> = {
    open: () => 0,
    data: (msg) => msg.seq,
    error: (msg) => msg.code,
    close: (msg) => (msg.clean ? 1 : 0),
  };
  eq(match({ kind: 'data', payload: 'x', seq: 7 }, weight), 7);
  eq(match({ kind: 'error', code: 500, reason: 'x' }, weight), 500);
});

test('exactly one handler runs per message', () => {
  const open = spy(() => 'o');
  const data = spy(() => 'd');
  const counted: Handlers<string> = {
    open,
    data,
    error: () => 'e',
    close: () => 'c',
  };
  eq(match({ kind: 'data', payload: 'x', seq: 1 }, counted), 'd');
  eq(open.callCount, 0);
  eq(data.callCount, 1);
});

test('the handler receives the whole message object', () => {
  const seen: unknown[] = [];
  const spyMap: Handlers<void> = {
    open: (msg) => void seen.push(msg),
    data: (msg) => void seen.push(msg),
    error: (msg) => void seen.push(msg),
    close: (msg) => void seen.push(msg),
  };
  match({ kind: 'open', url: 'wss://x' }, spyMap);
  eq(seen, [{ kind: 'open', url: 'wss://x' }]);
  ok(seen.length === 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<MessageKind, 'open' | 'data' | 'error' | 'close'>>;
type _t2 = Expect<
  Equal<
    Parameters<Handlers<string>['data']>[0],
    { kind: 'data'; payload: string; seq: number }
  >
>;
type _t3 = Expect<Equal<keyof Handlers<string>, MessageKind>>;
type _t4 = Expect<Equal<ReturnType<typeof match<number>>, number>>;

function _typeTests() {
  const line: string = logLine({ kind: 'close', clean: true });
  use(line);

  const typed: Handlers<number> = {
    open: (msg) => msg.url.length,
    // @ts-expect-error — a data message carries no `code`
    data: (msg) => msg.code,
    error: (msg) => msg.code,
    close: (msg) => (msg.clean ? 1 : 0),
  };
  use(typed);

  // @ts-expect-error — every kind needs a handler, and close is missing
  const partial: Handlers<string> = { open: () => 'o', data: () => 'd', error: () => 'e' };
  use(partial);

  const extra: Handlers<string> = {
    open: () => 'o',
    data: () => 'd',
    error: () => 'e',
    close: () => 'c',
    // @ts-expect-error — 'ping' is not a message kind
    ping: () => 'p',
  };
  use(extra);

  // @ts-expect-error — the handler map is not optional
  match({ kind: 'close', clean: true });
}
use(_typeTests);
