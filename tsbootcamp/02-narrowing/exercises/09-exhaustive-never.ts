// ─────────────────────────────────────────────────────────────────────────
//  09 · assertNever                                          ★★☆ core
//  concepts: exhaustiveness · never · compile-time coverage
//  run: node ../run.js exercises/09-exhaustive-never.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  `never` is the type with no values. When a switch has handled every
//  variant, the leftover in `default` is `never` — so a function that
//  only accepts `never` compiles there and NOWHERE ELSE. Add a fifth
//  channel next sprint and the build breaks on this exact line instead of
//  silently falling through in production.
//
//      route({ channel: 'email', to: 'a@b.c' })   → 'mail to a@b.c'
//      route({ channel: 'sms', phone: '555' })    → 'sms to 555'
//      route({ channel: 'push', deviceId: 'd1' }) → 'push to d1'
//
//  `assertNever` also has to work at RUNTIME: bad data does reach
//  production, so it throws a message containing 'unhandled variant'.
//
//  hint: its parameter type is the whole trick, and its return type is
//  the same word.

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

function probe<T>(value: T): T {
  return value;
}

export type Notification =
  | { channel: 'email'; to: string }
  | { channel: 'sms'; phone: string }
  | { channel: 'push'; deviceId: string };

export function assertNever(value: TODO): TODO {
  throw new Error('TODO');
}

export function route(notification: Notification): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('routes an email', () => {
  eq(route({ channel: 'email', to: 'a@b.c' }), 'mail to a@b.c');
});

test('routes an sms', () => {
  eq(route({ channel: 'sms', phone: '555' }), 'sms to 555');
});

test('routes a push', () => {
  eq(route({ channel: 'push', deviceId: 'd1' }), 'push to d1');
});

test('assertNever throws, and names the offending value', () => {
  throws(() => assertNever('fax' as unknown as never), 'unhandled variant');
});

test('bad data from outside the type system still blows up loudly', () => {
  const bogus = { channel: 'fax' } as unknown as Notification;
  throws(() => route(bogus), 'unhandled variant');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<Parameters<typeof assertNever>[0], never>>;

function _typeTests() {
  // the RESULT is `never` too — "this call does not come back", which is
  // why `return assertNever(x)` satisfies a `: string` signature
  function returnsNever(value: never) {
    const r = assertNever(value);
    type _noReturn = Expect<Equal<typeof r, never>>;
    use(r);
  }

  // every variant handled → `value` is `never` in the default branch
  function handleAll(value: Notification): string {
    switch (value.channel) {
      case 'email':
        return value.to;
      case 'sms':
        return value.phone;
      case 'push':
        return value.deviceId;
      default: {
        const p = probe(value);
        type _exhausted = Expect<Equal<typeof p, never>>;
        use(p);
        return assertNever(value);
      }
    }
  }

  // one variant missing → `value` is still a Notification, so this fails
  function handleSome(value: Notification): string {
    switch (value.channel) {
      case 'email':
        return value.to;
      case 'sms':
        return value.phone;
      default:
        // @ts-expect-error — 'push' is unhandled, so value is not never
        return assertNever(value);
    }
  }

  use(returnsNever, handleAll, handleSome);
}
use(_typeTests);
