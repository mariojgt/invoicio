import { savedInvoices, invoice, settings } from './state'

/**
 * Saved Invoices Functions
 * Save, load, and manage invoice history
 */

export function useSavedInvoices(grandTotal) {
  const saveCurrentInvoice = (name) => {
    const invoiceName = name || `Invoice ${invoice.number} - ${new Date().toLocaleDateString()}`
    const newSavedInvoice = {
      id: Date.now().toString(),
      name: invoiceName,
      createdAt: new Date().toISOString(),
      invoiceNumber: invoice.number,
      clientName: invoice.to.name || 'Unknown Client',
      total: grandTotal.value,
      currency: settings.currency,
      status: invoice.status || 'draft',
      dueDate: invoice.dueDate,
      data: JSON.parse(JSON.stringify(invoice))
    }
    savedInvoices.value.unshift(newSavedInvoice)
    return newSavedInvoice
  }

  const loadSavedInvoice = (id) => {
    const saved = savedInvoices.value.find(inv => inv.id === id)
    if (saved && saved.data) {
      Object.assign(invoice, saved.data)
      return true
    }
    return false
  }

  const updateSavedInvoice = (id) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index] = {
        ...savedInvoices.value[index],
        updatedAt: new Date().toISOString(),
        invoiceNumber: invoice.number,
        clientName: invoice.to.name || 'Unknown Client',
        total: grandTotal.value,
        currency: settings.currency,
        status: invoice.status || 'draft',
        dueDate: invoice.dueDate,
        data: JSON.parse(JSON.stringify(invoice))
      }
      return true
    }
    return false
  }

  const updateSavedInvoiceStatus = (id, newStatus) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index].status = newStatus
      if (savedInvoices.value[index].data) {
        savedInvoices.value[index].data.status = newStatus
      }
      return true
    }
    return false
  }

  const deleteSavedInvoice = (id) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value.splice(index, 1)
      return true
    }
    return false
  }

  const renameSavedInvoice = (id, newName) => {
    const index = savedInvoices.value.findIndex(inv => inv.id === id)
    if (index !== -1) {
      savedInvoices.value[index].name = newName
      return true
    }
    return false
  }

  const duplicateSavedInvoice = (id) => {
    const original = savedInvoices.value.find(inv => inv.id === id)
    if (original) {
      const duplicate = {
        ...JSON.parse(JSON.stringify(original)),
        id: Date.now().toString(),
        name: `${original.name} (Copy)`,
        createdAt: new Date().toISOString()
      }
      delete duplicate.updatedAt
      savedInvoices.value.unshift(duplicate)
      return duplicate
    }
    return null
  }

  const exportSavedInvoices = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      invoices: savedInvoices.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-saved-invoices-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSavedInvoices = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedInvoices = data.invoices || data

      if (!Array.isArray(importedInvoices)) {
        throw new Error('Invalid invoices data format')
      }

      if (mode === 'replace') {
        savedInvoices.value = importedInvoices.map(inv => ({
          ...inv,
          id: inv.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add all as new (invoices are unique)
        importedInvoices.forEach(importedInvoice => {
          savedInvoices.value.push({
            ...importedInvoice,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            importedAt: new Date().toISOString()
          })
        })
      }

      return { success: true, count: importedInvoices.length }
    } catch (error) {
      console.error('Invoices import failed:', error)
      return { success: false, error: error.message }
    }
  }

  const clearCurrentInvoice = () => {
    invoice.number = 'INV-001'
    invoice.date = new Date().toISOString().split('T')[0]
    invoice.dueDate = ''
    invoice.status = 'draft'
    invoice.logo = ''
    invoice.from.name = ''
    invoice.from.email = ''
    invoice.from.address = ''
    invoice.to.name = ''
    invoice.to.email = ''
    invoice.to.address = ''
    invoice.items = [{ description: '', quantity: 1, price: 0, tax: 0 }]
    invoice.discountPercent = 0
    invoice.notes = ''
  }

  return {
    savedInvoices,
    saveCurrentInvoice,
    loadSavedInvoice,
    updateSavedInvoice,
    updateSavedInvoiceStatus,
    deleteSavedInvoice,
    renameSavedInvoice,
    duplicateSavedInvoice,
    exportSavedInvoices,
    importSavedInvoices,
    clearCurrentInvoice
  }
}
