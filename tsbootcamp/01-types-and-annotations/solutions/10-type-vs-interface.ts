// ─────────────────────────────────────────────────────────────────────────
//  10 · type alias vs interface — SOLUTION                  ★★☆ core
//  run: node ../run.js solutions/10-type-vs-interface.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the type tests are the argument. `Equal<Point2DAlias,
//  Point2D>` holds outright — an interface and the equivalent alias ARE
//  the same type — and Point3DAlias and Point3D have the same members and
//  convert freely in both directions. (A strict identity check can still
//  separate `A & B` from an interface, because the compiler keeps an
//  intersection un-flattened internally; that is a detail of how types
//  are stored, not a difference you can observe with values.)
//
//  What does differ:
//    · interfaces MERGE. Two `interface Plugin` blocks fuse, which is how
//      you bolt a property onto `Window`, `Express.Request`, or any
//      library type from your own file. A second `type Plugin` is a
//      duplicate-identifier error.
//    · type aliases name things interfaces cannot: unions, tuples,
//      primitives, function types, mapped and conditional types.
//      `type Method = 'GET' | 'POST'` has no interface equivalent.
//
//  Practical rule: `interface` for object shapes that others may extend
//  (public API, React props, plugin contracts); `type` for everything
//  else — and stay consistent inside a file. The merging that makes
//  interfaces flexible also makes them open: any file can add members to
//  yours, which is a feature until it is a surprise.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export type Point2DAlias = {
  x: number;
  y: number;
};

export type Point3DAlias = Point2DAlias & { z: number };

export interface Plugin {
  name: string;
}

// the augmentation: a second declaration, merged into the first
export interface Plugin {
  version: string;
}

export function move(point: Point3D, dz: number): Point3D {
  return { ...point, z: point.z + dz };
}

export function describePlugin(plugin: Plugin): string {
  return `${plugin.name} v${plugin.version}`;
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
