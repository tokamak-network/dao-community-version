export const safe = {
  bigInt: (val: unknown): bigint | null => {
    try {
      if (val === null || val === undefined || val === '') return null
      return BigInt(String(val))
    } catch { return null }
  },

  json: (str: string): any => {
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

  formatDate: (timestamp: bigint | number): string => {
    try {
      const date = new Date(Number(timestamp) * 1000)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch { return 'Invalid Date' }
  },

  formatAddress: (address: string): string => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''
  },

  validateAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  validateTxHash: (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash)
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