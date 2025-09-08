import { AgendaMetadata } from './github'

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

export function validateMetadata(metadata: AgendaMetadata): ValidationResult {
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

  // Schema validation
  try {
    if (typeof metadata.id !== 'number' || metadata.id <= 0) {
      result.errors.push('Invalid agenda ID')
      result.isValid = false
    }

    if (!metadata.title || typeof metadata.title !== 'string') {
      result.errors.push('Title is required')
      result.isValid = false
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
      result.errors.push('Description is required')
      result.isValid = false
    }

    if (metadata.network !== 'mainnet' && metadata.network !== 'sepolia') {
      result.errors.push('Invalid network')
      result.isValid = false
    }

    if (!metadata.transaction || !/^0x[a-fA-F0-9]{64}$/.test(metadata.transaction)) {
      result.errors.push('Invalid transaction hash')
      result.isValid = false
    }

    if (!metadata.creator || !metadata.creator.address || !metadata.creator.signature) {
      result.errors.push('Creator information is incomplete')
      result.isValid = false
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(metadata.creator.address)) {
      result.errors.push('Invalid creator address')
      result.isValid = false
    }

    if (!metadata.actions || !Array.isArray(metadata.actions) || metadata.actions.length === 0) {
      result.errors.push('Actions array is required and must not be empty')
      result.isValid = false
    } else {
      metadata.actions.forEach((action, index) => {
        if (!action.contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(action.contractAddress)) {
          result.errors.push(`Action ${index + 1}: Invalid contract address`)
          result.isValid = false
        }
        if (!action.method) {
          result.errors.push(`Action ${index + 1}: Method is required`)
          result.isValid = false
        }
        if (!action.calldata || !/^0x[a-fA-F0-9]*$/.test(action.calldata)) {
          result.errors.push(`Action ${index + 1}: Invalid calldata`)
          result.isValid = false
        }
      })
    }

    if (!metadata.createdAt) {
      result.errors.push('Creation timestamp is required')
      result.isValid = false
    }

    result.checks.schema = result.errors.length === 0
  } catch (error) {
    result.errors.push('Schema validation error')
    result.isValid = false
  }

  // Signature validation (basic check)
  if (metadata.creator?.signature) {
    result.checks.signature = true
  } else {
    result.checks.signature = false
    result.errors.push('Missing creator signature')
    result.isValid = false
  }

  // Timestamp validation (1 hour)
  if (metadata.createdAt) {
    try {
      const createdTime = new Date(metadata.createdAt).getTime()
      const currentTime = Date.now()
      const oneHour = 60 * 60 * 1000

      if (currentTime - createdTime <= oneHour) {
        result.checks.timestamp = true
      } else {
        result.checks.timestamp = false
        result.errors.push('Signature timestamp is older than 1 hour')
        result.isValid = false
      }
    } catch {
      result.checks.timestamp = false
      result.errors.push('Invalid timestamp format')
      result.isValid = false
    }
  }

  // Integrity check
  const hasRequiredFields = !!(
    metadata.id && 
    metadata.title && 
    metadata.description &&
    metadata.network && 
    metadata.transaction && 
    metadata.creator &&
    metadata.actions?.length
  )

  result.checks.integrity = hasRequiredFields
  if (!hasRequiredFields) {
    result.errors.push('Missing required metadata fields')
    result.isValid = false
  }

  result.isValid = result.errors.length === 0

  return result
}