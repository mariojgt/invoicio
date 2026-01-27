<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal history-modal">
        <div class="modal-header">
          <h2>Saved Invoices</h2>
          <button class="btn btn-icon" @click="$emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Toolbar -->
          <div class="history-toolbar">
            <div class="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search invoices..."
                class="form-input"
              >
            </div>
            <div class="toolbar-actions">
              <button class="btn btn-primary btn-sm" @click="saveCurrentAsNew">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Current
              </button>
              <button class="btn btn-secondary btn-sm" @click="triggerImport">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Import
              </button>
              <button class="btn btn-secondary btn-sm" @click="exportSavedInvoices" :disabled="savedInvoices.length === 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Export All
              </button>
            </div>
          </div>

          <!-- Save Name Dialog -->
          <div v-if="showSaveDialog" class="save-dialog">
            <h4>Save Invoice</h4>
            <input
              type="text"
              class="form-input"
              v-model="saveName"
              placeholder="Enter a name for this invoice..."
              @keyup.enter="confirmSave"
              ref="saveNameInput"
            >
            <div class="dialog-actions">
              <button class="btn btn-secondary btn-sm" @click="showSaveDialog = false">Cancel</button>
              <button class="btn btn-primary btn-sm" @click="confirmSave" :disabled="!saveName.trim()">Save</button>
            </div>
          </div>

          <!-- Invoices List -->
          <div v-else class="invoices-list">
            <div v-if="filteredInvoices.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <p v-if="searchQuery">No invoices match your search</p>
              <p v-else>No saved invoices yet</p>
              <button v-if="!searchQuery" class="btn btn-primary btn-sm" @click="saveCurrentAsNew">
                Save Your First Invoice
              </button>
            </div>

            <div v-else class="invoice-cards">
              <div
                v-for="inv in filteredInvoices"
                :key="inv.id"
                class="invoice-card"
                :class="{ 'editing': editingId === inv.id }"
              >
                <div class="invoice-card-main" @click="loadInvoice(inv)">
                  <div class="invoice-info">
                    <div class="invoice-name" v-if="editingId !== inv.id">
                      {{ inv.name }}
                    </div>
                    <input
                      v-else
                      type="text"
                      class="form-input rename-input"
                      v-model="editingName"
                      @click.stop
                      @keyup.enter="saveRename(inv.id)"
                      @keyup.escape="cancelRename"
                      ref="renameInput"
                    >
                    <div class="invoice-meta">
                      <span class="invoice-number">{{ inv.invoiceNumber }}</span>
                      <span class="invoice-client">{{ inv.clientName }}</span>
                    </div>
                  </div>
                  <div class="invoice-details">
                    <div class="invoice-total">{{ formatAmount(inv.total, inv.currency) }}</div>
                    <div class="invoice-date">{{ formatDate(inv.createdAt) }}</div>
                    <span
                      class="status-badge status-badge-sm"
                      :style="{ backgroundColor: invoiceStatuses[inv.status || 'draft']?.color }"
                    >
                      {{ invoiceStatuses[inv.status || 'draft']?.label }}
                    </span>
                  </div>
                </div>
                <div class="invoice-card-actions" @click.stop>
                  <select
                    class="status-dropdown"
                    :value="inv.status || 'draft'"
                    @change="changeStatus(inv.id, $event.target.value)"
                    @click.stop
                    title="Change status"
                  >
                    <option v-for="(statusInfo, statusKey) in invoiceStatuses" :key="statusKey" :value="statusKey">
                      {{ statusInfo.label }}
                    </option>
                  </select>
                  <button
                    v-if="editingId === inv.id"
                    class="btn btn-icon btn-sm btn-success"
                    @click="saveRename(inv.id)"
                    title="Save name"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                  <button
                    v-if="editingId === inv.id"
                    class="btn btn-icon btn-sm"
                    @click="cancelRename"
                    title="Cancel"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                  <template v-else>
                    <button class="btn btn-icon btn-sm" @click="startRename(inv)" title="Rename">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon btn-sm" @click="duplicate(inv.id)" title="Duplicate">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon btn-sm" @click="updateInvoice(inv.id)" title="Update with current data">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                    </button>
                    <button class="btn btn-icon btn-sm btn-danger" @click="confirmDelete(inv)" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Notification -->
          <div v-if="notification" class="notification" :class="notification.type">
            {{ notification.message }}
          </div>
        </div>

        <!-- Import Options Dialog -->
        <div v-if="showImportOptions" class="import-dialog">
          <div class="import-dialog-content">
            <h4>Import Options</h4>
            <p>How would you like to import the invoices?</p>
            <div class="import-options">
              <button class="btn btn-secondary" @click="doImport('merge')">
                <strong>Add</strong>
                <span>Add all invoices to existing</span>
              </button>
              <button class="btn btn-secondary" @click="doImport('replace')">
                <strong>Replace</strong>
                <span>Clear all and import fresh</span>
              </button>
            </div>
            <button class="btn btn-link" @click="cancelImport">Cancel</button>
          </div>
        </div>

        <!-- Hidden file input -->
        <input
          ref="importInput"
          type="file"
          accept=".json"
          class="hidden-input"
          @change="handleImportFile"
        >
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, computed, nextTick } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoiceHistory',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const {
      settings,
      savedInvoices,
      saveCurrentInvoice,
      loadSavedInvoice,
      updateSavedInvoice,
      deleteSavedInvoice,
      renameSavedInvoice,
      duplicateSavedInvoice,
      exportSavedInvoices,
      importSavedInvoices,
      currencies,
      invoiceStatuses,
      updateSavedInvoiceStatus
    } = useInvoice()

    const searchQuery = ref('')
    const notification = ref(null)
    const showImportOptions = ref(false)
    const pendingImportData = ref(null)
    const importInput = ref(null)
    const showSaveDialog = ref(false)
    const saveName = ref('')
    const saveNameInput = ref(null)
    const editingId = ref(null)
    const editingName = ref('')
    const renameInput = ref(null)

    const filteredInvoices = computed(() => {
      if (!searchQuery.value) return savedInvoices.value
      const query = searchQuery.value.toLowerCase()
      return savedInvoices.value.filter(inv =>
        inv.name?.toLowerCase().includes(query) ||
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.clientName?.toLowerCase().includes(query)
      )
    })

    const showNotification = (message, type = 'success') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 3000)
    }

    const formatAmount = (amount, currency) => {
      const curr = currencies[currency] || currencies['USD']
      return curr.symbol + (amount || 0).toFixed(2)
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const saveCurrentAsNew = () => {
      saveName.value = ''
      showSaveDialog.value = true
      nextTick(() => {
        saveNameInput.value?.focus()
      })
    }

    const confirmSave = () => {
      if (!saveName.value.trim()) return
      saveCurrentInvoice(saveName.value.trim())
      showSaveDialog.value = false
      saveName.value = ''
      showNotification('Invoice saved!')
    }

    const loadInvoice = (inv) => {
      if (editingId.value) return
      if (confirm(`Load "${inv.name}"? This will replace your current invoice.`)) {
        loadSavedInvoice(inv.id)
        showNotification('Invoice loaded')
        emit('close')
      }
    }

    const updateInvoice = (id) => {
      if (confirm('Update this saved invoice with current data?')) {
        updateSavedInvoice(id)
        showNotification('Invoice updated')
      }
    }

    const confirmDelete = (inv) => {
      if (confirm(`Delete "${inv.name}"? This cannot be undone.`)) {
        deleteSavedInvoice(inv.id)
        showNotification('Invoice deleted')
      }
    }

    const startRename = (inv) => {
      editingId.value = inv.id
      editingName.value = inv.name
      nextTick(() => {
        renameInput.value?.[0]?.focus()
      })
    }

    const saveRename = (id) => {
      if (editingName.value.trim()) {
        renameSavedInvoice(id, editingName.value.trim())
        showNotification('Invoice renamed')
      }
      cancelRename()
    }

    const cancelRename = () => {
      editingId.value = null
      editingName.value = ''
    }

    const duplicate = (id) => {
      duplicateSavedInvoice(id)
      showNotification('Invoice duplicated')
    }

    const triggerImport = () => {
      importInput.value?.click()
    }

    const handleImportFile = (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          pendingImportData.value = e.target.result
          showImportOptions.value = true
        } catch (error) {
          showNotification('Failed to read file', 'error')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    }

    const doImport = (mode) => {
      const result = importSavedInvoices(pendingImportData.value, mode)
      if (result.success) {
        showNotification(`Imported ${result.count} invoices`)
      } else {
        showNotification(`Import failed: ${result.error}`, 'error')
      }
      showImportOptions.value = false
      pendingImportData.value = null
    }

    const cancelImport = () => {
      showImportOptions.value = false
      pendingImportData.value = null
    }

    const changeStatus = (invoiceId, newStatus) => {
      updateSavedInvoiceStatus(invoiceId, newStatus)
      showNotification(`Status updated to ${invoiceStatuses[newStatus]?.label}`)
    }

    return {
      savedInvoices,
      invoiceStatuses,
      searchQuery,
      notification,
      showImportOptions,
      importInput,
      showSaveDialog,
      saveName,
      saveNameInput,
      editingId,
      editingName,
      renameInput,
      filteredInvoices,
      formatAmount,
      formatDate,
      saveCurrentAsNew,
      confirmSave,
      loadInvoice,
      updateInvoice,
      confirmDelete,
      startRename,
      saveRename,
      cancelRename,
      duplicate,
      triggerImport,
      handleImportFile,
      doImport,
      cancelImport,
      exportSavedInvoices,
      changeStatus
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.history-modal {
  max-width: 700px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.history-toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gray-100);
  border-radius: 8px;
  padding: 0 0.75rem;
}

.search-box svg {
  color: var(--gray-500);
  flex-shrink: 0;
}

.search-box .form-input {
  border: none;
  background: transparent;
  padding-left: 0;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.save-dialog {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.save-dialog h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
}

.save-dialog .form-input {
  margin-bottom: 0.75rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.invoices-list {
  min-height: 200px;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--gray-500);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 1rem 0;
}

.invoice-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.invoice-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.15s ease;
}

.invoice-card:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.invoice-card.editing {
  border-color: var(--primary);
}

.invoice-card-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  gap: 1rem;
}

