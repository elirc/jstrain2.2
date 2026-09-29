// ─────────────────────────────────────────────────────────────────────────
//  20 · library capstone                                   ★★★ stretch
//  concepts: composition · static inheritance · this.constructor
//  run: node 20-library-capstone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Everything at once: four small classes that know as little about each
//  other as possible.
//
//    Book(id, title, copies = 1)
//      onLoan             starts at 0
//      get available()    copies - onLoan
//
//    Member(name)
//      static LIMIT = 2   how many books this KIND of member may hold
//      borrowed           array of book ids, starts empty
//      get limit()        the LIMIT of the class this instance came from
//      get canBorrow()    borrowed.length < limit
//
//    StaffMember extends Member
//      static LIMIT = 5   nothing else — the getter must pick this up
//
//    Library(name)
//      addBook(book) / addMember(member)  store and return the argument
//      borrow(member, bookId)   → the book. Throws:
//          'unknown book: xyz'      no such id
//          'no copies left of Dune' none available
//          'Ada is at their loan limit'
//      giveBack(member, bookId) → true. Throws 'Ada does not have b1'
//      loansFor(member)         → the member's book TITLES
//      get onLoanCount()        → total copies out across the library
//
//      lib.borrow(ada, 'b1'); dune.available   → 1  (of 2 copies)
//      lib.loansFor(ada)                       → ['Dune']
//
//  hint: `this.constructor` is the class an instance was built from, so
//  `this.constructor.LIMIT` reads 5 for a StaffMember and 2 for a
//  Member — statics are inherited by subclasses

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Book {
  constructor(id, title, copies = 1) {
    throw new Error('TODO');
  }

  get available() {
    throw new Error('TODO');
  }
}

export class Member {
  constructor(name) {
    throw new Error('TODO');
  }

  get limit() {
    throw new Error('TODO');
  }

  get canBorrow() {
    throw new Error('TODO');
  }
}

export class StaffMember extends Member {
  // TODO: one line
}

export class Library {
  constructor(name) {
    throw new Error('TODO');
  }

  addBook(book) {
    throw new Error('TODO');
  }

  addMember(member) {
    throw new Error('TODO');
  }

  borrow(member, bookId) {
    throw new Error('TODO');
  }

  giveBack(member, bookId) {
    throw new Error('TODO');
  }

  loansFor(member) {
    throw new Error('TODO');
  }

  get onLoanCount() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('borrowing takes a copy off the shelf', () => {
  const lib = new Library('City');
  const dune = lib.addBook(new Book('b1', 'Dune', 2));
  const ada = lib.addMember(new Member('Ada'));
  eq(dune.available, 2);
  lib.borrow(ada, 'b1');
  eq(dune.available, 1);
  eq(dune.onLoan, 1);
  eq(lib.onLoanCount, 1);
});

test('the library reports what a member is holding', () => {
  const lib = new Library('City');
  lib.addBook(new Book('b1', 'Dune', 2));
  lib.addBook(new Book('b2', 'Emma'));
  const ada = lib.addMember(new Member('Ada'));
  lib.borrow(ada, 'b1');
  lib.borrow(ada, 'b2');
  eq(lib.loansFor(ada), ['Dune', 'Emma']);
  eq(ada.borrowed, ['b1', 'b2']);
});

test('an unknown book id is refused', () => {
  const lib = new Library('City');
  const ada = lib.addMember(new Member('Ada'));
  throws(() => lib.borrow(ada, 'nope'), 'unknown book: nope');
});

test('the last copy cannot be lent twice', () => {
  const lib = new Library('City');
  const emma = lib.addBook(new Book('b2', 'Emma'));
  const ada = lib.addMember(new Member('Ada'));
  const bob = lib.addMember(new Member('Bob'));
  lib.borrow(ada, 'b2');
  eq(emma.available, 0);
  throws(() => lib.borrow(bob, 'b2'), 'no copies left of Emma');
  eq(emma.onLoan, 1, 'a refused loan must not change the count');
});

test('a member cannot go past their limit', () => {
  const lib = new Library('City');
  lib.addBook(new Book('b1', 'Dune', 5));
  lib.addBook(new Book('b2', 'Emma', 5));
  lib.addBook(new Book('b3', 'Ficciones', 5));
  const ada = lib.addMember(new Member('Ada'));
  eq(ada.limit, 2);
  lib.borrow(ada, 'b1');
  lib.borrow(ada, 'b2');
  eq(ada.canBorrow, false);
  throws(() => lib.borrow(ada, 'b3'), 'Ada is at their loan limit');
});

test('staff inherit everything but their own LIMIT', () => {
  const lib = new Library('City');
  for (const id of ['b1', 'b2', 'b3']) {
    lib.addBook(new Book(id, `Title ${id}`, 5));
  }
  const sam = lib.addMember(new StaffMember('Sam'));
  eq(sam.limit, 5);
  ok(sam instanceof Member);
  lib.borrow(sam, 'b1');
  lib.borrow(sam, 'b2');
  lib.borrow(sam, 'b3');
  eq(sam.canBorrow, true);
  eq(lib.onLoanCount, 3);
});

test('giving a book back frees the copy and the slot', () => {
  const lib = new Library('City');
  const dune = lib.addBook(new Book('b1', 'Dune', 2));
  const ada = lib.addMember(new Member('Ada'));
  lib.borrow(ada, 'b1');
  eq(lib.giveBack(ada, 'b1'), true);
  eq(dune.available, 2);
  eq(ada.borrowed, []);
  eq(lib.loansFor(ada), []);
  eq(lib.onLoanCount, 0);
});

test('you cannot give back what you never took', () => {
  const lib = new Library('City');
  lib.addBook(new Book('b1', 'Dune', 2));
  const ada = lib.addMember(new Member('Ada'));
  throws(() => lib.giveBack(ada, 'b1'), 'Ada does not have b1');
});
