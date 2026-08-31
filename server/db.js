import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data')
mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'invoicio.db'))

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS invoices (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL DEFAULT '',
    invoice_number TEXT NOT NULL DEFAULT '',
    client_name    TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'draft',
    currency       TEXT NOT NULL DEFAULT 'USD',
    total          REAL NOT NULL DEFAULT 0,
    due_date       TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL,
    updated_at     TEXT,
    record         TEXT NOT NULL
  );
`)

// The full saved-invoice object (same shape the frontend uses) lives in `record`;
// the other columns are denormalised copies for listing and querying.
const upsertStmt = db.prepare(`
  INSERT INTO invoices (id, name, invoice_number, client_name, status, currency, total, due_date, created_at, updated_at, record)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    invoice_number = excluded.invoice_number,
    client_name = excluded.client_name,
    status = excluded.status,
    currency = excluded.currency,
    total = excluded.total,
    due_date = excluded.due_date,
    updated_at = excluded.updated_at,
    record = excluded.record
`)

export function upsertInvoice(rec) {
  upsertStmt.run(
    String(rec.id),
    rec.name || '',
    rec.invoiceNumber || '',
    rec.clientName || '',
    rec.status || 'draft',
    rec.currency || 'USD',
    Number(rec.total) || 0,
    rec.dueDate || '',
    rec.createdAt || new Date().toISOString(),
    rec.updatedAt || null,
    JSON.stringify(rec)
  )
  return rec
}

export function listInvoices() {
  const rows = db.prepare('SELECT record FROM invoices ORDER BY created_at DESC').all()
  return rows.map(r => JSON.parse(r.record))
}

export function listInvoiceSummaries(status) {
  const sql = `SELECT id, name, invoice_number, client_name, status, currency, total, due_date, created_at, updated_at
               FROM invoices ${status ? 'WHERE status = ?' : ''} ORDER BY created_at DESC`
  const stmt = db.prepare(sql)
  const rows = status ? stmt.all(status) : stmt.all()
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    invoiceNumber: r.invoice_number,
    clientName: r.client_name,
    status: r.status,
    currency: r.currency,
    total: r.total,
    dueDate: r.due_date,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }))
}

export function getInvoice(id) {
  const row = db.prepare('SELECT record FROM invoices WHERE id = ?').get(String(id))
  return row ? JSON.parse(row.record) : null
}

export function deleteInvoice(id) {
  const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(String(id))
  return result.changes > 0
}

export function clearInvoices() {
  db.prepare('DELETE FROM invoices').run()
}

export function countInvoices() {
  return db.prepare('SELECT COUNT(*) AS n FROM invoices').get().n
}

export function closeDb() {
  db.close()
}
