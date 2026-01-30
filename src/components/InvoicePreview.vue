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

      <!-- Reusable Invoice Display -->
      <InvoiceDisplay 
        :invoice="invoice" 
        :settings="settings"
        :formatConvertedCurrency="formatConvertedCurrency"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useInvoice } from '../composables/useInvoice'
import InvoiceDisplay from './InvoiceDisplay.vue'
import pako from 'pako'

export default {
  name: 'InvoicePreview',
  components: {
    InvoiceDisplay
  },
  emits: ['export-pdf'],
  setup() {
    const {
      invoice,
      settings,
      isGeneratingPDF,
      formatConvertedCurrency
    } = useInvoice()

    const showShareModal = ref(false)
    const shareLink = ref('')
    const linkCopied = ref(false)
    const shareLinkInput = ref(null)
    const logoExcluded = ref(false)

    const printInvoice = () => {
      window.print()
    }

    const generateShareLink = () => {
      try {
        // Create a clean copy of invoice and settings for sharing
        // If logo is too large, use initials instead
        let logoToShare = invoice.logo
        let initialsToShare = null
        logoExcluded.value = false
        
        if (logoToShare && logoToShare.length > 5000) {
          logoToShare = null // Skip large logos to keep URL manageable
          logoExcluded.value = true
          // Generate initials from company name
          if (invoice.from?.name) {
            initialsToShare = invoice.from.name
              .split(' ')
              .map(word => word.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
          }
        }

        const shareData = {
          i: { // invoice
            n: invoice.number,
            d: invoice.date,
            dd: invoice.dueDate,
            l: logoToShare,
            ini: initialsToShare, // initials fallback
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
      showShareModal,
      shareLink,
      linkCopied,
      shareLinkInput,
      formatConvertedCurrency,
      printInvoice,
      shareInvoice,
      copyShareLink
    }
  }
}
</script>
