<template>
  <div>
    <div class="settings-overlay" :class="{ open: isOpen }" @click="$emit('close')"></div>
    <div class="settings-panel" :class="{ open: isOpen }">
      <div class="settings-header">
        <h3 class="settings-title">Settings</h3>
        <button class="settings-close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="settings-body">
        <!-- Appearance -->
        <div class="settings-section">
          <h4 class="settings-section-title">Appearance</h4>
          <div class="form-group">
            <label class="form-label">Invoice Template</label>
            <div class="template-grid">
              <div
                class="template-option"
                :class="{ active: settings.template === 'classic' }"
                @click="settings.template = 'classic'"
              >
                <div class="template-preview template-preview-classic">
                  <div class="tp-header"></div>
                  <div class="tp-body"></div>
                  <div class="tp-table"></div>
                </div>
                <span>Classic</span>
              </div>
              <div
                class="template-option"
                :class="{ active: settings.template === 'modern' }"
                @click="settings.template = 'modern'"
              >
                <div class="template-preview template-preview-modern">
                  <div class="tp-header"></div>
                  <div class="tp-body"></div>
                  <div class="tp-table"></div>
                </div>
                <span>Modern</span>
              </div>
              <div
                class="template-option"
                :class="{ active: settings.template === 'minimal' }"
                @click="settings.template = 'minimal'"
              >
                <div class="template-preview template-preview-minimal">
                  <div class="tp-header"></div>
                  <div class="tp-body"></div>
                  <div class="tp-table"></div>
                </div>
                <span>Minimal</span>
              </div>
              <div
                class="template-option"
                :class="{ active: settings.template === 'bold' }"
                @click="settings.template = 'bold'"
              >
                <div class="template-preview template-preview-bold">
                  <div class="tp-header"></div>
                  <div class="tp-body"></div>
                  <div class="tp-table"></div>
                </div>
                <span>Bold</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Accent Color</label>
            <div class="color-picker-group">
              <input type="color" class="color-picker" v-model="settings.accentColor">
              <div class="color-preview">{{ settings.accentColor }}</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Currency</label>
            <select class="form-select" v-model="settings.currency" @change="onCurrencyChange">
              <option v-for="(curr, code) in currencies" :key="code" :value="code">
                {{ curr.symbol }} - {{ curr.name }} ({{ code }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Convert Items to Currency</label>
            <div class="convert-items-row">
              <select class="form-select" v-model="convertTargetCurrency">
                <option v-for="(curr, code) in availableTargetCurrencies" :key="code" :value="code">
                  {{ code }} - {{ curr.name }}
                </option>
              </select>
              <button
                class="btn btn-primary btn-convert"
                @click="handleConvertItems"
                :disabled="conversionLoading || convertTargetCurrency === settings.currency"
              >
                {{ conversionLoading ? '...' : 'Convert' }}
              </button>
            </div>
            <small class="convert-help">This will convert all item prices to the selected currency</small>
          </div>
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" class="checkbox-input" id="showConversion" v-model="settings.showConversion" @change="onConversionToggle">
              <label for="showConversion">Show currency conversion</label>
            </div>
          </div>
          <div class="form-group" v-if="settings.showConversion">
            <label class="form-label">Convert to</label>
            <select class="form-select" v-model="settings.convertToCurrency" @change="fetchExchangeRates">
              <option v-for="(curr, code) in availableConversionCurrencies" :key="code" :value="code">
                {{ curr.symbol }} - {{ curr.name }} ({{ code }})
              </option>
            </select>
            <div class="conversion-info" v-if="lastRateUpdate">
              <small>
                Rate: 1 {{ settings.currency }} = {{ currentRate }} {{ settings.convertToCurrency }}
                <br>
                <span class="rate-date">Updated: {{ formatRateDate }}</span>
                <button class="btn-refresh" @click="fetchExchangeRates" :disabled="conversionLoading">
                  {{ conversionLoading ? '...' : '↻' }}
                </button>
              </small>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Date Format</label>
            <select class="form-select" v-model="settings.dateFormat">
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD MMM YYYY">DD MMM YYYY</option>
            </select>
          </div>
        </div>

        <!-- Tax Settings -->
        <div class="settings-section">
          <h4 class="settings-section-title">Tax Settings</h4>
          <div class="form-group">
            <label class="form-label">Tax Mode</label>
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
          <div class="form-group" v-if="settings.taxMode === 'total'">
            <label class="form-label">Default Tax Rate (%)</label>
            <input type="number" class="form-input" v-model.number="settings.globalTaxRate" min="0" step="0.01">
          </div>
          <div class="form-group">
            <label class="form-label">Default Item Tax Rate (%)</label>
            <input type="number" class="form-input" v-model.number="settings.defaultItemTax" min="0" step="0.01">
          </div>
        </div>

        <!-- Options -->
        <div class="settings-section">
          <h4 class="settings-section-title">Options</h4>
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" class="checkbox-input" id="showDiscount" v-model="settings.showDiscount">
              <label for="showDiscount">Show Discount Field</label>
            </div>
          </div>
        </div>

        <!-- QR Code Settings -->
        <div class="settings-section">
          <h4 class="settings-section-title">QR Code Style</h4>
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" class="checkbox-input" id="qrUseAccent" v-model="settings.qrCodeUseAccent">
              <label for="qrUseAccent">Use accent color for QR codes</label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">QR Code Style</label>
            <div class="qr-style-selector">
              <button
                v-for="style in qrStyles"
                :key="style.value"
                class="qr-style-btn"
                :class="{ active: settings.qrCodeStyle === style.value }"
                @click="settings.qrCodeStyle = style.value"
              >
                <div class="qr-style-preview" :class="'qr-preview-' + style.value">
                  <div class="qr-mini"></div>
                </div>
                <span>{{ style.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="settings-section">
          <h4 class="settings-section-title">Backup & Restore</h4>
          <p class="section-description">Export or import all your data: invoices, clients, catalog items, email templates, and settings.</p>
          <div class="form-group">
            <button class="btn btn-primary backup-btn" @click="handleExportAll">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Export All Data
            </button>
            <button class="btn btn-secondary backup-btn" @click="triggerImportAll">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Import All Data
            </button>
            <input
              ref="importAllInput"
              type="file"
              accept=".json"
              class="hidden-input"
              @change="handleImportAll"
            >
          </div>
          <div v-if="importNotification" class="import-notification" :class="importNotification.type">
            {{ importNotification.message }}
          </div>
        </div>

        <!-- Settings Only -->
        <div class="settings-section">
          <h4 class="settings-section-title">Settings Only</h4>
          <div class="form-group">
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="$emit('export-settings')">
              Export Settings
            </button>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="$emit('import-settings')">
              Import Settings
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section danger-section">
          <h4 class="settings-section-title">Danger Zone</h4>
          <div class="form-group">
            <button class="btn btn-danger" style="width: 100%;" @click="resetAll">
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'SettingsPanel',
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'export-settings', 'import-settings'],
  setup() {
    const {
      settings,
      resetAll,
      currencies,
      exchangeRates,
      conversionLoading,
      lastRateUpdate,
      fetchExchangeRates,
      loadCachedRates,
      convertItemsToCurrency,
      exportAllData,
      importAllData
    } = useInvoice()

    const convertTargetCurrency = ref('EUR')
    const importAllInput = ref(null)
    const importNotification = ref(null)

    // Filter out the base currency from conversion options
    const availableConversionCurrencies = computed(() => {
      const filtered = {}
      for (const [code, data] of Object.entries(currencies)) {
        if (code !== settings.currency) {
          filtered[code] = data
        }
      }
      return filtered
    })

    // Filter for convert items dropdown
    const availableTargetCurrencies = computed(() => {
      const filtered = {}
      for (const [code, data] of Object.entries(currencies)) {
        if (code !== settings.currency) {
          filtered[code] = data
        }
      }
      return filtered
    })

    const handleConvertItems = async () => {
      if (confirm(`Convert all item prices from ${settings.currency} to ${convertTargetCurrency.value}?\n\nThis will permanently update all item prices.`)) {
        await convertItemsToCurrency(convertTargetCurrency.value)
      }
    }

    const currentRate = computed(() => {
      if (exchangeRates.value[settings.convertToCurrency]) {
        return exchangeRates.value[settings.convertToCurrency].toFixed(4)
      }
      return '...'
    })

    const formatRateDate = computed(() => {
      if (!lastRateUpdate.value) return ''
      const date = new Date(lastRateUpdate.value)
      return date.toLocaleDateString()
    })

    const onCurrencyChange = () => {
      if (settings.showConversion) {
        fetchExchangeRates()
      }
    }

    const onConversionToggle = () => {
      if (settings.showConversion) {
        loadCachedRates()
        fetchExchangeRates()
      }
    }

    // QR Code style options
    const qrStyles = [
      { value: 'default', label: 'Default' },
      { value: 'rounded', label: 'Rounded' },
      { value: 'minimal', label: 'Minimal' },
      { value: 'bold', label: 'Bold' },
      { value: 'dark', label: 'Dark' }
    ]

    // Unified export/import handlers
    const showImportNotification = (message, type = 'success') => {
      importNotification.value = { message, type }
      setTimeout(() => {
        importNotification.value = null
      }, 4000)
    }

    const handleExportAll = () => {
      exportAllData()
      showImportNotification('Backup file downloaded!')
    }

    const triggerImportAll = () => {
      importAllInput.value?.click()
    }

    const handleImportAll = (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!confirm('This will replace ALL your current data (invoices, clients, catalog, settings). Continue?')) {
        event.target.value = ''
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = importAllData(e.target.result)
        if (result.success) {
          showImportNotification(result.message)
        } else {
          showImportNotification(`Import failed: ${result.error}`, 'error')
        }
      }
      reader.readAsText(file)
      event.target.value = ''
    }

    return {
      settings,
      resetAll,
      currencies,
      exchangeRates,
      conversionLoading,
      lastRateUpdate,
      availableConversionCurrencies,
      availableTargetCurrencies,
      currentRate,
      formatRateDate,
      fetchExchangeRates,
      onCurrencyChange,
      onConversionToggle,
      convertTargetCurrency,
      handleConvertItems,
      qrStyles,
      importAllInput,
      importNotification,
      handleExportAll,
      triggerImportAll,
      handleImportAll
    }
  }
}
</script>
