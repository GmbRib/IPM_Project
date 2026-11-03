import { EXPORT_TABLES, tableToCsv, type ExportTable } from '@/server/csv';
import { withDb } from '@/server/db';

// GET /api/export?table=packing → that table as CSV. Without `table`: the list of links.
// Only from the computer running the server (http://localhost:8081/api/export), since it
// shows everyone's data.
const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!LOCAL.has(url.hostname)) {
    return new Response('Só disponível no computador que corre o servidor.', { status: 403 });
  }

  const table = url.searchParams.get('table');
  if (!table) {
    return Response.json(
      Object.fromEntries(EXPORT_TABLES.map((t) => [t, `${url.origin}/api/export?table=${t}`])),
    );
  }
  if (!(EXPORT_TABLES as readonly string[]).includes(table)) {
    return new Response(`Tabela desconhecida: ${table}`, { status: 404 });
  }

  const csv = await withDb(false, (db) => tableToCsv(db, table as ExportTable));
  return new Response(`﻿${csv}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="packsun-${table}.csv"`,
    },
  });
}
