<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal dashboard-modal">
        <div class="modal-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
            Dashboard
          </h2>
          <button class="btn btn-icon" @click="$emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body dashboard-body">
          <!-- Summary Cards -->
          <div class="dashboard-summary">
            <div class="summary-card summary-revenue">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">Total Revenue</span>
                <span class="summary-value">{{ formatAmount(totalRevenue) }}</span>
                <span class="summary-trend" :class="{ positive: revenueTrend.isPositive, negative: !revenueTrend.isPositive }">
                  <svg v-if="revenueTrend.isPositive" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                    <polyline points="17 18 23 18 23 12"/>
                  </svg>
                  {{ revenueTrend.change }}% vs last month
                </span>
              </div>
            </div>

            <div class="summary-card summary-outstanding">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">Outstanding</span>
                <span class="summary-value">{{ formatAmount(outstandingAmount) }}</span>
                <span class="summary-sub">{{ invoiceCountsByStatus.sent + invoiceCountsByStatus.overdue }} invoices pending</span>
              </div>
            </div>

            <div class="summary-card summary-overdue">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">Overdue</span>
                <span class="summary-value">{{ formatAmount(overdueAmount) }}</span>
                <span class="summary-sub">{{ invoiceCountsByStatus.overdue }} invoices overdue</span>
              </div>
            </div>

            <div class="summary-card summary-rate">
              <div class="summary-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="summary-content">
                <span class="summary-label">Payment Rate</span>
                <span class="summary-value">{{ paymentRate }}%</span>
                <span class="summary-sub">{{ invoiceCountsByStatus.paid }} paid of {{ totalInvoiceCount }} total</span>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="dashboard-charts">
            <!-- Revenue Chart -->
            <div class="chart-card">
              <h3>Monthly Revenue</h3>
              <div class="chart-container bar-chart">
                <div class="chart-bars">
                  <div
                    v-for="month in monthlyRevenue"
                    :key="month.key"
                    class="chart-bar-wrapper"
                  >
                    <div class="chart-bar-value">{{ formatAmount(month.revenue) }}</div>
                    <div
                      class="chart-bar"
                      :style="{ height: getBarHeight(month.revenue, maxRevenue) + '%' }"
                      :title="`${month.label}: ${formatAmount(month.revenue)}`"
                    ></div>
                    <div class="chart-bar-label">{{ month.label }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice Status Distribution -->
            <div class="chart-card">
              <h3>Invoice Status</h3>
              <div class="chart-container donut-chart">
                <div class="donut-visual">
                  <svg viewBox="0 0 100 100" class="donut-svg">
                    <circle
                      v-for="(segment, index) in statusSegments"
                      :key="segment.status"
                      class="donut-segment"
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      :stroke="segment.color"
                      stroke-width="20"
                      :stroke-dasharray="segment.dashArray"
                      :stroke-dashoffset="segment.offset"
                      :style="{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }"
                    />
                  </svg>
                  <div class="donut-center">
                    <span class="donut-total">{{ totalInvoiceCount }}</span>
                    <span class="donut-label">Invoices</span>
                  </div>
                </div>
                <div class="donut-legend">
                  <div
                    v-for="(count, status) in invoiceCountsByStatus"
                    :key="status"
                    class="legend-item"
                    v-show="count > 0"
                  >
                    <span class="legend-color" :style="{ backgroundColor: statusColors[status] }"></span>
                    <span class="legend-label">{{ statusLabels[status] }}</span>
                    <span class="legend-count">{{ count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Row -->
          <div class="dashboard-bottom">
            <!-- Top Clients -->
            <div class="list-card">
              <h3>Top Clients</h3>
              <div class="client-list" v-if="topClients.length > 0">
                <div v-for="(client, index) in topClients" :key="client.name" class="client-item">
                  <span class="client-rank">{{ index + 1 }}</span>
                  <div class="client-info">
                    <span class="client-name">{{ client.name }}</span>
                    <span class="client-invoices">{{ client.count }} invoice{{ client.count !== 1 ? 's' : '' }}</span>
                  </div>
                  <span class="client-revenue">{{ formatAmount(client.revenue) }}</span>
                </div>
              </div>
              <div v-else class="empty-list">
                <p>No paid invoices yet</p>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="list-card">
              <h3>Recent Invoices</h3>
              <div class="activity-list" v-if="recentActivity.length > 0">
                <div v-for="inv in recentActivity" :key="inv.id" class="activity-item">
                  <div class="activity-info">
                    <span class="activity-number">{{ inv.invoiceNumber }}</span>
                    <span class="activity-client">{{ inv.clientName }}</span>
                  </div>
                  <div class="activity-meta">
                    <span
                      class="activity-status"
                      :style="{ backgroundColor: statusColors[inv.status || 'draft'] }"
                    >
                      {{ statusLabels[inv.status || 'draft'] }}
                    </span>
                    <span class="activity-amount">{{ formatAmount(inv.total || 0) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-list">
                <p>No invoices saved yet</p>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="quick-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formatAmount(averageInvoiceAmount) }}</span>
              <span class="stat-label">Avg. Invoice</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ invoiceCountsByStatus.draft }}</span>
              <span class="stat-label">Drafts</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatAmount(draftAmount) }}</span>
              <span class="stat-label">Draft Value</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ formatAmount(revenueTrend.thisMonth) }}</span>
              <span class="stat-label">This Month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { computed } from 'vue'
import { useAnalytics } from '../composables/useAnalytics'
import { invoiceStatuses } from '../composables/constants'

