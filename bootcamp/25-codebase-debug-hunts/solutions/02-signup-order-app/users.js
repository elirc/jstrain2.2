// users.js — the signup flow: validate, canonicalize, store, dedupe.
//
// signUp(store, rawEmail) registers one address and throws
//   'invalid email'       for garbage input
//   'already registered'  for a duplicate (in ANY spelling)
// The store is a Set of canonical addresses.

import { normalizeEmail } from './normalize.js';
import { isValidEmail } from './validate.js';

export function signUp(store, rawEmail) {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    throw new Error(`invalid email: ${rawEmail}`);
  }
  if (store.has(email)) {
    throw new Error(`already registered: ${email}`);
  }
  store.add(email);
  return email;
}
