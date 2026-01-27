import { ref, reactive, computed, watch, onMounted } from 'vue'

// Shared state
const invoice = reactive({
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  status: 'draft',
  logo: '',
  from: {
    name: '',
    email: '',
    address: ''
  },
  to: {
    name: '',
    email: '',
    address: ''
  },
  items: [
    { description: '', quantity: 1, price: 0, tax: 0 }
  ],
  discountPercent: 0,
  payment: {
    method: 'bank',
    showPaymentQR: false,
    // Bank Transfer
    bankName: '',
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftBic: '',
    // PayPal
    paypalEmail: '',
    // Crypto
    cryptoType: 'BTC',
    cryptoAddress: '',
    cryptoNetwork: '',
    // Wire Transfer
    wireBankName: '',
    wireBankAddress: '',
    wireAccountNumber: '',
    wireRoutingNumber: '',
    wireSwiftBic: '',
    wireReference: '',
    // QR Code
    qrCodeData: '',
    qrCodeImage: '',
    // Stripe/Card
    stripeLink: '',
    // Venmo
    venmoUsername: '',
    // Zelle
    zelleEmail: '',
    zellePhone: '',
    // Cash App
    cashAppTag: '',
    // Wise (TransferWise)
    wiseEmail: '',
    // Custom/Other
    instructions: ''
  },
  notes: ''
})

const settings = reactive({
  accentColor: '#4f46e5',
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
  taxMode: 'per-item',
  globalTaxRate: 10,
  defaultItemTax: 0,
  showDiscount: false,
  template: 'classic',
  showConversion: false,
  convertToCurrency: 'EUR',
  qrCodeStyle: 'default',
  qrCodeUseAccent: true
})

// Client Database
const clients = ref([])

// Item Catalog
const catalogItems = ref([])

// Saved Invoices
const savedInvoices = ref([])

const isGeneratingPDF = ref(false)

// Currency conversion state
const exchangeRates = ref({})
const conversionLoading = ref(false)
const lastRateUpdate = ref(null)

