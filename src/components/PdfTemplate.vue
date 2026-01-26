<template>
  <div ref="pdfRef" class="pdf-template" :class="'template-' + settings.template">
    <div class="pdf-page" :style="{ '--accent': settings.accentColor }">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-logo-section">
          <img v-if="invoice.logo" :src="invoice.logo" class="pdf-logo" alt="Logo">
        </div>
        <div class="pdf-title-section">
          <div class="pdf-title" :style="{ color: settings.accentColor }">INVOICE</div>
          <div class="pdf-invoice-number">{{ invoice.number || 'INV-001' }}</div>
          <div class="pdf-meta">Date: {{ formatDate(invoice.date) }}</div>
          <div v-if="invoice.dueDate" class="pdf-meta">Due: {{ formatDate(invoice.dueDate) }}</div>
        </div>
      </div>

      <!-- From / Bill To -->
      <div class="pdf-parties">
        <div class="pdf-party">
          <div class="pdf-party-label">From</div>
          <div class="pdf-party-name">{{ invoice.from.name || 'Your Company' }}</div>
          <div v-if="invoice.from.email" class="pdf-party-detail">{{ invoice.from.email }}</div>
          <div class="pdf-party-detail" style="white-space: pre-line;">{{ invoice.from.address }}</div>
        </div>
        <div class="pdf-party">
          <div class="pdf-party-label">Bill To</div>
          <div class="pdf-party-name">{{ invoice.to.name || 'Client Name' }}</div>
          <div v-if="invoice.to.email" class="pdf-party-detail">{{ invoice.to.email }}</div>
          <div class="pdf-party-detail" style="white-space: pre-line;">{{ invoice.to.address }}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="pdf-items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Description</th>
            <th style="text-align: right; width: 60px;">Qty</th>
            <th style="text-align: right; width: 80px;">Price</th>
            <th v-if="settings.taxMode === 'per-item'" style="text-align: right; width: 60px;">Tax</th>
            <th style="text-align: right; width: 90px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in invoice.items" :key="'pdf-item-'+index">
            <td>{{ item.description || 'Item ' + (index + 1) }}</td>
            <td style="text-align: right;">{{ item.quantity }}</td>
            <td style="text-align: right;">{{ formatCurrency(item.price) }}</td>
            <td v-if="settings.taxMode === 'per-item'" style="text-align: right;">{{ item.tax }}%</td>
            <td style="text-align: right; font-weight: 500;">{{ formatCurrency(calculateItemAmount(item)) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Totals -->
      <div class="pdf-totals">
        <div class="pdf-totals-table">
          <div class="pdf-totals-row">
            <span>Subtotal</span>
            <span>{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="pdf-totals-row">
            <span>Tax</span>
            <span>{{ formatCurrency(totalTax) }}</span>
          </div>
          <div v-if="settings.showDiscount && invoice.discountPercent > 0" class="pdf-totals-row">
            <span>Discount ({{ invoice.discountPercent }}%)</span>
            <span>-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="pdf-totals-row pdf-total-final" :style="{ color: settings.accentColor }">
            <span>Total</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div v-if="hasPaymentInfo" class="pdf-payment">
        <div class="pdf-payment-label">Payment Information</div>
        <div v-if="invoice.payment.method === 'bank'" class="pdf-payment-detail">
          <div v-if="invoice.payment.bankName">Bank: {{ invoice.payment.bankName }}</div>
          <div v-if="invoice.payment.accountName">Account: {{ invoice.payment.accountName }}</div>
          <div v-if="invoice.payment.accountNumber">Number: {{ invoice.payment.accountNumber }}</div>
        </div>
        <div v-else-if="invoice.payment.method === 'paypal'" class="pdf-payment-detail">
          PayPal: {{ invoice.payment.paypalEmail }}
        </div>
        <div v-else-if="invoice.payment.method === 'other'" class="pdf-payment-detail">
          {{ invoice.payment.instructions }}
        </div>
        <div v-else class="pdf-payment-detail">
          Payment Method: {{ invoice.payment.method }}
        </div>
      </div>

      <!-- Notes -->
      <div v-if="invoice.notes" class="pdf-notes">
        <strong>Notes:</strong> {{ invoice.notes }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'PdfTemplate',
  setup() {
    const { 
      invoice, 
      settings, 
      subtotal, 
      totalTax, 
      discountAmount, 
      grandTotal, 
      hasPaymentInfo,
      calculateItemAmount, 
      formatCurrency, 
      formatDate 
    } = useInvoice()
    
    const pdfRef = ref(null)

    return {
      invoice,
      settings,
      pdfRef,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      calculateItemAmount,
      formatCurrency,
      formatDate
    }
  }
}
</script>
