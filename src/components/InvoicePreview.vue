<template>
  <div class="invoice-preview-panel">
    <div class="preview-card">
      <div class="preview-header">
        <span class="preview-title">Preview</span>
        <div class="preview-actions">
          <button class="btn btn-sm btn-success" @click="$emit('export-pdf')" :disabled="isGeneratingPDF">
            <svg v-if="!isGeneratingPDF" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="12" y2="12"/>
              <line x1="15" y1="15" x2="12" y2="12"/>
            </svg>
            <span v-if="isGeneratingPDF" class="loading-spinner"></span>
            {{ isGeneratingPDF ? 'Generating...' : 'PDF' }}
          </button>
          <button class="btn btn-sm btn-primary" @click="printInvoice">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>
      <div class="preview-content">
        <div ref="invoiceRef" class="preview-invoice" :style="{ '--accent-color': settings.accentColor }">
          <!-- Invoice Header -->
          <div class="preview-invoice-header">
            <div>
              <img v-if="invoice.logo" :src="invoice.logo" class="preview-logo" alt="Logo">
            </div>
            <div class="preview-invoice-title">
              <h2 :style="{ color: settings.accentColor }">INVOICE</h2>
              <div class="preview-invoice-meta">
                <div><strong>{{ invoice.number || 'INV-001' }}</strong></div>
                <div>Date: {{ formatDate(invoice.date) }}</div>
                <div v-if="invoice.dueDate">Due: {{ formatDate(invoice.dueDate) }}</div>
              </div>
            </div>
          </div>

          <!-- Parties -->
          <div class="preview-parties">
            <div class="preview-party">
              <h4>From</h4>
              <div class="preview-party-name">{{ invoice.from.name || 'Your Company' }}</div>
              <div v-if="invoice.from.email">{{ invoice.from.email }}</div>
              <div style="white-space: pre-line;">{{ invoice.from.address }}</div>
            </div>
            <div class="preview-party">
              <h4>Bill To</h4>
              <div class="preview-party-name">{{ invoice.to.name || 'Client Name' }}</div>
              <div v-if="invoice.to.email">{{ invoice.to.email }}</div>
              <div style="white-space: pre-line;">{{ invoice.to.address }}</div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="preview-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th v-if="settings.taxMode === 'per-item'" class="text-right">Tax</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoice.items" :key="index">
                <td>{{ item.description || 'Item ' + (index + 1) }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ formatCurrency(item.price) }}</td>
                <td v-if="settings.taxMode === 'per-item'" class="text-right">{{ item.tax }}%</td>
                <td class="text-right">{{ formatCurrency(calculateItemAmount(item)) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="preview-totals">
            <div class="preview-totals-table">
              <div class="preview-totals-row">
                <span>Subtotal</span>
                <span>{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="preview-totals-row">
                <span>Tax</span>
                <span>{{ formatCurrency(totalTax) }}</span>
              </div>
              <div v-if="settings.showDiscount && invoice.discountPercent > 0" class="preview-totals-row">
                <span>Discount ({{ invoice.discountPercent }}%)</span>
                <span>-{{ formatCurrency(discountAmount) }}</span>
              </div>
              <div class="preview-totals-row total">
                <span>Total</span>
                <span>{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="preview-payment" v-if="hasPaymentInfo">
            <h4>Payment Information</h4>
            <div v-if="invoice.payment.method === 'bank'">
              <div v-if="invoice.payment.bankName">Bank: {{ invoice.payment.bankName }}</div>
              <div v-if="invoice.payment.accountName">Account: {{ invoice.payment.accountName }}</div>
              <div v-if="invoice.payment.accountNumber">Number: {{ invoice.payment.accountNumber }}</div>
            </div>
            <div v-else-if="invoice.payment.method === 'paypal'">
              PayPal: {{ invoice.payment.paypalEmail }}
            </div>
            <div v-else-if="invoice.payment.method === 'other'">
              {{ invoice.payment.instructions }}
            </div>
            <div v-else>
              Payment Method: {{ invoice.payment.method }}
            </div>
          </div>

          <!-- Notes -->
          <div class="preview-notes" v-if="invoice.notes">
            <strong>Notes:</strong> {{ invoice.notes }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoicePreview',
  emits: ['export-pdf'],
  setup() {
    const { 
      invoice, 
      settings, 
      isGeneratingPDF,
      subtotal, 
      totalTax, 
      discountAmount, 
      grandTotal, 
      hasPaymentInfo,
      calculateItemAmount, 
      formatCurrency, 
      formatDate 
    } = useInvoice()
    
    const invoiceRef = ref(null)

    const printInvoice = () => {
      window.print()
    }

    return {
      invoice,
      settings,
      isGeneratingPDF,
      invoiceRef,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      calculateItemAmount,
      formatCurrency,
      formatDate,
      printInvoice
    }
  }
}
</script>
