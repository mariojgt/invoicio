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

      <!-- Invoice Preview - Using Shared Component -->
      <div class="portal-invoice-wrapper">
        <InvoiceDisplay 
          :invoice="sharedInvoice" 
          :settings="sharedSettings"
        />
      </div>

      <!-- Footer -->
      <div class="portal-footer">
        <p>This invoice was shared via <a href="/" class="portal-link">Invoicio</a></p>
      </div>
    </div>

    <!-- Hidden PDF Template -->
    <PdfTemplate 
      ref="pdfTemplateRef" 
      :invoice="sharedInvoice" 
      :settings="sharedSettings"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import html2pdf from 'html2pdf.js'
import InvoiceDisplay from './InvoiceDisplay.vue'
import PdfTemplate from './PdfTemplate.vue'

export default {
  name: 'ClientPortal',
  components: {
    InvoiceDisplay,
    PdfTemplate
  },
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
    const pdfTemplateRef = ref(null)

    const printInvoice = () => {
      window.print()
    }

    const downloadPDF = async () => {
      if (!pdfTemplateRef.value?.$refs?.pdfRef) return

      isGeneratingPDF.value = true

      try {
        const original = pdfTemplateRef.value.$refs.pdfRef
        const clone = original.cloneNode(true)
        
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
      pdfTemplateRef,
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
  padding: 20px;
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

@media (max-width: 640px) {
  .portal-header {
    flex-direction: column;
    gap: 15px;
  }

  .portal-actions {
    width: 100%;
    justify-content: center;
  }

  .portal-invoice-wrapper {
    padding: 10px;
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
