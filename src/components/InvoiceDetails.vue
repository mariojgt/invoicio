<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Invoice Details</h3>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group">
        <label class="form-label">Logo</label>
        <div class="logo-upload">
          <div class="logo-preview" @click="triggerLogoUpload">
            <img v-if="invoice.logo" :src="invoice.logo" alt="Logo">
            <div v-else class="logo-preview-placeholder">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>Upload</span>
            </div>
          </div>
          <input
            ref="logoInput"
            type="file"
            accept="image/*"
            class="hidden-input"
            @change="handleLogoUpload"
          >
          <button v-if="invoice.logo" class="btn btn-sm btn-secondary" @click="removeLogo">Remove</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Invoice Number</label>
        <input type="text" class="form-input" v-model="invoice.number" placeholder="INV-001">
      </div>
    </div>
    <div class="form-row form-row-2">
      <div class="form-group">
        <label class="form-label">Invoice Date</label>
        <input type="date" class="form-input" v-model="invoice.date">
      </div>
      <div class="form-group">
        <label class="form-label">Due Date</label>
        <input type="date" class="form-input" v-model="invoice.dueDate">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <div class="status-selector">
        <select v-model="invoice.status" class="form-input status-select" :style="{ borderColor: invoiceStatuses[invoice.status]?.color }">
          <option v-for="(statusInfo, statusKey) in invoiceStatuses" :key="statusKey" :value="statusKey">
            {{ statusInfo.label }}
          </option>
        </select>
        <span class="status-badge" :style="{ backgroundColor: invoiceStatuses[invoice.status]?.color }">
          {{ invoiceStatuses[invoice.status]?.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoiceDetails',
  setup() {
    const { invoice, invoiceStatuses } = useInvoice()
    const logoInput = ref(null)

    const triggerLogoUpload = () => {
      logoInput.value.click()
    }

    const handleLogoUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          invoice.logo = e.target.result
        }
        reader.readAsDataURL(file)
      }
    }

    const removeLogo = () => {
      invoice.logo = ''
      logoInput.value.value = ''
    }

    return {
      invoice,
      invoiceStatuses,
      logoInput,
      triggerLogoUpload,
      handleLogoUpload,
      removeLogo
    }
  }
}
</script>
