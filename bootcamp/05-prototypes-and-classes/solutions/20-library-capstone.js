// ─────────────────────────────────────────────────────────────────────────
//  20 · library capstone — SOLUTION                        ★★★ stretch
//  run: node 20-library-capstone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: notice how little inheritance there is. Book, Member and
//  Library are three separate types that COMPOSE — the library holds
//  books and members and owns every rule about lending. Only StaffMember
//  extends anything, and it does so for the one reason inheritance is
//  actually good at: same behaviour, different constant.
//
//  `get limit() { return this.constructor.LIMIT; }` is the piece worth
//  stealing. `this.constructor` walks to the prototype's constructor —
//  StaffMember for a staff instance — and statics are inherited because
//  `class StaffMember extends Member` also links StaffMember itself to
//  Member. Writing `Member.LIMIT` instead would hard-code 2 forever, and
//  that bug survives every unit test that only uses Members.
//
//  borrow() checks all three invariants BEFORE mutating anything, so a
//  refused loan leaves the world untouched — validate first, mutate last.
//  The registries are private Maps: outside code goes through the API.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Book {
  constructor(id, title, copies = 1) {
    this.id = id;
    this.title = title;
    this.copies = copies;
    this.onLoan = 0;
  }

  get available() {
    return this.copies - this.onLoan;
  }
}

export class Member {
  static LIMIT = 2;

  constructor(name) {
    this.name = name;
    this.borrowed = [];
  }

  get limit() {
    return this.constructor.LIMIT;
  }

  get canBorrow() {
    return this.borrowed.length < this.limit;
  }
}

export class StaffMember extends Member {
  static LIMIT = 5;
}

export class Library {
  #books = new Map();
  #members = new Set();

  constructor(name) {
    this.name = name;
  }

  addBook(book) {
    this.#books.set(book.id, book);
    return book;
  }

  addMember(member) {
    this.#members.add(member);
    return member;
  }

  borrow(member, bookId) {
    const book = this.#books.get(bookId);
    if (!book) throw new Error(`unknown book: ${bookId}`);
    if (book.available === 0) {
      throw new Error(`no copies left of ${book.title}`);
    }
    if (!member.canBorrow) {
      throw new RangeError(`${member.name} is at their loan limit`);
    }
    book.onLoan += 1;
    member.borrowed.push(bookId);
    return book;
  }

  giveBack(member, bookId) {
    const at = member.borrowed.indexOf(bookId);
    if (at === -1) {
      throw new Error(`${member.name} does not have ${bookId}`);
    }
    member.borrowed.splice(at, 1);
    this.#books.get(bookId).onLoan -= 1;
    return true;
  }

  loansFor(member) {
    return member.borrowed.map((id) => this.#books.get(id).title);
  }

  get onLoanCount() {
    let total = 0;
    for (const book of this.#books.values()) total += book.onLoan;
    return total;
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
