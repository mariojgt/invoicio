<template>
  <div class="app-container">
    <!-- Header -->
    <header class="header">
      <div class="header-logo">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="12" fill="currentColor"/>
          <text x="50" y="68" font-family="Arial" font-size="55" font-weight="bold" fill="white" text-anchor="middle">I</text>
        </svg>
        <span>Invoicio</span>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="loadInvoice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Load
        </button>
        <button class="btn btn-secondary" @click="saveInvoice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save
        </button>
        <button class="btn btn-secondary" @click="toggleSettings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="invoice-layout">
        <!-- Invoice Builder -->
        <div class="invoice-builder">
          <!-- Logo & Basic Info -->
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
          </div>

          <!-- From / Bill To -->
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
                <h4 style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.75rem;">Bill To (Client)</h4>
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

          <!-- Items -->
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

          <!-- Payment Info -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Payment Information</h3>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select class="form-select" v-model="invoice.payment.method">
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div class="form-group" v-if="invoice.payment.method === 'bank'">
                <label class="form-label">Bank Name</label>
                <input type="text" class="form-input" v-model="invoice.payment.bankName" placeholder="Bank Name">
              </div>
            </div>
            <div class="form-row form-row-2" v-if="invoice.payment.method === 'bank'">
              <div class="form-group">
                <label class="form-label">Account Name</label>
                <input type="text" class="form-input" v-model="invoice.payment.accountName" placeholder="Account Holder Name">
              </div>
              <div class="form-group">
                <label class="form-label">Account Number / IBAN</label>
                <input type="text" class="form-input" v-model="invoice.payment.accountNumber" placeholder="Account Number">
              </div>
            </div>
            <div class="form-group" v-if="invoice.payment.method === 'paypal'">
              <label class="form-label">PayPal Email</label>
              <input type="email" class="form-input" v-model="invoice.payment.paypalEmail" placeholder="paypal@email.com">
            </div>
            <div class="form-group" v-if="invoice.payment.method === 'other'">
              <label class="form-label">Payment Instructions</label>
              <textarea class="form-textarea" v-model="invoice.payment.instructions" placeholder="Enter payment instructions..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Notes / Terms</label>
              <textarea class="form-textarea" v-model="invoice.notes" placeholder="Additional notes or terms..."></textarea>
            </div>
          </div>
        </div>

        <!-- Preview Panel -->
        <div class="invoice-preview-panel">
          <div class="preview-card">
            <div class="preview-header">
              <span class="preview-title">Preview</span>
              <div class="preview-actions">
                <button class="btn btn-sm btn-success" @click="exportPDF" :disabled="isGeneratingPDF">
                  <svg v-if="!isGeneratingPDF" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="12" y2="12"/>
                    <line x1="15" y1="15" x2="12" y2="12"/>
                  </svg>
                  <span v-if="isGeneratingPDF" class="loading-spinner"></span>
                  {{ isGeneratingPDF ? 'Generating...' : 'PDF' }}
                </button>
                <button class="btn btn-sm btn-primary" @click="printInvoice">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print
                </button>
              </div>
            </div>
            <div class="preview-content">
              <div ref="invoiceRef" class="preview-invoice" :style="{ '--accent-color': settings.accentColor }"
                <!-- Invoice Header -->
                <div class="preview-invoice-header">
                  <div>
                    <img v-if="invoice.logo" :src="invoice.logo" class="preview-logo" alt="Logo">
                  </div>
                  <div class="preview-invoice-title">
                    <h2 :style="{ color: settings.accentColor }">INVOICE</h2>
                    <div class="preview-invoice-meta">
                      <div><strong>{{ invoice.number || 'INV-001' }}</strong></div>
                      <div>Date: {{ formatDate(invoice.date) }}</div>
                      <div v-if="invoice.dueDate">Due: {{ formatDate(invoice.dueDate) }}</div>
                    </div>
                  </div>
                </div>

                <!-- Parties -->
                <div class="preview-parties">
                  <div class="preview-party">
                    <h4>From</h4>
                    <div class="preview-party-name">{{ invoice.from.name || 'Your Company' }}</div>
                    <div v-if="invoice.from.email">{{ invoice.from.email }}</div>
                    <div style="white-space: pre-line;">{{ invoice.from.address }}</div>
                  </div>
                  <div class="preview-party">
                    <h4>Bill To</h4>
                    <div class="preview-party-name">{{ invoice.to.name || 'Client Name' }}</div>
                    <div v-if="invoice.to.email">{{ invoice.to.email }}</div>
                    <div style="white-space: pre-line;">{{ invoice.to.address }}</div>
                  </div>
                </div>

                <!-- Items Table -->
                <table class="preview-items-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Price</th>
                      <th v-if="settings.taxMode === 'per-item'" class="text-right">Tax</th>
                      <th class="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in invoice.items" :key="index">
                      <td>{{ item.description || 'Item ' + (index + 1) }}</td>
                      <td class="text-right">{{ item.quantity }}</td>
                      <td class="text-right">{{ formatCurrency(item.price) }}</td>
                      <td v-if="settings.taxMode === 'per-item'" class="text-right">{{ item.tax }}%</td>
                      <td class="text-right">{{ formatCurrency(calculateItemAmount(item)) }}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Totals -->
                <div class="preview-totals">
                  <div class="preview-totals-table">
                    <div class="preview-totals-row">
                      <span>Subtotal</span>
                      <span>{{ formatCurrency(subtotal) }}</span>
                    </div>
                    <div class="preview-totals-row">
                      <span>Tax</span>
                      <span>{{ formatCurrency(totalTax) }}</span>
                    </div>
                    <div v-if="settings.showDiscount && invoice.discountPercent > 0" class="preview-totals-row">
                      <span>Discount ({{ invoice.discountPercent }}%)</span>
                      <span>-{{ formatCurrency(discountAmount) }}</span>
                    </div>
                    <div class="preview-totals-row total">
                      <span>Total</span>
                      <span>{{ formatCurrency(grandTotal) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Payment Info -->
                <div class="preview-payment" v-if="hasPaymentInfo">
                  <h4>Payment Information</h4>
                  <div v-if="invoice.payment.method === 'bank'">
                    <div v-if="invoice.payment.bankName">Bank: {{ invoice.payment.bankName }}</div>
                    <div v-if="invoice.payment.accountName">Account: {{ invoice.payment.accountName }}</div>
                    <div v-if="invoice.payment.accountNumber">Number: {{ invoice.payment.accountNumber }}</div>
                  </div>
                  <div v-else-if="invoice.payment.method === 'paypal'">
                    PayPal: {{ invoice.payment.paypalEmail }}
                  </div>
                  <div v-else-if="invoice.payment.method === 'other'">
                    {{ invoice.payment.instructions }}
                  </div>
                  <div v-else>
                    Payment Method: {{ invoice.payment.method }}
                  </div>
                </div>

                <!-- Notes -->
                <div class="preview-notes" v-if="invoice.notes">
                  <strong>Notes:</strong> {{ invoice.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Panel -->
    <div class="settings-overlay" :class="{ open: showSettings }" @click="toggleSettings"></div>
    <div class="settings-panel" :class="{ open: showSettings }">
      <div class="settings-header">
        <h3 class="settings-title">Settings</h3>
        <button class="settings-close" @click="toggleSettings">
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
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="exportSettings">
              Export Settings
            </button>
            <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" @click="importSettings">
              Import Settings
            </button>
            <button class="btn btn-danger" style="width: 100%;" @click="resetAll">
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden File Inputs -->
    <input 
      ref="loadInput" 
      type="file" 
      accept=".json" 
      class="hidden-input" 
      @change="handleLoadInvoice"
    >
    <input 
      ref="settingsInput" 
      type="file" 
      accept=".json" 
      class="hidden-input" 
      @change="handleImportSettings"
    >
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import html2pdf from 'html2pdf.js'

export default {
  name: 'App',
  setup() {
    const logoInput = ref(null)
    const loadInput = ref(null)
    const settingsInput = ref(null)
    const invoiceRef = ref(null)
    const showSettings = ref(false)
    const isGeneratingPDF = ref(false)

    // Invoice Data
    const invoice = reactive({
      number: 'INV-001',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      logo: '',
      from: {
        name: '',
        email: '',
        address: ''
      },
      to: {
        name: '',
        email: '',
        address: ''
      },
      items: [
        { description: '', quantity: 1, price: 0, tax: 0 }
      ],
      discountPercent: 0,
      payment: {
        method: 'bank',
        bankName: '',
        accountName: '',
        accountNumber: '',
        paypalEmail: '',
        instructions: ''
      },
      notes: ''
    })

    // Settings
    const settings = reactive({
      accentColor: '#4f46e5',
      currency: '$',
      dateFormat: 'MM/DD/YYYY',
      taxMode: 'per-item', // 'per-item' or 'total'
      globalTaxRate: 10,
      defaultItemTax: 0,
      showDiscount: false
    })

    // Load saved data on mount
    onMounted(() => {
      const savedInvoice = localStorage.getItem('invoicio-invoice')
      const savedSettings = localStorage.getItem('invoicio-settings')
      
      if (savedInvoice) {
        Object.assign(invoice, JSON.parse(savedInvoice))
      }
      if (savedSettings) {
        Object.assign(settings, JSON.parse(savedSettings))
      }
    })

    // Auto-save to localStorage
    watch(invoice, () => {
      localStorage.setItem('invoicio-invoice', JSON.stringify(invoice))
    }, { deep: true })

    watch(settings, () => {
      localStorage.setItem('invoicio-settings', JSON.stringify(settings))
    }, { deep: true })

    // Computed values
    const subtotal = computed(() => {
      return invoice.items.reduce((sum, item) => {
        return sum + (item.quantity * item.price)
      }, 0)
    })

    const totalTax = computed(() => {
      if (settings.taxMode === 'total') {
        return subtotal.value * (settings.globalTaxRate / 100)
      } else {
        return invoice.items.reduce((sum, item) => {
          const itemSubtotal = item.quantity * item.price
          return sum + (itemSubtotal * (item.tax / 100))
        }, 0)
      }
    })

    const discountAmount = computed(() => {
      if (!settings.showDiscount || !invoice.discountPercent) return 0
      return (subtotal.value + totalTax.value) * (invoice.discountPercent / 100)
    })

    const grandTotal = computed(() => {
      return subtotal.value + totalTax.value - discountAmount.value
    })

    const hasPaymentInfo = computed(() => {
      const p = invoice.payment
      return p.method === 'bank' && (p.bankName || p.accountName || p.accountNumber) ||
             p.method === 'paypal' && p.paypalEmail ||
             p.method === 'other' && p.instructions ||
             p.method === 'card' || p.method === 'cash'
    })

    // Methods
    const calculateItemAmount = (item) => {
      const subtotal = item.quantity * item.price
      if (settings.taxMode === 'per-item') {
        return subtotal + (subtotal * (item.tax / 100))
      }
      return subtotal
    }

    const formatCurrency = (amount) => {
      return settings.currency + amount.toFixed(2)
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      switch (settings.dateFormat) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`
        case 'DD MMM YYYY':
          return `${day} ${monthNames[date.getMonth()]} ${year}`
        default:
          return `${month}/${day}/${year}`
      }
    }

    const addItem = () => {
      invoice.items.push({
        description: '',
        quantity: 1,
        price: 0,
        tax: settings.defaultItemTax
      })
    }

    const removeItem = (index) => {
      invoice.items.splice(index, 1)
    }

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

    const toggleSettings = () => {
      showSettings.value = !showSettings.value
    }

    const saveInvoice = () => {
      const data = {
        invoice: { ...invoice },
        settings: { ...settings },
        exportDate: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoice.number || 'export'}.json`
      a.click()
      URL.revokeObjectURL(url)
    }

    const loadInvoice = () => {
      loadInput.value.click()
    }

    const handleLoadInvoice = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (data.invoice) {
              Object.assign(invoice, data.invoice)
            }
            if (data.settings) {
              Object.assign(settings, data.settings)
            }
            alert('Invoice loaded successfully!')
          } catch (err) {
            alert('Error loading file. Please make sure it\'s a valid JSON file.')
          }
        }
        reader.readAsText(file)
      }
      loadInput.value.value = ''
    }

    const exportSettings = () => {
      const data = {
        settings: { ...settings },
        exportDate: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoicio-settings.json'
      a.click()
      URL.revokeObjectURL(url)
    }

    const importSettings = () => {
      settingsInput.value.click()
    }

    const handleImportSettings = (event) => {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            if (data.settings) {
              Object.assign(settings, data.settings)
              alert('Settings imported successfully!')
            }
          } catch (err) {
            alert('Error loading file. Please make sure it\'s a valid JSON file.')
          }
        }
        reader.readAsText(file)
      }
      settingsInput.value.value = ''
    }

    const resetAll = () => {
      if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
        localStorage.removeItem('invoicio-invoice')
        localStorage.removeItem('invoicio-settings')
        location.reload()
      }
    }

    const printInvoice = () => {
      window.print()
    }

    const exportPDF = async () => {
      if (!invoiceRef.value) return
      
      isGeneratingPDF.value = true
      
      try {
        const element = invoiceRef.value
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `${invoice.number || 'invoice'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          }
        }
        
        await html2pdf().set(opt).from(element).save()
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again.')
      } finally {
        isGeneratingPDF.value = false
      }
    }

    return {
      logoInput,
      loadInput,
      settingsInput,
      invoiceRef,
      showSettings,
      isGeneratingPDF,
      invoice,
      settings,
      subtotal,
      totalTax,
      discountAmount,
      grandTotal,
      hasPaymentInfo,
      calculateItemAmount,
      formatCurrency,
      formatDate,
      addItem,
      removeItem,
      triggerLogoUpload,
      handleLogoUpload,
      removeLogo,
      toggleSettings,
      saveInvoice,
      loadInvoice,
      handleLoadInvoice,
      exportSettings,
      importSettings,
      handleImportSettings,
      resetAll,
      printInvoice,
      exportPDF
    }
  }
}
</script>