.invoice-info {
  flex: 1;
  min-width: 0;
}

.invoice-name {
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rename-input {
  margin-bottom: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.9rem;
}

.invoice-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--gray-500);
}

.invoice-number {
  font-family: monospace;
  background: var(--gray-100);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.invoice-details {
  text-align: right;
  flex-shrink: 0;
}

.invoice-total {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--primary);
}

.invoice-date {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.invoice-card-actions {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  background: var(--gray-50);
  border-top: 1px solid var(--gray-100);
  justify-content: flex-end;
}

.notification {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  background: var(--gray-800);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 1001;
  animation: slideUp 0.2s ease;
}

.notification.error {
  background: #dc2626;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.import-dialog {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.import-dialog-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  max-width: 350px;
}

.import-dialog-content h4 {
  margin: 0 0 0.5rem 0;
}

.import-dialog-content p {
  color: var(--gray-600);
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.import-options .btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  text-align: left;
}

.import-options .btn strong {
  font-size: 0.875rem;
}

.import-options .btn span {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: normal;
}

.btn-link {
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-link:hover {
  color: var(--gray-700);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.hidden-input {
  display: none;
}

@media (max-width: 600px) {
  .history-toolbar {
    flex-direction: column;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }

  .invoice-card-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .invoice-details {
    text-align: left;
    margin-top: 0.5rem;
  }
}
</style>
