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

export const AGENDA_STATUS = {
  0: { text: 'NONE', color: 'gray', description: 'No status' },
  1: { text: 'NOTICE', color: 'blue', description: 'Notice period' },
  2: { text: 'VOTING', color: 'green', description: 'Voting in progress' },
  3: { text: 'WAITING_EXEC', color: 'orange', description: 'Waiting for execution' },
  4: { text: 'EXECUTED', color: 'purple', description: 'Executed' },
  5: { text: 'ENDED', color: 'red', description: 'Ended' }
} as const

export const AGENDA_RESULT = {
  0: { text: 'PENDING', color: 'gray', description: 'Pending result' },
  1: { text: 'ACCEPT', color: 'green', description: 'Accepted' },
  2: { text: 'REJECT', color: 'red', description: 'Rejected' },
  3: { text: 'DISMISS', color: 'yellow', description: 'Dismissed' }
} as const

export const UI_TEXT = {
  CONNECT_WALLET: 'Connect Wallet',
  DISCONNECT: 'Disconnect',
  WALLET_CONNECTED: 'Wallet Connected',
  WALLET_DISCONNECTED: 'Wallet Disconnected',
  MAINNET: 'Ethereum Mainnet',
  SEPOLIA: 'Sepolia Testnet',
  SWITCH_NETWORK: 'Switch Network',
  LOADING: 'Loading...',
  ERROR: 'Error',
  SUCCESS: 'Success',
  PENDING: 'Pending',
  SUBMIT: 'Submit',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  RETRY: 'Retry',
  PREVIOUS: 'Previous',
  NEXT: 'Next',
  BACK: 'Back',
  FORWARD: 'Forward',
} as const

export const ERROR_MESSAGES = {
  INVALID_HASH: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters.',
  NOT_FOUND: 'Transaction not found on selected network. Please check the network and hash.',
  NOT_AGENDA: 'This transaction does not contain an agenda creation event.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  MISSING_TITLE: 'Agenda title is required.',
  MISSING_DESCRIPTION: 'Agenda description is required.',
  INVALID_ACTION: 'Action {index}: {error}',
  INVALID_SIGNATURE: 'Creator signature is invalid or expired.',
  GITHUB_TOKEN_ERROR: 'Invalid GitHub token. Please check your token and try again.'
}