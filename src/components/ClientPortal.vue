<template>
  <div class="client-portal">
    <div class="portal-container">
      <!-- Header -->
      <div class="portal-header">
        <div class="portal-branding">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>Invoice</span>
        </div>
        <div class="portal-actions">
          <button class="btn btn-primary" @click="downloadPDF" :disabled="isGeneratingPDF">
            <svg v-if="!isGeneratingPDF" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span v-if="isGeneratingPDF" class="loading-spinner"></span>
            {{ isGeneratingPDF ? 'Generating...' : 'Download PDF' }}
          </button>
          <button class="btn btn-secondary" @click="printInvoice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>

      <!-- Invoice Preview -->
      <div class="portal-invoice-wrapper">
        <div class="portal-invoice" :class="'portal-template-' + sharedSettings.template" :style="{ '--accent': sharedSettings.accentColor, '--accent-color': sharedSettings.accentColor }">
          <!-- Invoice Header -->
          <div class="portal-invoice-header">
            <div class="portal-logo-section">
              <img v-if="sharedInvoice.logo" :src="sharedInvoice.logo" class="portal-logo" alt="Logo">
            </div>
            <div class="portal-title-section">
              <h1 :style="{ color: sharedSettings.accentColor }">INVOICE</h1>
              <div class="portal-meta">
                <div class="portal-invoice-number">{{ sharedInvoice.number || 'INV-001' }}</div>
                <div>Date: {{ formatDate(sharedInvoice.date) }}</div>
                <div v-if="sharedInvoice.dueDate">Due: {{ formatDate(sharedInvoice.dueDate) }}</div>
              </div>
            </div>
          </div>

          <!-- Parties -->
          <div class="portal-parties">
            <div class="portal-party">
              <h4>From</h4>
              <div class="portal-party-name">{{ sharedInvoice.from?.name || 'Company' }}</div>
              <div v-if="sharedInvoice.from?.email">{{ sharedInvoice.from.email }}</div>
              <div class="portal-party-address">{{ sharedInvoice.from?.address }}</div>
            </div>
            <div class="portal-party">
              <h4>Bill To</h4>
              <div class="portal-party-name">{{ sharedInvoice.to?.name || 'Client' }}</div>
              <div v-if="sharedInvoice.to?.email">{{ sharedInvoice.to.email }}</div>
              <div class="portal-party-address">{{ sharedInvoice.to?.address }}</div>
            </div>
          </div>

          <!-- Items Table -->
          <table class="portal-items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th v-if="sharedSettings.taxMode === 'per-item'" class="text-right">Tax</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in sharedInvoice.items" :key="index">
                <td>{{ item.description || 'Item ' + (index + 1) }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">{{ formatCurrency(item.price) }}</td>
                <td v-if="sharedSettings.taxMode === 'per-item'" class="text-right">{{ item.tax }}%</td>
                <td class="text-right font-medium">{{ formatCurrency(calculateItemAmount(item)) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div class="portal-totals">
            <div class="portal-totals-table">
              <div class="portal-totals-row">
                <span>Subtotal</span>
                <span>{{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="portal-totals-row">
                <span>Tax</span>
                <span>{{ formatCurrency(totalTax) }}</span>
              </div>
              <div v-if="sharedSettings.showDiscount && sharedInvoice.discountPercent > 0" class="portal-totals-row">
                <span>Discount ({{ sharedInvoice.discountPercent }}%)</span>
                <span>-{{ formatCurrency(discountAmount) }}</span>
              </div>
              <div class="portal-totals-row portal-total-final" :style="{ color: sharedSettings.accentColor }">
                <span>Total</span>
                <span>{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div v-if="hasPaymentInfo" class="portal-payment">
            <h4>Payment Information</h4>
            
            <!-- Bank Transfer -->
            <div v-if="sharedInvoice.payment?.method === 'bank'" class="portal-payment-details">
              <div v-if="sharedInvoice.payment.bankName"><span class="label">Bank:</span> {{ sharedInvoice.payment.bankName }}</div>
              <div v-if="sharedInvoice.payment.accountName"><span class="label">Account:</span> {{ sharedInvoice.payment.accountName }}</div>
              <div v-if="sharedInvoice.payment.accountNumber"><span class="label">Number:</span> {{ sharedInvoice.payment.accountNumber }}</div>
              <div v-if="sharedInvoice.payment.routingNumber"><span class="label">Routing:</span> {{ sharedInvoice.payment.routingNumber }}</div>
              <div v-if="sharedInvoice.payment.swiftBic"><span class="label">SWIFT/BIC:</span> {{ sharedInvoice.payment.swiftBic }}</div>
            </div>

            <!-- Wire Transfer -->
            <div v-else-if="sharedInvoice.payment?.method === 'wire'" class="portal-payment-details">
              <div v-if="sharedInvoice.payment.wireBankName"><span class="label">Bank:</span> {{ sharedInvoice.payment.wireBankName }}</div>
              <div v-if="sharedInvoice.payment.wireBankAddress"><span class="label">Bank Address:</span> {{ sharedInvoice.payment.wireBankAddress }}</div>
              <div v-if="sharedInvoice.payment.wireAccountNumber"><span class="label">Account/IBAN:</span> {{ sharedInvoice.payment.wireAccountNumber }}</div>
              <div v-if="sharedInvoice.payment.wireRoutingNumber"><span class="label">Routing/ABA:</span> {{ sharedInvoice.payment.wireRoutingNumber }}</div>
              <div v-if="sharedInvoice.payment.wireSwiftBic"><span class="label">SWIFT/BIC:</span> {{ sharedInvoice.payment.wireSwiftBic }}</div>
              <div v-if="sharedInvoice.payment.wireReference"><span class="label">Reference:</span> {{ sharedInvoice.payment.wireReference }}</div>
            </div>

            <!-- PayPal -->
            <div v-else-if="sharedInvoice.payment?.method === 'paypal'" class="portal-payment-details">
              <div><span class="label">PayPal:</span> {{ sharedInvoice.payment.paypalEmail }}</div>
            </div>

            <!-- Stripe -->
            <div v-else-if="sharedInvoice.payment?.method === 'stripe'" class="portal-payment-details">
              <div><span class="label">Pay via Stripe:</span> <a :href="sharedInvoice.payment.stripeLink" target="_blank" class="payment-link">{{ sharedInvoice.payment.stripeLink }}</a></div>
            </div>

            <!-- Venmo -->
            <div v-else-if="sharedInvoice.payment?.method === 'venmo'" class="portal-payment-details">
              <div><span class="label">Venmo:</span> @{{ sharedInvoice.payment.venmoUsername }}</div>
            </div>

            <!-- Zelle -->
            <div v-else-if="sharedInvoice.payment?.method === 'zelle'" class="portal-payment-details">
              <div v-if="sharedInvoice.payment.zelleEmail"><span class="label">Zelle Email:</span> {{ sharedInvoice.payment.zelleEmail }}</div>
              <div v-if="sharedInvoice.payment.zellePhone"><span class="label">Zelle Phone:</span> {{ sharedInvoice.payment.zellePhone }}</div>
            </div>

            <!-- Cash App -->
            <div v-else-if="sharedInvoice.payment?.method === 'cashapp'" class="portal-payment-details">
              <div><span class="label">Cash App:</span> ${{ sharedInvoice.payment.cashAppTag }}</div>
            </div>

            <!-- Wise -->
            <div v-else-if="sharedInvoice.payment?.method === 'wise'" class="portal-payment-details">
              <div><span class="label">Wise:</span> {{ sharedInvoice.payment.wiseEmail }}</div>
            </div>

            <!-- Crypto -->
            <div v-else-if="sharedInvoice.payment?.method === 'crypto'" class="portal-payment-details">
              <div><span class="label">{{ sharedInvoice.payment.cryptoType }}:</span></div>
              <div class="crypto-address">{{ sharedInvoice.payment.cryptoAddress }}</div>
              <div v-if="sharedInvoice.payment.cryptoNetwork"><span class="label">Network:</span> {{ sharedInvoice.payment.cryptoNetwork }}</div>
            </div>

            <!-- QR Code -->
            <div v-else-if="sharedInvoice.payment?.method === 'qrcode'" class="portal-payment-details">
              <div v-if="sharedInvoice.payment.qrCodeImage" class="qr-display">
                <img :src="sharedInvoice.payment.qrCodeImage" alt="Payment QR Code" class="qr-image">
              </div>
              <div v-else-if="sharedInvoice.payment.qrCodeData">
                <div class="qr-generated">
                  <img :src="getQRCodeUrl(sharedInvoice.payment.qrCodeData, 120)" alt="QR Code">
                </div>
                <div class="qr-link">{{ sharedInvoice.payment.qrCodeData }}</div>
              </div>
            </div>

            <!-- Card -->
            <div v-else-if="sharedInvoice.payment?.method === 'card'" class="portal-payment-details">
              <div>Payment Method: Credit Card</div>
            </div>

            <!-- Cash -->
            <div v-else-if="sharedInvoice.payment?.method === 'cash'" class="portal-payment-details">
              <div>Payment Method: Cash</div>
            </div>

            <!-- Other -->
            <div v-else-if="sharedInvoice.payment?.method === 'other'" class="portal-payment-details">
              <div class="custom-instructions">{{ sharedInvoice.payment.instructions }}</div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="sharedInvoice.notes" class="portal-notes">
            <strong>Notes:</strong> {{ sharedInvoice.notes }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="portal-footer">
        <p>This invoice was shared via <a href="/" class="portal-link">Invoicio</a></p>
      </div>
    </div>

    <!-- Hidden PDF Template -->
    <div ref="pdfRef" class="pdf-template" :class="'template-' + sharedSettings.template">
      <div class="pdf-page" :style="{ '--accent': sharedSettings.accentColor }">
        <!-- Header -->
        <div class="pdf-header">
          <div class="pdf-logo-section">
            <img v-if="sharedInvoice.logo" :src="sharedInvoice.logo" class="pdf-logo" alt="Logo">
          </div>
          <div class="pdf-title-section">
            <div class="pdf-title" :style="{ color: sharedSettings.accentColor }">INVOICE</div>
            <div class="pdf-invoice-number">{{ sharedInvoice.number || 'INV-001' }}</div>
            <div class="pdf-meta">Date: {{ formatDate(sharedInvoice.date) }}</div>
            <div v-if="sharedInvoice.dueDate" class="pdf-meta">Due: {{ formatDate(sharedInvoice.dueDate) }}</div>
          </div>
        </div>

        <!-- From / Bill To -->
        <div class="pdf-parties">
          <div class="pdf-party">
            <div class="pdf-party-label">From</div>
            <div class="pdf-party-name">{{ sharedInvoice.from?.name || 'Your Company' }}</div>
            <div v-if="sharedInvoice.from?.email" class="pdf-party-detail">{{ sharedInvoice.from.email }}</div>
            <div class="pdf-party-detail" style="white-space: pre-line;">{{ sharedInvoice.from?.address }}</div>
          </div>
          <div class="pdf-party">
            <div class="pdf-party-label">Bill To</div>
            <div class="pdf-party-name">{{ sharedInvoice.to?.name || 'Client Name' }}</div>
            <div v-if="sharedInvoice.to?.email" class="pdf-party-detail">{{ sharedInvoice.to.email }}</div>
            <div class="pdf-party-detail" style="white-space: pre-line;">{{ sharedInvoice.to?.address }}</div>
          </div>
        </div>

        <!-- Items Table -->
        <table class="pdf-items-table">
          <thead>
            <tr>
              <th style="text-align: left;">Description</th>
              <th style="text-align: right; width: 60px;">Qty</th>
              <th style="text-align: right; width: 80px;">Price</th>
              <th v-if="sharedSettings.taxMode === 'per-item'" style="text-align: right; width: 60px;">Tax</th>
              <th style="text-align: right; width: 90px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in sharedInvoice.items" :key="'pdf-item-'+index">
              <td>{{ item.description || 'Item ' + (index + 1) }}</td>
              <td style="text-align: right;">{{ item.quantity }}</td>
              <td style="text-align: right;">{{ formatCurrency(item.price) }}</td>
              <td v-if="sharedSettings.taxMode === 'per-item'" style="text-align: right;">{{ item.tax }}%</td>
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
            <div v-if="sharedSettings.showDiscount && sharedInvoice.discountPercent > 0" class="pdf-totals-row">
              <span>Discount ({{ sharedInvoice.discountPercent }}%)</span>
              <span>-{{ formatCurrency(discountAmount) }}</span>
            </div>
            <div class="pdf-totals-row pdf-total-final" :style="{ color: sharedSettings.accentColor }">
              <span>Total</span>
              <span>{{ formatCurrency(grandTotal) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div v-if="hasPaymentInfo" class="pdf-payment">
          <div class="pdf-payment-label">Payment Information</div>
          <div class="pdf-payment-detail">
            <template v-if="sharedInvoice.payment?.method === 'bank'">
              <div v-if="sharedInvoice.payment.bankName">Bank: {{ sharedInvoice.payment.bankName }}</div>
              <div v-if="sharedInvoice.payment.accountName">Account: {{ sharedInvoice.payment.accountName }}</div>
              <div v-if="sharedInvoice.payment.accountNumber">Number: {{ sharedInvoice.payment.accountNumber }}</div>
              <div v-if="sharedInvoice.payment.routingNumber">Routing: {{ sharedInvoice.payment.routingNumber }}</div>
              <div v-if="sharedInvoice.payment.swiftBic">SWIFT/BIC: {{ sharedInvoice.payment.swiftBic }}</div>
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'paypal'">
              PayPal: {{ sharedInvoice.payment.paypalEmail }}
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'venmo'">
              Venmo: @{{ sharedInvoice.payment.venmoUsername }}
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'zelle'">
              <div v-if="sharedInvoice.payment.zelleEmail">Zelle Email: {{ sharedInvoice.payment.zelleEmail }}</div>
              <div v-if="sharedInvoice.payment.zellePhone">Zelle Phone: {{ sharedInvoice.payment.zellePhone }}</div>
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'cashapp'">
              Cash App: ${{ sharedInvoice.payment.cashAppTag }}
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'wise'">
              Wise: {{ sharedInvoice.payment.wiseEmail }}
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'crypto'">
              <div>{{ sharedInvoice.payment.cryptoType }}: {{ sharedInvoice.payment.cryptoAddress }}</div>
              <div v-if="sharedInvoice.payment.cryptoNetwork">Network: {{ sharedInvoice.payment.cryptoNetwork }}</div>
            </template>
            <template v-else-if="sharedInvoice.payment?.method === 'other'">
              {{ sharedInvoice.payment.instructions }}
            </template>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="sharedInvoice.notes" class="pdf-notes">
          <strong>Notes:</strong> {{ sharedInvoice.notes }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import html2pdf from 'html2pdf.js'

export default {
  name: 'ClientPortal',
  props: {
    sharedInvoice: {
      type: Object,
      required: true
    },
    sharedSettings: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const isGeneratingPDF = ref(false)
    const pdfRef = ref(null)

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const formatCurrency = (amount) => {
      const currency = props.sharedSettings.currency || 'USD'
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount || 0)
    }

    const calculateItemAmount = (item) => {
      const base = item.quantity * item.price
      if (props.sharedSettings.taxMode === 'per-item') {
        return base + (base * (item.tax || 0) / 100)
      }
      return base
    }

    const subtotal = computed(() => {
      return (props.sharedInvoice.items || []).reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)
    })

    const totalTax = computed(() => {
      if (props.sharedSettings.taxMode === 'total') {
        return subtotal.value * (props.sharedSettings.globalTaxRate / 100)
      } else {
        return (props.sharedInvoice.items || []).reduce((sum, item) => {
          const itemSubtotal = item.quantity * item.price
          return sum + (itemSubtotal * (item.tax / 100))
        }, 0)
      }
    })

    const discountAmount = computed(() => {
      if (!props.sharedSettings.showDiscount || !props.sharedInvoice.discountPercent) return 0
      return (subtotal.value + totalTax.value) * (props.sharedInvoice.discountPercent / 100)
    })

    const grandTotal = computed(() => {
      return subtotal.value + totalTax.value - discountAmount.value
    })

    const hasPaymentInfo = computed(() => {
      const p = props.sharedInvoice.payment
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

    const getQRCodeUrl = (data, size = 100) => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
    }

    const printInvoice = () => {
      window.print()
    }

    const downloadPDF = async () => {
      if (!pdfRef.value) return

      isGeneratingPDF.value = true

      try {
        const clone = pdfRef.value.cloneNode(true)
        clone.style.position = 'fixed'
        clone.style.left = '0'
        clone.style.top = '0'
        clone.style.zIndex = '99999'
        clone.style.background = 'white'
        clone.style.width = '595px'

        document.body.appendChild(clone)

        await new Promise(resolve => setTimeout(resolve, 300))

        const opt = {
          margin: 0,
          filename: `${props.sharedInvoice.number || 'invoice'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: 595,
            height: 842,
            windowWidth: 595
          },
          jsPDF: {
            unit: 'pt',
            format: [595.28, 841.89],
            orientation: 'portrait'
          },
          pagebreak: { mode: 'avoid-all' }
        }

        await html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
          while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages())
          }
        }).save()

        document.body.removeChild(clone)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again.')
      } finally {
        isGeneratingPDF.value = false
      }
    }

    return {
      isGeneratingPDF,
      pdfRef,
      formatDate,
      formatCurrency,
      calculateItemAmount,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      getQRCodeUrl,
      printInvoice,
      downloadPDF
    }
  }
}
</script>

<style scoped>
.client-portal {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.portal-container {
  max-width: 800px;
  margin: 0 auto;
}

.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.portal-branding {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #4f46e5;
}

.portal-actions {
  display: flex;
  gap: 10px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.portal-invoice-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.portal-invoice {
  padding: 40px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.portal-invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.portal-logo {
  max-width: 150px;
  max-height: 60px;
  object-fit: contain;
}

.portal-title-section {
  text-align: right;
}

.portal-title-section h1 {
  font-size: 28px;
  margin: 0 0 8px 0;
}

.portal-meta {
  color: #6b7280;
  font-size: 14px;
}

.portal-invoice-number {
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.portal-parties {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.portal-party h4 {
  font-size: 11px;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.portal-party-name {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
  margin-bottom: 4px;
}

.portal-party-address {
  white-space: pre-line;
  color: #6b7280;
  line-height: 1.5;
}

.portal-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
}

.portal-items-table th {
  background: #f9fafb;
  padding: 12px 15px;
  font-size: 11px;
  text-transform: uppercase;
  color: #6b7280;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.portal-items-table th:first-child {
  text-align: left;
}

.portal-items-table td {
  padding: 15px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.text-right {
  text-align: right;
}

.font-medium {
  font-weight: 500;
}

.portal-totals {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 25px;
}

.portal-totals-table {
  width: 250px;
}

.portal-totals-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #6b7280;
}

.portal-total-final {
  border-top: 2px solid #111827;
  margin-top: 8px;
  padding-top: 12px;
  font-size: 18px;
  font-weight: 700;
}

.portal-payment {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.portal-payment h4 {
  font-size: 11px;
  text-transform: uppercase;
  color: #9ca3af;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.portal-payment-details {
  font-size: 14px;
  line-height: 1.6;
}

.portal-payment-details .label {
  color: #6b7280;
}

.payment-link {
  color: #4f46e5;
  text-decoration: none;
}

.payment-link:hover {
  text-decoration: underline;
}

.crypto-address {
  font-family: monospace;
  font-size: 12px;
  background: #e5e7eb;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  margin: 8px 0;
}

.qr-image {
  max-width: 120px;
  border-radius: 8px;
}

.qr-link {
  font-size: 12px;
  color: #9ca3af;
  word-break: break-all;
  margin-top: 8px;
}

.portal-notes {
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.portal-notes strong {
  color: #374151;
}

.portal-footer {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.portal-link {
  color: white;
  font-weight: 500;
}

/* Template Variations */
.portal-template-modern .portal-invoice-header {
  background: var(--accent, #4f46e5);
  color: white;
  margin: -40px -40px 30px -40px;
  padding: 30px 40px;
  border-bottom: none;
}

.portal-template-modern .portal-title-section h1 {
  color: white !important;
}

.portal-template-modern .portal-meta,
.portal-template-modern .portal-invoice-number {
  color: rgba(255, 255, 255, 0.9);
}

.portal-template-modern .portal-items-table th {
  background: var(--accent, #4f46e5);
  color: white;
}

.portal-template-minimal .portal-invoice-header {
  border-bottom: 1px solid #e5e7eb;
}

.portal-template-minimal .portal-title-section h1 {
  font-weight: 300;
  letter-spacing: 4px;
}

.portal-template-minimal .portal-items-table th {
  background: transparent;
  border-bottom: 1px solid #e5e7eb;
}

.portal-template-bold .portal-invoice {
  border: 3px solid var(--accent, #4f46e5);
}

.portal-template-bold .portal-invoice-header {
  border-bottom: 3px solid var(--accent, #4f46e5);
}

.portal-template-bold .portal-title-section h1 {
  text-transform: uppercase;
  letter-spacing: 2px;
}

.portal-template-bold .portal-party h4 {
  background: var(--accent, #4f46e5);
  color: white;
  padding: 4px 10px;
  display: inline-block;
}

@media (max-width: 640px) {
  .portal-header {
    flex-direction: column;
    gap: 15px;
  }

  .portal-actions {
    width: 100%;
    justify-content: center;
  }

  .portal-invoice {
    padding: 20px;
  }

  .portal-parties {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .portal-invoice-header {
    flex-direction: column;
    gap: 15px;
  }

  .portal-title-section {
    text-align: left;
  }
}

@media print {
  .client-portal {
    background: white;
    padding: 0;
  }

  .portal-header,
  .portal-footer {
    display: none;
  }

  .portal-invoice-wrapper {
    box-shadow: none;
  }
}
</style>
