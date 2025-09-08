import { ValidationResult } from './types'

export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try {
      if (val === null || val === undefined || val === '') return null
      return BigInt(String(val))
    } catch { return null }
  },

  json: (str: string): unknown => {
    try {
      if (!str.trim()) return null
      return JSON.parse(str)
    } catch { return null }
  },

  formatTON: (wei: bigint | null): string => {
    if (!wei) return '0'
    const eth = Number(wei) / Math.pow(10, 18)
    return eth.toFixed(6)
  },

  formatGas: (gasWei: bigint | null): string => {
    if (!gasWei) return '0'
    const gwei = Number(gasWei) / Math.pow(10, 9)
    return gwei.toFixed(2)
  },

  storage: {
    set: (key: string, val: unknown) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(val))
        }
      } catch {}
    },
    get: <T>(key: string, fallback: T): T => {
      try {
        if (typeof window === 'undefined') return fallback
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : fallback
      } catch { return fallback }
    },
    clear: (key: string) => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key)
        }
      } catch {}
    }
  },

  getErrorMessage: (error: unknown): string => {
    if (!error) return 'Unknown error'

    if (typeof error === 'string') return error

    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        return 'Insufficient ETH for gas fees. Please add more ETH to your wallet.'
      }
      if (error.message.includes('user rejected')) {
        return 'Transaction was rejected. Please approve the transaction to continue.'
      }
      if (error.message.includes('replacement fee too low')) {
        return 'Gas fee too low. Please increase gas price and try again.'
      }
      if (error.message.includes('nonce too low')) {
        return 'Transaction nonce error. Please reset your wallet and try again.'
      }
      return error.message
    }

    return 'An unexpected error occurred'
  }
}

export const validate = {
  url: (url: string): boolean => {
    if (!url || url.length < 10) return false
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch { return false }
  },

  address: (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr)
  },

  jsonArray: (str: string): boolean => {
    const parsed = safe.json(str)
    return Array.isArray(parsed)
  },

  functionAbi: (str: string): boolean => {
    const parsed = safe.json(str)
    if (!parsed) return false

    const func = Array.isArray(parsed) ? parsed[0] : parsed
    return func &&
           typeof func.name === 'string' &&
           func.type === 'function' &&
           Array.isArray(func.inputs)
  },

  parameters: (str: string, expectedCount: number): boolean => {
    const parsed = safe.json(str)
    return Array.isArray(parsed) && parsed.length === expectedCount
  },

  form: (formData: unknown): ValidationResult => {
    const errors: string[] = []
    const data = formData as { url?: string; transactions?: unknown[] }

    if (!validate.url(data.url || '')) {
      errors.push('Please enter a valid HTTP/HTTPS URL for the agenda')
    }

    if (!Array.isArray(data.transactions) || data.transactions.length === 0) {
      errors.push('At least one transaction is required')
    }

    data.transactions?.forEach((tx: unknown, index: number) => {
      const transaction = tx as { targetAddress?: string; functionAbi?: string; parameters?: string }
      const txNum = index + 1

      if (!validate.address(transaction.targetAddress || '')) {
        errors.push(`Transaction ${txNum}: Invalid target address format`)
      }

      if (!validate.functionAbi(transaction.functionAbi || '')) {
        errors.push(`Transaction ${txNum}: Invalid function ABI format`)
      }

      if (!validate.jsonArray(transaction.parameters || '')) {
        errors.push(`Transaction ${txNum}: Parameters must be a valid JSON array`)
      }

      const abi = safe.json(transaction.functionAbi || '')
      const params = safe.json(transaction.parameters || '')
      if (abi && params && Array.isArray(params)) {
        const func = Array.isArray(abi) ? abi[0] : abi
        const functionObj = func as { inputs?: unknown[] }
        const expectedParams = functionObj?.inputs?.length || 0
        if (params.length !== expectedParams) {
          errors.push(`Transaction ${txNum}: Expected ${expectedParams} parameters but got ${params.length}`)
        }
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const ux = {
  formatTimeRemaining: (seconds: number): string => {
    if (seconds <= 0) return 'Ready now'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) return `${hours}h ${minutes}m remaining`
    if (minutes > 0) return `${minutes}m ${secs}s remaining`
    return `${secs}s remaining`
  },

  truncateHash: (hash: string, length = 6): string => {
    if (!hash) return ''
    return `${hash.slice(0, length)}...${hash.slice(-4)}`
  },

  getNetworkName: (chainId: number): string => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet'
      case 11155111: return 'Sepolia Testnet'
      default: return `Chain ${chainId}`
    }
  }
}