// ─────────────────────────────────────────────────────────────────────────
//  04 · fluent builder                                          ★★☆ core
//  concepts: closures · derived APIs · immutable values
//  run: node 04-fluent-builder.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The overrides object from exercise 03 gets noisy once a fixture has ten
//  fields. The fluent variant reads like a sentence and — the part that
//  matters — is IMMUTABLE, so one shared base builder can be handed to
//  every test in a file without leaking between them.
//
//      const aUser = builder({ name: 'Ada', role: 'viewer', teamId: 7 });
//
//      aUser().build()                    → { name: 'Ada', role: 'viewer',
//                                             teamId: 7 }
//      aUser().withName('Bo').build()     → { ...defaults, name: 'Bo' }
//      aUser().with({ role: 'admin', teamId: 2 }).build()
//
//  One `withX` setter is generated per key of the defaults — `teamId` gives
//  `withTeamId`, and `withNope` simply does not exist. Every setter returns
//  a NEW builder; `build()` returns a fresh object each call.
//
//  hint: write one internal `make(values)` that returns a builder object
//  and have each setter call `make` again with a patched copy.

import { test, eq, ok } from '../../_lib/check.js';

export function builder(defaults) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const DEFAULTS = { name: 'Ada', role: 'viewer', teamId: 7 };

test('build() returns the defaults', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().build(), { name: 'Ada', role: 'viewer', teamId: 7 });
});

test('there is one setter per default key, and no others', () => {
  const aUser = builder(DEFAULTS);
  const b = aUser();
  eq(typeof b.withName, 'function');
  eq(typeof b.withRole, 'function');
  eq(typeof b.withTeamId, 'function');
  eq(b.withNope, undefined);
});

test('a setter sets its field and leaves the rest alone', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().withName('Bo').build(), {
    name: 'Bo',
    role: 'viewer',
    teamId: 7,
  });
});

test('setters chain', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().withName('Bo').withRole('admin').withTeamId(1).build(), {
    name: 'Bo',
    role: 'admin',
    teamId: 1,
  });
});

test('with(patch) applies several keys at once', () => {
  const aUser = builder(DEFAULTS);
  eq(aUser().with({ role: 'admin', teamId: 2 }).build(), {
    name: 'Ada',
    role: 'admin',
    teamId: 2,
  });
});

test('every setter returns a NEW builder — the base is untouched', () => {
  const aUser = builder(DEFAULTS);
  const base = aUser();
  const admin = base.withRole('admin');
  ok(admin !== base, 'a setter must not return the same builder');
  eq(admin.build().role, 'admin');
  eq(base.build().role, 'viewer');
});

test('build() hands out a fresh object every time', () => {
  const aUser = builder(DEFAULTS);
  const b = aUser();
  const first = b.build();
  first.name = 'Mutated';
  eq(b.build().name, 'Ada');
});

test('the defaults object itself is never modified', () => {
  const defaults = { name: 'Ada', role: 'viewer', teamId: 7 };
  const aUser = builder(defaults);
  aUser().withName('Bo').withRole('admin').build();
  eq(defaults, { name: 'Ada', role: 'viewer', teamId: 7 });
});
