import { AgendaMetadata, ValidationResult } from '@/types/agenda'
import { verifySignature, validateTimestamp, createSignatureMessage } from './signature'

export const validateMetadata = (metadata: AgendaMetadata): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!metadata.id || metadata.id <= 0) {
    errors.push('Invalid agenda ID')
  }

  if (!metadata.title || metadata.title.trim().length === 0) {
    errors.push('Title is required')
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push('Description is required')
  }

  if (!['mainnet', 'sepolia'].includes(metadata.network)) {
    errors.push('Invalid network')
  }

  if (!metadata.transaction || !/^0x[a-fA-F0-9]{64}$/.test(metadata.transaction)) {
    errors.push('Invalid transaction hash')
  }

  if (!metadata.creator || !metadata.creator.address || !metadata.creator.signature) {
    errors.push('Creator information is incomplete')
  } else {
    if (!/^0x[a-fA-F0-9]{40}$/.test(metadata.creator.address)) {
      errors.push('Invalid creator address')
    }
  }

  if (!metadata.actions || metadata.actions.length === 0) {
    errors.push('At least one action is required')
  } else {
    metadata.actions.forEach((action, index) => {
      if (!action.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(action.contractAddress)) {
        errors.push(`Action ${index + 1}: Invalid contract address`)
      }
      if (!action.method || action.method.trim().length === 0) {
        errors.push(`Action ${index + 1}: Method is required`)
      }
      if (!action.calldata || !/^0x[a-fA-F0-9]*$/.test(action.calldata)) {
        errors.push(`Action ${index + 1}: Invalid calldata`)
      }
    })
  }

  if (!metadata.createdAt) {
    errors.push('Creation timestamp is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const performFullValidation = (
  metadata: AgendaMetadata,
  isUpdate: boolean = false
): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    checks: {
      schema: false,
      signature: false,
      timestamp: false,
      integrity: false
    }
  }

  // 1. Schema validation
  const schemaValidation = validateMetadata(metadata)
  result.checks.schema = schemaValidation.isValid
  if (!schemaValidation.isValid) {
    result.errors.push(...schemaValidation.errors.map(e => `Schema: ${e}`))
  }

  // 2. Signature validation
  if (metadata.creator?.signature && metadata.creator?.address && metadata.createdAt) {
    const message = createSignatureMessage(
      metadata.id,
      metadata.transaction,
      metadata.createdAt,
      isUpdate
    )
    
    const isValidSignature = verifySignature(
      message,
      metadata.creator.signature,
      metadata.creator.address
    )
    
    result.checks.signature = isValidSignature
    if (!isValidSignature) {
      result.errors.push('Invalid signature')
    }
  } else {
    result.checks.signature = false
    result.errors.push('Missing signature data')
  }

  // 3. Timestamp validation
  if (metadata.createdAt) {
    const isValidTimestamp = validateTimestamp(metadata.createdAt)
    result.checks.timestamp = isValidTimestamp
    if (!isValidTimestamp) {
      result.errors.push('Signature timestamp is older than 1 hour')
    }
  } else {
    result.checks.timestamp = false
    result.errors.push('Missing timestamp')
  }

  // 4. Data integrity
  const hasRequiredFields = !!(
    metadata.id &&
    metadata.title &&
    metadata.description &&
    metadata.network &&
    metadata.transaction &&
    metadata.creator &&
    metadata.actions?.length > 0
  )
  
  result.checks.integrity = hasRequiredFields
  if (!hasRequiredFields) {
    result.errors.push('Missing required fields')
  }

  result.isValid = Object.values(result.checks).every(check => check)

  return result
}