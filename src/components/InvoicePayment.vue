<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Payment Information</h3>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <select class="form-select" v-model="invoice.payment.method">
          <option value="bank">Bank Transfer</option>
          <option value="paypal">PayPal</option>
          <option value="card">Credit Card</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="form-group" v-if="invoice.payment.method === 'bank'">
        <label class="form-label">Bank Name</label>
        <input type="text" class="form-input" v-model="invoice.payment.bankName" placeholder="Bank Name">
      </div>
    </div>
    <div class="form-row form-row-2" v-if="invoice.payment.method === 'bank'">
      <div class="form-group">
        <label class="form-label">Account Name</label>
        <input type="text" class="form-input" v-model="invoice.payment.accountName" placeholder="Account Holder Name">
      </div>
      <div class="form-group">
        <label class="form-label">Account Number / IBAN</label>
        <input type="text" class="form-input" v-model="invoice.payment.accountNumber" placeholder="Account Number">
      </div>
    </div>
    <div class="form-group" v-if="invoice.payment.method === 'paypal'">
      <label class="form-label">PayPal Email</label>
      <input type="email" class="form-input" v-model="invoice.payment.paypalEmail" placeholder="paypal@email.com">
    </div>
    <div class="form-group" v-if="invoice.payment.method === 'other'">
      <label class="form-label">Payment Instructions</label>
      <textarea class="form-textarea" v-model="invoice.payment.instructions" placeholder="Enter payment instructions..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Notes / Terms</label>
      <textarea class="form-textarea" v-model="invoice.notes" placeholder="Additional notes or terms..."></textarea>
    </div>
  </div>
</template>

<script>
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoicePayment',
  setup() {
    const { invoice } = useInvoice()
    return { invoice }
  }
}
</script>
