import { ref } from 'vue'
import { settings } from './state'

/**
 * AI Image Scanner Functions
 * Use OpenAI Vision API to extract invoice items from images
 */

// Store API key in localStorage
const apiKey = ref(localStorage.getItem('invoicio-openai-key') || '')

export function useImageScanner() {
  const isScanning = ref(false)
  const scanError = ref(null)

  const saveApiKey = (key) => {
    apiKey.value = key
    localStorage.setItem('invoicio-openai-key', key)
  }

  const getApiKey = () => apiKey.value

  const hasApiKey = () => !!apiKey.value

  const clearApiKey = () => {
    apiKey.value = ''
    localStorage.removeItem('invoicio-openai-key')
  }

  /**
   * Convert file to base64
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Scan image and extract items using OpenAI Vision API
   */
  const scanImage = async (imageFile) => {
    if (!apiKey.value) {
      throw new Error('OpenAI API key not configured')
    }

    isScanning.value = true
    scanError.value = null

    try {
      const base64Image = await fileToBase64(imageFile)
      const mimeType = imageFile.type || 'image/jpeg'

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.value}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this image and extract all items/products/services that could be used in an invoice. 
                  
For each item found, provide:
- description: A clear description of the item
- quantity: The quantity (default to 1 if not visible)
- price: The unit price (use 0 if not visible)

Return ONLY a valid JSON array of objects with these exact fields: description, quantity, price.
Example: [{"description": "Web Design Service", "quantity": 1, "price": 500}, {"description": "Logo Design", "quantity": 2, "price": 150}]

If you cannot identify any items, return an empty array: []
Do not include any explanation, just the JSON array.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || '[]'

      // Parse the JSON response
      let items = []
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          items = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', content)
        throw new Error('Failed to parse items from image. Please try again.')
      }

      // Validate and clean the items
      const validItems = items
        .filter(item => item && typeof item === 'object' && item.description)
        .map(item => ({
          description: String(item.description || '').trim(),
          quantity: Math.max(1, parseInt(item.quantity) || 1),
          price: Math.max(0, parseFloat(item.price) || 0),
          tax: 0
        }))

      return validItems

    } catch (error) {
      console.error('Image scan error:', error)
      scanError.value = error.message
      throw error
    } finally {
      isScanning.value = false
    }
  }

  return {
    apiKey,
    isScanning,
    scanError,
    saveApiKey,
    getApiKey,
    hasApiKey,
    clearApiKey,
    scanImage
  }
}
