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
        <div class="bill-to-header">
          <h4>Bill To (Client)</h4>
          <div class="client-actions">
            <button class="btn btn-secondary btn-xs" @click="$emit('open-clients')" title="Select from saved clients">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Select
            </button>
            <button
              class="btn btn-secondary btn-xs"
              @click="saveClientToDatabase"
              :disabled="!invoice.to.name"
              title="Save client to database"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save
            </button>
          </div>
        </div>
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
  emits: ['open-clients'],
  setup() {
    const { invoice, saveCurrentClientToDatabase } = useInvoice()

    const saveClientToDatabase = () => {
      const result = saveCurrentClientToDatabase()
      if (result) {
        alert('Client saved to database!')
      }
    }

    return { invoice, saveClientToDatabase }
  }
}
</script>

<style scoped>
.bill-to-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.bill-to-header h4 {
  font-size: 0.875rem;
  color: var(--gray-600);
  margin: 0;
}

.client-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-xs svg {
  flex-shrink: 0;
}
</style>
