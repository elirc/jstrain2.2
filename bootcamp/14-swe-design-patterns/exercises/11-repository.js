// ─────────────────────────────────────────────────────────────────────────
//  11 · UserRepository                                          ★★☆ core
//  concepts: repository · persistence boundary · defensive copies
//  run: node exercises/11-repository.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Business rules should not know whether users live in Postgres, in a
//  JSON file or in a Map. Put a repository between them. Today it is a
//  Map; the day it becomes SQL, only this file changes.
//
//      const repo = createUserRepository();
//      repo.add({ name: 'Ada', email: 'ada@x.io' })
//        → { id: 'u1', name: 'Ada', email: 'ada@x.io' }   ids are u1, u2…
//      repo.getById('u1')       → the user, or undefined
//      repo.find((u) => u.name.startsWith('A'))  → array of users
//      repo.update('u1', { name: 'Ada L.' })     → the merged user,
//                                                  undefined if no such id
//      repo.delete('u1')        → true if it removed something
//      repo.count()             → 1
//
//  Rule that bites: every user handed out is a COPY. A caller who
//  mutates the object they got back must not change what is stored.
//
//  Then `createUserService(repo)` on top:
//      register(name, email) → the new user; throws
//                              'email already registered: <email>' when
//                              that address exists (case-insensitively)
//      rename(id, name)      → the updated user; throws 'no such user: <id>'
//
//  hint: `{ ...user }` is enough of a copy here — and the service must
//  never touch the storage, only the repository interface

import { test, eq, ok, throws } from '../../_lib/check.js';

export function createUserRepository() {
  throw new Error('TODO');
}

export function createUserService(repo) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('add stores the user and assigns a sequential id', () => {
  const repo = createUserRepository();
  eq(repo.add({ name: 'Ada', email: 'ada@x.io' }), {
    id: 'u1',
    name: 'Ada',
    email: 'ada@x.io',
  });
  eq(repo.add({ name: 'Grace', email: 'grace@x.io' }).id, 'u2');
  eq(repo.count(), 2);
});

test('getById finds a user, or returns undefined', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.getById('u1').name, 'Ada');
  eq(repo.getById('nope'), undefined);
});

test('the repository hands out copies, not its own objects', () => {
  const repo = createUserRepository();
  const added = repo.add({ name: 'Ada', email: 'ada@x.io' });
  added.name = 'HACKED';
  const fetched = repo.getById('u1');
  fetched.name = 'ALSO HACKED';
  eq(repo.getById('u1').name, 'Ada');
});

test('find filters with a predicate', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  repo.add({ name: 'Grace', email: 'grace@x.io' });
  eq(repo.find((u) => u.name.startsWith('A')).map((u) => u.id), ['u1']);
  eq(repo.find(() => true).length, 2);
  eq(repo.find(() => false), []);
});

test('update merges a patch and leaves the rest alone', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.update('u1', { name: 'Ada L.' }), {
    id: 'u1',
    name: 'Ada L.',
    email: 'ada@x.io',
  });
  eq(repo.getById('u1').name, 'Ada L.');
  eq(repo.update('ghost', { name: 'x' }), undefined);
});

test('delete removes and reports whether it did', () => {
  const repo = createUserRepository();
  repo.add({ name: 'Ada', email: 'ada@x.io' });
  eq(repo.delete('u1'), true);
  eq(repo.delete('u1'), false);
  eq(repo.getById('u1'), undefined);
  eq(repo.count(), 0);
});

test('the service registers users through the repository', () => {
  const repo = createUserRepository();
  const service = createUserService(repo);
  const user = service.register('Ada', 'ada@x.io');
  eq(user.id, 'u1');
  eq(repo.count(), 1);
  eq(service.rename('u1', 'Ada L.').name, 'Ada L.');
});

test('the service enforces rules the repository knows nothing about', () => {
  const service = createUserService(createUserRepository());
  service.register('Ada', 'ada@x.io');
  throws(() => service.register('Imposter', 'ADA@X.IO'), 'email already registered');
  throws(() => service.rename('ghost', 'x'), 'no such user: ghost');
  ok(true);
});
