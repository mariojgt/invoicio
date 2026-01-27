import { computed } from 'vue'
import { savedInvoices, settings } from './state'
import { currencies, invoiceStatuses } from './constants'

/**
 * Analytics Functions
 * Dashboard metrics, charts data, and trends
 */

export function useAnalytics() {
  // Get all invoices with parsed dates
  const invoicesWithDates = computed(() => {
    return savedInvoices.value.map(inv => ({
      ...inv,
      parsedDate: new Date(inv.createdAt),
      parsedDueDate: inv.dueDate ? new Date(inv.dueDate) : null
    }))
  })

  // Total revenue (paid invoices only)
  const totalRevenue = computed(() => {
    return savedInvoices.value
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
  })

  // Outstanding amount (sent + overdue invoices)
  const outstandingAmount = computed(() => {
    return savedInvoices.value
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
  })

  // Draft amount
  const draftAmount = computed(() => {
    return savedInvoices.value
      .filter(inv => inv.status === 'draft')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
  })

  // Overdue amount
  const overdueAmount = computed(() => {
    return savedInvoices.value
      .filter(inv => inv.status === 'overdue')
      .reduce((sum, inv) => sum + (inv.total || 0), 0)
  })

  // Invoice counts by status
  const invoiceCountsByStatus = computed(() => {
    const counts = {}
    Object.keys(invoiceStatuses).forEach(status => {
      counts[status] = savedInvoices.value.filter(inv => (inv.status || 'draft') === status).length
    })
    return counts
  })

  // Total invoice count
  const totalInvoiceCount = computed(() => savedInvoices.value.length)

  // Average invoice amount
  const averageInvoiceAmount = computed(() => {
    if (savedInvoices.value.length === 0) return 0
    const total = savedInvoices.value.reduce((sum, inv) => sum + (inv.total || 0), 0)
    return total / savedInvoices.value.length
  })

  // Monthly revenue data (last 12 months)
  const monthlyRevenue = computed(() => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

      const monthInvoices = savedInvoices.value.filter(inv => {
        if (inv.status !== 'paid') return false
        const invDate = new Date(inv.createdAt)
        return invDate.getFullYear() === date.getFullYear() &&
               invDate.getMonth() === date.getMonth()
      })

      const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const count = monthInvoices.length

      months.push({
        key: monthKey,
        label: monthName,
        revenue,
        count
      })
    }

    return months
  })

  // Monthly invoice counts (all statuses)
  const monthlyInvoiceCounts = computed(() => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

      const monthInvoices = savedInvoices.value.filter(inv => {
        const invDate = new Date(inv.createdAt)
        return invDate.getFullYear() === date.getFullYear() &&
               invDate.getMonth() === date.getMonth()
      })

      months.push({
        label: monthName,
        count: monthInvoices.length,
        paid: monthInvoices.filter(i => i.status === 'paid').length,
        pending: monthInvoices.filter(i => i.status === 'sent' || i.status === 'overdue').length
      })
    }

    return months
  })

  // Top clients by revenue
  const topClients = computed(() => {
    const clientRevenue = {}

    savedInvoices.value
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const clientName = inv.clientName || 'Unknown'
        if (!clientRevenue[clientName]) {
          clientRevenue[clientName] = { name: clientName, revenue: 0, count: 0 }
        }
        clientRevenue[clientName].revenue += inv.total || 0
        clientRevenue[clientName].count++
      })

    return Object.values(clientRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  })

  // Recent activity (last 10 invoices)
  const recentActivity = computed(() => {
    return [...savedInvoices.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
  })

  // Revenue trend (comparison with previous period)
  const revenueTrend = computed(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    // This month's revenue
    const thisMonthRevenue = savedInvoices.value
      .filter(inv => {
        if (inv.status !== 'paid') return false
        const invDate = new Date(inv.createdAt)
        return invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0)

    // Last month's revenue
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear

    const lastMonthRevenue = savedInvoices.value
      .filter(inv => {
        if (inv.status !== 'paid') return false
        const invDate = new Date(inv.createdAt)
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0)

    const change = lastMonthRevenue === 0
      ? (thisMonthRevenue > 0 ? 100 : 0)
      : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100

    return {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      change: change.toFixed(1),
      isPositive: change >= 0
    }
  })

  // Payment rate (paid / total non-draft)
  const paymentRate = computed(() => {
    const nonDraft = savedInvoices.value.filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled')
    if (nonDraft.length === 0) return 0
    const paid = nonDraft.filter(inv => inv.status === 'paid').length
    return ((paid / nonDraft.length) * 100).toFixed(1)
  })

  // Format currency helper
  const formatAmount = (amount) => {
    const symbol = currencies[settings.currency]?.symbol || '$'
    return symbol + amount.toFixed(2)
  }

  return {
    // Summary metrics
    totalRevenue,
    outstandingAmount,
    draftAmount,
    overdueAmount,
    totalInvoiceCount,
    averageInvoiceAmount,
    invoiceCountsByStatus,

    // Charts data
    monthlyRevenue,
    monthlyInvoiceCounts,
    topClients,
    recentActivity,

    // Trends
    revenueTrend,
    paymentRate,

    // Helpers
    formatAmount
  }
}
