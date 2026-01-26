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
            <label class="form-label">Accent Color</label>
            <div class="color-picker-group">
              <input type="color" class="color-picker" v-model="settings.accentColor">
              <div class="color-preview">{{ settings.accentColor }}</div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Currency Symbol</label>
            <select class="form-select" v-model="settings.currency">
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="₹">₹ (INR)</option>
              <option value="A$">A$ (AUD)</option>
              <option value="C$">C$ (CAD)</option>
              <option value="CHF">CHF (Swiss Franc)</option>
            </select>
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
    const { settings, resetAll } = useInvoice()
    
    return {
      settings,
      resetAll
    }
  }
}
</script>
