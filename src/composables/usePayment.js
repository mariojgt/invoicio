import { computed } from 'vue'
import { invoice, settings } from './state'

/**
 * Payment Related Functions
 * QR codes, payment info detection, etc.
 */

export function usePayment() {
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

  return {
    hasPaymentInfo,
    paymentQRData,
    getQRCodeUrl
  }
}
