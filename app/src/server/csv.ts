import type { Db } from './db';

// Read-only CSV view of the JSON file, to open the data in Excel/Numbers during the course.
// Sessions and password hashes are never exported.

export const EXPORT_TABLES = [
  'users',
  'documents',
  'trips',
  'members',
  'invites',
  'packing',
  'events',
  'reviews',
] as const;
export type ExportTable = (typeof EXPORT_TABLES)[number];

const cell = (value: unknown) => {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function tableToCsv(db: Db, table: ExportTable) {
  const rows: Record<string, unknown>[] =
    table === 'users'
      ? db.users.map(({ salt: _salt, passwordHash: _hash, ...user }) => user)
      : db[table];
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [columns, ...rows.map((row) => columns.map((c) => row[c]))]
    .map((line) => line.map(cell).join(','))
    .join('\n');
}
