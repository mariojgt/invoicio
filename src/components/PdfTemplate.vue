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
          <div v-if="settings.showConversion && formatConvertedCurrency(grandTotal)" class="pdf-totals-row pdf-converted">
            <span>≈ {{ settings.convertToCurrency }}</span>
            <span>{{ formatConvertedCurrency(grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div v-if="hasPaymentInfo" class="pdf-payment">
        <div class="pdf-payment-label">Payment Information</div>
        
        <!-- Bank Transfer -->
        <div v-if="invoice.payment.method === 'bank'" class="pdf-payment-detail">
          <div v-if="invoice.payment.bankName">Bank: {{ invoice.payment.bankName }}</div>
          <div v-if="invoice.payment.accountName">Account: {{ invoice.payment.accountName }}</div>
          <div v-if="invoice.payment.accountNumber">Number: {{ invoice.payment.accountNumber }}</div>
          <div v-if="invoice.payment.routingNumber">Routing: {{ invoice.payment.routingNumber }}</div>
          <div v-if="invoice.payment.swiftBic">SWIFT/BIC: {{ invoice.payment.swiftBic }}</div>
        </div>

        <!-- Wire Transfer -->
        <div v-else-if="invoice.payment.method === 'wire'" class="pdf-payment-detail">
          <div v-if="invoice.payment.wireBankName">Bank: {{ invoice.payment.wireBankName }}</div>
          <div v-if="invoice.payment.wireBankAddress">Bank Address: {{ invoice.payment.wireBankAddress }}</div>
          <div v-if="invoice.payment.wireAccountNumber">Account/IBAN: {{ invoice.payment.wireAccountNumber }}</div>
          <div v-if="invoice.payment.wireRoutingNumber">Routing/ABA: {{ invoice.payment.wireRoutingNumber }}</div>
          <div v-if="invoice.payment.wireSwiftBic">SWIFT/BIC: {{ invoice.payment.wireSwiftBic }}</div>
          <div v-if="invoice.payment.wireReference">Reference: {{ invoice.payment.wireReference }}</div>
        </div>

        <!-- PayPal -->
        <div v-else-if="invoice.payment.method === 'paypal'" class="pdf-payment-detail">
          PayPal: {{ invoice.payment.paypalEmail }}
        </div>

        <!-- Stripe -->
        <div v-else-if="invoice.payment.method === 'stripe'" class="pdf-payment-detail">
          Pay via Stripe: {{ invoice.payment.stripeLink }}
        </div>

        <!-- Venmo -->
        <div v-else-if="invoice.payment.method === 'venmo'" class="pdf-payment-detail">
          Venmo: @{{ invoice.payment.venmoUsername }}
        </div>

        <!-- Zelle -->
        <div v-else-if="invoice.payment.method === 'zelle'" class="pdf-payment-detail">
          <div v-if="invoice.payment.zelleEmail">Zelle Email: {{ invoice.payment.zelleEmail }}</div>
          <div v-if="invoice.payment.zellePhone">Zelle Phone: {{ invoice.payment.zellePhone }}</div>
        </div>

        <!-- Cash App -->
        <div v-else-if="invoice.payment.method === 'cashapp'" class="pdf-payment-detail">
          Cash App: ${{ invoice.payment.cashAppTag }}
        </div>

        <!-- Wise -->
        <div v-else-if="invoice.payment.method === 'wise'" class="pdf-payment-detail">
          Wise: {{ invoice.payment.wiseEmail }}
        </div>

        <!-- Crypto -->
        <div v-else-if="invoice.payment.method === 'crypto'" class="pdf-payment-detail">
          <div>{{ invoice.payment.cryptoType }}:</div>
          <div class="pdf-crypto-address">{{ invoice.payment.cryptoAddress }}</div>
          <div v-if="invoice.payment.cryptoNetwork">Network: {{ invoice.payment.cryptoNetwork }}</div>
        </div>

        <!-- QR Code -->
        <div v-else-if="invoice.payment.method === 'qrcode'" class="pdf-payment-detail pdf-qr-section">
          <div v-if="invoice.payment.qrCodeImage" class="pdf-qr-display">
            <img :src="invoice.payment.qrCodeImage" alt="Payment QR Code" class="pdf-qr-image">
          </div>
          <div v-else-if="invoice.payment.qrCodeData" class="pdf-qr-display">
            <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=' + encodeURIComponent(invoice.payment.qrCodeData)" alt="QR Code" class="pdf-qr-image">
            <div class="pdf-qr-link">{{ invoice.payment.qrCodeData }}</div>
          </div>
        </div>

        <!-- Card -->
        <div v-else-if="invoice.payment.method === 'card'" class="pdf-payment-detail">
          Payment Method: Credit Card
        </div>

        <!-- Cash -->
        <div v-else-if="invoice.payment.method === 'cash'" class="pdf-payment-detail">
          Payment Method: Cash
        </div>

        <!-- Other/Custom -->
        <div v-else-if="invoice.payment.method === 'other'" class="pdf-payment-detail">
          {{ invoice.payment.instructions }}
        </div>

        <!-- Payment QR Code (for any method with showPaymentQR enabled) -->
        <div v-if="invoice.payment.showPaymentQR && paymentQRData && invoice.payment.method !== 'qrcode'" class="pdf-payment-qr">
          <div class="pdf-payment-qr-label">Scan to Pay</div>
          <img :src="'https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=' + encodeURIComponent(paymentQRData)" alt="Payment QR" class="pdf-qr-image">
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
      paymentQRData,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
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
      paymentQRData,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate
    }
  }
}
</script>
