<template>
  <div ref="pdfRef" class="pdf-wrapper">
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
  </div>
</template>

<script>
import { computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'
import ClassicTemplate from './templates/ClassicTemplate.vue'
import ModernTemplate from './templates/ModernTemplate.vue'
import MinimalTemplate from './templates/MinimalTemplate.vue'
import BoldTemplate from './templates/BoldTemplate.vue'
import PaymentContent from './templates/PaymentContent.vue'

export default {
  name: 'PdfTemplate',
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

    const currentTemplate = computed(() => {
      const templateMap = {
        'classic': 'ClassicTemplate',
        'modern': 'ModernTemplate',
        'minimal': 'MinimalTemplate',
        'bold': 'BoldTemplate'
      }
      return templateMap[settings?.template] || 'ClassicTemplate'
    })

    return {
      invoice,
      settings,
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
      currentTemplate
    }
  }
}
</script>

<style scoped>
.pdf-wrapper {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: -1;
}
</style>
