// ─────────────────────────────────────────────────────────────────────────
//  27 · a binary header                                        ★★☆ core
//  concepts: Buffer.alloc · readUInt32BE · endianness · magic bytes
//  run: node 27-binary-header.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every binary format on disk or on a socket starts the same way: a few
//  magic bytes so you can tell it is yours, a version so you can change
//  your mind later, and a length so the reader knows where the payload
//  ends. Ten bytes, fixed offsets:
//
//      0..3  magic 'JSTR' (ascii)   4  version (uint8)
//      5     flags (uint8)          6..9  payload length (uint32, BIG endian)
//
//      writeHeader({ version: 1, flags: 0, length: 300 })  → <Buffer 10 B>
//      readHeader(buf)   → { version: 1, flags: 0, length: 300 }
//      packFrame({ version: 1, flags: 0 }, 'héllo')
//        → header + payload, with length set to 6 (BYTES, not characters)
//
//  readHeader throws when the buffer is shorter than the header or when
//  the magic is not 'JSTR' — a reader that trusts junk is how you end up
//  allocating 3 GB because someone sent you a PNG.
//
//  hint: Buffer.alloc gives you zeroed bytes; write*/read* take the
//  OFFSET as their last argument. Pick BE or LE once and never mix them.

import { test, eq, throws } from '../../_lib/check.js';

// Provided: the format constants. Use them instead of magic numbers.
export const MAGIC = 'JSTR';
export const HEADER_BYTES = 10;

export function writeHeader({ version, flags = 0, length }) {
  throw new Error('TODO');
}

export function readHeader(buffer) {
  throw new Error('TODO');
}

export function packFrame(fields, payload) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a header is exactly ten bytes and starts with the magic', () => {
  const header = writeHeader({ version: 1, flags: 0, length: 0 });
  eq(header.length, HEADER_BYTES);
  eq(header.toString('ascii', 0, 4), 'JSTR');
});

test('the length is written big-endian', () => {
  const header = writeHeader({ version: 1, flags: 0, length: 300 });
  eq([...header.subarray(6)], [0x00, 0x00, 0x01, 0x2c]);
  eq(header.readUInt32BE(6), 300);
});

test('version and flags each take one byte', () => {
  const header = writeHeader({ version: 3, flags: 255, length: 1 });
  eq(header[4], 3);
  eq(header[5], 255);
});

test('readHeader is the inverse of writeHeader', () => {
  const fields = { version: 2, flags: 7, length: 4096 };
  eq(readHeader(writeHeader(fields)), fields);
});

test('readHeader parses bytes it did not write', () => {
  const onTheWire = Buffer.from('4a53545201020000012c', 'hex');
  eq(readHeader(onTheWire), { version: 1, flags: 2, length: 300 });
});

test('a wrong magic is rejected', () => {
  const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
  throws(() => readHeader(png), 'magic');
});

test('a buffer shorter than the header is rejected', () => {
  throws(() => readHeader(Buffer.from('JSTR', 'ascii')));
  throws(() => readHeader(Buffer.alloc(0)));
});

test('packFrame measures the payload in bytes, not characters', () => {
  const frame = packFrame({ version: 1, flags: 0 }, 'héllo'); // 5 chars
  const header = readHeader(frame);
  eq(header.length, 6);
  eq(frame.length, HEADER_BYTES + 6);
  eq(frame.subarray(HEADER_BYTES).toString('utf8'), 'héllo');
});
