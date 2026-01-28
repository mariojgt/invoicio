import { ref, watch } from 'vue'
import { invoice, settings } from './state'

// State
export const emailTemplates = ref([])
export const defaultTemplateId = ref(null)

// Load from localStorage
const loadTemplates = () => {
  const saved = localStorage.getItem('invoicio-email-templates')
  if (saved) {
    emailTemplates.value = JSON.parse(saved)
  }
  const defaultId = localStorage.getItem('invoicio-default-template')
  if (defaultId) {
    defaultTemplateId.value = defaultId
  }
}

// Auto-save
watch(emailTemplates, (val) => {
  localStorage.setItem('invoicio-email-templates', JSON.stringify(val))
}, { deep: true })

watch(defaultTemplateId, (val) => {
  if (val) {
    localStorage.setItem('invoicio-default-template', val)
  } else {
    localStorage.removeItem('invoicio-default-template')
  }
})

// Initialize
loadTemplates()

export function useEmailTemplates() {
  const addTemplate = (data) => {
    const template = {
      id: Date.now().toString(),
      name: data.name || 'Untitled',
      subject: data.subject || '',
      body: data.body || '',
      clientName: data.clientName || '',
      createdAt: new Date().toISOString()
    }
    emailTemplates.value.push(template)
    
    // If first template and no default, set as default
    if (emailTemplates.value.length === 1 && !defaultTemplateId.value) {
      defaultTemplateId.value = template.id
    }
    
    return template
  }

  const updateTemplate = (id, data) => {
    const idx = emailTemplates.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      emailTemplates.value[idx] = { ...emailTemplates.value[idx], ...data }
    }
  }

  const deleteTemplate = (id) => {
    const idx = emailTemplates.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      emailTemplates.value.splice(idx, 1)
      if (defaultTemplateId.value === id) {
        defaultTemplateId.value = emailTemplates.value[0]?.id || null
      }
    }
  }

  const setDefault = (id) => {
    defaultTemplateId.value = id
  }

  const getTemplate = (id) => {
    return emailTemplates.value.find(t => t.id === id)
  }

  const getTemplateForClient = (clientName) => {
    if (!clientName) return getTemplate(defaultTemplateId.value)
    const clientTemplate = emailTemplates.value.find(
      t => t.clientName && t.clientName.toLowerCase() === clientName.toLowerCase()
    )
    return clientTemplate || getTemplate(defaultTemplateId.value)
  }

  const parseTemplate = (template) => {
    if (!template) return { subject: '', body: '' }
    
    const vars = {
      invoiceNumber: invoice.number || '',
      invoiceDate: invoice.date || '',
      dueDate: invoice.dueDate || '',
      clientName: invoice.to.name || '',
      clientEmail: invoice.to.email || '',
      yourName: invoice.from.name || '',
      yourEmail: invoice.from.email || '',
      currency: settings.currency || 'USD',
      total: invoice.items.reduce((sum, i) => sum + (i.quantity * i.price), 0).toFixed(2)
    }

    let subject = template.subject
    let body = template.body

    Object.entries(vars).forEach(([key, val]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      subject = subject.replace(regex, val)
      body = body.replace(regex, val)
    })

    return { subject, body }
  }

  const exportTemplates = () => {
    const data = {
      templates: emailTemplates.value,
      defaultTemplateId: defaultTemplateId.value,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoicio-email-templates.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTemplates = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data.templates && Array.isArray(data.templates)) {
            // Merge templates - add new IDs to avoid conflicts
            data.templates.forEach(t => {
              const exists = emailTemplates.value.find(
                et => et.name === t.name && et.clientName === t.clientName
              )
              if (!exists) {
                emailTemplates.value.push({
                  ...t,
                  id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                })
              }
            })
            resolve({ imported: data.templates.length })
          } else {
            reject(new Error('Invalid file format'))
          }
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsText(file)
    })
  }

  return {
    emailTemplates,
    defaultTemplateId,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setDefault,
    getTemplate,
    getTemplateForClient,
    parseTemplate,
    exportTemplates,
    importTemplates
  }
}
