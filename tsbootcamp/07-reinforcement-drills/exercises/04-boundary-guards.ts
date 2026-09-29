// ─────────────────────────────────────────────────────────────────────────
//  04 · boundary guards                                     ★★☆ core
//  concepts: unknown · type predicates · Result unions
//  run: node ../run.js exercises/04-boundary-guards.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  cold rep — you learned this in TS-02 and TS-06.
//
//  Six fixtures came off the wire. Two are clean; four are the kind of
//  broken that a lazy guard waves through:
//
//      {"id":7,...}                        id is a number
//      {"id":"u_2","name":"Bo",...}        no email at all
//      {..."status":"PAID"}                not in the literal union
//      {..."items":[{"sku":"a1"}]}         item has no qty
//
//  Write `isUser` / `isOrder` so all four are rejected, then the parsers.
//
//      parseUser(FIXTURES.user)        → { ok: true, value: { … } }
//      parseUser(FIXTURES.userNoEmail) → { ok: false, error: 'not a user' }
//      parseOrder(FIXTURES.brokenJson) → { ok: false, error: 'invalid json' }
//      parseOrder(FIXTURES.orderShoutyStatus)
//                                      → { ok: false, error: 'not an order' }

import { test, eq, ok } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export interface OrderItem {
  sku: string;
  qty: number;
}

export interface Order {
  id: string;
  total: number;
  items: OrderItem[];
  status: 'new' | 'paid' | 'shipped';
}

export const FIXTURES = {
  user: '{"id":"u_1","name":"Ada","email":"ada@lovelace.dev","active":true}',
  userNumericId: '{"id":7,"name":"Ada","email":"a@b.c","active":true}',
  userNoEmail: '{"id":"u_2","name":"Bo","active":false}',
  order: '{"id":"o_1","total":1999,"items":[{"sku":"a1","qty":2}],"status":"paid"}',
  orderShoutyStatus: '{"id":"o_2","total":10,"items":[],"status":"PAID"}',
  orderItemNoQty: '{"id":"o_3","total":10,"items":[{"sku":"a1"}],"status":"new"}',
  notAnObject: '[1,2,3]',
  brokenJson: '{"id":"o_4",',
};

export type Parsed<T> = TODO;

export function isUser(value: unknown): TODO {
  throw new Error('TODO');
}

export function isOrderItem(value: unknown): TODO {
  throw new Error('TODO');
}

export function isOrder(value: unknown): TODO {
  throw new Error('TODO');
}

export function parseUser(json: string): Parsed<User> {
  throw new Error('TODO');
}

export function parseOrder(json: string): Parsed<Order> {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a clean payload parses into a typed value', () => {
  const result = parseUser(FIXTURES.user);
  if (!result.ok) throw new Error('expected the ok branch');
  eq(result.value, {
    id: 'u_1',
    name: 'Ada',
    email: 'ada@lovelace.dev',
    active: true,
  });
});

test('isUser rejects the two broken user fixtures', () => {
  ok(!isUser(JSON.parse(FIXTURES.userNumericId)), 'numeric id must fail');
  ok(!isUser(JSON.parse(FIXTURES.userNoEmail)), 'missing email must fail');
});

test('isUser rejects things that are not plain objects', () => {
  ok(!isUser(JSON.parse(FIXTURES.notAnObject)));
  ok(!isUser(null));
  ok(!isUser('u_1'));
});

test('a clean order parses, items and all', () => {
  const result = parseOrder(FIXTURES.order);
  if (!result.ok) throw new Error('expected the ok branch');
  eq(result.value.items, [{ sku: 'a1', qty: 2 }]);
  eq(result.value.status, 'paid');
});

test('isOrder rejects a status outside the union and a half-built item', () => {
  ok(!isOrder(JSON.parse(FIXTURES.orderShoutyStatus)), 'PAID is not paid');
  ok(!isOrder(JSON.parse(FIXTURES.orderItemNoQty)), 'item needs a qty');
});

test('unparseable text comes back as data, never as an exception', () => {
  eq(parseOrder(FIXTURES.brokenJson), { ok: false, error: 'invalid json' });
  eq(parseUser(FIXTURES.userNoEmail), { ok: false, error: 'not a user' });
  eq(parseOrder(FIXTURES.orderShoutyStatus), {
    ok: false,
    error: 'not an order',
  });
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<
  Equal<Parsed<User>, { ok: true; value: User } | { ok: false; error: string }>
>;
type _t2 = Expect<Equal<ReturnType<typeof parseUser>, Parsed<User>>>;
type _t3 = Expect<Equal<ReturnType<typeof parseOrder>, Parsed<Order>>>;

function _typeTests() {
  const raw: unknown = JSON.parse(FIXTURES.user);

  // @ts-expect-error — raw is unknown until a guard has spoken
  raw.email;

  if (isUser(raw)) {
    const email: string = raw.email;
    use(email);

    // @ts-expect-error — User has no role field
    raw.role;
  }

  const result = parseUser(FIXTURES.user);

  // @ts-expect-error — value exists only on the ok branch
  result.value;

  if (result.ok) {
    const user: User = result.value;
    use(user);
  } else {
    const message: string = result.error;
    use(message);
  }

  const order = parseOrder(FIXTURES.order);
  if (order.ok) {
    // @ts-expect-error — status is a three-way literal union
    const status: 'paid' = order.value.status;
    use(status);
  }

  // @ts-expect-error — parse takes the raw text, not an already-parsed object
  parseUser({ id: 'u_1', name: 'Ada', email: 'a@b.c', active: true });
}
use(_typeTests);
