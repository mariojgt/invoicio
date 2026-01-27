<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Payment Information</h3>
    </div>
    
    <!-- Payment Method Selector -->
    <div class="form-group">
      <label class="form-label">Payment Method</label>
      <select class="form-select" v-model="invoice.payment.method">
        <optgroup label="Bank & Transfers">
          <option value="bank">Bank Transfer (ACH/Local)</option>
          <option value="wire">Wire Transfer (International)</option>
        </optgroup>
        <optgroup label="Digital Payments">
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe / Card Link</option>
          <option value="venmo">Venmo</option>
          <option value="zelle">Zelle</option>
          <option value="cashapp">Cash App</option>
          <option value="wise">Wise (TransferWise)</option>
        </optgroup>
        <optgroup label="Cryptocurrency">
          <option value="crypto">Cryptocurrency</option>
        </optgroup>
        <optgroup label="Other">
          <option value="qrcode">QR Code Payment</option>
          <option value="card">Credit Card (Manual)</option>
          <option value="cash">Cash</option>
          <option value="other">Custom Instructions</option>
        </optgroup>
      </select>
    </div>

    <!-- Bank Transfer Fields -->
    <div v-if="invoice.payment.method === 'bank'" class="payment-fields">
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Bank Name</label>
          <input type="text" class="form-input" v-model="invoice.payment.bankName" placeholder="Bank Name">
        </div>
        <div class="form-group">
          <label class="form-label">Account Holder Name</label>
          <input type="text" class="form-input" v-model="invoice.payment.accountName" placeholder="Account Holder Name">
        </div>
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Account Number / IBAN</label>
          <input type="text" class="form-input" v-model="invoice.payment.accountNumber" placeholder="Account Number or IBAN">
        </div>
        <div class="form-group">
          <label class="form-label">Routing Number (Optional)</label>
          <input type="text" class="form-input" v-model="invoice.payment.routingNumber" placeholder="Routing Number">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">SWIFT/BIC Code (Optional)</label>
        <input type="text" class="form-input" v-model="invoice.payment.swiftBic" placeholder="SWIFT/BIC Code">
      </div>
    </div>

    <!-- Wire Transfer Fields -->
    <div v-if="invoice.payment.method === 'wire'" class="payment-fields">
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Bank Name</label>
          <input type="text" class="form-input" v-model="invoice.payment.wireBankName" placeholder="Bank Name">
        </div>
        <div class="form-group">
          <label class="form-label">SWIFT/BIC Code</label>
          <input type="text" class="form-input" v-model="invoice.payment.wireSwiftBic" placeholder="SWIFT/BIC Code">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Bank Address</label>
        <input type="text" class="form-input" v-model="invoice.payment.wireBankAddress" placeholder="Full Bank Address">
      </div>
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Account Number / IBAN</label>
          <input type="text" class="form-input" v-model="invoice.payment.wireAccountNumber" placeholder="Account Number or IBAN">
        </div>
        <div class="form-group">
          <label class="form-label">Routing / ABA Number</label>
          <input type="text" class="form-input" v-model="invoice.payment.wireRoutingNumber" placeholder="Routing Number">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Payment Reference (Optional)</label>
        <input type="text" class="form-input" v-model="invoice.payment.wireReference" placeholder="Reference to include with payment">
      </div>
    </div>

    <!-- PayPal Fields -->
    <div v-if="invoice.payment.method === 'paypal'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">PayPal Email</label>
        <input type="email" class="form-input" v-model="invoice.payment.paypalEmail" placeholder="paypal@email.com">
      </div>
    </div>

    <!-- Stripe Fields -->
    <div v-if="invoice.payment.method === 'stripe'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">Stripe Payment Link</label>
        <input type="url" class="form-input" v-model="invoice.payment.stripeLink" placeholder="https://buy.stripe.com/...">
        <small class="form-help">Create a payment link in your Stripe dashboard</small>
      </div>
    </div>

    <!-- Venmo Fields -->
    <div v-if="invoice.payment.method === 'venmo'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">Venmo Username</label>
        <div class="input-with-prefix">
          <span class="input-prefix">@</span>
          <input type="text" class="form-input" v-model="invoice.payment.venmoUsername" placeholder="username">
        </div>
      </div>
    </div>

    <!-- Zelle Fields -->
    <div v-if="invoice.payment.method === 'zelle'" class="payment-fields">
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Zelle Email</label>
          <input type="email" class="form-input" v-model="invoice.payment.zelleEmail" placeholder="zelle@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Or Phone Number</label>
          <input type="tel" class="form-input" v-model="invoice.payment.zellePhone" placeholder="+1 234 567 8900">
        </div>
      </div>
    </div>

    <!-- Cash App Fields -->
    <div v-if="invoice.payment.method === 'cashapp'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">Cash App Tag</label>
        <div class="input-with-prefix">
          <span class="input-prefix">$</span>
          <input type="text" class="form-input" v-model="invoice.payment.cashAppTag" placeholder="cashtag">
        </div>
      </div>
    </div>

    <!-- Wise Fields -->
    <div v-if="invoice.payment.method === 'wise'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">Wise Email</label>
        <input type="email" class="form-input" v-model="invoice.payment.wiseEmail" placeholder="wise@email.com">
      </div>
    </div>

    <!-- Crypto Fields -->
    <div v-if="invoice.payment.method === 'crypto'" class="payment-fields">
      <div class="form-row form-row-2">
        <div class="form-group">
          <label class="form-label">Cryptocurrency</label>
          <select class="form-select" v-model="invoice.payment.cryptoType">
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT)</option>
            <option value="USDC">USD Coin (USDC)</option>
            <option value="BNB">BNB</option>
            <option value="XRP">Ripple (XRP)</option>
            <option value="SOL">Solana (SOL)</option>
            <option value="ADA">Cardano (ADA)</option>
            <option value="DOGE">Dogecoin (DOGE)</option>
            <option value="LTC">Litecoin (LTC)</option>
            <option value="MATIC">Polygon (MATIC)</option>
            <option value="DOT">Polkadot (DOT)</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Network (Optional)</label>
          <input type="text" class="form-input" v-model="invoice.payment.cryptoNetwork" placeholder="e.g., ERC-20, BEP-20, TRC-20">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Wallet Address</label>
        <input type="text" class="form-input crypto-address" v-model="invoice.payment.cryptoAddress" placeholder="Enter wallet address">
      </div>
    </div>

    <!-- QR Code Fields -->
    <div v-if="invoice.payment.method === 'qrcode'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">QR Code Data / URL</label>
        <input type="text" class="form-input" v-model="invoice.payment.qrCodeData" placeholder="Payment URL or data to encode">
        <small class="form-help">Enter a payment URL (e.g., PayPal.me, Pix, UPI) - QR code will be generated automatically</small>
      </div>
      <div class="form-group">
        <label class="form-label">Or Upload QR Code Image</label>
        <input type="file" class="form-input" @change="handleQrUpload" accept="image/*">
        <div v-if="invoice.payment.qrCodeImage" class="qr-preview">
          <img :src="invoice.payment.qrCodeImage" alt="QR Code" class="qr-preview-img">
          <button class="btn btn-danger btn-sm" @click="removeQrImage">Remove</button>
        </div>
      </div>
    </div>

    <!-- Card Manual -->
    <div v-if="invoice.payment.method === 'card'" class="payment-fields">
      <div class="payment-note">
        <strong>Credit Card:</strong> Client will pay by card. Include your payment processor details in the notes if needed.
      </div>
    </div>

    <!-- Cash -->
    <div v-if="invoice.payment.method === 'cash'" class="payment-fields">
      <div class="payment-note">
        <strong>Cash Payment:</strong> Payment to be made in cash.
      </div>
    </div>

    <!-- Custom/Other Fields -->
    <div v-if="invoice.payment.method === 'other'" class="payment-fields">
      <div class="form-group">
        <label class="form-label">Payment Instructions</label>
        <textarea class="form-textarea" v-model="invoice.payment.instructions" rows="4" placeholder="Enter custom payment instructions..."></textarea>
      </div>
    </div>

    <!-- Show Payment QR Code Option -->
    <div v-if="canShowPaymentQR" class="form-group qr-option">
      <div class="checkbox-group">
        <input type="checkbox" class="checkbox-input" id="showPaymentQR" v-model="invoice.payment.showPaymentQR">
        <label for="showPaymentQR">Display payment details as QR code</label>
      </div>
      <small class="form-help">QR code will contain your payment information for easy scanning</small>
    </div>

    <!-- Notes -->
    <div class="form-group" style="margin-top: 1rem;">
      <label class="form-label">Notes / Terms</label>
      <textarea class="form-textarea" v-model="invoice.notes" placeholder="Additional notes or terms..."></textarea>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoicePayment',
  setup() {
    const { invoice } = useInvoice()

    // Methods that can have QR codes generated
    const canShowPaymentQR = computed(() => {
      const method = invoice.payment.method
      // QR code method already has its own QR display
      if (method === 'qrcode') return false
      // Check if there's data to show
      switch (method) {
        case 'bank':
          return invoice.payment.bankName || invoice.payment.accountNumber
        case 'wire':
          return invoice.payment.wireBankName || invoice.payment.wireAccountNumber
        case 'paypal':
          return invoice.payment.paypalEmail
        case 'stripe':
          return invoice.payment.stripeLink
        case 'venmo':
          return invoice.payment.venmoUsername
        case 'zelle':
          return invoice.payment.zelleEmail || invoice.payment.zellePhone
        case 'cashapp':
          return invoice.payment.cashAppTag
        case 'wise':
          return invoice.payment.wiseEmail
        case 'crypto':
          return invoice.payment.cryptoAddress
        case 'other':
          return invoice.payment.instructions
        default:
          return false
      }
    })

    const handleQrUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          invoice.payment.qrCodeImage = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const removeQrImage = () => {
      invoice.payment.qrCodeImage = ''
    }

    return { 
      invoice,
      handleQrUpload,
      removeQrImage,
      canShowPaymentQR
    }
  }
}
</script>
