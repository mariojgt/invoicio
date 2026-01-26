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
    bankName: '',
    accountName: '',
    accountNumber: '',
    paypalEmail: '',
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
  convertToCurrency: 'EUR'
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
    return p.method === 'bank' && (p.bankName || p.accountName || p.accountNumber) ||
           p.method === 'paypal' && p.paypalEmail ||
           p.method === 'other' && p.instructions ||
           p.method === 'card' || p.method === 'cash'
  })

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
