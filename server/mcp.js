import crypto from 'node:crypto'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import * as store from './db.js'
import { safeEqual } from './auth.js'

const MCP_TOKEN = process.env.MCP_TOKEN || ''

const itemShape = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  price: z.number().default(0),
  tax: z.number().min(0).max(100).default(0).describe('Per-item tax rate in percent')
})

const partyShape = z.object({
  name: z.string().default(''),
  email: z.string().default(''),
  address: z.string().default('')
})

const statusShape = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'])

const round2 = (n) => Math.round(n * 100) / 100

function computeTotal(data) {
  const items = data.items || []
  const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.price || 0), 0)
  const tax = items.reduce((s, i) => s + (i.quantity || 0) * (i.price || 0) * ((i.tax || 0) / 100), 0)
  const discount = (subtotal + tax) * ((data.discountPercent || 0) / 100)
  return round2(subtotal + tax - discount)
}

const defaultPayment = () => ({
  method: 'bank', showPaymentQR: false,
  bankName: '', accountName: '', accountNumber: '', routingNumber: '', swiftBic: '',
  paypalEmail: '',
  cryptoType: 'BTC', cryptoAddress: '', cryptoNetwork: '',
  wireBankName: '', wireBankAddress: '', wireAccountNumber: '', wireRoutingNumber: '', wireSwiftBic: '', wireReference: '',
  qrCodeData: '', qrCodeImage: '',
  stripeLink: '',
  venmoUsername: '',
  zelleEmail: '', zellePhone: '',
  cashAppTag: '',
  wiseEmail: '',
  instructions: ''
})

const jsonResult = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] })
const errorResult = (message) => ({ content: [{ type: 'text', text: message }], isError: true })

