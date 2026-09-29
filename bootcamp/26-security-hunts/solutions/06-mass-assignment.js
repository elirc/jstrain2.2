// ─────────────────────────────────────────────────────────────────────────
//  06 · the profile update that grants admin — SOLUTION      ★★★ stretch
//  concepts: security · mass assignment · field allowlists
//  run: node 06-mass-assignment.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Vulnerability: mass assignment. `{ ...user, ...patch }` copies EVERY
//  key of the request body over the user, so `{ role: 'admin' }` in the
//  POST body wrote straight through to the record. The spread trusted
//  whatever the client sent.
//  The tell: a wholesale spread/merge/Object.assign of a
//  request-derived object onto a domain object. The code decided what to
//  keep by omission — and omission forgets.
//  The minimal fix: an ALLOWLIST — pull only the fields users may edit,
//  and ignore the rest by construction:
//      const EDITABLE = ['name', 'email'];
//      const safe = {};
//      for (const k of EDITABLE)
//        if (k in patch) safe[k] = patch[k];
//      return { ...user, ...safe };
//  Allowlist, never denylist: a blocklist of ['role','id','balance']
//  ships a hole the day someone adds an `isAdmin` column.
//  In the wild: Rails' original mass-assignment CVEs, `User.update(params)`,
//  ORM `.save(req.body)`, GraphQL input types wired straight to columns.
//  Bind inputs to an explicit DTO, not to your table.

import { test, eq } from '../../_lib/check.js';

const EDITABLE = ['name', 'email'];

export function updateProfile(user, patch) {
  const safe = {};
  for (const key of EDITABLE) {
    if (key in patch) safe[key] = patch[key];
  }
  return { ...user, ...safe };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a name change is applied', () => {
  const user = { id: 1, name: 'Ada', email: 'a@x.com', role: 'user' };
  eq(updateProfile(user, { name: 'Ada L.' }).name, 'Ada L.');
});

test('name and email can both be edited', () => {
  const user = { id: 1, name: 'Ada', email: 'a@x.com', role: 'user' };
  const out = updateProfile(user, { name: 'Ada L.', email: 'ada@x.com' });
  eq(out.name, 'Ada L.');
  eq(out.email, 'ada@x.com');
});

test('a smuggled role is ignored', () => {
  const user = { id: 1, name: 'Ada', email: 'a@x.com', role: 'user' };
  eq(updateProfile(user, { name: 'Ada', role: 'admin' }).role, 'user');
});

test('id and balance cannot be overwritten from the patch', () => {
  const user = { id: 1, name: 'Ada', email: 'a@x.com', role: 'user', balance: 0 };
  const out = updateProfile(user, { id: 999, balance: 1000000 });
  eq(out.id, 1);
  eq(out.balance, 0);
});

test('an unknown field in the patch is dropped, not stored', () => {
  const user = { id: 1, name: 'Ada', email: 'a@x.com', role: 'user' };
  const out = updateProfile(user, { name: 'Ada', isAdmin: true });
  eq('isAdmin' in out, false);
});
