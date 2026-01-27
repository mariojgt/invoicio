<template>
  <div class="client-database-overlay" v-if="isOpen" @click.self="$emit('close')">
    <div class="client-database-modal">
      <div class="modal-header">
        <h2>Client Database</h2>
        <button class="btn-close" @click="$emit('close')" aria-label="Close">×</button>
      </div>

      <div class="modal-toolbar">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search clients..."
            class="search-input"
          >
        </div>
        <div class="toolbar-actions">
          <button class="btn btn-secondary btn-sm" @click="showAddForm = true" v-if="!showAddForm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Client
          </button>
          <button class="btn btn-secondary btn-sm" @click="triggerImport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Import
          </button>
          <button class="btn btn-secondary btn-sm" @click="exportClients" :disabled="clients.length === 0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Add/Edit Client Form -->
      <div class="client-form" v-if="showAddForm || editingClient">
        <h3>{{ editingClient ? 'Edit Client' : 'Add New Client' }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" class="form-input" v-model="formData.name" placeholder="Client or Company Name">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" v-model="formData.email" placeholder="client@email.com">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea class="form-textarea" v-model="formData.address" placeholder="Full address..." rows="2"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-input" v-model="formData.phone" placeholder="+1 234 567 8900">
          </div>
          <div class="form-group">
            <label class="form-label">Company</label>
            <input type="text" class="form-input" v-model="formData.company" placeholder="Company Name">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">VAT/Tax ID</label>
            <input type="text" class="form-input" v-model="formData.taxId" placeholder="VAT or Tax ID">
          </div>
          <div class="form-group">
            <label class="form-label">Website</label>
            <input type="url" class="form-input" v-model="formData.website" placeholder="https://...">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" v-model="formData.notes" placeholder="Internal notes about this client..." rows="2"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" @click="cancelForm">Cancel</button>
          <button class="btn btn-primary" @click="saveClient" :disabled="!formData.name">
            {{ editingClient ? 'Update Client' : 'Add Client' }}
          </button>
        </div>
      </div>

      <!-- Client List -->
      <div class="client-list" v-if="!showAddForm && !editingClient">
        <div v-if="filteredClients.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <p v-if="searchQuery">No clients found matching "{{ searchQuery }}"</p>
          <p v-else>No clients yet. Add your first client to get started!</p>
        </div>

        <div
          v-for="client in filteredClients"
          :key="client.id"
          class="client-card"
        >
          <div class="client-avatar">
            {{ getInitials(client.name) }}
          </div>
          <div class="client-info">
            <div class="client-name">{{ client.name }}</div>
            <div class="client-email" v-if="client.email">{{ client.email }}</div>
            <div class="client-company" v-if="client.company">{{ client.company }}</div>
          </div>
          <div class="client-actions">
            <button class="btn btn-primary btn-sm" @click="useClient(client)" title="Use in invoice">
              Use
            </button>
            <button class="btn btn-secondary btn-sm btn-icon" @click="editClient(client)" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-danger btn-sm btn-icon" @click="confirmDelete(client)" title="Delete">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <span class="client-count">{{ clients.length }} client{{ clients.length !== 1 ? 's' : '' }} total</span>
      </div>

      <!-- Hidden file input for import -->
      <input
        ref="importInput"
        type="file"
        accept=".json,.csv"
        class="hidden-input"
        @change="handleImport"
      >

      <!-- Import Options Modal -->
      <div class="import-modal" v-if="showImportOptions">
        <div class="import-modal-content">
          <h3>Import Options</h3>
          <p>How do you want to import the clients?</p>
          <div class="import-options">
            <button class="btn btn-secondary" @click="doImport('merge')">
              <strong>Merge</strong>
              <span>Add new clients, update existing by email</span>
            </button>
            <button class="btn btn-secondary" @click="doImport('replace')">
              <strong>Replace All</strong>
              <span>Remove existing clients and import new ones</span>
            </button>
          </div>
          <button class="btn btn-secondary" @click="cancelImport">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'ClientDatabase',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'client-selected'],
  setup(props, { emit }) {
    const {
      clients,
      addClient,
      updateClient,
      deleteClient,
      selectClient,
      exportClients,
      importClients
    } = useInvoice()

    const searchQuery = ref('')
    const showAddForm = ref(false)
    const editingClient = ref(null)
    const importInput = ref(null)
    const showImportOptions = ref(false)
    const pendingImportData = ref(null)

    const formData = ref({
      name: '',
      email: '',
      address: '',
      phone: '',
      company: '',
      taxId: '',
      website: '',
      notes: ''
    })

    const filteredClients = computed(() => {
      if (!searchQuery.value) return clients.value
      const query = searchQuery.value.toLowerCase()
      return clients.value.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query)
      )
    })

    const getInitials = (name) => {
      if (!name) return '?'
      return name.split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    }

    const resetForm = () => {
      formData.value = {
        name: '',
        email: '',
        address: '',
        phone: '',
        company: '',
        taxId: '',
        website: '',
        notes: ''
      }
    }

    const cancelForm = () => {
      showAddForm.value = false
      editingClient.value = null
      resetForm()
    }

    const saveClient = () => {
      if (!formData.value.name) return

      if (editingClient.value) {
        updateClient(editingClient.value.id, { ...formData.value })
      } else {
        addClient({ ...formData.value })
      }
      cancelForm()
    }

    const editClient = (client) => {
      editingClient.value = client
      formData.value = { ...client }
    }

    const confirmDelete = (client) => {
      if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
        deleteClient(client.id)
      }
    }

    const useClient = (client) => {
      selectClient(client.id)
      emit('client-selected', client)
      emit('close')
    }

    const triggerImport = () => {
      importInput.value?.click()
    }

    const handleImport = (event) => {
      const file = event.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          pendingImportData.value = e.target.result
          showImportOptions.value = true
        } catch (error) {
          alert('Failed to read file: ' + error.message)
        }
      }
      reader.readAsText(file)
      event.target.value = '' // Reset input
    }

    const doImport = (mode) => {
      const result = importClients(pendingImportData.value, mode)
      if (result.success) {
        alert(`Successfully imported ${result.count} client(s)!`)
      } else {
        alert('Import failed: ' + result.error)
      }
      showImportOptions.value = false
      pendingImportData.value = null
    }

    const cancelImport = () => {
      showImportOptions.value = false
      pendingImportData.value = null
    }

    return {
      clients,
      searchQuery,
      showAddForm,
      editingClient,
      formData,
      importInput,
      showImportOptions,
      filteredClients,
      getInitials,
      cancelForm,
      saveClient,
      editClient,
      confirmDelete,
      useClient,
      triggerImport,
      handleImport,
      doImport,
      cancelImport,
      exportClients
    }
  }
}
</script>

