<template>
  <div ref="pdfRef" class="pdf-template" :class="'template-' + displaySettings.template">
    <div class="pdf-page" :style="{ '--accent': displaySettings.accentColor }">
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-logo-section">
          <img v-if="displayInvoice.logo" :src="displayInvoice.logo" class="pdf-logo" alt="Logo">
          <div v-else-if="displayInvoice.initials" class="pdf-logo-initials" :style="{ backgroundColor: displaySettings.accentColor }">
            {{ displayInvoice.initials }}
          </div>
        </div>
        <div class="pdf-title-section">
          <div class="pdf-title" :style="{ color: displaySettings.accentColor }">INVOICE</div>
          <div class="pdf-invoice-number">{{ displayInvoice.number || 'INV-001' }}</div>
          <div class="pdf-meta">Date: {{ formatDate(displayInvoice.date) }}</div>
          <div v-if="displayInvoice.dueDate" class="pdf-meta">Due: {{ formatDate(displayInvoice.dueDate) }}</div>
        </div>
      </div>

      <!-- From / Bill To -->
      <div class="pdf-parties">
        <div class="pdf-party">
          <div class="pdf-party-label">From</div>
          <div class="pdf-party-name">{{ displayInvoice.from?.name || 'Your Company' }}</div>
          <div v-if="displayInvoice.from?.email" class="pdf-party-detail">{{ displayInvoice.from.email }}</div>
          <div class="pdf-party-detail" style="white-space: pre-line;">{{ displayInvoice.from?.address }}</div>
        </div>
        <div class="pdf-party">
          <div class="pdf-party-label">Bill To</div>
          <div class="pdf-party-name">{{ displayInvoice.to?.name || 'Client Name' }}</div>
          <div v-if="displayInvoice.to?.email" class="pdf-party-detail">{{ displayInvoice.to.email }}</div>
          <div class="pdf-party-detail" style="white-space: pre-line;">{{ displayInvoice.to?.address }}</div>
        </div>
      </div>

      <!-- Items Table -->
      <table class="pdf-items-table">
        <thead>
          <tr>
            <th style="text-align: left;">Description</th>
            <th style="text-align: right; width: 60px;">Qty</th>
            <th style="text-align: right; width: 80px;">Price</th>
            <th v-if="displaySettings.taxMode === 'per-item'" style="text-align: right; width: 60px;">Tax</th>
            <th style="text-align: right; width: 90px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in displayItems" :key="'pdf-item-'+index">
            <td>{{ item.description || 'Item ' + (index + 1) }}</td>
            <td style="text-align: right;">{{ item.quantity }}</td>
            <td style="text-align: right;">{{ formatCurrency(item.price) }}</td>
            <td v-if="displaySettings.taxMode === 'per-item'" style="text-align: right;">{{ item.tax }}%</td>
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
          <div v-if="displaySettings.showDiscount && displayInvoice.discountPercent > 0" class="pdf-totals-row">
            <span>Discount ({{ displayInvoice.discountPercent }}%)</span>
            <span>-{{ formatCurrency(discountAmount) }}</span>
          </div>
          <div class="pdf-totals-row pdf-total-final" :style="{ color: displaySettings.accentColor }">
            <span>Total</span>
            <span>{{ formatCurrency(grandTotal) }}</span>
          </div>
          <div v-if="displaySettings.showConversion && convertedTotal" class="pdf-totals-row pdf-converted">
            <span>≈ {{ displaySettings.convertToCurrency }}</span>
            <span>{{ convertedTotal }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Info -->
      <div v-if="hasPaymentInfo" class="pdf-payment">
        <div class="pdf-payment-label">Payment Information</div>

        <!-- Bank Transfer -->
        <div v-if="payment.method === 'bank'" class="pdf-payment-detail">
          <div v-if="payment.bankName">Bank: {{ payment.bankName }}</div>
          <div v-if="payment.accountName">Account: {{ payment.accountName }}</div>
          <div v-if="payment.accountNumber">Number: {{ payment.accountNumber }}</div>
          <div v-if="payment.routingNumber">Routing: {{ payment.routingNumber }}</div>
          <div v-if="payment.swiftBic">SWIFT/BIC: {{ payment.swiftBic }}</div>
        </div>

        <!-- Wire Transfer -->
        <div v-else-if="payment.method === 'wire'" class="pdf-payment-detail">
          <div v-if="payment.wireBankName">Bank: {{ payment.wireBankName }}</div>
          <div v-if="payment.wireBankAddress">Bank Address: {{ payment.wireBankAddress }}</div>
          <div v-if="payment.wireAccountNumber">Account/IBAN: {{ payment.wireAccountNumber }}</div>
          <div v-if="payment.wireRoutingNumber">Routing/ABA: {{ payment.wireRoutingNumber }}</div>
          <div v-if="payment.wireSwiftBic">SWIFT/BIC: {{ payment.wireSwiftBic }}</div>
          <div v-if="payment.wireReference">Reference: {{ payment.wireReference }}</div>
        </div>

        <!-- PayPal -->
        <div v-else-if="payment.method === 'paypal'" class="pdf-payment-detail">
          PayPal: {{ payment.paypalEmail }}
        </div>

        <!-- Stripe -->
        <div v-else-if="payment.method === 'stripe'" class="pdf-payment-detail">
          Pay via Stripe: {{ payment.stripeLink }}
        </div>

        <!-- Venmo -->
        <div v-else-if="payment.method === 'venmo'" class="pdf-payment-detail">
          Venmo: @{{ payment.venmoUsername }}
        </div>

        <!-- Zelle -->
        <div v-else-if="payment.method === 'zelle'" class="pdf-payment-detail">
          <div v-if="payment.zelleEmail">Zelle Email: {{ payment.zelleEmail }}</div>
          <div v-if="payment.zellePhone">Zelle Phone: {{ payment.zellePhone }}</div>
        </div>

        <!-- Cash App -->
        <div v-else-if="payment.method === 'cashapp'" class="pdf-payment-detail">
          Cash App: ${{ payment.cashAppTag }}
        </div>

        <!-- Wise -->
        <div v-else-if="payment.method === 'wise'" class="pdf-payment-detail">
          Wise: {{ payment.wiseEmail }}
        </div>

        <!-- Crypto -->
        <div v-else-if="payment.method === 'crypto'" class="pdf-payment-detail">
          <div>{{ payment.cryptoType }}:</div>
          <div class="pdf-crypto-address">{{ payment.cryptoAddress }}</div>
          <div v-if="payment.cryptoNetwork">Network: {{ payment.cryptoNetwork }}</div>
        </div>

        <!-- QR Code -->
        <div v-else-if="payment.method === 'qrcode'" class="pdf-payment-detail pdf-qr-section">
          <div v-if="payment.qrCodeImage" class="pdf-qr-display">
            <img :src="payment.qrCodeImage" alt="Payment QR Code" class="pdf-qr-image">
          </div>
          <div v-else-if="payment.qrCodeData" class="pdf-qr-display">
            <img :src="getQRCodeUrl(payment.qrCodeData, 100)" alt="QR Code" class="pdf-qr-image">
            <div class="pdf-qr-link">{{ payment.qrCodeData }}</div>
          </div>
        </div>

        <!-- Card -->
        <div v-else-if="payment.method === 'card'" class="pdf-payment-detail">
          Payment Method: Credit Card
        </div>

        <!-- Cash -->
        <div v-else-if="payment.method === 'cash'" class="pdf-payment-detail">
          Payment Method: Cash
        </div>

        <!-- Other/Custom -->
        <div v-else-if="payment.method === 'other'" class="pdf-payment-detail">
          {{ payment.instructions }}
        </div>

        <!-- Payment QR Code (for any method with showPaymentQR enabled) -->
        <div v-if="payment.showPaymentQR && paymentQRData && payment.method !== 'qrcode'" class="pdf-payment-qr">
          <div class="pdf-payment-qr-label">Scan to Pay</div>
          <img :src="getQRCodeUrl(paymentQRData, 80)" alt="Payment QR" class="pdf-qr-image">
        </div>
      </div>

      <!-- Notes -->
      <div v-if="displayInvoice.notes" class="pdf-notes">
        <strong>Notes:</strong> {{ displayInvoice.notes }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'PdfTemplate',
  props: {
    invoice: {
      type: Object,
      default: null
    },
    settings: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const composable = useInvoice()

    const pdfRef = ref(null)

    // Use props if provided, otherwise fall back to composable
    const displayInvoice = computed(() => props.invoice || composable.invoice)
    const displaySettings = computed(() => props.settings || composable.settings)
    const displayItems = computed(() => displayInvoice.value?.items || [])
    const payment = computed(() => displayInvoice.value?.payment || {})

    // Calculate values based on display data
    const subtotal = computed(() => {
      if (props.invoice) {
        return displayItems.value.reduce((sum, item) => {
          const amount = (item.quantity || 0) * (item.rate || 0)
          return sum + amount
        }, 0)
      }
      return composable.subtotal.value
    })

    const totalTax = computed(() => {
      if (props.invoice) {
        return displayItems.value.reduce((sum, item) => {
          const amount = (item.quantity || 0) * (item.rate || 0)
          const taxRate = item.taxRate || 0
          return sum + (amount * taxRate / 100)
        }, 0)
      }
      return composable.totalTax.value
    })

    const discountAmount = computed(() => {
      if (props.invoice) {
        const inv = displayInvoice.value
        if (inv.discountType === 'percentage') {
          return subtotal.value * (inv.discount || 0) / 100
        }
        return inv.discount || 0
      }
      return composable.discountAmount.value
    })

    const grandTotal = computed(() => {
      return subtotal.value + totalTax.value - discountAmount.value
    })

    const hasPaymentInfo = computed(() => {
      const p = payment.value
      if (!p || !p.method) return false
      switch (p.method) {
        case 'bank':
        case 'wire':
          return p.bankName || p.accountNumber
        case 'paypal':
          return p.paypalEmail
        case 'stripe':
          return p.stripeLink
        case 'venmo':
          return p.venmoUsername
        case 'zelle':
          return p.zelleEmail || p.zellePhone
        case 'cashapp':
          return p.cashappUsername
        case 'wise':
          return p.wiseEmail
        case 'crypto':
          return p.cryptoAddress
        case 'qrcode':
          return p.qrCodeData || p.qrCodeImage
        case 'card':
        case 'cash':
          return true
        case 'other':
          return p.instructions
        default:
          return false
      }
    })

    const paymentQRData = computed(() => {
      if (props.invoice) {
        const p = payment.value
        if (p.showPaymentQR) {
          if (p.method === 'paypal' && p.paypalEmail) {
            return `https://www.paypal.com/paypalme/${p.paypalEmail}`
          }
          if (p.method === 'venmo' && p.venmoUsername) {
            return `https://venmo.com/${p.venmoUsername}`
          }
          if (p.method === 'cashapp' && p.cashappUsername) {
            return `https://cash.app/$${p.cashappUsername}`
          }
          if (p.method === 'stripe' && p.stripeLink) {
            return p.stripeLink
          }
        }
        return null
      }
      return composable.paymentQRData.value
    })

    const calculateItemAmount = (item) => {
      return (item.quantity || 0) * (item.rate || 0)
    }

    const formatCurrency = (amount) => {
      const currency = displaySettings.value?.currency || 'USD'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount || 0)
    }

    const formatConvertedCurrency = (amount, convertedCurrency) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: convertedCurrency || 'EUR'
      }).format(amount || 0)
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    return {
      pdfRef,
      displayInvoice,
      displaySettings,
      displayItems,
      payment,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      paymentQRData,
      getQRCodeUrl: composable.getQRCodeUrl,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate
    }
  }
}
</script>
