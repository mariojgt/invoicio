<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Parties</h3>
    </div>
    <div class="form-row form-row-2">
      <div>
        <h4 style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.75rem;">From (Your Details)</h4>
        <div class="form-group">
          <label class="form-label">Name / Company</label>
          <input type="text" class="form-input" v-model="invoice.from.name" placeholder="Your Company Name">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" v-model="invoice.from.email" placeholder="email@company.com">
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" v-model="invoice.from.address" placeholder="123 Street, City, Country"></textarea>
        </div>
      </div>
      <div>
        <h4 style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.75rem;">Bill To (Client)</h4>
        <div class="form-group">
          <label class="form-label">Name / Company</label>
          <input type="text" class="form-input" v-model="invoice.to.name" placeholder="Client Name">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" v-model="invoice.to.email" placeholder="client@email.com">
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" v-model="invoice.to.address" placeholder="Client Address"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoiceParties',
  setup() {
    const { invoice } = useInvoice()
    return { invoice }
  }
}
</script>
