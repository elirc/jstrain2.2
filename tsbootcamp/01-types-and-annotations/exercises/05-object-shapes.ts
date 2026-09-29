// ─────────────────────────────────────────────────────────────────────────
//  05 · object shapes                                      ★☆☆ warm-up
//  concepts: object types · optional props · readonly props
//  run: node ../run.js exercises/05-object-shapes.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Model a user for a signup form. Read the spec literally — which
//  properties are required, which may be missing, which must never be
//  reassigned after creation:
//
//      id        string, required, readonly (assigned once, by the DB)
//      name      string, required
//      email     string, optional
//      address   optional, and itself { city: string; zip?: string }
//
//      displayName({ id: 'u1', name: 'Ada' })          → 'Ada'
//      displayName({ id, name: 'Ada', email: 'a@x.io' })→ 'Ada <a@x.io>'
//      cityOf({ id, name, address: { city: 'Bath' } }) → 'Bath'
//      cityOf({ id, name })                            → 'unknown'
//      rename(user, 'Grace')  → a NEW user with the new name
//
//  hint: `?` and `| undefined` are not the same thing — `?` also means
//  "you may leave this key out entirely"

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Address = TODO;
export type User = TODO;

export function displayName(user: User): string {
  throw new Error('TODO');
}

export function cityOf(user: User): string {
  throw new Error('TODO');
}

export function rename(user: User, name: TODO): User {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

const ada: User = { id: 'u1', name: 'Ada', email: 'ada@x.io' };
const grace: User = { id: 'u2', name: 'Grace', address: { city: 'Bath' } };

test('displayName appends the email when there is one', () => {
  eq(displayName(ada), 'Ada <ada@x.io>');
});

test('displayName is just the name when the email is missing', () => {
  eq(displayName(grace), 'Grace');
});

test('cityOf reads the nested address', () => {
  eq(cityOf(grace), 'Bath');
});

test('cityOf falls back when there is no address', () => {
  eq(cityOf(ada), 'unknown');
});

test('rename copies rather than mutates', () => {
  eq(rename(ada, 'Ada L.'), { id: 'u1', name: 'Ada L.', email: 'ada@x.io' });
  eq(ada.name, 'Ada');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<User['name'], string>>;
type _2 = Expect<Equal<User['email'], string | undefined>>;
type _3 = Expect<Equal<Address['zip'], string | undefined>>;
type _4 = Expect<Equal<keyof User, 'id' | 'name' | 'email' | 'address'>>;
type _5 = Expect<Equal<User['address'], Address | undefined>>;

function _typeTests() {
  // both optional keys may be left out entirely
  const minimal: User = { id: 'u1', name: 'Ada' };

  // @ts-expect-error — id is readonly once the object exists
  minimal.id = 'u2';

  // @ts-expect-error — name is required
  const nameless: User = { id: 'u1' };
  use(nameless);

  // @ts-expect-error — email is a string when it is there at all
  const wrong: User = { id: 'u1', name: 'Ada', email: 42 };
  use(wrong);

  // @ts-expect-error — city is required inside an address
  const noCity: User = { id: 'u1', name: 'Ada', address: { zip: 'BA1' } };
  use(noCity);
}
use(_typeTests);