export default {
  name: 'Dashboard',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup() {
    const {
      totalRevenue,
      outstandingAmount,
      draftAmount,
      overdueAmount,
      totalInvoiceCount,
      averageInvoiceAmount,
      invoiceCountsByStatus,
      monthlyRevenue,
      topClients,
      recentActivity,
      revenueTrend,
      paymentRate,
      formatAmount
    } = useAnalytics()

    // Status colors and labels
    const statusColors = {}
    const statusLabels = {}
    Object.entries(invoiceStatuses).forEach(([key, value]) => {
      statusColors[key] = value.color
      statusLabels[key] = value.label
    })

    // Calculate max revenue for bar chart scaling
    const maxRevenue = computed(() => {
      const max = Math.max(...monthlyRevenue.value.map(m => m.revenue))
      return max || 1
    })

    const getBarHeight = (value, max) => {
      if (!max || max === 0) return 5
      return Math.max(5, (value / max) * 100)
    }

    // Calculate donut chart segments
    const statusSegments = computed(() => {
      const total = totalInvoiceCount.value
      if (total === 0) return []

      const segments = []
      let cumulativeOffset = 0
      const circumference = 2 * Math.PI * 40 // r=40

      Object.entries(invoiceCountsByStatus.value).forEach(([status, count]) => {
        if (count > 0) {
          const percentage = count / total
          const dashLength = percentage * circumference
          const gapLength = circumference - dashLength

          segments.push({
            status,
            color: statusColors[status],
            count,
            percentage: (percentage * 100).toFixed(1),
            dashArray: `${dashLength} ${gapLength}`,
            offset: -cumulativeOffset
          })

          cumulativeOffset += dashLength
        }
      })

      return segments
    })

    return {
      totalRevenue,
      outstandingAmount,
      draftAmount,
      overdueAmount,
      totalInvoiceCount,
      averageInvoiceAmount,
      invoiceCountsByStatus,
      monthlyRevenue,
      topClients,
      recentActivity,
      revenueTrend,
      paymentRate,
      formatAmount,
      statusColors,
      statusLabels,
      maxRevenue,
      getBarHeight,
      statusSegments
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--gray-800);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}

.dashboard-modal {
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-body {
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Summary Cards */
.dashboard-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-revenue .summary-icon {
  background: #dcfce7;
  color: #16a34a;
}

.summary-outstanding .summary-icon {
  background: #dbeafe;
  color: #2563eb;
}

.summary-overdue .summary-icon {
  background: #fee2e2;
  color: #dc2626;
}

.summary-rate .summary-icon {
  background: #f3e8ff;
  color: #9333ea;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.8rem;
  color: var(--gray-500);
  font-weight: 500;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
}

.summary-trend {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.summary-trend.positive {
  color: #16a34a;
}

.summary-trend.negative {
  color: #dc2626;
}

.summary-sub {
  font-size: 0.75rem;
  color: var(--gray-500);
}

/* Charts */
.dashboard-charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
}

.chart-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

/* Bar Chart */
.bar-chart {
  height: 200px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 100%;
  gap: 0.5rem;
  padding-top: 1.5rem;
}

.chart-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
}

.chart-bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(180deg, var(--primary) 0%, var(--primary-dark, #4338ca) 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  min-height: 4px;
}

.chart-bar-value {
  position: absolute;
  top: 0;
  font-size: 0.6rem;
  color: var(--gray-500);
  white-space: nowrap;
  transform: rotate(-45deg);
  transform-origin: bottom left;
}

.chart-bar-label {
  font-size: 0.65rem;
  color: var(--gray-500);
  margin-top: 0.5rem;
  text-align: center;
}

/* Donut Chart */
.donut-chart {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.donut-visual {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.donut-svg {
  width: 100%;
  height: 100%;
}

.donut-segment {
  transition: stroke-dashoffset 0.3s ease;
}

.donut-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.donut-total {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-800);
}

.donut-label {
  display: block;
  font-size: 0.7rem;
  color: var(--gray-500);
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  color: var(--gray-600);
  flex: 1;
}

.legend-count {
  font-weight: 600;
  color: var(--gray-800);
}

/* Bottom Row */
.dashboard-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.list-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--gray-200);
}

.list-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 1rem;
}

/* Client List */
.client-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--gray-50);
}

.client-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  display: block;
  font-weight: 500;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-invoices {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.client-revenue {
  font-weight: 600;
  color: #16a34a;
  white-space: nowrap;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--gray-50);
}

.activity-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.activity-number {
  font-weight: 500;
  color: var(--gray-800);
  font-size: 0.85rem;
}

.activity-client {
  font-size: 0.75rem;
  color: var(--gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.activity-status {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.activity-amount {
  font-weight: 600;
  color: var(--gray-800);
  font-size: 0.85rem;
  white-space: nowrap;
}

.empty-list {
  text-align: center;
  padding: 2rem;
  color: var(--gray-500);
}

/* Quick Stats */
.quick-stats {
  display: flex;
  justify-content: space-around;
  background: var(--gray-50);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--gray-200);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--gray-800);
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 900px) {
  .dashboard-charts {
    grid-template-columns: 1fr;
  }

  .dashboard-bottom {
    grid-template-columns: 1fr;
  }

  .donut-chart {
    flex-direction: column;
  }

  .quick-stats {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .stat-item {
    flex: 1 0 40%;
  }
}

@media (max-width: 600px) {
  .dashboard-summary {
    grid-template-columns: 1fr;
  }

  .chart-bar-value {
    display: none;
  }
}
</style>
