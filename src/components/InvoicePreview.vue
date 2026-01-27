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
      <div class="preview-content" :class="'preview-template-' + settings.template">
        <div ref="invoiceRef" class="preview-invoice" :style="{ '--accent-color': settings.accentColor, '--accent': settings.accentColor }">
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
              <div v-if="settings.showConversion && formatConvertedCurrency(grandTotal)" class="preview-totals-row converted">
                <span>≈ {{ settings.convertToCurrency }}</span>
                <span>{{ formatConvertedCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="preview-payment" v-if="hasPaymentInfo">
            <h4>Payment Information</h4>
            
            <!-- Bank Transfer -->
            <div v-if="invoice.payment.method === 'bank'" class="payment-details">
              <div v-if="invoice.payment.bankName"><span class="label">Bank:</span> {{ invoice.payment.bankName }}</div>
              <div v-if="invoice.payment.accountName"><span class="label">Account:</span> {{ invoice.payment.accountName }}</div>
              <div v-if="invoice.payment.accountNumber"><span class="label">Number:</span> {{ invoice.payment.accountNumber }}</div>
              <div v-if="invoice.payment.routingNumber"><span class="label">Routing:</span> {{ invoice.payment.routingNumber }}</div>
              <div v-if="invoice.payment.swiftBic"><span class="label">SWIFT/BIC:</span> {{ invoice.payment.swiftBic }}</div>
            </div>

            <!-- Wire Transfer -->
            <div v-else-if="invoice.payment.method === 'wire'" class="payment-details">
              <div v-if="invoice.payment.wireBankName"><span class="label">Bank:</span> {{ invoice.payment.wireBankName }}</div>
              <div v-if="invoice.payment.wireBankAddress"><span class="label">Bank Address:</span> {{ invoice.payment.wireBankAddress }}</div>
              <div v-if="invoice.payment.wireAccountNumber"><span class="label">Account/IBAN:</span> {{ invoice.payment.wireAccountNumber }}</div>
              <div v-if="invoice.payment.wireRoutingNumber"><span class="label">Routing/ABA:</span> {{ invoice.payment.wireRoutingNumber }}</div>
              <div v-if="invoice.payment.wireSwiftBic"><span class="label">SWIFT/BIC:</span> {{ invoice.payment.wireSwiftBic }}</div>
              <div v-if="invoice.payment.wireReference"><span class="label">Reference:</span> {{ invoice.payment.wireReference }}</div>
            </div>

            <!-- PayPal -->
            <div v-else-if="invoice.payment.method === 'paypal'" class="payment-details">
              <div><span class="label">PayPal:</span> {{ invoice.payment.paypalEmail }}</div>
            </div>

            <!-- Stripe -->
            <div v-else-if="invoice.payment.method === 'stripe'" class="payment-details">
              <div><span class="label">Pay via Stripe:</span> <a :href="invoice.payment.stripeLink" target="_blank">{{ invoice.payment.stripeLink }}</a></div>
            </div>

            <!-- Venmo -->
            <div v-else-if="invoice.payment.method === 'venmo'" class="payment-details">
              <div><span class="label">Venmo:</span> @{{ invoice.payment.venmoUsername }}</div>
            </div>

            <!-- Zelle -->
            <div v-else-if="invoice.payment.method === 'zelle'" class="payment-details">
              <div v-if="invoice.payment.zelleEmail"><span class="label">Zelle Email:</span> {{ invoice.payment.zelleEmail }}</div>
              <div v-if="invoice.payment.zellePhone"><span class="label">Zelle Phone:</span> {{ invoice.payment.zellePhone }}</div>
            </div>

            <!-- Cash App -->
            <div v-else-if="invoice.payment.method === 'cashapp'" class="payment-details">
              <div><span class="label">Cash App:</span> ${{ invoice.payment.cashAppTag }}</div>
            </div>

            <!-- Wise -->
            <div v-else-if="invoice.payment.method === 'wise'" class="payment-details">
              <div><span class="label">Wise:</span> {{ invoice.payment.wiseEmail }}</div>
            </div>

            <!-- Crypto -->
            <div v-else-if="invoice.payment.method === 'crypto'" class="payment-details">
              <div><span class="label">{{ invoice.payment.cryptoType }}:</span></div>
              <div class="crypto-address">{{ invoice.payment.cryptoAddress }}</div>
              <div v-if="invoice.payment.cryptoNetwork"><span class="label">Network:</span> {{ invoice.payment.cryptoNetwork }}</div>
            </div>

            <!-- QR Code -->
            <div v-else-if="invoice.payment.method === 'qrcode'" class="payment-details">
              <div v-if="invoice.payment.qrCodeImage" class="qr-display">
                <img :src="invoice.payment.qrCodeImage" alt="Payment QR Code" class="qr-image">
              </div>
              <div v-else-if="invoice.payment.qrCodeData">
                <div><span class="label">Scan to pay:</span></div>
                <div class="qr-generated">
                  <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(invoice.payment.qrCodeData)" alt="QR Code">
                </div>
                <div class="qr-link">{{ invoice.payment.qrCodeData }}</div>
              </div>
            </div>

            <!-- Card -->
            <div v-else-if="invoice.payment.method === 'card'" class="payment-details">
              <div>Payment Method: Credit Card</div>
            </div>

            <!-- Cash -->
            <div v-else-if="invoice.payment.method === 'cash'" class="payment-details">
              <div>Payment Method: Cash</div>
            </div>

            <!-- Other/Custom -->
            <div v-else-if="invoice.payment.method === 'other'" class="payment-details">
              <div class="custom-instructions">{{ invoice.payment.instructions }}</div>
            </div>

            <!-- Payment QR Code (for any method with showPaymentQR enabled) -->
            <div v-if="invoice.payment.showPaymentQR && paymentQRData && invoice.payment.method !== 'qrcode'" class="payment-qr-section">
              <div class="payment-qr-label">Scan to Pay</div>
              <div class="payment-qr-generated">
                <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(paymentQRData)" alt="Payment QR Code">
              </div>
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
      paymentQRData,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
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
      paymentQRData,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate,
      printInvoice
    }
  }
}
</script>
