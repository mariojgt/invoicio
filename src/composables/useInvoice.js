import { ref, reactive, computed, watch, onMounted } from 'vue'

// Shared state
const invoice = reactive({
  number: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
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

export function useInvoice() {
  // Load saved data
  const loadFromStorage = () => {
    const savedInvoice = localStorage.getItem('invoicio-invoice')
    const savedSettings = localStorage.getItem('invoicio-settings')

    if (savedInvoice) {
      Object.assign(invoice, JSON.parse(savedInvoice))
    }
    if (savedSettings) {
      Object.assign(settings, JSON.parse(savedSettings))
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
    convertItemsToCurrency
  }
}
