<template>
  <div class="app-container">
    <AppHeader
      @load="loadInvoice"
      @save="saveInvoice"
      @toggle-settings="toggleSettings"
    />

    <main class="main-content">
      <div class="invoice-layout">
        <div class="invoice-builder">
          <InvoiceDetails />
          <InvoiceParties />
          <InvoiceItems />
          <InvoicePayment />
        </div>

        <InvoicePreview @export-pdf="exportPDF" />
      </div>
    </main>

    <SettingsPanel
      :isOpen="showSettings"
      @close="toggleSettings"
      @export-settings="exportSettings"
      @import-settings="triggerImportSettings"
    />

    <PdfTemplate ref="pdfTemplateRef" />

    <!-- Hidden File Inputs -->
    <input
      ref="loadInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleLoadInvoice"
    >
    <input
      ref="settingsInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleImportSettings"
    >
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import html2pdf from 'html2pdf.js'
import { useInvoice } from './composables/useInvoice'
import AppHeader from './components/AppHeader.vue'
import InvoiceDetails from './components/InvoiceDetails.vue'
import InvoiceParties from './components/InvoiceParties.vue'
import InvoiceItems from './components/InvoiceItems.vue'
import InvoicePayment from './components/InvoicePayment.vue'
import InvoicePreview from './components/InvoicePreview.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import PdfTemplate from './components/PdfTemplate.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    InvoiceDetails,
    InvoiceParties,
    InvoiceItems,
    InvoicePayment,
    InvoicePreview,
    SettingsPanel,
    PdfTemplate
  },
  setup() {
    const { invoice, settings, isGeneratingPDF, loadFromStorage, setupAutoSave } = useInvoice()

    const showSettings = ref(false)
    const loadInput = ref(null)
    const settingsInput = ref(null)
    const pdfTemplateRef = ref(null)

    onMounted(() => {
      loadFromStorage()
      setupAutoSave()
    })

    const toggleSettings = () => {
      showSettings.value = !showSettings.value
    }

    const saveInvoice = () => {
      const data = {
        invoice: { ...invoice },
        settings: { ...settings },
        exportDate: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.number || 'export'}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    const loadInvoice = () => {
      loadInput.value.click()
    }

    const handleLoadInvoice = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (data.invoice) {
              Object.assign(invoice, data.invoice)
            }
            if (data.settings) {
              Object.assign(settings, data.settings)
            }
            alert('Invoice loaded successfully!')
          } catch (err) {
            alert('Error loading file. Please make sure it\'s a valid JSON file.')
          }
        }
        reader.readAsText(file)
      }
      loadInput.value.value = ''
    }

    const exportSettings = () => {
      const data = {
        settings: { ...settings },
        exportDate: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoicio-settings.json'
      a.click()
      URL.revokeObjectURL(url)
    }

    const triggerImportSettings = () => {
      settingsInput.value.click()
    }

    const handleImportSettings = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (data.settings) {
              Object.assign(settings, data.settings)
              alert('Settings imported successfully!')
            }
          } catch (err) {
            alert('Error loading file. Please make sure it\'s a valid JSON file.')
          }
        }
        reader.readAsText(file)
      }
      settingsInput.value.value = ''
    }

    const exportPDF = async () => {
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

        const pdfContent = clone.querySelector('.pdf-page')
        if (pdfContent) {
          pdfContent.style.width = '595px'
          pdfContent.style.height = '842px'
          pdfContent.style.overflow = 'hidden'
        }

        const opt = {
          margin: 0,
          filename: `${invoice.number || 'invoice'}.pdf`,
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

        await html2pdf().set(opt).from(pdfContent || clone).toPdf().get('pdf').then((pdf) => {
          // Remove any extra pages
          while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages())
          }
        }).save()

        document.body.removeChild(clone)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again.')
        const clones = document.querySelectorAll('.pdf-template')
        clones.forEach(c => {
          if (c.style.position === 'fixed') {
            document.body.removeChild(c)
          }
        })
      } finally {
        isGeneratingPDF.value = false
      }
    }

    return {
      showSettings,
      loadInput,
      settingsInput,
      pdfTemplateRef,
      toggleSettings,
      saveInvoice,
      loadInvoice,
      handleLoadInvoice,
      exportSettings,
      triggerImportSettings,
      handleImportSettings,
      exportPDF
    }
  }
}
</script>
