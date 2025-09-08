export interface WorkflowStep {
  id: number
  name: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'error'
}

export interface TransactionInputProps {
  onTransactionParsed: (transaction: any) => void
  onError: (error: string) => void
  initialNetwork?: 'mainnet' | 'sepolia'
}

export interface MetadataInputProps {
  parsedTransaction: any
  onMetadataComplete: (metadata: any) => void
  onError: (error: string) => void
}

export interface SignatureStepProps {
  metadata: any
  onSignatureComplete: (signature: string) => void
  onError: (error: string) => void
}

export interface ValidationStepProps {
  metadata: any
  onValidationComplete: () => void
  onError: (error: string) => void
}

export interface GitHubSetupProps {
  onSetupComplete: (config: any) => void
  onError: (error: string) => void
}

export interface PRCreationProps {
  metadata: any
  githubConfig: any
  onPRCreated: (url: string) => void
  onError: (error: string) => void
}