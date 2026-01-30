<template>
  <div class="invoice-preview-panel">
    <div class="preview-card">
      <div class="preview-header">
        <span class="preview-title">Preview</span>
        <div class="preview-actions">
          <button class="btn btn-sm btn-share" @click="shareInvoice" title="Share Invoice Link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
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

      <!-- Share Modal -->
      <div v-if="showShareModal" class="share-modal-overlay" @click.self="showShareModal = false">
        <div class="share-modal">
          <div class="share-modal-header">
            <h3>Share Invoice</h3>
            <button class="share-modal-close" @click="showShareModal = false">&times;</button>
          </div>
          <div class="share-modal-body">
            <p class="share-description">Share this link with your client. They can view and download the invoice directly.</p>
            <div class="share-link-container">
              <input type="text" :value="shareLink" readonly class="share-link-input" ref="shareLinkInput">
              <button class="btn btn-sm btn-primary" @click="copyShareLink">
                <svg v-if="!linkCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {{ linkCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <div class="share-actions">
              <a :href="'mailto:?subject=Invoice ' + invoice.number + '&body=Please view your invoice here: ' + encodeURIComponent(shareLink)" class="share-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email
              </a>
              <a :href="'https://wa.me/?text=Please view your invoice: ' + encodeURIComponent(shareLink)" target="_blank" class="share-action-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
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
                  <img :src="getQRCodeUrl(invoice.payment.qrCodeData, 120)" alt="QR Code">
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
                <img :src="getQRCodeUrl(paymentQRData, 100)" alt="Payment QR Code">
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
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'
import pako from 'pako'

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
      getQRCodeUrl,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate
    } = useInvoice()

    const invoiceRef = ref(null)
    const showShareModal = ref(false)
    const shareLink = ref('')
    const linkCopied = ref(false)
    const shareLinkInput = ref(null)

    const printInvoice = () => {
      window.print()
    }

    const generateShareLink = () => {
      try {
        // Create a clean copy of invoice and settings for sharing
        // Exclude logo if it's too large (data URLs can be huge)
        let logoToShare = invoice.logo
        if (logoToShare && logoToShare.length > 5000) {
          logoToShare = null // Skip large logos to keep URL manageable
        }

        const shareData = {
          i: { // invoice
            n: invoice.number,
            d: invoice.date,
            dd: invoice.dueDate,
            l: logoToShare,
            f: { name: invoice.from.name, email: invoice.from.email, address: invoice.from.address },
            t: { name: invoice.to.name, email: invoice.to.email, address: invoice.to.address },
            it: invoice.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              tax: item.tax
            })),
            dp: invoice.discountPercent,
            nt: invoice.notes,
            p: invoice.payment ? { ...invoice.payment } : {}
          },
          s: { // settings
            t: settings.template,
            c: settings.currency,
            ac: settings.accentColor,
            tm: settings.taxMode,
            gtr: settings.globalTaxRate,
            sd: settings.showDiscount
          }
        }

        // Compress and encode the data
        const jsonStr = JSON.stringify(shareData)
        const compressed = pako.deflate(jsonStr)
        
        // Convert Uint8Array to base64 safely (handles large arrays)
        let binary = ''
        const len = compressed.length
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(compressed[i])
        }
        const base64 = btoa(binary)
        const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

        return `${window.location.origin}${window.location.pathname}?inv=${urlSafe}`
      } catch (error) {
        console.error('Error generating share link:', error)
        return null
      }
    }

    const shareInvoice = () => {
      const link = generateShareLink()
      if (link) {
        shareLink.value = link
        linkCopied.value = false
        showShareModal.value = true
      } else {
        alert('Error generating share link. Please try again.')
      }
    }

    const copyShareLink = async () => {
      try {
        await navigator.clipboard.writeText(shareLink.value)
        linkCopied.value = true
        setTimeout(() => {
          linkCopied.value = false
        }, 2000)
      } catch (err) {
        // Fallback for older browsers
        if (shareLinkInput.value) {
          shareLinkInput.value.select()
          document.execCommand('copy')
          linkCopied.value = true
          setTimeout(() => {
            linkCopied.value = false
          }, 2000)
        }
      }
    }

    return {
      invoice,
      settings,
      isGeneratingPDF,
      invoiceRef,
      showShareModal,
      shareLink,
      linkCopied,
      shareLinkInput,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      paymentQRData,
      getQRCodeUrl,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate,
      printInvoice,
      shareInvoice,
      copyShareLink
    }
  }
}
</script>
