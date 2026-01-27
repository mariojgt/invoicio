import { clients, invoice } from './state'

/**
 * Client Database Functions
 * Manage client records for quick invoice population
 */

export function useClients() {
  const addClient = (clientData) => {
    const newClient = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...clientData
    }
    clients.value.push(newClient)
    return newClient
  }

  const updateClient = (id, clientData) => {
    const index = clients.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clients.value[index] = { ...clients.value[index], ...clientData, updatedAt: new Date().toISOString() }
      return clients.value[index]
    }
    return null
  }

  const deleteClient = (id) => {
    const index = clients.value.findIndex(c => c.id === id)
    if (index !== -1) {
      clients.value.splice(index, 1)
      return true
    }
    return false
  }

  const getClient = (id) => {
    return clients.value.find(c => c.id === id)
  }

  const selectClient = (id) => {
    const client = getClient(id)
    if (client) {
      invoice.to.name = client.name || ''
      invoice.to.email = client.email || ''
      invoice.to.address = client.address || ''
    }
  }

  const saveCurrentClientToDatabase = () => {
    if (!invoice.to.name) return null

    // Check if client already exists by email
    const existingClient = clients.value.find(c =>
      c.email && c.email.toLowerCase() === invoice.to.email?.toLowerCase()
    )

    if (existingClient) {
      return updateClient(existingClient.id, {
        name: invoice.to.name,
        email: invoice.to.email,
        address: invoice.to.address
      })
    } else {
      return addClient({
        name: invoice.to.name,
        email: invoice.to.email,
        address: invoice.to.address
      })
    }
  }

  const exportClients = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      clients: clients.value
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoicio-clients-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importClients = (jsonData, mode = 'merge') => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      const importedClients = data.clients || data

      if (!Array.isArray(importedClients)) {
        throw new Error('Invalid client data format')
      }

      if (mode === 'replace') {
        clients.value = importedClients.map(c => ({
          ...c,
          id: c.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        }))
      } else {
        // Merge mode - add new clients, update existing by email
        importedClients.forEach(importedClient => {
          const existingIndex = clients.value.findIndex(c =>
            c.email && importedClient.email &&
            c.email.toLowerCase() === importedClient.email.toLowerCase()
          )

          if (existingIndex !== -1) {
            // Update existing
            clients.value[existingIndex] = {
              ...clients.value[existingIndex],
              ...importedClient,
              updatedAt: new Date().toISOString()
            }
          } else {
            // Add new
            clients.value.push({
              ...importedClient,
              id: importedClient.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
              importedAt: new Date().toISOString()
            })
          }
        })
      }

      return { success: true, count: importedClients.length }
    } catch (error) {
      console.error('Import failed:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    selectClient,
    saveCurrentClientToDatabase,
    exportClients,
    importClients
  }
}