// Currency list with symbols
const currencies = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  MXN: { symbol: '$', name: 'Mexican Peso' },
  BRL: { symbol: 'R$', name: 'Brazilian Real' },
  KRW: { symbol: '₩', name: 'South Korean Won' },
  SGD: { symbol: 'S$', name: 'Singapore Dollar' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar' },
  NOK: { symbol: 'kr', name: 'Norwegian Krone' },
  SEK: { symbol: 'kr', name: 'Swedish Krona' },
  DKK: { symbol: 'kr', name: 'Danish Krone' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  PLN: { symbol: 'zł', name: 'Polish Zloty' }
}

// Invoice Status Options
const invoiceStatuses = {
  draft: { label: 'Draft', color: '#6b7280' },
  sent: { label: 'Sent', color: '#3b82f6' },
  paid: { label: 'Paid', color: '#10b981' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#9ca3af' }
}

export function useInvoice() {
  // Load saved data
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

  // Client Database Functions
  const addClient = (clientData) => {
    const newClient = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...clientData
    }
    clients.value.push(newClient)
    return newClient
  }

  const updateClient = (id, clientData) => {
    const index = clients.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clients.value[index] = { ...clients.value[index], ...clientData, updatedAt: new Date().toISOString() }
      return clients.value[index]
    }
    return null
  }

  const deleteClient = (id) => {
    const index = clients.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clients.value.splice(index, 1)
      return true
    }
    return false
  }

  const getClient = (id) => {
    return clients.value.find(c => c.id === id)
  }

  const selectClient = (id) => {
    const client = getClient(id)
    if (client) {
      invoice.to.name = client.name || ''
      invoice.to.email = client.email || ''
      invoice.to.address = client.address || ''
    }
  }

  const saveCurrentClientToDatabase = () => {
    if (!invoice.to.name) return null
    
    // Check if client already exists by email
    const existingClient = clients.value.find(c => 
      c.email && c.email.toLowerCase() === invoice.to.email?.toLowerCase()
    )
    
    if (existingClient) {
      return updateClient(existingClient.id, {
        name: invoice.to.name,
        email: invoice.to.email,
        address: invoice.to.address
      })
    } else {
      return addClient({
        name: invoice.to.name,
        email: invoice.to.email,
        address: invoice.to.address
      })
    }
  }

  const exportClients = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      clients: clients.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-clients-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importClients = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedClients = data.clients || data
      
      if (!Array.isArray(importedClients)) {
        throw new Error('Invalid client data format')
      }

      if (mode === 'replace') {
        clients.value = importedClients.map(c => ({
          ...c,
          id: c.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add new clients, update existing by email
        importedClients.forEach(importedClient => {
          const existingIndex = clients.value.findIndex(c => 
            c.email && importedClient.email && 
            c.email.toLowerCase() === importedClient.email.toLowerCase()
          )
          
          if (existingIndex !== -1) {
            // Update existing
            clients.value[existingIndex] = {
              ...clients.value[existingIndex],
              ...importedClient,
              updatedAt: new Date().toISOString()
            }
          } else {
            // Add new
            clients.value.push({
              ...importedClient,
              id: importedClient.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              importedAt: new Date().toISOString()
            })
          }
        })
      }
      
      return { success: true, count: importedClients.length }
    } catch (error) {
      console.error('Import failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Item Catalog Functions
  const addCatalogItem = (itemData) => {
    const newItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...itemData
    }
    catalogItems.value.push(newItem)
    return newItem
  }

  const updateCatalogItem = (id, itemData) => {
    const index = catalogItems.value.findIndex(i => i.id === id)
    if (index !== -1) {
      catalogItems.value[index] = { ...catalogItems.value[index], ...itemData, updatedAt: new Date().toISOString() }
      return catalogItems.value[index]
    }
    return null
  }

  const deleteCatalogItem = (id) => {
    const index = catalogItems.value.findIndex(i => i.id === id)
    if (index !== -1) {
      catalogItems.value.splice(index, 1)
      return true
    }
    return false
  }

  const getCatalogItem = (id) => {
    return catalogItems.value.find(i => i.id === id)
  }

  const addCatalogItemToInvoice = (id) => {
    const catalogItem = getCatalogItem(id)
    if (catalogItem) {
      invoice.items.push({
        description: catalogItem.description || '',
        quantity: catalogItem.defaultQuantity || 1,
        price: catalogItem.price || 0,
        tax: catalogItem.tax || settings.defaultItemTax
      })
    }
  }

  const saveInvoiceItemToCatalog = (index) => {
    const item = invoice.items[index]
    if (!item || !item.description) return null
    
    // Check if item already exists by description
    const existingItem = catalogItems.value.find(i => 
      i.description && i.description.toLowerCase() === item.description.toLowerCase()
    )
    
    if (existingItem) {
      return updateCatalogItem(existingItem.id, {
        description: item.description,
        price: item.price,
        tax: item.tax,
        defaultQuantity: item.quantity
      })
    } else {
      return addCatalogItem({
        description: item.description,
        price: item.price,
        tax: item.tax,
        defaultQuantity: item.quantity
      })
    }
  }

  const exportCatalog = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      items: catalogItems.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-catalog-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCatalog = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedItems = data.items || data
      
      if (!Array.isArray(importedItems)) {
        throw new Error('Invalid catalog data format')
      }

      if (mode === 'replace') {
        catalogItems.value = importedItems.map(i => ({
          ...i,
          id: i.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add new items, update existing by description
        importedItems.forEach(importedItem => {
          const existingIndex = catalogItems.value.findIndex(i => 
            i.description && importedItem.description && 
            i.description.toLowerCase() === importedItem.description.toLowerCase()
          )
          
          if (existingIndex !== -1) {
            // Update existing
            catalogItems.value[existingIndex] = {
              ...catalogItems.value[existingIndex],
              ...importedItem,
              updatedAt: new Date().toISOString()
            }
          } else {
            // Add new
            catalogItems.value.push({
              ...importedItem,
              id: importedItem.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              importedAt: new Date().toISOString()
            })
          }
        })
      }
      
      return { success: true, count: importedItems.length }
    } catch (error) {
      console.error('Catalog import failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Saved Invoices Functions
  const saveCurrentInvoice = (name) => {
    const invoiceName = name || `Invoice ${invoice.number} - ${new Date().toLocaleDateString()}`
    const newSavedInvoice = {
      id: Date.now().toString(),
      name: invoiceName,
      createdAt: new Date().toISOString(),
      invoiceNumber: invoice.number,
      clientName: invoice.to.name || 'Unknown Client',
      total: grandTotal.value,
      currency: settings.currency,
      status: invoice.status || 'draft',
      dueDate: invoice.dueDate,
      data: JSON.parse(JSON.stringify(invoice))
    }
    savedInvoices.value.unshift(newSavedInvoice)
    return newSavedInvoice
  }

  const loadSavedInvoice = (id) => {
    const saved = savedInvoices.value.find(inv => inv.id === id)
    if (saved && saved.data) {
      Object.assign(invoice, saved.data)
      return true
    }
    return false
  }

  const updateSavedInvoice = (id) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index] = {
        ...savedInvoices.value[index],
        updatedAt: new Date().toISOString(),
        invoiceNumber: invoice.number,
        clientName: invoice.to.name || 'Unknown Client',
        total: grandTotal.value,
        currency: settings.currency,
        status: invoice.status || 'draft',
        dueDate: invoice.dueDate,
        data: JSON.parse(JSON.stringify(invoice))
      }
      return true
    }
    return false
  }

  const updateSavedInvoiceStatus = (id, newStatus) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index].status = newStatus
      if (savedInvoices.value[index].data) {
        savedInvoices.value[index].data.status = newStatus
      }
      return true
    }
    return false
  }

  const deleteSavedInvoice = (id) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value.splice(index, 1)
      return true
    }
    return false
  }

  const renameSavedInvoice = (id, newName) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index].name = newName
      return true
    }
    return false
  }

  const duplicateSavedInvoice = (id) => {
    const original = savedInvoices.value.find(inv => inv.id === id)
    if (original) {
      const duplicate = {
        ...JSON.parse(JSON.stringify(original)),
        id: Date.now().toString(),
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString()
      }
      delete duplicate.updatedAt
      savedInvoices.value.unshift(duplicate)
      return duplicate
    }
    return null
  }

  const exportSavedInvoices = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      invoices: savedInvoices.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-saved-invoices-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSavedInvoices = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedInvoices = data.invoices || data
      
      if (!Array.isArray(importedInvoices)) {
        throw new Error('Invalid invoices data format')
      }

      if (mode === 'replace') {
        savedInvoices.value = importedInvoices.map(inv => ({
          ...inv,
          id: inv.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add all as new (invoices are unique)
        importedInvoices.forEach(importedInvoice => {
          savedInvoices.value.push({
            ...importedInvoice,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            importedAt: new Date().toISOString()
          })
        })
      }
      
      return { success: true, count: importedInvoices.length }
    } catch (error) {
      console.error('Invoices import failed:', error)
      return { success: false, error: error.message }
    }
  }

  const clearCurrentInvoice = () => {
    invoice.number = 'INV-001'
    invoice.date = new Date().toISOString().split('T')[0]
    invoice.dueDate = ''
    invoice.status = 'draft'
    invoice.logo = ''
    invoice.from.name = ''
    invoice.from.email = ''
    invoice.from.address = ''
    invoice.to.name = ''
    invoice.to.email = ''
    invoice.to.address = ''
    invoice.items = [{ description: '', quantity: 1, price: 0, tax: 0 }]
    invoice.discountPercent = 0
    invoice.notes = ''
  }

  // Computed values
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

  const hasPaymentInfo = computed(() => {
    const p = invoice.payment
    switch (p.method) {
      case 'bank':
        return p.bankName || p.accountName || p.accountNumber
      case 'paypal':
        return p.paypalEmail
      case 'crypto':
        return p.cryptoAddress
      case 'wire':
        return p.wireBankName || p.wireAccountNumber
      case 'qrcode':
        return p.qrCodeData || p.qrCodeImage
      case 'stripe':
        return p.stripeLink
      case 'venmo':
        return p.venmoUsername
      case 'zelle':
        return p.zelleEmail || p.zellePhone
      case 'cashapp':
        return p.cashAppTag
      case 'wise':
        return p.wiseEmail
      case 'other':
        return p.instructions
      case 'card':
      case 'cash':
        return true
      default:
        return false
    }
  })

  // Generate payment QR data string
  const paymentQRData = computed(() => {
    const p = invoice.payment
    if (!p.showPaymentQR) return ''
    
    let data = []
    
    switch (p.method) {
      case 'bank':
        data.push('BANK TRANSFER')
        if (p.bankName) data.push(`Bank: ${p.bankName}`)
        if (p.accountName) data.push(`Account: ${p.accountName}`)
        if (p.accountNumber) data.push(`Number: ${p.accountNumber}`)
        if (p.routingNumber) data.push(`Routing: ${p.routingNumber}`)
        if (p.swiftBic) data.push(`SWIFT: ${p.swiftBic}`)
        break
      case 'wire':
        data.push('WIRE TRANSFER')
        if (p.wireBankName) data.push(`Bank: ${p.wireBankName}`)
        if (p.wireBankAddress) data.push(`Address: ${p.wireBankAddress}`)
        if (p.wireAccountNumber) data.push(`Account: ${p.wireAccountNumber}`)
        if (p.wireRoutingNumber) data.push(`Routing: ${p.wireRoutingNumber}`)
        if (p.wireSwiftBic) data.push(`SWIFT: ${p.wireSwiftBic}`)
        if (p.wireReference) data.push(`Ref: ${p.wireReference}`)
        break
      case 'paypal':
        // PayPal.me link format
        return `https://paypal.me/${p.paypalEmail}`
      case 'stripe':
        return p.stripeLink
      case 'venmo':
        // Venmo deep link
        return `venmo://paycharge?txn=pay&recipients=${p.venmoUsername}`
      case 'zelle':
        data.push('ZELLE')
        if (p.zelleEmail) data.push(`Email: ${p.zelleEmail}`)
        if (p.zellePhone) data.push(`Phone: ${p.zellePhone}`)
        break
      case 'cashapp':
        // Cash App link
        return `https://cash.app/$${p.cashAppTag}`
      case 'wise':
        data.push('WISE')
        data.push(`Email: ${p.wiseEmail}`)
        break
      case 'crypto':
        // For crypto, include the address directly (can be scanned by wallets)
        data.push(p.cryptoType)
        if (p.cryptoNetwork) data.push(`Network: ${p.cryptoNetwork}`)
        data.push(p.cryptoAddress)
        break
      case 'other':
        return p.instructions
    }
    
    return data.join('\\n')
  })

  // Generate QR code URL with styling
  const getQRCodeUrl = (data, size = 100) => {
    if (!data) return ''
    
    const baseUrl = 'https://api.qrserver.com/v1/create-qr-code/'
    const params = new URLSearchParams({
      size: `${size}x${size}`,
      data: data,
      format: 'png',
      margin: '10'
    })
    
    // Apply accent color if enabled
    if (settings.qrCodeUseAccent && settings.accentColor) {
      // Remove # from hex color
      const color = settings.accentColor.replace('#', '')
      params.append('color', color)
    }
    
    // Apply QR style (background variations)
    switch (settings.qrCodeStyle) {
      case 'rounded':
        // Lighter background
        params.append('bgcolor', 'f8f9fa')
        break
      case 'dark':
        // Dark mode - swap colors
        if (!settings.qrCodeUseAccent) {
          params.append('color', 'ffffff')
        }
        params.append('bgcolor', '1f2937')
        break
      case 'minimal':
        // Very light, subtle
        params.append('bgcolor', 'ffffff')
        if (!settings.qrCodeUseAccent) {
          params.append('color', '6b7280')
        }
        break
      case 'bold':
        // High contrast
        params.append('bgcolor', 'ffffff')
        if (!settings.qrCodeUseAccent) {
          params.append('color', '000000')
        }
        break
      default:
        // Default - white background
        params.append('bgcolor', 'ffffff')
    }
    
    return `${baseUrl}?${params.toString()}`
  }

  // Methods
  const calculateItemAmount = (item) => {
    const itemSubtotal = item.quantity * item.price
    if (settings.taxMode === 'per-item') {
      return itemSubtotal + (itemSubtotal * (item.tax / 100))
    }
    return itemSubtotal
  }

  const formatCurrency = (amount) => {
    const symbol = currencies[settings.currency]?.symbol || settings.currency
    return symbol + amount.toFixed(2)
  }

  // Convert amount to another currency
  const convertAmount = (amount) => {
    if (!settings.showConversion || !exchangeRates.value[settings.convertToCurrency]) {
      return null
    }
    const rate = exchangeRates.value[settings.convertToCurrency]
    return amount * rate
  }

  const formatConvertedCurrency = (amount) => {
    const converted = convertAmount(amount)
    if (converted === null) return ''
    const symbol = currencies[settings.convertToCurrency]?.symbol || settings.convertToCurrency
    return symbol + converted.toFixed(2)
  }

  // Fetch exchange rates from Frankfurter API
  const fetchExchangeRates = async () => {
    if (conversionLoading.value) return
    
    conversionLoading.value = true
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${settings.currency}`)
      if (response.ok) {
        const data = await response.json()
        exchangeRates.value = data.rates
        lastRateUpdate.value = new Date().toISOString()
        localStorage.setItem('invoicio-rates', JSON.stringify({
          rates: data.rates,
          base: settings.currency,
          date: lastRateUpdate.value
        }))
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      // Try to load cached rates
      const cached = localStorage.getItem('invoicio-rates')
      if (cached) {
        const data = JSON.parse(cached)
        if (data.base === settings.currency) {
          exchangeRates.value = data.rates
          lastRateUpdate.value = data.date
        }
      }
    } finally {
      conversionLoading.value = false
    }
  }

  const loadCachedRates = () => {
    const cached = localStorage.getItem('invoicio-rates')
    if (cached) {
      const data = JSON.parse(cached)
      if (data.base === settings.currency) {
        exchangeRates.value = data.rates
        lastRateUpdate.value = data.date
      }
    }
  }

  // Convert all item prices to the target currency
  const convertItemsToCurrency = async (targetCurrency) => {
    if (targetCurrency === settings.currency) return
    
    // Get exchange rate
    let rate = exchangeRates.value[targetCurrency]
    
    // If rate not available, fetch it
    if (!rate) {
      conversionLoading.value = true
      try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${settings.currency}&to=${targetCurrency}`)
        if (response.ok) {
          const data = await response.json()
          rate = data.rates[targetCurrency]
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
        alert('Failed to fetch exchange rate. Please try again.')
        return
      } finally {
        conversionLoading.value = false
      }
    }
    
    if (!rate) {
      alert('Could not get exchange rate')
      return
    }
    
    // Convert all item prices
    invoice.items.forEach(item => {
      item.price = parseFloat((item.price * rate).toFixed(2))
    })
    
    // Update the currency setting
    settings.currency = targetCurrency
    settings.currencySymbol = currencies[targetCurrency]?.symbol || targetCurrency
    
    // Update exchange rates for new base currency
    exchangeRates.value = {}
    lastRateUpdate.value = null
    if (settings.showConversion) {
      await fetchExchangeRates()
    }
  }

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

  return {
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
    convertAmount,
    formatDate,
    addItem,
    removeItem,
    resetAll,
    loadFromStorage,
    setupAutoSave,
    currencies,
    exchangeRates,
    conversionLoading,
    lastRateUpdate,
    fetchExchangeRates,
    loadCachedRates,
    convertItemsToCurrency,
    // Client Database
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    selectClient,
    saveCurrentClientToDatabase,
    exportClients,
    importClients,
    // Item Catalog
    catalogItems,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    getCatalogItem,
    addCatalogItemToInvoice,
    saveInvoiceItemToCatalog,
    exportCatalog,
    importCatalog,
    // Saved Invoices
    savedInvoices,
    saveCurrentInvoice,
    loadSavedInvoice,
    updateSavedInvoice,
    updateSavedInvoiceStatus,
    deleteSavedInvoice,
    renameSavedInvoice,
    duplicateSavedInvoice,
    exportSavedInvoices,
    importSavedInvoices,
    clearCurrentInvoice,
    // Invoice Statuses
    invoiceStatuses,
    // Unified Export/Import
    exportAllData,
    importAllData
  }
}
