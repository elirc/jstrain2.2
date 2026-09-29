// ─────────────────────────────────────────────────────────────────────────
//  33 · anti-corruption layer — SOLUTION                         ★★☆ core
//  concepts: anti-corruption layer · normalisation · validate at the edge
//  run: node solutions/33-anti-corruption-layer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — keep a foreign model out of your model. Everything the
//  vendor believes (their field names, their date format, their dollars,
//  their status codes) stops at one translation layer, and the inside of
//  the app only ever sees the domain type.
//  Adapter (exercise 08) translates BEHAVIOUR: you call their API in
//  your words. An ACL translates DATA and meaning, in both directions,
//  and it is where you also validate — because "the domain type is
//  always valid" is only true if something enforces it, and the only
//  place that can is the door.
//  Notice the shape: two thin mapping functions plus one shared gate.
//  Mapping is vendor-specific and boring; the gate is the invariant and
//  is written once. Vendor three is a new mapping function and zero
//  changes anywhere else.
//  Fail loudly and in domain words. `missing email` is actionable;
//  passing `undefined` inward turns into `Cannot read properties of
//  undefined` in a queue worker at 3am with no payload to look at.
//  Extra vendor fields (`legacy_batch`, `phone`, `currency`) are dropped
//  on purpose — every field you carry inward is a field that will end up
//  in a database column and then in a business rule.
//  When NOT to use: an integration you own both sides of, or a
//  throwaway script. The ACL costs a layer; it pays when the foreign
//  model is out of your control, which is most of them.
//  In the wild: DDD's bounded-context boundary (where the name comes
//  from), Stripe/Plaid webhook normalisers, GraphQL resolvers over
//  legacy REST, `zod`/`io-ts` parse-don't-validate at the edge, protobuf
//  ↔ domain mappers.

import { test, eq, ok, throws } from '../../_lib/check.js';

const DEPARTMENTS = { ENG: 'ENGINEERING', SLS: 'SALES', SUP: 'SUPPORT' };

const titleCase = (word) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

// the one gate: clean, then refuse anything the domain cannot use
const employee = (draft) => {
  const clean = {
    id: `emp-${String(draft.id ?? '').trim()}`,
    firstName: titleCase(String(draft.firstName ?? '').trim()),
    lastName: titleCase(String(draft.lastName ?? '').trim()),
    email: String(draft.email ?? '').trim().toLowerCase(),
    startDate: String(draft.startDate ?? '').trim(),
    department: draft.department ?? 'UNKNOWN',
    salaryCents: draft.salaryCents,
    active: draft.active === true,
  };

  for (const field of ['firstName', 'lastName', 'email', 'startDate']) {
    if (!clean[field]) throw new Error(`missing ${field}`);
  }
  if (clean.id === 'emp-') throw new Error('missing id');
  if (!Number.isFinite(clean.salaryCents)) throw new Error('missing salary');

  return clean;
};

export function fromVendorA(payload) {
  return employee({
    id: payload.emp_id,
    firstName: payload.first_nm,
    lastName: payload.last_nm,
    email: payload.email_addr,
    startDate: String(payload.start_dt ?? '').replaceAll('/', '-'),
    department: DEPARTMENTS[payload.dept_cd] ?? 'UNKNOWN',
    salaryCents: Math.round(Number(payload.salary) * 100),
    active: payload.status_flag === 'A',
  });
}

export function fromVendorB(payload) {
  return employee({
    id: payload.id,
    firstName: payload.name?.given,
    lastName: payload.name?.family,
    email: payload.contact?.email,
    startDate: String(payload.employment?.startDate ?? '').slice(0, 10),
    department: String(payload.employment?.department ?? '').toUpperCase(),
    salaryCents: payload.compensation?.amount,
    active: payload.employment?.active === true,
  });
}

// ── the two vendor payloads (pretend these arrive on a webhook) ───────────

const A_HIRED = {
  emp_id: '4471',
  first_nm: 'ada',
  last_nm: 'LOVELACE',
  email_addr: '  ADA@Example.COM ',
  start_dt: '2026/03/01',
  dept_cd: 'ENG',
  salary: '120000.00',
  status_flag: 'A',
  legacy_batch: 'B-88',
};

const B_HIRED = {
  id: 4471,
  name: { given: 'Ada', family: 'lovelace' },
  contact: { email: 'ada@example.com', phone: '+1-555-0100' },
  employment: {
    startDate: '2026-03-01T00:00:00Z',
    department: 'engineering',
    active: true,
  },
  compensation: { amount: 12000000, currency: 'USD', unit: 'cents' },
};

const EXPECTED = {
  id: 'emp-4471',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  startDate: '2026-03-01',
  department: 'ENGINEERING',
  salaryCents: 12000000,
  active: true,
};

const VENDORS = [
  {
    name: 'legacy-hr',
    normalize: fromVendorA,
    hired: A_HIRED,
    left: { ...A_HIRED, status_flag: 'T' },
    broken: { ...A_HIRED, email_addr: '   ' },
  },
  {
    name: 'cloud-hr',
    normalize: fromVendorB,
    hired: B_HIRED,
    left: {
      ...B_HIRED,
      employment: { ...B_HIRED.employment, active: false },
    },
    broken: { ...B_HIRED, contact: { phone: '+1-555-0100' } },
  },
];

// ──────────────────────────── tests ──────────────────────────────────────

for (const vendor of VENDORS) {
  test(`${vendor.name}: a hire becomes the one domain shape`, () => {
    eq(vendor.normalize(vendor.hired), EXPECTED);
  });

  test(`${vendor.name}: a departure is active:false`, () => {
    eq(vendor.normalize(vendor.left).active, false);
    eq(vendor.normalize(vendor.left).id, 'emp-4471');
  });

  test(`${vendor.name}: a payload missing a required field is rejected`, () => {
    throws(() => vendor.normalize(vendor.broken), 'missing email');
  });
}

test('both vendors produce identical domain objects', () => {
  const [a, b] = VENDORS.map((vendor) => vendor.normalize(vendor.hired));
  eq(a, b);
  ok(a !== b);
});

test('no vendor vocabulary survives the boundary', () => {
  for (const vendor of VENDORS) {
    const employeeRecord = vendor.normalize(vendor.hired);
    eq(Object.keys(employeeRecord).sort(), [
      'active',
      'department',
      'email',
      'firstName',
      'id',
      'lastName',
      'salaryCents',
      'startDate',
    ]);
    eq(titleCase('LOVELACE'), 'Lovelace');
    ok(DEPARTMENTS.ENG === 'ENGINEERING');
  }
});
