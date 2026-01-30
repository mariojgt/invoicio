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
        <div ref="invoiceRef" class="preview-wrapper">
          <component
            v-if="invoice && settings"
            :is="currentTemplate"
            :key="settings?.template || 'classic'"
            :invoice="invoice"
            :accentColor="settings?.accentColor || '#4f46e5'"
            :taxMode="settings?.taxMode || 'global'"
            :showDiscount="settings?.showDiscount || true"
            :showConversion="settings?.showConversion || false"
            :convertToCurrency="settings?.convertToCurrency || 'USD'"
            :subtotal="subtotal"
            :totalTax="totalTax"
            :discountAmount="discountAmount"
            :grandTotal="grandTotal"
            :hasPaymentInfo="hasPaymentInfo"
            :calculateItemAmount="calculateItemAmount"
            :formatCurrency="formatCurrency"
            :formatConvertedCurrency="formatConvertedCurrency"
            :formatDate="formatDate"
          >
            <template #payment-content>
              <PaymentContent
                :payment="invoice?.payment || {}"
                :paymentQRData="paymentQRData"
                :getQRCodeUrl="getQRCodeUrl"
              />
            </template>
          </component>
          <div v-else class="loading-message">Loading preview...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'
import ClassicTemplate from './templates/ClassicTemplate.vue'
import ModernTemplate from './templates/ModernTemplate.vue'
import MinimalTemplate from './templates/MinimalTemplate.vue'
import BoldTemplate from './templates/BoldTemplate.vue'
import PaymentContent from './templates/PaymentContent.vue'

export default {
  name: 'InvoicePreview',
  emits: ['export-pdf'],
  components: {
    ClassicTemplate,
    ModernTemplate,
    MinimalTemplate,
    BoldTemplate,
    PaymentContent
  },
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

    const currentTemplate = computed(() => {
      const templateMap = {
        'classic': 'ClassicTemplate',
        'modern': 'ModernTemplate',
        'minimal': 'MinimalTemplate',
        'bold': 'BoldTemplate'
      }
      return templateMap[settings?.template] || 'ClassicTemplate'
    })

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
      getQRCodeUrl,
      calculateItemAmount,
      formatCurrency,
      formatConvertedCurrency,
      formatDate,
      currentTemplate,
      printInvoice
    }
  }
}
</script>

<style scoped>
.preview-wrapper {
  transform: scale(0.95);
  transform-origin: top center;
  margin: 0 auto;
  width: 595px;
  min-height: 500px;
}

.preview-wrapper > * {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
}
</style>
