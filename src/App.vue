<template>
  <div class="app-container">
    <AppHeader
      @load="loadInvoice"
      @save="saveInvoice"
      @toggle-settings="toggleSettings"
      @open-clients="showClientDatabase = true"
      @open-catalog="showItemCatalog = true"
      @open-history="showInvoiceHistory = true"
      @open-dashboard="showDashboard = true"
      @open-templates="showEmailTemplates = true"
    />

    <main class="main-content">
      <div class="invoice-layout">
        <div class="invoice-builder">
          <InvoiceDetails />
          <InvoiceParties @open-clients="showClientDatabase = true" />
          <InvoiceItems @open-catalog="showItemCatalog = true" />
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

    <ClientDatabase
      :isOpen="showClientDatabase"
      @close="showClientDatabase = false"
    />

    <ItemCatalog
      :isOpen="showItemCatalog"
      @close="showItemCatalog = false"
    />

    <InvoiceHistory
      :isOpen="showInvoiceHistory"
      @close="showInvoiceHistory = false"
    />

    <Dashboard
      :isOpen="showDashboard"
      @close="showDashboard = false"
    />

    <EmailTemplates
      :isOpen="showEmailTemplates"
      @close="showEmailTemplates = false"
    />

    <PdfTemplate ref="pdfTemplateRef" />

    <AppFooter />

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
import AppFooter from './components/AppFooter.vue'
import InvoiceDetails from './components/InvoiceDetails.vue'
import InvoiceParties from './components/InvoiceParties.vue'
import InvoiceItems from './components/InvoiceItems.vue'
import InvoicePayment from './components/InvoicePayment.vue'
import InvoicePreview from './components/InvoicePreview.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import ClientDatabase from './components/ClientDatabase.vue'
import ItemCatalog from './components/ItemCatalog.vue'
import InvoiceHistory from './components/InvoiceHistory.vue'
import Dashboard from './components/Dashboard.vue'
import EmailTemplates from './components/EmailTemplates.vue'
import PdfTemplate from './components/PdfTemplate.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter,
    InvoiceDetails,
    InvoiceParties,
    InvoiceItems,
    InvoicePayment,
    InvoicePreview,
    SettingsPanel,
    ClientDatabase,
    ItemCatalog,
    InvoiceHistory,
    Dashboard,
    EmailTemplates,
    PdfTemplate
  },
  setup() {
    const { invoice, settings, isGeneratingPDF, loadFromStorage, setupAutoSave } = useInvoice()

    const showSettings = ref(false)
    const showClientDatabase = ref(false)
    const showItemCatalog = ref(false)
    const showInvoiceHistory = ref(false)
    const showDashboard = ref(false)
    const showEmailTemplates = ref(false)
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
        const wrapper = pdfTemplateRef.value.$refs.pdfRef
        const templateElement = wrapper.firstElementChild

        if (!templateElement) {
          throw new Error('Template element not found')
        }

        // Clone the template element
        const clone = templateElement.cloneNode(true)
        clone.style.position = 'fixed'
        clone.style.left = '0'
        clone.style.top = '0'
        clone.style.zIndex = '99999'
        clone.style.background = 'white'

        document.body.appendChild(clone)
        await new Promise(resolve => setTimeout(resolve, 300))

        const opt = {
          margin: 0,
          filename: `${invoice.number || 'invoice'}.pdf`,
          image: { type: 'png', quality: 1.0 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            dpi: 300,
            width: 595,
            height: 842,
            windowWidth: 595,
            windowHeight: 842,
            imageTimeout: 0
          },
          jsPDF: {
            unit: 'pt',
            format: [595.28, 841.89],
            orientation: 'portrait',
            compress: false
          },
          pagebreak: { mode: 'avoid-all' }
        }

        await html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
          // Remove any extra pages
          while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages())
          }
        }).save()

        // Cleanup
        if (document.body.contains(clone)) {
          document.body.removeChild(clone)
        }
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again.')

        // Cleanup on error
        const clones = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 99999"]')
        clones.forEach(c => {
          if (document.body.contains(c)) {
            document.body.removeChild(c)
          }
        })
      } finally {
        isGeneratingPDF.value = false
      }
    }

    return {
      showSettings,
      showClientDatabase,
      showItemCatalog,
      showInvoiceHistory,
      showDashboard,
      showEmailTemplates,
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
