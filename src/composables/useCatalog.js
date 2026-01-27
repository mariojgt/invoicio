import { catalogItems, invoice, settings } from './state'

/**
 * Item Catalog Functions
 * Manage reusable items for quick invoice population
 */

export function useCatalog() {
  const addCatalogItem = (itemData) => {
    const newItem = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...itemData
    }
    catalogItems.value.push(newItem)
    return newItem
  }

  const updateCatalogItem = (id, itemData) => {
    const index = catalogItems.value.findIndex(i => i.id === id)
    if (index !== -1) {
      catalogItems.value[index] = { ...catalogItems.value[index], ...itemData, updatedAt: new Date().toISOString() }
      return catalogItems.value[index]
    }
    return null
  }

  const deleteCatalogItem = (id) => {
    const index = catalogItems.value.findIndex(i => i.id === id)
    if (index !== -1) {
      catalogItems.value.splice(index, 1)
      return true
    }
    return false
  }

  const getCatalogItem = (id) => {
    return catalogItems.value.find(i => i.id === id)
  }

  const addCatalogItemToInvoice = (id) => {
    const catalogItem = getCatalogItem(id)
    if (catalogItem) {
      invoice.items.push({
        description: catalogItem.description || '',
        quantity: catalogItem.defaultQuantity || 1,
        price: catalogItem.price || 0,
        tax: catalogItem.tax || settings.defaultItemTax
      })
    }
  }

  const saveInvoiceItemToCatalog = (index) => {
    const item = invoice.items[index]
    if (!item || !item.description) return null

    // Check if item already exists by description
    const existingItem = catalogItems.value.find(i =>
      i.description && i.description.toLowerCase() === item.description.toLowerCase()
    )

    if (existingItem) {
      return updateCatalogItem(existingItem.id, {
        description: item.description,
        price: item.price,
        tax: item.tax,
        defaultQuantity: item.quantity
      })
    } else {
      return addCatalogItem({
        description: item.description,
        price: item.price,
        tax: item.tax,
        defaultQuantity: item.quantity
      })
    }
  }

  const exportCatalog = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      items: catalogItems.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-catalog-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCatalog = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedItems = data.items || data

      if (!Array.isArray(importedItems)) {
        throw new Error('Invalid catalog data format')
      }

      if (mode === 'replace') {
        catalogItems.value = importedItems.map(i => ({
          ...i,
          id: i.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add new items, update existing by description
        importedItems.forEach(importedItem => {
          const existingIndex = catalogItems.value.findIndex(i =>
            i.description && importedItem.description &&
            i.description.toLowerCase() === importedItem.description.toLowerCase()
          )

          if (existingIndex !== -1) {
            // Update existing
            catalogItems.value[existingIndex] = {
              ...catalogItems.value[existingIndex],
              ...importedItem,
              updatedAt: new Date().toISOString()
            }
          } else {
            // Add new
            catalogItems.value.push({
              ...importedItem,
              id: importedItem.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              importedAt: new Date().toISOString()
            })
          }
        })
      }

      return { success: true, count: importedItems.length }
    } catch (error) {
      console.error('Catalog import failed:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    catalogItems,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    getCatalogItem,
    addCatalogItemToInvoice,
    saveInvoiceItemToCatalog,
    exportCatalog,
    importCatalog
  }
}
