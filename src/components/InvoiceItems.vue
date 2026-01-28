<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title-row">
        <h3 class="card-title">Items</h3>
        <button class="btn btn-secondary btn-sm" @click="$emit('open-catalog')" title="Browse item catalog">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          Catalog
        </button>
        <button class="btn btn-secondary btn-sm" @click="showScanModal = true" title="Scan image with AI">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          AI Scan
        </button>
      </div>
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <label style="font-size: 0.875rem; color: var(--gray-600);">Tax Mode:</label>
        <div class="tax-mode-toggle">
          <button
            class="tax-mode-btn"
            :class="{ active: settings.taxMode === 'per-item' }"
            @click="settings.taxMode = 'per-item'"
          >
            Per Item
          </button>
          <button
            class="tax-mode-btn"
            :class="{ active: settings.taxMode === 'total' }"
            @click="settings.taxMode = 'total'"
          >
            On Total
          </button>
        </div>
      </div>
    </div>
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-description">Description</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Price</th>
          <th v-if="settings.taxMode === 'per-item'" class="col-tax">Tax %</th>
          <th class="col-amount">Amount</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in invoice.items" :key="index">
          <td>
            <input type="text" class="form-input" v-model="item.description" placeholder="Item description">
          </td>
          <td>
            <input type="number" class="form-input" v-model.number="item.quantity" min="0" step="1">
          </td>
          <td>
            <input type="number" class="form-input" v-model.number="item.price" min="0" step="0.01">
          </td>
          <td v-if="settings.taxMode === 'per-item'">
            <input type="number" class="form-input" v-model.number="item.tax" min="0" step="0.01">
          </td>
          <td class="col-amount">
            <div class="item-amount">{{ formatCurrency(calculateItemAmount(item)) }}</div>
          </td>
          <td>
            <div class="row-actions">
              <button
                class="btn btn-icon btn-sm"
                @click="saveItemToCatalog(index)"
                :disabled="!item.description"
                title="Save to catalog"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              </button>
              <button class="btn btn-icon btn-danger btn-sm" @click="removeItem(index)" v-if="invoice.items.length > 1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="add-item-row">
      <button class="btn btn-secondary" @click="addItem">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Item
      </button>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-table">
        <div class="totals-row subtotal">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">{{ formatCurrency(subtotal) }}</span>
        </div>
        <div v-if="settings.taxMode === 'total'" class="totals-row tax">
          <span class="totals-label">
            Tax
            <input
              type="number"
              style="width: 50px; padding: 2px 4px; font-size: 0.75rem; border: 1px solid var(--gray-300); border-radius: 4px;"
              v-model.number="settings.globalTaxRate"
              min="0"
              step="0.01"
            >%
          </span>
          <span class="totals-value">{{ formatCurrency(totalTax) }}</span>
        </div>
        <div v-else class="totals-row tax">
          <span class="totals-label">Tax (per item)</span>
          <span class="totals-value">{{ formatCurrency(totalTax) }}</span>
        </div>
        <div v-if="settings.showDiscount" class="totals-row">
          <span class="totals-label">
            Discount
            <input
              type="number"
              style="width: 50px; padding: 2px 4px; font-size: 0.75rem; border: 1px solid var(--gray-300); border-radius: 4px;"
              v-model.number="invoice.discountPercent"
              min="0"
              step="0.01"
            >%
          </span>
          <span class="totals-value">-{{ formatCurrency(discountAmount) }}</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">Total</span>
          <span class="totals-value">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>
    </div>

    <!-- Notification Toast -->
    <div v-if="notification" class="item-notification">
      {{ notification }}
    </div>

    <!-- AI Scan Modal -->
    <Teleport to="body">
      <div v-if="showScanModal" class="modal-overlay" @click.self="closeScanModal">
        <div class="modal scan-modal">
          <div class="modal-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              AI Image Scanner
            </h2>
            <button class="btn btn-icon" @click="closeScanModal" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- API Key Setup -->
            <div v-if="!hasApiKey()" class="api-key-setup">
              <div class="setup-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </div>
              <h3>OpenAI API Key Required</h3>
              <p>To use the AI image scanner, you need to provide your OpenAI API key. Your key is stored locally and never sent to our servers.</p>
              <div class="api-key-input">
                <input
                  type="password"
                  class="form-input"
                  v-model="tempApiKey"
                  placeholder="sk-..."
                  @keyup.enter="saveKey"
                >
                <button class="btn btn-primary" @click="saveKey" :disabled="!tempApiKey">
                  Save Key
                </button>
              </div>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" class="api-link">
                Get your API key from OpenAI →
              </a>
            </div>

            <!-- Image Upload -->
            <div v-else class="scan-content">
              <div
                class="upload-zone"
                :class="{ 'drag-over': isDragging, 'has-image': previewImage }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <div v-if="!previewImage" class="upload-prompt">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Drop an image here or click to upload</p>
                  <span>Supports: JPG, PNG, WebP, GIF</span>
                </div>
                <div v-else class="preview-container">
                  <img :src="previewImage" alt="Preview" class="preview-image">
                  <button class="btn btn-icon remove-preview" @click.stop="clearPreview">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>

              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden-input"
                @change="handleFileSelect"
              >

              <!-- Scanning state -->
              <div v-if="isScanning" class="scanning-state">
                <div class="spinner"></div>
                <p>Analyzing image with AI...</p>
              </div>

              <!-- Scan Results -->
              <div v-if="scannedItems.length > 0" class="scan-results">
                <h4>Detected Items ({{ scannedItems.length }})</h4>
                <div class="scanned-items-list">
                  <div v-for="(item, index) in scannedItems" :key="index" class="scanned-item">
                    <input type="checkbox" v-model="item.selected" :id="'item-' + index">
                    <label :for="'item-' + index" class="scanned-item-info">
                      <span class="scanned-description">{{ item.description }}</span>
                      <span class="scanned-details">
                        Qty: {{ item.quantity }} ×
                        <span v-if="item.convertedPrice !== undefined">
                          <s style="color: var(--gray-400); font-size: 0.75rem;">{{ formatSourcePrice(item.price) }}</s>
                          → {{ formatCurrency(item.convertedPrice) }}
                        </span>
                        <span v-else>{{ formatSourcePrice(item.price) }}</span>
                      </span>
                    </label>
                  </div>
                </div>

                <!-- Currency Conversion -->
                <div class="currency-conversion-section">
                  <div class="conversion-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <span>Currency Conversion</span>
                  </div>
                  <div class="conversion-row">
                    <div class="conversion-field">
                      <label>Prices are in:</label>
                      <select v-model="sourceCurrency" class="form-input form-input-sm">
                        <option v-for="(info, code) in currencies" :key="code" :value="code">
                          {{ code }} ({{ info.symbol }})
                        </option>
                      </select>
                    </div>
                    <div class="conversion-arrow">→</div>
                    <div class="conversion-field">
                      <label>Convert to:</label>
                      <select v-model="targetCurrency" class="form-input form-input-sm" disabled>
                        <option :value="settings.currency">
                          {{ settings.currency }} ({{ currencies[settings.currency]?.symbol }})
                        </option>
                      </select>
                    </div>
                    <button
                      class="btn btn-secondary btn-sm"
                      @click="convertPrices"
                      :disabled="isConverting || sourceCurrency === settings.currency"
                    >
                      <span v-if="isConverting" class="spinner-sm"></span>
                      <span v-else>Convert</span>
                    </button>
                  </div>
                  <div v-if="conversionRate" class="conversion-info">
                    Rate: 1 {{ sourceCurrency }} = {{ conversionRate.toFixed(4) }} {{ settings.currency }}
                  </div>
                </div>
              </div>

              <!-- Error state -->
              <div v-if="scanError" class="scan-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ scanError }}
              </div>

              <!-- Actions -->
              <div class="scan-actions">
                <button
                  class="btn btn-primary"
                  @click="startScan"
                  :disabled="!selectedFile || isScanning"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Scan Image
                </button>
                <button
                  v-if="scannedItems.length > 0"
                  class="btn btn-success"
                  @click="addScannedItems"
                  :disabled="!hasSelectedItems"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Add {{ selectedItemCount }} Item{{ selectedItemCount !== 1 ? 's' : '' }}
                </button>
              </div>

              <!-- API Key Management -->
              <div class="api-key-footer">
                <span>Using OpenAI API</span>
                <button class="btn btn-link btn-sm" @click="clearApiKey(); tempApiKey = ''">
                  Change API Key
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useInvoice } from '../composables/useInvoice'
import { useImageScanner } from '../composables/useImageScanner'
import { currencies } from '../composables/constants'

