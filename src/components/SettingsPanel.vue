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

        <!-- Data Management -->
        <div class="settings-section">
          <h4 class="settings-section-title">Data Management</h4>
          <div class="form-group">
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="$emit('export-settings')">
              Export Settings
            </button>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="$emit('import-settings')">
              Import Settings
            </button>
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
      convertItemsToCurrency
    } = useInvoice()

    const convertTargetCurrency = ref('EUR')

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
      handleConvertItems
    }
  }
}
</script>
