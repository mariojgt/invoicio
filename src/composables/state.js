import { ref, reactive } from 'vue'

// Shared invoice state
export const invoice = reactive({
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

// Settings state
export const settings = reactive({
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
export const clients = ref([])

// Item Catalog
export const catalogItems = ref([])

// Saved Invoices
export const savedInvoices = ref([])

// UI State
export const isGeneratingPDF = ref(false)

// Currency conversion state
export const exchangeRates = ref({})
export const conversionLoading = ref(false)
export const lastRateUpdate = ref(null)
