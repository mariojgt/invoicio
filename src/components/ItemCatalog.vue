<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal catalog-modal">
        <div class="modal-header">
          <h2>Item Catalog</h2>
          <button class="btn btn-icon" @click="$emit('close')" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- Search and Actions -->
          <div class="catalog-toolbar">
            <div class="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search items..."
                class="form-input"
              >
            </div>
            <div class="toolbar-actions">
              <button class="btn btn-secondary btn-sm" @click="showAddForm = true" v-if="!showAddForm && !editingItem">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Item
              </button>
              <button class="btn btn-secondary btn-sm" @click="triggerImport">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Import
              </button>
              <button class="btn btn-secondary btn-sm" @click="exportCatalog" :disabled="catalogItems.length === 0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Export
              </button>
            </div>
          </div>

          <!-- Add/Edit Form -->
          <div v-if="showAddForm || editingItem" class="item-form">
            <h4>{{ editingItem ? 'Edit Item' : 'Add New Item' }}</h4>
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Description *</label>
                <input type="text" class="form-input" v-model="formData.description" placeholder="Product or service name">
              </div>
              <div class="form-group">
                <label>Price ({{ settings.currency }})</label>
                <input type="number" class="form-input" v-model.number="formData.price" min="0" step="0.01" placeholder="0.00">
              </div>
              <div class="form-group">
                <label>Default Tax %</label>
                <input type="number" class="form-input" v-model.number="formData.tax" min="0" step="0.01" placeholder="0">
              </div>
              <div class="form-group">
                <label>Default Quantity</label>
                <input type="number" class="form-input" v-model.number="formData.defaultQuantity" min="1" step="1" placeholder="1">
              </div>
              <div class="form-group">
                <label>Category</label>
                <input type="text" class="form-input" v-model="formData.category" placeholder="e.g., Services, Products">
              </div>
              <div class="form-group">
                <label>SKU/Code</label>
                <input type="text" class="form-input" v-model="formData.sku" placeholder="Optional identifier">
              </div>
              <div class="form-group">
                <label>Unit</label>
                <input type="text" class="form-input" v-model="formData.unit" placeholder="e.g., hour, piece, kg">
              </div>
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea class="form-input" v-model="formData.notes" rows="2" placeholder="Additional details..."></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" @click="cancelForm">Cancel</button>
              <button class="btn btn-primary" @click="saveItem" :disabled="!formData.description">
                {{ editingItem ? 'Update' : 'Add' }} Item
              </button>
            </div>
          </div>

          <!-- Items List -->
          <div v-else class="items-list">
            <div v-if="filteredItems.length === 0" class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p v-if="searchQuery">No items match your search</p>
              <p v-else>No items in catalog yet</p>
              <button v-if="!searchQuery" class="btn btn-primary btn-sm" @click="showAddForm = true">
                Add Your First Item
              </button>
            </div>

            <!-- Category Groups -->
            <div v-else>
              <div v-for="category in groupedItems" :key="category.name" class="category-group">
                <div class="category-header" v-if="category.name">
                  <span class="category-name">{{ category.name }}</span>
                  <span class="category-count">{{ category.items.length }} items</span>
                </div>
                <div class="catalog-items">
                  <div
                    v-for="item in category.items"
                    :key="item.id"
                    class="catalog-item"
                    @click="selectItem(item)"
                  >
                    <div class="item-main">
                      <div class="item-description">
                        {{ item.description }}
                        <span v-if="item.sku" class="item-sku">{{ item.sku }}</span>
                      </div>
                      <div class="item-details">
                        <span class="item-price">{{ formatCurrency(item.price) }}</span>
                        <span v-if="item.unit" class="item-unit">/ {{ item.unit }}</span>
                        <span v-if="item.tax" class="item-tax">+{{ item.tax }}% tax</span>
                      </div>
                    </div>
                    <div class="item-actions" @click.stop>
                      <button class="btn btn-icon btn-sm" @click="editItem(item)" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn btn-icon btn-sm btn-danger" @click="confirmDelete(item)" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
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
            <p>How would you like to import the catalog?</p>
            <div class="import-options">
              <button class="btn btn-secondary" @click="doImport('merge')">
                <strong>Merge</strong>
                <span>Add new items, update existing</span>
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
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'ItemCatalog',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'item-selected'],
  setup(props, { emit }) {
    const {
      settings,
      catalogItems,
      addCatalogItem,
      updateCatalogItem,
      deleteCatalogItem,
      addCatalogItemToInvoice,
      exportCatalog,
      importCatalog,
      formatCurrency
    } = useInvoice()

    const searchQuery = ref('')
    const showAddForm = ref(false)
    const editingItem = ref(null)
    const notification = ref(null)
    const showImportOptions = ref(false)
    const pendingImportData = ref(null)
    const importInput = ref(null)

    const emptyForm = {
      description: '',
      price: 0,
      tax: 0,
      defaultQuantity: 1,
      category: '',
      sku: '',
      unit: '',
      notes: ''
    }

    const formData = ref({ ...emptyForm })

    const filteredItems = computed(() => {
      if (!searchQuery.value) return catalogItems.value
      const query = searchQuery.value.toLowerCase()
      return catalogItems.value.filter(item =>
        item.description?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.sku?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      )
    })

    const groupedItems = computed(() => {
      const groups = {}
      filteredItems.value.forEach(item => {
        const category = item.category || 'Uncategorized'
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(item)
      })

      // Sort categories, put Uncategorized last
      return Object.keys(groups)
        .sort((a, b) => {
          if (a === 'Uncategorized') return 1
          if (b === 'Uncategorized') return -1
          return a.localeCompare(b)
        })
        .map(name => ({
          name: name === 'Uncategorized' ? '' : name,
          items: groups[name].sort((a, b) => a.description.localeCompare(b.description))
        }))
    })

    const showNotification = (message, type = 'success') => {
      notification.value = { message, type }
      setTimeout(() => {
        notification.value = null
      }, 3000)
    }

    const cancelForm = () => {
      showAddForm.value = false
      editingItem.value = null
      formData.value = { ...emptyForm }
    }

    const saveItem = () => {
      if (!formData.value.description) return

      if (editingItem.value) {
        updateCatalogItem(editingItem.value.id, formData.value)
        showNotification('Item updated successfully')
      } else {
        addCatalogItem(formData.value)
        showNotification('Item added to catalog')
      }

      cancelForm()
    }

    const editItem = (item) => {
      editingItem.value = item
      formData.value = {
        description: item.description || '',
        price: item.price || 0,
        tax: item.tax || 0,
        defaultQuantity: item.defaultQuantity || 1,
        category: item.category || '',
        sku: item.sku || '',
        unit: item.unit || '',
        notes: item.notes || ''
      }
    }

    const confirmDelete = (item) => {
      if (confirm(`Delete "${item.description}" from catalog?`)) {
        deleteCatalogItem(item.id)
        showNotification('Item deleted')
      }
    }

    const selectItem = (item) => {
      addCatalogItemToInvoice(item.id)
      showNotification(`"${item.description}" added to invoice`)
      emit('item-selected', item)
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
      const result = importCatalog(pendingImportData.value, mode)
      if (result.success) {
        showNotification(`Imported ${result.count} items`)
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

    return {
      settings,
      catalogItems,
      searchQuery,
      showAddForm,
      editingItem,
      formData,
      notification,
      showImportOptions,
      importInput,
      filteredItems,
      groupedItems,
      formatCurrency,
      cancelForm,
      saveItem,
      editItem,
      confirmDelete,
      selectItem,
      triggerImport,
      handleImportFile,
      doImport,
      cancelImport,
      exportCatalog
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

.catalog-modal {
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.catalog-toolbar {
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

.item-form {
  background: var(--gray-50);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.item-form h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--gray-700);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--gray-600);
  margin-bottom: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
}

.items-list {
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

.category-group {
  margin-bottom: 1.5rem;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.category-name {
  font-weight: 600;
  color: var(--gray-700);
  font-size: 0.875rem;
}

.category-count {
  font-size: 0.75rem;
  color: var(--gray-500);
}

.catalog-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.catalog-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.catalog-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-description {
  font-weight: 500;
  color: var(--gray-800);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-sku {
  font-size: 0.7rem;
  font-weight: normal;
  color: var(--gray-500);
  background: var(--gray-100);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.item-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.8rem;
}

.item-price {
  font-weight: 600;
  color: var(--accent-color);
}

.item-unit {
  color: var(--gray-500);
}

.item-tax {
  color: var(--gray-500);
  font-size: 0.7rem;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.catalog-item:hover .item-actions {
  opacity: 1;
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

.hidden-input {
  display: none;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .catalog-toolbar {
    flex-direction: column;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }
}
</style>
