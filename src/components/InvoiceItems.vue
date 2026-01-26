<template>
  <div class="card">
    <div class="card-header">
      <h3 class="card-title">Items</h3>
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
            <button class="btn btn-icon btn-danger btn-sm" @click="removeItem(index)" v-if="invoice.items.length > 1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
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
  </div>
</template>

<script>
import { useInvoice } from '../composables/useInvoice'

export default {
  name: 'InvoiceItems',
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
      removeItem
    } = useInvoice()

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
      removeItem
    }
  }
}
</script>