<style scoped>
.client-database-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.client-database-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--gray-400);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.btn-close:hover {
  background: var(--gray-100);
  color: var(--gray-600);
}

.modal-toolbar {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 0 0.75rem;
}

.search-box svg {
  color: var(--gray-400);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: none;
  padding: 0.625rem 0;
  font-size: 0.875rem;
  width: 100%;
  outline: none;
}

.toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.client-form {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-100);
  background: var(--gray-50);
}

.client-form h3 {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
}

.client-form .form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.client-form .form-group {
  margin-bottom: 0;
}

.client-form .form-group:last-child {
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.client-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--gray-400);
  text-align: center;
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
}

.client-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  transition: background 0.15s;
}

.client-card:hover {
  background: var(--gray-50);
}

.client-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.client-info {
  flex: 1;
  min-width: 0;
}

.client-name {
  font-weight: 600;
  color: var(--gray-900);
}

.client-email {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.client-company {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.client-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.5rem !important;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
  border-radius: 0 0 12px 12px;
}

.client-count {
  font-size: 0.875rem;
  color: var(--gray-500);
}

.hidden-input {
  display: none;
}

/* Import Modal */
.import-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.import-modal-content {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.import-modal-content h3 {
  margin: 0 0 0.5rem;
}

.import-modal-content p {
  color: var(--gray-600);
  margin-bottom: 1.5rem;
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
  display: block;
  margin-bottom: 0.25rem;
}

.import-options .btn span {
  font-size: 0.75rem;
  color: var(--gray-500);
  font-weight: normal;
}

@media (max-width: 600px) {
  .client-form .form-row {
    grid-template-columns: 1fr;
  }

  .modal-toolbar {
    flex-direction: column;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
