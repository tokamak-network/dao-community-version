'use client'

import { useState, useEffect, useCallback } from 'react'
import { AgendaMetadata, ValidationResult } from '@/types/agenda'
import { performFullValidation } from '@/lib/validation'

interface ValidationStepProps {
  metadata: Partial<AgendaMetadata>
  onValidationComplete: () => void
  onError: (error: string) => void
  isUpdate?: boolean
}

export function ValidationStep({
  metadata,
  onValidationComplete,
  onError,
  isUpdate = false
}: ValidationStepProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  const performValidation = useCallback(async () => {
    setIsValidating(true)

    try {
      const result = performFullValidation(metadata as AgendaMetadata, isUpdate)
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
  }, [metadata, onValidationComplete, onError, isUpdate])

  useEffect(() => {
    if (metadata && Object.keys(metadata).length > 0 && metadata.creator?.signature) {
      performValidation()
    }
  }, [performValidation])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 4: Validation</h2>
        <p className="text-gray-600 mb-6">
          Validating metadata integrity and signature
        </p>
      </div>

      {isValidating && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {validationResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${
              validationResult.checks.schema
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${
                  validationResult.checks.schema ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.checks.schema ? '✓' : '✗'}
                </span>
                <div>
                  <h4 className="font-medium">Schema Validation</h4>
                  <p className="text-sm text-gray-600">
                    {validationResult.checks.schema ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              validationResult.checks.signature
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${
                  validationResult.checks.signature ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.checks.signature ? '✓' : '✗'}
                </span>
                <div>
                  <h4 className="font-medium">Signature Validation</h4>
                  <p className="text-sm text-gray-600">
                    {validationResult.checks.signature ? 'Valid' : 'Invalid'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              validationResult.checks.timestamp
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${
                  validationResult.checks.timestamp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.checks.timestamp ? '✓' : '✗'}
                </span>
                <div>
                  <h4 className="font-medium">Timestamp Validation</h4>
                  <p className="text-sm text-gray-600">
                    {validationResult.checks.timestamp ? 'Within 1 hour' : 'Expired'}
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              validationResult.checks.integrity
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${
                  validationResult.checks.integrity ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validationResult.checks.integrity ? '✓' : '✗'}
                </span>
                <div>
                  <h4 className="font-medium">Data Integrity</h4>
                  <p className="text-sm text-gray-600">
                    {validationResult.checks.integrity ? 'Complete' : 'Incomplete'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.isValid && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ All validations passed successfully!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}