// Currency list with symbols
export const currencies = {
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
export const invoiceStatuses = {
  draft: { label: 'Draft', color: '#6b7280' },
  sent: { label: 'Sent', color: '#3b82f6' },
  paid: { label: 'Paid', color: '#10b981' },
  overdue: { label: 'Overdue', color: '#ef4444' },
  cancelled: { label: 'Cancelled', color: '#9ca3af' }
}

// Payment methods
export const paymentMethods = {
  bank: { label: 'Bank Transfer', icon: 'bank' },
  paypal: { label: 'PayPal', icon: 'paypal' },
  crypto: { label: 'Cryptocurrency', icon: 'crypto' },
  wire: { label: 'Wire Transfer', icon: 'wire' },
  qrcode: { label: 'QR Code', icon: 'qr' },
  stripe: { label: 'Stripe/Card Link', icon: 'card' },
  venmo: { label: 'Venmo', icon: 'venmo' },
  zelle: { label: 'Zelle', icon: 'zelle' },
  cashapp: { label: 'Cash App', icon: 'cashapp' },
  wise: { label: 'Wise', icon: 'wise' },
  card: { label: 'Credit/Debit Card', icon: 'card' },
  cash: { label: 'Cash', icon: 'cash' },
  other: { label: 'Other/Custom', icon: 'other' }
}
