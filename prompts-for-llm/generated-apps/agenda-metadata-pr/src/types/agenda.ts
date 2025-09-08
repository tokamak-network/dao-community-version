export interface AgendaMetadata {
  id: number
  title: string
  description: string
  network: 'mainnet' | 'sepolia'
  transaction: string
  creator: {
    address: string
    signature: string
  }
  actions: Action[]
  createdAt: string
  updatedAt?: string
  snapshotUrl?: string
  discourseUrl?: string
}

export interface Action {
  title: string
  contractAddress: string
  method: string
  calldata: string
  abi: unknown[]
  sendEth?: boolean
  id?: string
  type?: string
}

export interface ParsedTransaction {
  agendaId: number
  txHash: string
  from: string
  network: 'mainnet' | 'sepolia'
  targets: string[]
  noticePeriodSeconds: bigint
  votingPeriodSeconds: bigint
  atomicExecute: boolean
  memoUrl?: string
  calldatas: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  checks: {
    schema: boolean
    signature: boolean
    timestamp: boolean
    integrity: boolean
  }
}

export interface GitHubConfig {
  username: string
  token: string
  owner: string
  repo: string
  branch: string
}

export interface PRData {
  title: string
  body: string
  head: string
  base: string
  files: {
    path: string
    content: string
  }[]
}

export interface FunctionParameter {
  name: string
  type: string
  value: string
}

export interface CallDataValidationResult {
  isValid: boolean
  generated: string
  original: string
  error?: string
}