function buildMcpServer() {
  const server = new McpServer({ name: 'invoicio', version: '1.0.0' })

  server.registerTool('list_invoices', {
    title: 'List invoices',
    description: 'List all saved invoices (summaries: id, number, client, status, total). Optionally filter by status.',
    inputSchema: { status: statusShape.optional() }
  }, async ({ status }) => jsonResult(store.listInvoiceSummaries(status)))

  server.registerTool('get_invoice', {
    title: 'View invoice',
    description: 'Get the full contents of a saved invoice by id (use list_invoices to find ids).',
    inputSchema: { id: z.string() }
  }, async ({ id }) => {
    const rec = store.getInvoice(id)
    return rec ? jsonResult(rec) : errorResult(`No invoice found with id "${id}"`)
  })

  server.registerTool('create_invoice', {
    title: 'Create invoice',
    description: 'Create and save a new invoice. Totals are computed automatically from items (per-item tax, then discount).',
    inputSchema: {
      number: z.string().optional().describe('Invoice number, e.g. INV-042. Auto-generated when omitted.'),
      name: z.string().optional().describe('Display name in the invoice history. Defaults to "Invoice <number> — <client>".'),
      date: z.string().optional().describe('Issue date YYYY-MM-DD, defaults to today'),
      dueDate: z.string().optional().describe('Due date YYYY-MM-DD'),
      from: partyShape.optional().describe('Sender (your company)'),
      to: partyShape.optional().describe('Recipient (the client)'),
      items: z.array(itemShape).min(1),
      discountPercent: z.number().min(0).max(100).default(0),
      currency: z.string().length(3).default('USD').describe('ISO currency code, e.g. USD, EUR, GBP'),
      status: statusShape.default('draft'),
      notes: z.string().default('')
    }
  }, async (input) => {
    const now = new Date()
    const number = input.number || `INV-${String(store.countInvoices() + 1).padStart(3, '0')}`
    const data = {
      number,
      date: input.date || now.toISOString().split('T')[0],
      dueDate: input.dueDate || '',
      status: input.status,
      logo: '',
      from: { name: '', email: '', address: '', ...input.from },
      to: { name: '', email: '', address: '', ...input.to },
      items: input.items,
      discountPercent: input.discountPercent,
      payment: defaultPayment(),
      notes: input.notes
    }
    const rec = {
      id: crypto.randomUUID(),
      name: input.name || `Invoice ${number} — ${data.to.name || 'Unknown Client'}`,
      createdAt: now.toISOString(),
      invoiceNumber: number,
      clientName: data.to.name || 'Unknown Client',
      total: computeTotal(data),
      currency: input.currency.toUpperCase(),
      status: data.status,
      dueDate: data.dueDate,
      data
    }
    store.upsertInvoice(rec)
    return jsonResult(rec)
  })

  server.registerTool('update_invoice', {
    title: 'Edit invoice',
    description: 'Update an existing invoice by id. Only provided fields change; items (when given) replace the whole list. The total is recomputed.',
    inputSchema: {
      id: z.string(),
      number: z.string().optional(),
      name: z.string().optional(),
      date: z.string().optional(),
      dueDate: z.string().optional(),
      from: partyShape.partial().optional(),
      to: partyShape.partial().optional(),
      items: z.array(itemShape).min(1).optional(),
      discountPercent: z.number().min(0).max(100).optional(),
      currency: z.string().length(3).optional(),
      status: statusShape.optional(),
      notes: z.string().optional()
    }
  }, async (input) => {
    const rec = store.getInvoice(input.id)
    if (!rec) return errorResult(`No invoice found with id "${input.id}"`)
    const data = rec.data || {}
    if (input.number !== undefined) data.number = input.number
    if (input.date !== undefined) data.date = input.date
    if (input.dueDate !== undefined) data.dueDate = input.dueDate
    if (input.from) data.from = { ...data.from, ...input.from }
    if (input.to) data.to = { ...data.to, ...input.to }
    if (input.items) data.items = input.items
    if (input.discountPercent !== undefined) data.discountPercent = input.discountPercent
    if (input.status) data.status = input.status
    if (input.notes !== undefined) data.notes = input.notes

    rec.data = data
    rec.updatedAt = new Date().toISOString()
    rec.invoiceNumber = data.number
    rec.clientName = data.to?.name || 'Unknown Client'
    rec.status = data.status || rec.status
    rec.dueDate = data.dueDate || ''
    rec.total = computeTotal(data)
    if (input.name !== undefined) rec.name = input.name
    if (input.currency) rec.currency = input.currency.toUpperCase()
    store.upsertInvoice(rec)
    return jsonResult(rec)
  })

  server.registerTool('delete_invoice', {
    title: 'Delete invoice',
    description: 'Permanently delete a saved invoice by id.',
    inputSchema: { id: z.string() }
  }, async ({ id }) => {
    return store.deleteInvoice(id)
      ? jsonResult({ deleted: id })
      : errorResult(`No invoice found with id "${id}"`)
  })

  return server
}

function checkMcpAuth(req, res) {
  if (!MCP_TOKEN) {
    res.status(503).json({ error: 'MCP endpoint disabled. Set the MCP_TOKEN environment variable to enable it.' })
    return false
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || !safeEqual(token, MCP_TOKEN)) {
    res.status(401).json({ error: 'Invalid or missing bearer token' })
    return false
  }
  return true
}

export function mountMcp(app) {
  // Stateless mode: a fresh server + transport per request, no session tracking.
  app.post('/mcp', async (req, res) => {
    if (!checkMcpAuth(req, res)) return
    try {
      const server = buildMcpServer()
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
      res.on('close', () => {
        transport.close()
        server.close()
      })
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      console.error('[invoicio] MCP request failed:', err)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null
        })
      }
    }
  })

  const methodNotAllowed = (req, res) => {
    if (!checkMcpAuth(req, res)) return
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed' },
      id: null
    })
  }
  app.get('/mcp', methodNotAllowed)
  app.delete('/mcp', methodNotAllowed)
}
