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
  currency: '$',
  dateFormat: 'MM/DD/YYYY',
  taxMode: 'per-item',
  globalTaxRate: 10,
  defaultItemTax: 0,
  showDiscount: false,
  template: 'classic'
})

const isGeneratingPDF = ref(false)

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
    return settings.currency + amount.toFixed(2)
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
    formatDate,
    addItem,
    removeItem,
    resetAll,
    loadFromStorage,
    setupAutoSave
  }
}
