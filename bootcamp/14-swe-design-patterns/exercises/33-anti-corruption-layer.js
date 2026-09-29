// ─────────────────────────────────────────────────────────────────────────
//  33 · anti-corruption layer                                    ★★☆ core
//  concepts: anti-corruption layer · normalisation · validate at the edge
//  run: node exercises/33-anti-corruption-layer.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two HR vendors send you "an employee was hired". One is a flattened
//  legacy export with `emp_id` and `status_flag`; the other is nested
//  JSON with `name.given` and `compensation.amount`. Neither vocabulary
//  is allowed past the front door.
//
//  Write one normaliser per vendor. Both produce exactly this, and
//  nothing else:
//
//      { id: 'emp-4471', firstName: 'Ada', lastName: 'Lovelace',
//        email: 'ada@example.com', startDate: '2026-03-01',
//        department: 'ENGINEERING', salaryCents: 12000000,
//        active: true }
//
//  The boundary does the dirty work: trim and lowercase the email,
//  title-case the names, `2026/03/01` and `2026-03-01T00:00:00Z` both
//  become `2026-03-01`, vendor A's `dept_cd` goes through DEPARTMENTS,
//  vendor A's dollar string becomes cents, and `status_flag: 'A'` and
//  `employment.active: true` both become `active: true`.
//
//  A payload missing a field the domain requires is rejected here, in
//  domain words: `throw new Error('missing email')` — not passed inward
//  as `undefined` to explode three layers later.
//
//  hint: two mapping functions, one shared gate that validates and
//  cleans; the shared test suite below runs against both vendors

import { test, eq, ok, throws } from '../../_lib/check.js';

export function fromVendorA(payload) {
  throw new Error('TODO');
}

export function fromVendorB(payload) {
  throw new Error('TODO');
}

const DEPARTMENTS = { ENG: 'ENGINEERING', SLS: 'SALES', SUP: 'SUPPORT' };

const titleCase = (word) =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

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
