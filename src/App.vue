<template>
  <!-- Client Portal View for Shared Invoices -->
  <ClientPortal 
    v-if="isSharedView"
    :sharedInvoice="sharedInvoice" 
    :sharedSettings="sharedSettings" 
  />

  <!-- Main App View -->
  <div v-else class="app-container">
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
import { ref, reactive, onMounted } from 'vue'
import html2pdf from 'html2pdf.js'
import pako from 'pako'
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
import ClientPortal from './components/ClientPortal.vue'

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
    PdfTemplate,
    ClientPortal
  },
  setup() {
    const { invoice, settings, isGeneratingPDF, loadFromStorage, setupAutoSave } = useInvoice()

    // Shared invoice state
    const isSharedView = ref(false)
    const sharedInvoice = reactive({})
    const sharedSettings = reactive({})

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
      // Check for shared invoice in URL
      const urlParams = new URLSearchParams(window.location.search)
      const invParam = urlParams.get('inv')
      
      if (invParam) {
        try {
          // Decode the URL-safe base64
          const base64 = invParam.replace(/-/g, '+').replace(/_/g, '/')
          const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
          const decoded = atob(base64 + padding)
          
          // Convert to Uint8Array
          const bytes = new Uint8Array(decoded.length)
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i)
          }
          
          // Decompress
          const decompressed = pako.inflate(bytes, { to: 'string' })
          const data = JSON.parse(decompressed)
          
          // Map shortened keys back to full names with defaults
          Object.assign(sharedInvoice, {
            number: data.i?.n || 'INV-001',
            date: data.i?.d || new Date().toISOString().split('T')[0],
            dueDate: data.i?.dd || '',
            logo: data.i?.l || '',
            initials: data.i?.ini || '', // fallback initials when logo is too large
            from: data.i?.f || { name: '', email: '', address: '' },
            to: data.i?.t || { name: '', email: '', address: '' },
            items: data.i?.it || [{ description: '', quantity: 1, price: 0, tax: 0 }],
            discountPercent: data.i?.dp || 0,
            notes: data.i?.nt || '',
            payment: data.i?.p || { method: 'none' }
          })
          
          Object.assign(sharedSettings, {
            template: data.s?.t || 'classic',
            currency: data.s?.c || 'USD',
            accentColor: data.s?.ac || '#4f46e5',
            taxMode: data.s?.tm || 'total',
            globalTaxRate: data.s?.gtr || 0,
            showDiscount: data.s?.sd || false
          })
          
          isSharedView.value = true
          
          // Update page title
          document.title = `Invoice ${sharedInvoice.number || ''} | Invoicio`
        } catch (err) {
          console.error('Error parsing shared invoice:', err)
          // If parsing fails, show normal app
          loadFromStorage()
          setupAutoSave()
        }
      } else {
        loadFromStorage()
        setupAutoSave()
      }
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

        // Use the clone (not just pdfContent) to preserve the template class for CSS inheritance
        await html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf) => {
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
      isSharedView,
      sharedInvoice,
      sharedSettings,
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
