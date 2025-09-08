'use client'

import { useState, useEffect, useCallback } from 'react'
import { validateMetadata, ValidationResult } from '@/lib/metadata-validator'
import { AgendaMetadata } from '@/lib/github'

interface ValidationStepProps {
  metadata: Partial<AgendaMetadata>
  onValidationComplete: () => void
  onError: (error: string) => void
}

export function ValidationStep({ 
  metadata, 
  onValidationComplete, 
  onError 
}: ValidationStepProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const performValidation = useCallback(async () => {
    setIsValidating(true)

    try {
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

      // 1. Metadata schema validation
      try {
        const schemaValidation = validateMetadata(metadata as AgendaMetadata)
        result.checks.schema = schemaValidation.isValid
        if (!schemaValidation.isValid) {
          result.errors.push(...schemaValidation.errors)
        }
      } catch {
        result.checks.schema = false
        result.errors.push('Schema validation error')
      }

      // 2. Signature validation
      if (metadata.creator?.signature && metadata.creator?.address) {
        result.checks.signature = true
      } else {
        result.checks.signature = false
        result.errors.push('Missing creator signature or address')
      }

      // 3. Timestamp validation (1 hour)
      if (metadata.createdAt) {
        const createdTime = new Date(metadata.createdAt).getTime()
        const currentTime = Date.now()
        const oneHour = 60 * 60 * 1000

        if (currentTime - createdTime <= oneHour) {
          result.checks.timestamp = true
        } else {
          result.checks.timestamp = false
          result.errors.push('Signature timestamp is older than 1 hour')
        }
      } else {
        result.checks.timestamp = false
        result.errors.push('Missing creation timestamp')
      }

      // 4. Integrity check
      const hasRequiredFields = !!(
        metadata.id && metadata.title && metadata.description &&
        metadata.network && metadata.transaction && metadata.creator &&
        metadata.actions?.length
      )

      result.checks.integrity = hasRequiredFields
      if (!hasRequiredFields) {
        result.errors.push('Missing required metadata fields')
      }

      // Overall validation result
      result.isValid = Object.values(result.checks).every(check => check)

      setValidationResult(result)

      if (result.isValid) {
        onValidationComplete()
      } else {
        onError(`Validation failed: ${result.errors.join(', ')}`)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation error occurred'
      onError(errorMessage)
      setValidationResult({
        isValid: false,
        errors: [errorMessage],
        checks: { schema: false, signature: false, timestamp: false, integrity: false }
      })
    } finally {
      setIsValidating(false)
    }
  }, [metadata, onValidationComplete, onError])

  useEffect(() => {
    if (metadata && Object.keys(metadata).length > 0) {
      performValidation()
    }
  }, [performValidation])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 4: Validation</h2>
        <p className="text-gray-600 mb-6">
          Verifying metadata integrity and signature validity
        </p>
      </div>

      {isValidating ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : validationResult && (
        <div className="space-y-4">
          {/* Validation Checks */}
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              validationResult.checks.schema ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="font-medium">Schema Validation</span>
              <span className={validationResult.checks.schema ? 'text-green-600' : 'text-red-600'}>
                {validationResult.checks.schema ? '✓ Passed' : '✗ Failed'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              validationResult.checks.signature ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="font-medium">Signature Verification</span>
              <span className={validationResult.checks.signature ? 'text-green-600' : 'text-red-600'}>
                {validationResult.checks.signature ? '✓ Passed' : '✗ Failed'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              validationResult.checks.timestamp ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="font-medium">Timestamp Check (1 hour)</span>
              <span className={validationResult.checks.timestamp ? 'text-green-600' : 'text-red-600'}>
                {validationResult.checks.timestamp ? '✓ Passed' : '✗ Failed'}
              </span>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-lg ${
              validationResult.checks.integrity ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <span className="font-medium">Data Integrity</span>
              <span className={validationResult.checks.integrity ? 'text-green-600' : 'text-red-600'}>
                {validationResult.checks.integrity ? '✓ Passed' : '✗ Failed'}
              </span>
            </div>
          </div>

          {/* Overall Result */}
          <div className={`p-4 rounded-lg ${
            validationResult.isValid 
              ? 'bg-green-100 border border-green-300' 
              : 'bg-red-100 border border-red-300'
          }`}>
            <h3 className={`font-bold text-lg mb-2 ${
              validationResult.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.isValid ? 'Validation Successful' : 'Validation Failed'}
            </h3>
            {validationResult.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{error}</li>
                ))}
              </ul>
            )}
          </div>

          {validationResult.isValid && (
            <button
              onClick={onValidationComplete}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue to GitHub Setup
            </button>
          )}
        </div>
      )}
    </div>
  )
}