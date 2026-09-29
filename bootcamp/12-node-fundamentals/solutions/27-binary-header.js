// ─────────────────────────────────────────────────────────────────────────
//  27 · a binary header — SOLUTION                              ★★☆ core
//  run: node 27-binary-header.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: Buffer.alloc(HEADER_BYTES) hands you ten zeroed bytes and
//  every field then writes at a fixed offset — that offset table IS the
//  format, which is why the constants live at the top instead of being
//  sprinkled through the code as 4, 5, 6.
//  Endianness is a coin flip you make once: 300 is 00 00 01 2c big-endian
//  and 2c 01 00 00 little-endian. Read with the wrong one and you get
//  738'197'504 instead of 300 — no error, just a wrong number, which is
//  exactly the bug that eats an afternoon.
//  Validate before you trust: length check first (a short buffer makes
//  readUInt32BE throw an opaque RangeError), then the magic, then parse.
//  packFrame measures Buffer.byteLength, not string.length — 'héllo' is
//  five characters and six bytes, and a length field counted in
//  characters desynchronises the stream on the very first accented word.

import { test, eq, throws } from '../../_lib/check.js';

// Provided: the format constants. Use them instead of magic numbers.
export const MAGIC = 'JSTR';
export const HEADER_BYTES = 10;

export function writeHeader({ version, flags = 0, length }) {
  const header = Buffer.alloc(HEADER_BYTES);
  header.write(MAGIC, 0, 'ascii');
  header.writeUInt8(version, 4);
  header.writeUInt8(flags, 5);
  header.writeUInt32BE(length, 6);
  return header;
}

export function readHeader(buffer) {
  if (buffer.length < HEADER_BYTES) {
    throw new Error(`header needs ${HEADER_BYTES} bytes, got ${buffer.length}`);
  }
  const magic = buffer.toString('ascii', 0, 4);
  if (magic !== MAGIC) throw new Error(`bad magic: ${JSON.stringify(magic)}`);
  return {
    version: buffer.readUInt8(4),
    flags: buffer.readUInt8(5),
    length: buffer.readUInt32BE(6),
  };
}

export function packFrame(fields, payload) {
  const bytes = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
  const header = writeHeader({ ...fields, length: bytes.length });
  return Buffer.concat([header, bytes]);
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
