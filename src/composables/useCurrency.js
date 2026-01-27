import { invoice, settings, exchangeRates, conversionLoading, lastRateUpdate } from './state'
import { currencies } from './constants'

/**
 * Currency Conversion Functions
 * Exchange rates and currency formatting
 */

export function useCurrency() {
  const formatCurrency = (amount) => {
    const symbol = currencies[settings.currency]?.symbol || settings.currency
    return symbol + amount.toFixed(2)
  }

  // Convert amount to another currency
  const convertAmount = (amount) => {
    if (!settings.showConversion || !exchangeRates.value[settings.convertToCurrency]) {
      return null
    }
    const rate = exchangeRates.value[settings.convertToCurrency]
    return amount * rate
  }

  const formatConvertedCurrency = (amount) => {
    const converted = convertAmount(amount)
    if (converted === null) return ''
    const symbol = currencies[settings.convertToCurrency]?.symbol || settings.convertToCurrency
    return symbol + converted.toFixed(2)
  }

  // Fetch exchange rates from Frankfurter API
  const fetchExchangeRates = async () => {
    if (conversionLoading.value) return

    conversionLoading.value = true
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=${settings.currency}`)
      if (response.ok) {
        const data = await response.json()
        exchangeRates.value = data.rates
        lastRateUpdate.value = new Date().toISOString()
        localStorage.setItem('invoicio-rates', JSON.stringify({
          rates: data.rates,
          base: settings.currency,
          date: lastRateUpdate.value
        }))
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
      // Try to load cached rates
      const cached = localStorage.getItem('invoicio-rates')
      if (cached) {
        const data = JSON.parse(cached)
        if (data.base === settings.currency) {
          exchangeRates.value = data.rates
          lastRateUpdate.value = data.date
        }
      }
    } finally {
      conversionLoading.value = false
    }
  }

  const loadCachedRates = () => {
    const cached = localStorage.getItem('invoicio-rates')
    if (cached) {
      const data = JSON.parse(cached)
      if (data.base === settings.currency) {
        exchangeRates.value = data.rates
        lastRateUpdate.value = data.date
      }
    }
  }

  // Convert all item prices to the target currency
  const convertItemsToCurrency = async (targetCurrency) => {
    if (targetCurrency === settings.currency) return

    // Get exchange rate
    let rate = exchangeRates.value[targetCurrency]

    // If rate not available, fetch it
    if (!rate) {
      conversionLoading.value = true
      try {
        const response = await fetch(`https://api.frankfurter.app/latest?from=${settings.currency}&to=${targetCurrency}`)
        if (response.ok) {
          const data = await response.json()
          rate = data.rates[targetCurrency]
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error)
        alert('Failed to fetch exchange rate. Please try again.')
        return
      } finally {
        conversionLoading.value = false
      }
    }

    if (!rate) {
      alert('Could not get exchange rate')
      return
    }

    // Convert all item prices
    invoice.items.forEach(item => {
      item.price = parseFloat((item.price * rate).toFixed(2))
    })

    // Update the currency setting
    settings.currency = targetCurrency
    settings.currencySymbol = currencies[targetCurrency]?.symbol || targetCurrency

    // Update exchange rates for new base currency
    exchangeRates.value = {}
    lastRateUpdate.value = null
    if (settings.showConversion) {
      await fetchExchangeRates()
    }
  }

  return {
    currencies,
    exchangeRates,
    conversionLoading,
    lastRateUpdate,
    formatCurrency,
    convertAmount,
    formatConvertedCurrency,
    fetchExchangeRates,
    loadCachedRates,
    convertItemsToCurrency
  }
}
