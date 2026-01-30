<template>
  <div class="preview-content" :class="'preview-template-' + displaySettings.template">
    <div class="preview-invoice" :style="{ '--accent-color': displaySettings.accentColor, '--accent': displaySettings.accentColor }">
      <!-- Invoice Header -->
      <div class="preview-invoice-header">
        <div>
          <img v-if="displayInvoice.logo" :src="displayInvoice.logo" class="preview-logo" alt="Logo">
          <div v-else-if="displayInvoice.initials" class="preview-logo-initials" :style="{ backgroundColor: displaySettings.accentColor }">
            {{ displayInvoice.initials }}
          </div>
        </div>
        <div class="preview-invoice-title">
          <h2 :style="{ color: displaySettings.accentColor }">INVOICE</h2>
          <div class="preview-invoice-meta">
            <div><strong>{{ displayInvoice.number || 'INV-001' }}</strong></div>
            <div>Date: {{ formatDate(displayInvoice.date) }}</div>
            <div v-if="displayInvoice.dueDate">Due: {{ formatDate(displayInvoice.dueDate) }}</div>
          </div>
        </div>
      </div>

      <!-- Parties -->
      <div class="preview-parties">
        <div class="preview-party">
          <h4>From</h4>
          <div class="preview-party-name">{{ displayInvoice.from?.name || 'Your Company' }}</div>
          <div v-if="displayInvoice.from?.email">{{ displayInvoice.from.email }}</div>
          <div style="white-space: pre-line;">{{ displayInvoice.from?.address }}</div>
        </div>
        <div class="preview-party">
          <h4>Bill To</h4>
          <div class="preview-party-name">{{ displayInvoice.to?.name || 'Client Name' }}</div>
          <div v-if="displayInvoice.to?.email">{{ displayInvoice.to.email }}</div>
          <div style="white-space: pre-line;">{{ displayInvoice.to?.address }}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="preview-items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th v-if="displaySettings.taxMode === 'per-item'" class="text-right">Tax</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in displayItems" :key="index">
            <td>{{ item.description || 'Item ' + (index + 1) }}</td>
            <td class="text-right">{{ item.quantity }}</td>
            <td class="text-right">{{ formatCurrency(item.price) }}</td>
            <td v-if="displaySettings.taxMode === 'per-item'" class="text-right">{{ item.tax }}%</td>
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
          <div v-if="displaySettings.showDiscount && displayInvoice.discountPercent > 0" class="preview-totals-row">
            <span>Discount ({{ displayInvoice.discountPercent }}%)</span>
            <span>-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="preview-totals-row total">
            <span>Total</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
          <div v-if="showConversion && convertedTotal" class="preview-totals-row converted">
            <span>≈ {{ displaySettings.convertToCurrency }}</span>
            <span>{{ convertedTotal }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div class="preview-payment" v-if="hasPaymentInfo">
        <h4>Payment Information</h4>

        <!-- Bank Transfer -->
        <div v-if="payment.method === 'bank'" class="payment-details">
          <div v-if="payment.bankName"><span class="label">Bank:</span> {{ payment.bankName }}</div>
          <div v-if="payment.accountName"><span class="label">Account:</span> {{ payment.accountName }}</div>
          <div v-if="payment.accountNumber"><span class="label">Number:</span> {{ payment.accountNumber }}</div>
          <div v-if="payment.routingNumber"><span class="label">Routing:</span> {{ payment.routingNumber }}</div>
          <div v-if="payment.swiftBic"><span class="label">SWIFT/BIC:</span> {{ payment.swiftBic }}</div>
        </div>

        <!-- Wire Transfer -->
        <div v-else-if="payment.method === 'wire'" class="payment-details">
          <div v-if="payment.wireBankName"><span class="label">Bank:</span> {{ payment.wireBankName }}</div>
          <div v-if="payment.wireBankAddress"><span class="label">Bank Address:</span> {{ payment.wireBankAddress }}</div>
          <div v-if="payment.wireAccountNumber"><span class="label">Account/IBAN:</span> {{ payment.wireAccountNumber }}</div>
          <div v-if="payment.wireRoutingNumber"><span class="label">Routing/ABA:</span> {{ payment.wireRoutingNumber }}</div>
          <div v-if="payment.wireSwiftBic"><span class="label">SWIFT/BIC:</span> {{ payment.wireSwiftBic }}</div>
          <div v-if="payment.wireReference"><span class="label">Reference:</span> {{ payment.wireReference }}</div>
        </div>

        <!-- PayPal -->
        <div v-else-if="payment.method === 'paypal'" class="payment-details">
          <div><span class="label">PayPal:</span> {{ payment.paypalEmail }}</div>
        </div>

        <!-- Stripe -->
        <div v-else-if="payment.method === 'stripe'" class="payment-details">
          <div><span class="label">Pay via Stripe:</span> <a :href="payment.stripeLink" target="_blank">{{ payment.stripeLink }}</a></div>
        </div>

        <!-- Venmo -->
        <div v-else-if="payment.method === 'venmo'" class="payment-details">
          <div><span class="label">Venmo:</span> @{{ payment.venmoUsername }}</div>
        </div>

        <!-- Zelle -->
        <div v-else-if="payment.method === 'zelle'" class="payment-details">
          <div v-if="payment.zelleEmail"><span class="label">Zelle Email:</span> {{ payment.zelleEmail }}</div>
          <div v-if="payment.zellePhone"><span class="label">Zelle Phone:</span> {{ payment.zellePhone }}</div>
        </div>

        <!-- Cash App -->
        <div v-else-if="payment.method === 'cashapp'" class="payment-details">
          <div><span class="label">Cash App:</span> ${{ payment.cashAppTag }}</div>
        </div>

        <!-- Wise -->
        <div v-else-if="payment.method === 'wise'" class="payment-details">
          <div><span class="label">Wise:</span> {{ payment.wiseEmail }}</div>
        </div>

        <!-- Crypto -->
        <div v-else-if="payment.method === 'crypto'" class="payment-details">
          <div><span class="label">{{ payment.cryptoType }}:</span></div>
          <div class="crypto-address">{{ payment.cryptoAddress }}</div>
          <div v-if="payment.cryptoNetwork"><span class="label">Network:</span> {{ payment.cryptoNetwork }}</div>
        </div>

        <!-- QR Code -->
        <div v-else-if="payment.method === 'qrcode'" class="payment-details">
          <div v-if="payment.qrCodeImage" class="qr-display">
            <img :src="payment.qrCodeImage" alt="Payment QR Code" class="qr-image">
          </div>
          <div v-else-if="payment.qrCodeData">
            <div><span class="label">Scan to pay:</span></div>
            <div class="qr-generated">
              <img :src="getQRCodeUrl(payment.qrCodeData, 120)" alt="QR Code">
            </div>
            <div class="qr-link">{{ payment.qrCodeData }}</div>
          </div>
        </div>

        <!-- Card -->
        <div v-else-if="payment.method === 'card'" class="payment-details">
          <div>Payment Method: Credit Card</div>
        </div>

        <!-- Cash -->
        <div v-else-if="payment.method === 'cash'" class="payment-details">
          <div>Payment Method: Cash</div>
        </div>

        <!-- Other/Custom -->
        <div v-else-if="payment.method === 'other'" class="payment-details">
          <div class="custom-instructions">{{ payment.instructions }}</div>
        </div>

        <!-- Payment QR Code (for any method with showPaymentQR enabled) -->
        <div v-if="payment.showPaymentQR && paymentQRData && payment.method !== 'qrcode'" class="payment-qr-section">
          <div class="payment-qr-label">Scan to Pay</div>
          <div class="payment-qr-generated">
            <img :src="getQRCodeUrl(paymentQRData, 100)" alt="Payment QR Code">
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="preview-notes" v-if="displayInvoice.notes">
        <strong>Notes:</strong> {{ displayInvoice.notes }}
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'InvoiceDisplay',
  props: {
    invoice: {
      type: Object,
      required: true
    },
    settings: {
      type: Object,
      required: true
    },
    // Optional: for currency conversion in main app
    formatConvertedCurrency: {
      type: Function,
      default: null
    }
  },
  setup(props) {
    // Safe accessors with defaults
    const displayInvoice = computed(() => props.invoice || {})
    const displaySettings = computed(() => props.settings || {})
    const displayItems = computed(() => displayInvoice.value.items || [])
    const payment = computed(() => displayInvoice.value.payment || {})

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const formatCurrency = (amount) => {
      const currency = displaySettings.value.currency || 'USD'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount || 0)
    }

    const calculateItemAmount = (item) => {
      const base = (item.quantity || 0) * (item.price || 0)
      if (displaySettings.value.taxMode === 'per-item') {
        return base + (base * (item.tax || 0) / 100)
      }
      return base
    }

    const subtotal = computed(() => {
      return displayItems.value.reduce((sum, item) => {
        return sum + ((item.quantity || 0) * (item.price || 0))
      }, 0)
    })

    const totalTax = computed(() => {
      if (displaySettings.value.taxMode === 'total') {
        return subtotal.value * ((displaySettings.value.globalTaxRate || 0) / 100)
      } else {
        return displayItems.value.reduce((sum, item) => {
          const itemSubtotal = (item.quantity || 0) * (item.price || 0)
          return sum + (itemSubtotal * ((item.tax || 0) / 100))
        }, 0)
      }
    })

    const discountAmount = computed(() => {
      if (!displaySettings.value.showDiscount || !displayInvoice.value.discountPercent) return 0
      return (subtotal.value + totalTax.value) * (displayInvoice.value.discountPercent / 100)
    })

    const grandTotal = computed(() => {
      return subtotal.value + totalTax.value - discountAmount.value
    })

    const showConversion = computed(() => {
      return displaySettings.value.showConversion && props.formatConvertedCurrency
    })

    const convertedTotal = computed(() => {
      if (props.formatConvertedCurrency) {
        return props.formatConvertedCurrency(grandTotal.value)
      }
      return null
    })

    const hasPaymentInfo = computed(() => {
      const p = payment.value
      if (!p || !p.method || p.method === 'none') return false
      
      switch (p.method) {
        case 'bank': return p.bankName || p.accountName || p.accountNumber
        case 'wire': return p.wireBankName || p.wireAccountNumber
        case 'paypal': return p.paypalEmail
        case 'stripe': return p.stripeLink
        case 'venmo': return p.venmoUsername
        case 'zelle': return p.zelleEmail || p.zellePhone
        case 'cashapp': return p.cashAppTag
        case 'wise': return p.wiseEmail
        case 'crypto': return p.cryptoAddress
        case 'qrcode': return p.qrCodeImage || p.qrCodeData
        case 'other': return p.instructions
        default: return true
      }
    })

    const paymentQRData = computed(() => {
      const p = payment.value
      if (!p) return null
      
      // Generate payment QR data based on method
      if (p.method === 'paypal' && p.paypalEmail) {
        return `https://paypal.me/${p.paypalEmail}/${grandTotal.value}`
      }
      if (p.method === 'venmo' && p.venmoUsername) {
        return `https://venmo.com/${p.venmoUsername}`
      }
      return null
    })

    const getQRCodeUrl = (data, size = 100) => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
    }

    return {
      displayInvoice,
      displaySettings,
      displayItems,
      payment,
      formatDate,
      formatCurrency,
      calculateItemAmount,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      showConversion,
      convertedTotal,
      hasPaymentInfo,
      paymentQRData,
      getQRCodeUrl
    }
  }
}
</script>
