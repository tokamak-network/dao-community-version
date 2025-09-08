export interface FormData {
  url: string
  transactions: Transaction[]
}

export interface Transaction {
  targetAddress: string
  functionAbi: string    // JSON string of function ABI
  parameters: string     // JSON string of parameters
}

export interface ContractAddresses {
  ton: `0x${string}`
  committee: `0x${string}`
  agendaManager: `0x${string}`
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  totalCost: bigint
}

export interface AgendaCreationResult {
  hash: `0x${string}`
  agendaId: string
  success: boolean
  error?: string
}

// Network types
export type SupportedChainId = 1 | 11155111