export default {
  name: 'InvoiceItems',
  emits: ['open-catalog'],
  setup() {
    const {
      invoice,
      settings,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      calculateItemAmount,
      formatCurrency,
      addItem,
      removeItem,
      saveInvoiceItemToCatalog
    } = useInvoice()

    const {
      isScanning,
      scanError,
      saveApiKey,
      hasApiKey,
      clearApiKey,
      scanImage
    } = useImageScanner()

    const notification = ref(null)
    const showScanModal = ref(false)
    const tempApiKey = ref('')
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const previewImage = ref(null)
    const isDragging = ref(false)
    const scannedItems = ref([])

    // Currency conversion
    const sourceCurrency = ref('USD')
    const targetCurrency = computed(() => settings.currency)
    const isConverting = ref(false)
    const conversionRate = ref(null)

    const showNotification = (message) => {
      notification.value = message
      setTimeout(() => {
        notification.value = null
      }, 2000)
    }

    const saveItemToCatalog = (index) => {
      const result = saveInvoiceItemToCatalog(index)
      if (result) {
        showNotification('Item saved to catalog!')
      }
    }

    // AI Scanner functions
    const saveKey = () => {
      if (tempApiKey.value) {
        saveApiKey(tempApiKey.value)
        tempApiKey.value = ''
      }
    }

    const triggerFileInput = () => {
      fileInput.value?.click()
    }

    const handleFileSelect = (event) => {
      const file = event.target.files?.[0]
      if (file) {
        processFile(file)
      }
    }

    const handleDrop = (event) => {
      isDragging.value = false
      const file = event.dataTransfer.files?.[0]
      if (file && file.type.startsWith('image/')) {
        processFile(file)
      }
    }

    const processFile = (file) => {
      selectedFile.value = file
      scannedItems.value = []

      const reader = new FileReader()
      reader.onload = (e) => {
        previewImage.value = e.target.result
      }
      reader.readAsDataURL(file)
    }

    const clearPreview = () => {
      selectedFile.value = null
      previewImage.value = null
      scannedItems.value = []
      conversionRate.value = null
      sourceCurrency.value = 'USD'
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const startScan = async () => {
      if (!selectedFile.value) return

      conversionRate.value = null

      try {
        const items = await scanImage(selectedFile.value)
        scannedItems.value = items.map(item => ({
          ...item,
          selected: true,
          convertedPrice: undefined
        }))

        if (items.length === 0) {
          showNotification('No items detected in the image')
        }
      } catch (error) {
        console.error('Scan failed:', error)
      }
    }

    // Format price in source currency
    const formatSourcePrice = (price) => {
      const symbol = currencies[sourceCurrency.value]?.symbol || sourceCurrency.value
      return symbol + price.toFixed(2)
    }

    // Convert prices using Frankfurter API (free)
    const convertPrices = async () => {
      if (sourceCurrency.value === settings.currency) return

      isConverting.value = true

      try {
        const response = await fetch(
          `https://api.frankfurter.app/latest?from=${sourceCurrency.value}&to=${settings.currency}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate')
        }

        const data = await response.json()
        const rate = data.rates[settings.currency]

        if (!rate) {
          throw new Error('Exchange rate not available')
        }

        conversionRate.value = rate

        // Update all scanned items with converted prices
        scannedItems.value = scannedItems.value.map(item => ({
          ...item,
          convertedPrice: parseFloat((item.price * rate).toFixed(2))
        }))

        showNotification(`Converted to ${settings.currency}`)
      } catch (error) {
        console.error('Conversion failed:', error)
        showNotification('Failed to convert currency')
      } finally {
        isConverting.value = false
      }
    }

    const selectedItemCount = computed(() => {
      return scannedItems.value.filter(item => item.selected).length
    })

    const hasSelectedItems = computed(() => selectedItemCount.value > 0)

    const addScannedItems = () => {
      const itemsToAdd = scannedItems.value.filter(item => item.selected)

      itemsToAdd.forEach(item => {
        invoice.items.push({
          description: item.description,
          quantity: item.quantity,
          price: item.convertedPrice !== undefined ? item.convertedPrice : item.price,
          tax: settings.defaultItemTax || 0
        })
      })

      showNotification(`Added ${itemsToAdd.length} item${itemsToAdd.length !== 1 ? 's' : ''} from scan`)
      closeScanModal()
    }

    const closeScanModal = () => {
      showScanModal.value = false
      clearPreview()
    }

    return {
      invoice,
      settings,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      calculateItemAmount,
      formatCurrency,
      addItem,
      removeItem,
      saveItemToCatalog,
      notification,
      // AI Scanner
      showScanModal,
      tempApiKey,
      fileInput,
      selectedFile,
      previewImage,
      isDragging,
      scannedItems,
      isScanning,
      scanError,
      hasApiKey,
      clearApiKey,
      saveKey,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      clearPreview,
      startScan,
      selectedItemCount,
      hasSelectedItems,
      addScannedItems,
      closeScanModal,
      // Currency conversion
      currencies,
      sourceCurrency,
      targetCurrency,
      isConverting,
      conversionRate,
      formatSourcePrice,
      convertPrices
    }
  }
}
</script>

<style scoped>
.card-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 0.25rem;
}

.item-notification {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  background: var(--gray-800);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  z-index: 1000;
  animation: slideUpNotif 0.2s ease;
}

@keyframes slideUpNotif {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* AI Scanner Modal Styles */
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
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.scan-modal {
  max-width: 550px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.hidden-input {
  display: none;
}

/* API Key Setup */
.api-key-setup {
  text-align: center;
  padding: 1rem;
}

.setup-icon {
  color: var(--primary);
  margin-bottom: 1rem;
}

.api-key-setup h3 {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
}

.api-key-setup p {
  color: var(--gray-600);
  font-size: 0.875rem;
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.api-key-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.api-key-input .form-input {
  flex: 1;
}

.api-link {
  font-size: 0.85rem;
  color: var(--primary);
  text-decoration: none;
}

.api-link:hover {
  text-decoration: underline;
}

/* Upload Zone */
.upload-zone {
  border: 2px dashed var(--gray-300);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--gray-50);
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: var(--primary);
  background: rgba(79, 70, 229, 0.05);
}

.upload-zone.has-image {
  padding: 0.5rem;
  background: white;
}

.upload-prompt {
  color: var(--gray-500);
}

.upload-prompt svg {
  margin-bottom: 0.75rem;
  color: var(--gray-400);
}

.upload-prompt p {
  margin: 0 0 0.25rem;
  font-weight: 500;
  color: var(--gray-700);
}

.upload-prompt span {
  font-size: 0.8rem;
}

.preview-container {
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 250px;
  border-radius: 8px;
  object-fit: contain;
}

.remove-preview {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  padding: 0;
}

.remove-preview:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* Scanning State */
.scanning-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: var(--gray-600);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Scan Results */
.scan-results {
  margin-top: 1rem;
  border-top: 1px solid var(--gray-200);
  padding-top: 1rem;
}

.scan-results h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--gray-700);
}

.scanned-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}

.scanned-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--gray-50);
  border-radius: 8px;
}

.scanned-item input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 16px;
  height: 16px;
  accent-color: var(--primary);
}

.scanned-item-info {
  flex: 1;
  cursor: pointer;
}

.scanned-description {
  display: block;
  font-weight: 500;
  color: var(--gray-800);
  font-size: 0.9rem;
}

.scanned-details {
  display: block;
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-top: 0.125rem;
}

/* Currency Conversion Section */
.currency-conversion-section {
  margin-top: 1rem;
  padding: 0.875rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  border: 1px solid #bae6fd;
}

.conversion-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 0.75rem;
}

.conversion-row {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.conversion-field {
  flex: 1;
  min-width: 100px;
}

.conversion-field label {
  display: block;
  font-size: 0.7rem;
  color: var(--gray-600);
  margin-bottom: 0.25rem;
}

.conversion-field select {
  width: 100%;
  font-size: 0.8rem;
  padding: 0.375rem 0.5rem;
}

.conversion-arrow {
  color: var(--gray-400);
  font-size: 1.25rem;
  padding-bottom: 0.25rem;
}

.conversion-row .btn {
  white-space: nowrap;
}

.conversion-info {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #0369a1;
  text-align: right;
}

.spinner-sm {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.form-input-sm {
  font-size: 0.85rem;
  padding: 0.375rem 0.5rem;
}

/* Error State */
.scan-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 1rem;
}

/* Actions */
.scan-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.scan-actions .btn {
  flex: 1;
}

.btn-success {
  background: #16a34a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #15803d;
}

/* API Key Footer */
.api-key-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-200);
  font-size: 0.8rem;
  color: var(--gray-500);
}

.btn-link {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
}

.btn-link:hover {
  text-decoration: underline;
}
</style>
