import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import { registerAuthRoutes, requireAuth } from './auth.js'
import { mountMcp } from './mcp.js'
import * as store from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001

const app = express()
app.disable('x-powered-by')
// Invoice records can embed base64 logos/QR images, so allow generous bodies
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true }))

registerAuthRoutes(app)

// ---- Invoice API (session-protected) ----
const invoices = express.Router()
invoices.use(requireAuth)

function normalizeRecord(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const rec = { ...body }
  rec.id = String(rec.id || crypto.randomUUID())
  if (!rec.data || typeof rec.data !== 'object') return null
  rec.createdAt = rec.createdAt || new Date().toISOString()
  return rec
}

invoices.get('/', (req, res) => {
  res.json(store.listInvoices())
})

invoices.post('/', (req, res) => {
  const rec = normalizeRecord(req.body)
  if (!rec) return res.status(400).json({ error: 'Invalid invoice record' })
  store.upsertInvoice(rec)
  res.status(201).json(rec)
})

invoices.post('/import', (req, res) => {
  const { invoices: list, mode } = req.body || {}
  if (!Array.isArray(list)) return res.status(400).json({ error: 'invoices must be an array' })
  const records = list.map(normalizeRecord)
  if (records.some(r => !r)) return res.status(400).json({ error: 'Invalid invoice record in list' })
  if (mode === 'replace') store.clearInvoices()
  records.forEach(store.upsertInvoice)
  res.json({ count: records.length })
})

invoices.put('/:id', (req, res) => {
  const rec = normalizeRecord({ ...req.body, id: req.params.id })
  if (!rec) return res.status(400).json({ error: 'Invalid invoice record' })
  store.upsertInvoice(rec)
  res.json(rec)
})

invoices.delete('/:id', (req, res) => {
  if (!store.deleteInvoice(req.params.id)) {
    return res.status(404).json({ error: 'Invoice not found' })
  }
  res.status(204).end()
})

app.use('/api/invoices', invoices)

// ---- MCP endpoint (bearer-token protected) ----
mountMcp(app)

// ---- Static frontend ----
const distDir = path.join(__dirname, '..', 'dist')
app.use(express.static(distDir))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) return next()
  res.sendFile(path.join(distDir, 'index.html'))
})

const httpServer = app.listen(PORT, () => {
  console.log(`[invoicio] listening on http://localhost:${PORT}`)
  console.log(`[invoicio] MCP endpoint: ${process.env.MCP_TOKEN ? `http://localhost:${PORT}/mcp (bearer token required)` : 'disabled (set MCP_TOKEN to enable)'}`)
})

// Graceful shutdown: stop accepting connections, checkpoint SQLite, exit
function shutdown(signal) {
  console.log(`[invoicio] ${signal} received, shutting down`)
  httpServer.close(() => {
    try { store.closeDb() } catch {}
    process.exit(0)
  })
  // Fallback if open connections keep the server from closing in time
  setTimeout(() => process.exit(0), 5000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
