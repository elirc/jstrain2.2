// ─────────────────────────────────────────────────────────────────────────
//  09 · assertNever — SOLUTION                               ★★☆ core
//  run: node ../run.js solutions/09-exhaustive-never.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `assertNever(value: never): never` is eight words that
//  buy you compile-time coverage checking. Nothing is assignable to
//  `never`, so the ONLY place the call type-checks is a branch the
//  compiler has already proved unreachable. Handle every variant and the
//  leftover is `never` and it compiles; miss one and the leftover is that
//  variant, which is not `never`, and the build fails right here — with a
//  message that names the variant you forgot.
//
//  The return type matters too. `never` means "does not return", so
//  `return assertNever(x)` satisfies a `: string` signature without a
//  fake return value, and code after the call is correctly seen as dead.
//
//  It is not only a type trick: bad data really does arrive from network
//  payloads and old localStorage, so the body throws. Include the value
//  in the message — "unhandled variant" with no value is a bad night.
//
//  Try it: add `| { channel: 'fax'; number: string }` to Notification and
//  run tsc. One error, on the assertNever line, pointing at 'fax'.

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

function probe<T>(value: T): T {
  return value;
}

export type Notification =
  | { channel: 'email'; to: string }
  | { channel: 'sms'; phone: string }
  | { channel: 'push'; deviceId: string };

export function assertNever(value: never): never {
  throw new Error(`unhandled variant: ${JSON.stringify(value)}`);
}

export function route(notification: Notification): string {
  switch (notification.channel) {
    case 'email':
      return `mail to ${notification.to}`;
    case 'sms':
      return `sms to ${notification.phone}`;
    case 'push':
      return `push to ${notification.deviceId}`;
    default:
      return assertNever(notification);
  }
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
