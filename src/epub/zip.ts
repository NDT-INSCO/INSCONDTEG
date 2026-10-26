/// <reference types="node" />
/**
 * Minimal, deterministic ZIP reader/writer used by the EPUB pipeline.
 *
 * EPUB is a ZIP with one hard constraint: `mimetype` must be the first entry,
 * stored (method 0) and uncompressed. Everything else is ordinary DEFLATE.
 *
 * The writer fixes timestamps and entry order so the same source produces the
 * same archive on every machine — that is what lets `epub:check` detect a stale
 * build in CI without chasing clock differences.
 */
import { createHash } from 'node:crypto';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

export interface ZipInput {
  path: string;
  data: Buffer;
  /** Defaults to true; `mimetype` is always written stored. */
  compress?: boolean;
}

export interface ZipEntry {
  path: string;
  method: number;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  data: Buffer;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

export function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 2026-01-01 00:00 in MS-DOS date/time. Fixed so archives are reproducible. */
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
const UTF8_FLAG = 0x0800;

export function writeZip(entries: ZipInput[]): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, 'utf8');
    const stored = entry.path === 'mimetype' || entry.compress === false;
    const body = stored ? entry.data : deflateRawSync(entry.data, { level: 9 });
    const method = stored ? 0 : 8;
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(UTF8_FLAG, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(UTF8_FLAG, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    localParts.push(local, name, body);
    centralParts.push(central, name);
    offset += local.length + name.length + body.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

export function readZip(buffer: Buffer): ZipEntry[] {
  if (buffer.length < 22) throw new Error('Not a ZIP archive: too short');

  let endOffset = -1;
  for (let index = buffer.length - 22; index >= 0; index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }
  if (endOffset < 0) throw new Error('Not a ZIP archive: end of central directory not found');

  const count = buffer.readUInt16LE(endOffset + 10);
  const centralOffset = buffer.readUInt32LE(endOffset + 16);
  const entries: ZipEntry[] = [];
  let cursor = centralOffset;

  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error(`Corrupt central directory entry #${index + 1}`);
    }
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const crc = buffer.readUInt32LE(cursor + 16);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const path = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');

    if (flags & 0x01) throw new Error(`Encrypted entry: ${path}`);
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Corrupt local header for ${path}`);
    }
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? Buffer.from(raw) : method === 8 ? inflateRawSync(raw) : null;
    if (!data) throw new Error(`Unsupported compression method ${method} for ${path}`);
    if (data.length !== uncompressedSize) {
      throw new Error(`Size mismatch for ${path}`);
    }
    if (crc32(data) !== crc) {
      throw new Error(`CRC mismatch for ${path}`);
    }

    entries.push({ path, method, crc, compressedSize, uncompressedSize, data });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

/**
 * Content digest of an archive: independent of the compressor, so a Node or zlib
 * upgrade does not look like a content change.
 */
export function zipContentDigest(entries: { path: string; data: Buffer }[]): string {
  const hash = createHash('sha256');
  for (const entry of [...entries].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    hash.update(entry.path);
    hash.update('\0');
    hash.update(createHash('sha256').update(entry.data).digest('hex'));
    hash.update('\n');
  }
  return hash.digest('hex');
}
