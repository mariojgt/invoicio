import { computed, watch } from 'vue'

// Import shared state
import {
  invoice,
  settings,
  clients,
  catalogItems,
  savedInvoices,
  isGeneratingPDF,
  exchangeRates,
  conversionLoading,
  lastRateUpdate
} from './state'

// Import constants
import { currencies, invoiceStatuses, paymentMethods } from './constants'

// Import sub-composables
import { useClients } from './useClients'
import { useCatalog } from './useCatalog'
import { useSavedInvoices } from './useSavedInvoices'
import { useCurrency } from './useCurrency'
import { usePayment } from './usePayment'

/**
 * Main Invoice Composable
 * Aggregates all invoice-related functionality
 */
export function useInvoice() {
  // Load saved data from localStorage
  const loadFromStorage = () => {
    const savedInvoice = localStorage.getItem('invoicio-invoice')
    const savedSettings = localStorage.getItem('invoicio-settings')
    const savedClients = localStorage.getItem('invoicio-clients')
    const savedCatalog = localStorage.getItem('invoicio-catalog')

    if (savedInvoice) {
      Object.assign(invoice, JSON.parse(savedInvoice))
    }
    if (savedSettings) {
      Object.assign(settings, JSON.parse(savedSettings))
    }
    if (savedClients) {
      clients.value = JSON.parse(savedClients)
    }
    if (savedCatalog) {
      catalogItems.value = JSON.parse(savedCatalog)
    }

    const savedInvoicesData = localStorage.getItem('invoicio-saved-invoices')
    if (savedInvoicesData) {
      savedInvoices.value = JSON.parse(savedInvoicesData)
    }
  }

  // Auto-save watchers
  const setupAutoSave = () => {
    watch(invoice, () => {
      localStorage.setItem('invoicio-invoice', JSON.stringify(invoice))
    }, { deep: true })

    watch(settings, () => {
      localStorage.setItem('invoicio-settings', JSON.stringify(settings))
    }, { deep: true })

    watch(clients, () => {
      localStorage.setItem('invoicio-clients', JSON.stringify(clients.value))
    }, { deep: true })

    watch(catalogItems, () => {
      localStorage.setItem('invoicio-catalog', JSON.stringify(catalogItems.value))
    }, { deep: true })

    watch(savedInvoices, () => {
      localStorage.setItem('invoicio-saved-invoices', JSON.stringify(savedInvoices.value))
    }, { deep: true })
  }

  // Computed values for invoice calculations
  const subtotal = computed(() => {
    return invoice.items.reduce((sum, item) => {
      return sum + (item.quantity * item.price)
    }, 0)
  })

  const totalTax = computed(() => {
    if (settings.taxMode === 'total') {
      return subtotal.value * (settings.globalTaxRate / 100)
    } else {
      return invoice.items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.price
        return sum + (itemSubtotal * (item.tax / 100))
      }, 0)
    }
  })

  const discountAmount = computed(() => {
    if (!settings.showDiscount || !invoice.discountPercent) return 0
    return (subtotal.value + totalTax.value) * (invoice.discountPercent / 100)
  })

  const grandTotal = computed(() => {
    return subtotal.value + totalTax.value - discountAmount.value
  })

  // Invoice item methods
  const calculateItemAmount = (item) => {
    const itemSubtotal = item.quantity * item.price
    if (settings.taxMode === 'per-item') {
      return itemSubtotal + (itemSubtotal * (item.tax / 100))
    }
    return itemSubtotal
  }

  const addItem = () => {
    invoice.items.push({
      description: '',
      quantity: 1,
      price: 0,
      tax: settings.defaultItemTax
    })
  }

  const removeItem = (index) => {
    invoice.items.splice(index, 1)
  }

  // Date formatting
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    switch (settings.dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      case 'DD MMM YYYY':
        return `${day} ${monthNames[date.getMonth()]} ${year}`
      default:
        return `${month}/${day}/${year}`
    }
  }

  // Reset all data
  const resetAll = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      localStorage.removeItem('invoicio-invoice')
      localStorage.removeItem('invoicio-settings')
      location.reload()
    }
  }

  // Unified Export/Import - All Data
  const exportAllData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      appName: 'Invoicio',
      data: {
        currentInvoice: JSON.parse(JSON.stringify(invoice)),
        settings: JSON.parse(JSON.stringify(settings)),
        clients: clients.value,
        catalogItems: catalogItems.value,
        savedInvoices: savedInvoices.value
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importAllData = (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData

      if (!data.data) {
        throw new Error('Invalid backup file format')
      }

      const imported = data.data
      let counts = {
        settings: false,
        currentInvoice: false,
        clients: 0,
        catalogItems: 0,
        savedInvoices: 0
      }

      // Import settings
      if (imported.settings) {
        Object.assign(settings, imported.settings)
        counts.settings = true
      }

      // Import current invoice
      if (imported.currentInvoice) {
        Object.assign(invoice, imported.currentInvoice)
        counts.currentInvoice = true
      }

      // Import clients
      if (Array.isArray(imported.clients)) {
        clients.value = imported.clients
        counts.clients = imported.clients.length
      }

      // Import catalog items
      if (Array.isArray(imported.catalogItems)) {
        catalogItems.value = imported.catalogItems
        counts.catalogItems = imported.catalogItems.length
      }

      // Import saved invoices
      if (Array.isArray(imported.savedInvoices)) {
        savedInvoices.value = imported.savedInvoices
        counts.savedInvoices = imported.savedInvoices.length
      }

      return {
        success: true,
        counts,
        message: `Imported: ${counts.clients} clients, ${counts.catalogItems} catalog items, ${counts.savedInvoices} saved invoices`
      }
    } catch (error) {
      console.error('Import failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Initialize sub-composables
  const clientFunctions = useClients()
  const catalogFunctions = useCatalog()
  const savedInvoiceFunctions = useSavedInvoices(grandTotal)
  const currencyFunctions = useCurrency()
  const paymentFunctions = usePayment()

  return {
    // State
    invoice,
    settings,
    isGeneratingPDF,

    // Computed
    subtotal,
    totalTax,
    discountAmount,
    grandTotal,

    // Invoice methods
    calculateItemAmount,
    formatDate,
    addItem,
    removeItem,
    resetAll,
    loadFromStorage,
    setupAutoSave,

    // Constants
    currencies,
    invoiceStatuses,
    paymentMethods,

    // Currency (from useCurrency)
    exchangeRates,
    conversionLoading,
    lastRateUpdate,
    formatCurrency: currencyFunctions.formatCurrency,
    convertAmount: currencyFunctions.convertAmount,
    formatConvertedCurrency: currencyFunctions.formatConvertedCurrency,
    fetchExchangeRates: currencyFunctions.fetchExchangeRates,
    loadCachedRates: currencyFunctions.loadCachedRates,
    convertItemsToCurrency: currencyFunctions.convertItemsToCurrency,

    // Payment (from usePayment)
    hasPaymentInfo: paymentFunctions.hasPaymentInfo,
    paymentQRData: paymentFunctions.paymentQRData,
    getQRCodeUrl: paymentFunctions.getQRCodeUrl,

    // Client Database (from useClients)
    clients,
    addClient: clientFunctions.addClient,
    updateClient: clientFunctions.updateClient,
    deleteClient: clientFunctions.deleteClient,
    getClient: clientFunctions.getClient,
    selectClient: clientFunctions.selectClient,
    saveCurrentClientToDatabase: clientFunctions.saveCurrentClientToDatabase,
    exportClients: clientFunctions.exportClients,
    importClients: clientFunctions.importClients,

    // Item Catalog (from useCatalog)
    catalogItems,
    addCatalogItem: catalogFunctions.addCatalogItem,
    updateCatalogItem: catalogFunctions.updateCatalogItem,
    deleteCatalogItem: catalogFunctions.deleteCatalogItem,
    getCatalogItem: catalogFunctions.getCatalogItem,
    addCatalogItemToInvoice: catalogFunctions.addCatalogItemToInvoice,
    saveInvoiceItemToCatalog: catalogFunctions.saveInvoiceItemToCatalog,
    exportCatalog: catalogFunctions.exportCatalog,
    importCatalog: catalogFunctions.importCatalog,

    // Saved Invoices (from useSavedInvoices)
    savedInvoices,
    saveCurrentInvoice: savedInvoiceFunctions.saveCurrentInvoice,
    loadSavedInvoice: savedInvoiceFunctions.loadSavedInvoice,
    updateSavedInvoice: savedInvoiceFunctions.updateSavedInvoice,
    updateSavedInvoiceStatus: savedInvoiceFunctions.updateSavedInvoiceStatus,
    deleteSavedInvoice: savedInvoiceFunctions.deleteSavedInvoice,
    renameSavedInvoice: savedInvoiceFunctions.renameSavedInvoice,
    duplicateSavedInvoice: savedInvoiceFunctions.duplicateSavedInvoice,
    exportSavedInvoices: savedInvoiceFunctions.exportSavedInvoices,
    importSavedInvoices: savedInvoiceFunctions.importSavedInvoices,
    clearCurrentInvoice: savedInvoiceFunctions.clearCurrentInvoice,

    // Unified Export/Import
    exportAllData,
    importAllData
  }
}
