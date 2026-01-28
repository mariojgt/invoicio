<template>
  <div class="email-templates-overlay" v-if="isOpen" @click.self="$emit('close')">
    <div class="email-templates-modal">
      <div class="modal-header">
        <h2>📧 Email Templates</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <!-- Add/Edit Form -->
      <div class="template-form" v-if="showForm">
        <h3>{{ editing ? 'Edit Template' : 'New Template' }}</h3>
        
        <div class="form-group">
          <label>Template Name *</label>
          <input v-model="form.name" type="text" class="form-input" placeholder="e.g., Payment Instructions">
        </div>

        <div class="form-group">
          <label>For Client (leave empty for default)</label>
          <input v-model="form.clientName" type="text" class="form-input" placeholder="Client name or empty">
        </div>

        <div class="form-group">
          <label>Email Subject</label>
          <input v-model="form.subject" type="text" class="form-input" placeholder="Invoice {invoiceNumber}">
        </div>

        <div class="form-group">
          <label>Email Body</label>
          <textarea v-model="form.body" class="form-textarea" rows="10" placeholder="Dear {clientName},

Please find attached invoice {invoiceNumber}.

Payment Details:
Amount: {currency} {total}
Due Date: {dueDate}

Best regards,
{yourName}"></textarea>
        </div>

        <div class="variables-hint">
          <strong>Variables:</strong> {invoiceNumber}, {clientName}, {yourName}, {currency}, {total}, {dueDate}, {invoiceDate}
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" @click="cancelForm">Cancel</button>
          <button class="btn btn-primary" @click="saveForm" :disabled="!form.name">
            {{ editing ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>

      <!-- Template List -->
      <div class="template-list" v-else>
        <div class="toolbar">
          <button class="btn btn-primary" @click="openAddForm">
            + New Template
          </button>
          <div class="toolbar-right">
            <button class="btn btn-secondary" @click="handleExport" :disabled="emailTemplates.length === 0" title="Export templates">
              ⬇️ Export
            </button>
            <button class="btn btn-secondary" @click="triggerImport" title="Import templates">
              ⬆️ Import
            </button>
          </div>
        </div>

        <div v-if="emailTemplates.length === 0" class="empty-state">
          <div class="empty-icon">📧</div>
          <p>No templates yet. Create one to get started!</p>
        </div>

        <div v-for="template in emailTemplates" :key="template.id" class="template-card">
          <div class="template-info">
            <div class="template-name">
              {{ template.name }}
              <span v-if="template.id === defaultTemplateId" class="default-badge">Default</span>
              <span v-if="template.clientName" class="client-badge">{{ template.clientName }}</span>
            </div>
            <div class="template-subject">{{ template.subject || '(no subject)' }}</div>
          </div>
          <div class="template-actions">
            <button v-if="template.id !== defaultTemplateId" class="btn btn-sm" @click="setDefault(template.id)" title="Set as default">
              ⭐
            </button>
            <button class="btn btn-sm" @click="previewTemplate(template)" title="Preview">
              👁️
            </button>
            <button class="btn btn-sm" @click="editTemplate(template)" title="Edit">
              ✏️
            </button>
            <button class="btn btn-sm btn-danger" @click="confirmDelete(template)" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <div class="preview-panel" v-if="previewing">
        <div class="preview-header">
          <h3>Preview: {{ previewing.name }}</h3>
          <button class="btn btn-sm" @click="previewing = null">Close</button>
        </div>
        <div class="preview-content">
          <div class="preview-field">
            <label>Subject:</label>
            <div class="preview-value">{{ parsedPreview.subject }}</div>
          </div>
          <div class="preview-field">
            <label>Body:</label>
            <pre class="preview-value">{{ parsedPreview.body }}</pre>
          </div>
        </div>
        <button class="btn btn-primary" @click="copyToClipboard">📋 Copy to Clipboard</button>
      </div>

      <div class="modal-footer">
        {{ emailTemplates.length }} template{{ emailTemplates.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="importInput"
      type="file"
      accept=".json"
      class="hidden-input"
      @change="handleImport"
    >
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useEmailTemplates } from '../composables/useEmailTemplates'

defineProps({
  isOpen: Boolean
})

defineEmits(['close'])

const {
  emailTemplates,
  defaultTemplateId,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setDefault,
  parseTemplate,
  exportTemplates,
  importTemplates
} = useEmailTemplates()

const showForm = ref(false)
const editing = ref(null)
const previewing = ref(null)
const importInput = ref(null)
const form = ref({ name: '', clientName: '', subject: '', body: '' })

const parsedPreview = computed(() => {
  if (!previewing.value) return { subject: '', body: '' }
  return parseTemplate(previewing.value)
})

const openAddForm = () => {
  form.value = { name: '', clientName: '', subject: '', body: '' }
  editing.value = null
  showForm.value = true
}

const editTemplate = (template) => {
  form.value = { ...template }
  editing.value = template.id
  showForm.value = true
}

const cancelForm = () => {
  showForm.value = false
  editing.value = null
}

const saveForm = () => {
  if (!form.value.name) return
  
  if (editing.value) {
    updateTemplate(editing.value, form.value)
  } else {
    addTemplate(form.value)
  }
  
  showForm.value = false
  editing.value = null
}

const confirmDelete = (template) => {
  if (confirm(`Delete "${template.name}"?`)) {
    deleteTemplate(template.id)
  }
}

const previewTemplate = (template) => {
  previewing.value = template
}

const copyToClipboard = async () => {
  const text = `Subject: ${parsedPreview.value.subject}\n\n${parsedPreview.value.body}`
  try {
    await navigator.clipboard.writeText(text)
    alert('Copied!')
  } catch {
    alert('Failed to copy')
  }
}

const handleExport = () => {
  exportTemplates()
}

const triggerImport = () => {
  importInput.value.click()
}

const handleImport = async (event) => {
  const file = event.target.files[0]
  if (file) {
    try {
      const result = await importTemplates(file)
      alert(`Imported ${result.imported} template(s)!`)
    } catch (err) {
      alert('Error importing: ' + err.message)
    }
  }
  importInput.value.value = ''
}
</script>

<style scoped>
.email-templates-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.email-templates-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.btn-close:hover {
  color: #111;
}

.toolbar {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.toolbar-right {
  display: flex;
  gap: 0.5rem;
}

.hidden-input {
  display: none;
}

.template-list {
  flex: 1;
  overflow-y: auto;
}

.template-form {
  padding: 1.5rem;
  overflow-y: auto;
}

.template-form h3 {
  margin: 0 0 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: monospace;
  resize: vertical;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.variables-hint {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #4f46e5;
}

.btn-primary:disabled {
  background: #c7d2fe;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-sm {
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
}

.btn-danger {
  background: #fee2e2;
  color: #dc2626;
}

.btn-danger:hover {
  background: #fecaca;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.template-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.template-card:hover {
  background: #f9fafb;
}

.template-name {
  font-weight: 600;
  color: #111;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.template-subject {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.default-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.client-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-panel {
  border-top: 2px solid #6366f1;
  padding: 1.5rem;
  background: #f9fafb;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-header h3 {
  margin: 0;
}

.preview-field {
  margin-bottom: 1rem;
}

.preview-field label {
  font-weight: 600;
  color: #374151;
  display: block;
  margin-bottom: 0.25rem;
}

.preview-value {
  background: white;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
}

.modal-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
