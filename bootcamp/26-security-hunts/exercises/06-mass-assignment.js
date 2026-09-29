// ─────────────────────────────────────────────────────────────────────────
//  06 · the profile update that grants admin                 ★★★ stretch
//  concepts: security · mass assignment · field allowlists
//  run: node 06-mass-assignment.js
// ─────────────────────────────────────────────────────────────────────────
//
//  updateProfile(user, patch) applies a profile edit from a request
//  body. Users may change ONLY their display name and email. Everything
//  else — role, id, balance — is off-limits and must be ignored, even
//  when the request body includes it:
//
//      updateProfile({ id: 1, name: 'Ada', role: 'user' },
//                    { name: 'Ada L.' })
//        → { id: 1, name: 'Ada L.', role: 'user' }
//
//  Someone POSTed { "name": "x", "role": "admin" } to the profile
//  endpoint and became an admin.
//
//  The code below is fully written — and a security hole. 3 tests fail:
//  they smuggle privileged fields into the patch. Find the flaw and fix
//  it with the smallest change. Keep the legitimate edits working.
//
//  hint: the safe question is not "which fields should I block?" (you
//  will forget one) but "which fields do I ALLOW?" Where does this code
//  decide which keys of `patch` get through — and does it decide at all?

import { test, eq } from '../../_lib/check.js';

export function updateProfile(user, patch) {
  return { ...user, ...patch };
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
