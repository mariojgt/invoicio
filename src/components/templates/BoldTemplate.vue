<template>
  <div class="bold-template" :style="{ '--accent': accentColor }">
    <div class="content-wrapper" :style="{ borderColor: accentColor }">
      <!-- Header -->
      <div class="header" :style="{ borderColor: accentColor }">
        <div class="logo-section">
          <img v-if="invoice.logo" :src="invoice.logo" class="logo" alt="Logo">
        </div>
        <div class="title-section">
          <div class="title" :style="{ color: accentColor }">INVOICE</div>
          <div class="invoice-number">{{ invoice.number || 'INV-001' }}</div>
          <div class="meta">Date: {{ formatDate(invoice.date) }}</div>
          <div v-if="invoice.dueDate" class="meta">Due: {{ formatDate(invoice.dueDate) }}</div>
        </div>
      </div>

      <!-- From / Bill To -->
      <div class="parties">
        <div class="party">
          <div class="party-label" :style="{ background: accentColor }">FROM</div>
          <div class="party-name">{{ invoice.from.name || 'Your Company' }}</div>
          <div v-if="invoice.from.email" class="party-detail">{{ invoice.from.email }}</div>
          <div class="party-detail" style="white-space: pre-line;">{{ invoice.from.address }}</div>
        </div>
        <div class="party">
          <div class="party-label" :style="{ background: accentColor }">BILL TO</div>
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
            <th style="text-align: right; width: 55px;">Qty</th>
            <th style="text-align: right; width: 75px;">Price</th>
            <th v-if="taxMode === 'per-item'" style="text-align: right; width: 55px;">Tax</th>
            <th style="text-align: right; width: 85px;">Amount</th>
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
        <div class="totals-table" :style="{ borderColor: accentColor }">
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
          <div class="totals-row total-final" :style="{ borderColor: accentColor, color: accentColor }">
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
      <div v-if="hasPaymentInfo" class="payment" :style="{ borderColor: accentColor }">
        <div class="payment-label">PAYMENT INFORMATION</div>
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
  name: 'BoldTemplate',
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
.bold-template {
  width: 595px;
  min-height: 842px;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 12px;
  color: #1f2937;
  background: white;
  box-sizing: border-box;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.content-wrapper {
  border: 4px solid var(--accent, #4f46e5);
  padding: 36px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 4px solid var(--accent, #4f46e5);
}

.logo-section {
  flex: 1;
}

.logo {
  max-width: 120px;
  max-height: 50px;
  object-fit: contain;
}

.title-section {
  text-align: right;
}

.title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.invoice-number {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #111827;
}

.meta {
  color: #4b5563;
  font-size: 11px;
  line-height: 1.6;
  font-weight: 500;
}

.parties {
  display: flex;
  gap: 40px;
  margin-bottom: 24px;
}

.party {
  flex: 1;
}

.party-label {
  font-size: 10px;
  text-transform: uppercase;
  color: white;
  padding: 6px 10px;
  display: inline-block;
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  border-radius: 3px;
}

.party-name {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 4px;
  color: #111827;
}

.party-detail {
  color: #4b5563;
  font-size: 11px;
  line-height: 1.6;
  font-weight: 500;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
  border: 3px solid #374151;
}

.items-table th {
  background: #374151;
  color: white;
  padding: 12px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.items-table td {
  padding: 12px;
  border-bottom: 1px solid #d1d5db;
  font-size: 11px;
  color: #1f2937;
  font-weight: 500;
}

.items-table tr:last-child td {
  border-bottom: none;
}

.totals {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 24px;
}

.totals-table {
  width: 200px;
  background: white;
  padding: 14px 18px;
  border: 3px solid var(--accent, #4f46e5);
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 11px;
  color: #4b5563;
  font-weight: 500;
}

.total-final {
  border-top: 3px solid var(--accent, #4f46e5);
  margin-top: 8px;
  padding-top: 12px;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.converted {
  color: #6b7280;
  font-style: italic;
  font-size: 10px;
  border-top: 1px dashed #d1d5db;
  margin-top: 6px;
  padding-top: 6px;
}

.payment {
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 2px solid var(--accent, #4f46e5);
}

.payment-label {
  font-size: 10px;
  text-transform: uppercase;
  color: #6b7280;
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.payment-detail {
  color: #374151;
  font-size: 11px;
  line-height: 1.8;
  font-weight: 500;
}

.notes {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.6;
}

.notes strong {
  color: #374151;
  font-weight: 700;
}
</style>
