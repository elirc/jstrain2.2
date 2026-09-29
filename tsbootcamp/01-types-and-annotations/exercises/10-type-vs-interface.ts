// ─────────────────────────────────────────────────────────────────────────
//  10 · type alias vs interface                             ★★☆ core
//  concepts: type aliases · interfaces · extends · intersections
//  run: node ../run.js exercises/10-type-vs-interface.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  For an object shape, `interface X { ... }` and `type X = { ... }`
//  produce the SAME type — assignable both ways, indistinguishable to the
//  compiler. Their differences are about extension:
//
//      interface Point3D extends Point2D { z: number }   // extends
//      type Point3DAlias = Point2DAlias & { z: number }  // intersection
//
//  and about merging: two `interface Plugin` declarations in the same
//  scope fuse into one type with all the members. A `type` cannot do that
//  (a second `type Plugin` is a duplicate-identifier error).
//
//  Build the alias twins of the two interfaces, then augment Plugin with
//  a SECOND `interface Plugin` block that adds `version: string`. Do not
//  edit the first block — that's the point of the demo.
//
//      move({ x: 1, y: 2, z: 3 }, 2)          → { x: 1, y: 2, z: 5 }
//      describePlugin({ name: 'router', version: '1.2' })  → 'router v1.2'
//
//  hint: declaration merging is why you can add fields to `Window` or
//  `Express.Request` from your own file — and why library authors ship
//  interfaces, not type aliases, for anything you might need to extend

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export type Point2DAlias = TODO;
export type Point3DAlias = TODO;

export interface Plugin {
  name: string;
}

// TODO: add a second `interface Plugin` block right here, contributing
// `version: string`. Leave the block above alone.

export function move(point: Point3D, dz: TODO): Point3D {
  throw new Error('TODO');
}

export function describePlugin(plugin: Plugin): string {
  throw new Error('TODO');
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('move adds dz to the z coordinate', () => {
  eq(move({ x: 1, y: 2, z: 3 }, 2), { x: 1, y: 2, z: 5 });
});

test('move leaves x and y alone and copies the point', () => {
  const point = { x: 1, y: 2, z: 3 };
  eq(move(point, 10), { x: 1, y: 2, z: 13 });
  eq(point.z, 3);
});

test('describePlugin uses both merged members', () => {
  eq(describePlugin({ name: 'router', version: '1.2' }), 'router v1.2');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _1 = Expect<Equal<Point2DAlias, Point2D>>;
// an intersection is stored un-flattened, so a strict identity check can
// still tell `A & B` from an interface with the same members — what
// matters is that the members match and values move freely both ways
type _2 = Expect<Equal<keyof Point3DAlias, keyof Point3D>>;
type _3 = Expect<Equal<Point3DAlias['z'], number>>;
type _4 = Expect<Equal<keyof Plugin, 'name' | 'version'>>;

function _typeTests() {
  // interface and alias describe one type — they swap freely
  const fromInterface: Point3D = { x: 1, y: 2, z: 3 };
  const fromAlias: Point3DAlias = fromInterface;
  const andBack: Point3D = fromAlias;
  use(fromAlias, andBack);

  // @ts-expect-error — the intersection still needs all three members
  const missing: Point3DAlias = { x: 1, y: 2 };
  use(missing);

  const merged: Plugin = { name: 'router', version: '1.2' };
  use(merged);

  // @ts-expect-error — after the merge, version is required too
  const half: Plugin = { name: 'router' };
  use(half);
}
use(_typeTests);
