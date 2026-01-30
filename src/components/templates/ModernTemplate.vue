<template>
  <div class="modern-template" :style="{ '--accent': accentColor }">
    <!-- Header with Accent Background -->
    <div class="header" :style="{ background: accentColor }">
      <div class="logo-section">
        <img v-if="invoice.logo" :src="invoice.logo" class="logo" alt="Logo">
      </div>
      <div class="title-section">
        <div class="title">INVOICE</div>
        <div class="invoice-number">{{ invoice.number || 'INV-001' }}</div>
        <div class="meta">Date: {{ formatDate(invoice.date) }}</div>
        <div v-if="invoice.dueDate" class="meta">Due: {{ formatDate(invoice.dueDate) }}</div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content">
      <!-- From / Bill To -->
      <div class="parties">
        <div class="party">
          <div class="party-label">From</div>
          <div class="party-name">{{ invoice.from.name || 'Your Company' }}</div>
          <div v-if="invoice.from.email" class="party-detail">{{ invoice.from.email }}</div>
          <div class="party-detail" style="white-space: pre-line;">{{ invoice.from.address }}</div>
        </div>
        <div class="party">
          <div class="party-label">Bill To</div>
          <div class="party-name">{{ invoice.to.name || 'Client Name' }}</div>
          <div v-if="invoice.to.email" class="party-detail">{{ invoice.to.email }}</div>
          <div class="party-detail" style="white-space: pre-line;">{{ invoice.to.address }}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Description</th>
            <th style="text-align: right; width: 50px;">Qty</th>
            <th style="text-align: right; width: 70px;">Price</th>
            <th v-if="taxMode === 'per-item'" style="text-align: right; width: 50px;">Tax</th>
            <th style="text-align: right; width: 75px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in invoice.items" :key="'item-'+index">
            <td>{{ item.description || 'Item ' + (index + 1) }}</td>
            <td style="text-align: right;">{{ item.quantity }}</td>
            <td style="text-align: right;">{{ formatCurrency(item.price) }}</td>
            <td v-if="taxMode === 'per-item'" style="text-align: right;">{{ item.tax }}%</td>
            <td style="text-align: right; font-weight: 500;">{{ formatCurrency(calculateItemAmount(item)) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="totals-row">
            <span>Tax</span>
            <span>{{ formatCurrency(totalTax) }}</span>
          </div>
          <div v-if="showDiscount && invoice.discountPercent > 0" class="totals-row">
            <span>Discount ({{ invoice.discountPercent }}%)</span>
            <span>-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="totals-row total-final" :style="{ color: accentColor }">
            <span>Total</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
          <div v-if="showConversion && formatConvertedCurrency(grandTotal)" class="totals-row converted">
            <span>≈ {{ convertToCurrency }}</span>
            <span>{{ formatConvertedCurrency(grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div v-if="hasPaymentInfo" class="payment">
        <div class="payment-label">Payment Information</div>
        <div class="payment-detail">
          <slot name="payment-content"></slot>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="invoice.notes" class="notes">
        <strong>Notes:</strong> {{ invoice.notes }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModernTemplate',
  props: {
    invoice: { type: Object, default: () => ({ from: {}, to: {}, items: [], payment: {} }) },
    accentColor: { type: String, default: '#4f46e5' },
    taxMode: { type: String, default: 'global' },
    showDiscount: { type: Boolean, default: true },
    showConversion: { type: Boolean, default: false },
    convertToCurrency: { type: String, default: 'USD' },
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    hasPaymentInfo: { type: Boolean, default: false },
    calculateItemAmount: { type: Function, default: () => 0 },
    formatCurrency: { type: Function, default: (v) => `$${v}` },
    formatConvertedCurrency: { type: Function, default: () => '' },
    formatDate: { type: Function, default: (d) => d }
  }
}
</script>

<style scoped>
.modern-template {
  width: 595px;
  min-height: 842px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px;
  color: #1f2937;
  background: white;
  box-sizing: border-box;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.header {
  padding: 28px 35px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.logo-section {
  flex: 1;
}

.logo {
  max-width: 120px;
  max-height: 50px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.title-section {
  text-align: right;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 1px;
  color: white;
}

.invoice-number {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: white;
}

.meta {
  color: rgba(255, 255, 255, 0.9);
  font-size: 10px;
  line-height: 1.6;
}

.content {
  padding: 0 35px 35px 35px;
}

.parties {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
}

.party {
  flex: 1;
}

.party-label {
  font-size: 9px;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 6px;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 3px;
  letter-spacing: 0.5px;
}

.party-name {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 3px;
  color: #111827;
}

.party-detail {
  color: #4b5563;
  font-size: 10px;
  line-height: 1.5;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  table-layout: fixed;
}

.items-table th {
  background: var(--accent, #4f46e5);
  color: white;
  padding: 9px 10px;
  font-size: 9px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.items-table td {
  padding: 9px 10px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 10px;
  color: #1f2937;
}

.items-table tr:last-child td {
  border-bottom: none;
}

.totals {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.totals-table {
  width: 180px;
  background: white;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 10px;
  color: #4b5563;
}

.total-final {
  border-top: 2px solid #d1d5db;
  margin-top: 6px;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.converted {
  color: #6b7280;
  font-style: italic;
  font-size: 9px;
  border-top: 1px dashed #d1d5db;
  margin-top: 5px;
  padding-top: 5px;
}

.payment {
  background: #f9fafb;
  padding: 14px;
  border-radius: 6px;
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
}

.payment-label {
  font-size: 9px;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.payment-detail {
  color: #374151;
  font-size: 10px;
  line-height: 1.7;
}

.notes {
  border-top: 1px solid #e5e7eb;
  padding-top: 14px;
  font-size: 10px;
  color: #6b7280;
  line-height: 1.6;
}

.notes strong {
  color: #374151;
  font-weight: 600;
}
</style>
