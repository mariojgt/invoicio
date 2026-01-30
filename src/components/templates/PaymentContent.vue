<template>
  <div class="payment-content">
    <!-- Bank Transfer -->
    <div v-if="payment.method === 'bank'">
      <div v-if="payment.bankName">Bank: {{ payment.bankName }}</div>
      <div v-if="payment.accountName">Account: {{ payment.accountName }}</div>
      <div v-if="payment.accountNumber">Number: {{ payment.accountNumber }}</div>
      <div v-if="payment.routingNumber">Routing: {{ payment.routingNumber }}</div>
      <div v-if="payment.swiftBic">SWIFT/BIC: {{ payment.swiftBic }}</div>
    </div>

    <!-- Wire Transfer -->
    <div v-else-if="payment.method === 'wire'">
      <div v-if="payment.wireBankName">Bank: {{ payment.wireBankName }}</div>
      <div v-if="payment.wireBankAddress">Bank Address: {{ payment.wireBankAddress }}</div>
      <div v-if="payment.wireAccountNumber">Account/IBAN: {{ payment.wireAccountNumber }}</div>
      <div v-if="payment.wireRoutingNumber">Routing/ABA: {{ payment.wireRoutingNumber }}</div>
      <div v-if="payment.wireSwiftBic">SWIFT/BIC: {{ payment.wireSwiftBic }}</div>
      <div v-if="payment.wireReference">Reference: {{ payment.wireReference }}</div>
    </div>

    <!-- PayPal -->
    <div v-else-if="payment.method === 'paypal'">
      PayPal: {{ payment.paypalEmail }}
    </div>

    <!-- Stripe -->
    <div v-else-if="payment.method === 'stripe'">
      Pay via Stripe: {{ payment.stripeLink }}
    </div>

    <!-- Venmo -->
    <div v-else-if="payment.method === 'venmo'">
      Venmo: @{{ payment.venmoUsername }}
    </div>

    <!-- Zelle -->
    <div v-else-if="payment.method === 'zelle'">
      <div v-if="payment.zelleEmail">Zelle Email: {{ payment.zelleEmail }}</div>
      <div v-if="payment.zellePhone">Zelle Phone: {{ payment.zellePhone }}</div>
    </div>

    <!-- Cash App -->
    <div v-else-if="payment.method === 'cashapp'">
      Cash App: ${{ payment.cashAppTag }}
    </div>

    <!-- Wise -->
    <div v-else-if="payment.method === 'wise'">
      Wise: {{ payment.wiseEmail }}
    </div>

    <!-- Crypto -->
    <div v-else-if="payment.method === 'crypto'">
      <div>{{ payment.cryptoType }}:</div>
      <div class="crypto-address">{{ payment.cryptoAddress }}</div>
      <div v-if="payment.cryptoNetwork">Network: {{ payment.cryptoNetwork }}</div>
    </div>

    <!-- QR Code -->
    <div v-else-if="payment.method === 'qrcode'" class="qr-section">
      <div v-if="payment.qrCodeImage" class="qr-display">
        <img :src="payment.qrCodeImage" alt="Payment QR Code" class="qr-image">
      </div>
      <div v-else-if="payment.qrCodeData" class="qr-display">
        <img :src="getQRCodeUrl(payment.qrCodeData, 100)" alt="QR Code" class="qr-image">
        <div class="qr-link">{{ payment.qrCodeData }}</div>
      </div>
    </div>

    <!-- Card -->
    <div v-else-if="payment.method === 'card'">
      Payment Method: Credit Card
    </div>

    <!-- Cash -->
    <div v-else-if="payment.method === 'cash'">
      Payment Method: Cash
    </div>

    <!-- Other/Custom -->
    <div v-else-if="payment.method === 'other'">
      {{ payment.instructions }}
    </div>

    <!-- Payment QR Code (for any method with showPaymentQR enabled) -->
    <div v-if="payment.showPaymentQR && paymentQRData && payment.method !== 'qrcode'" class="payment-qr">
      <div class="payment-qr-label">Scan to Pay</div>
      <img :src="getQRCodeUrl(paymentQRData, 80)" alt="Payment QR" class="qr-image">
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentContent',
  props: {
    payment: { type: Object, default: () => ({}) },
    paymentQRData: { type: String, default: '' },
    getQRCodeUrl: { type: Function, default: () => '' }
  }
}
</script>

<style scoped>
.payment-content > div {
  margin-bottom: 2px;
}

.crypto-address {
  font-family: monospace;
  font-size: 9px;
  word-break: break-all;
  background: #ffffff;
  padding: 6px 8px;
  border-radius: 4px;
  margin: 4px 0;
  border: 1px solid #e5e7eb;
}

.qr-section {
  text-align: center;
  margin: 8px 0;
}

.qr-display {
  margin: 8px 0;
  text-align: center;
}

.qr-image {
  width: 80px;
  height: 80px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.qr-link {
  font-size: 8px;
  color: #6b7280;
  word-break: break-all;
  margin-top: 4px;
}

.payment-qr {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #d1d5db;
  text-align: center;
}

.payment-qr-label {
  font-size: 9px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
