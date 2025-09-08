'use client'

import { useState, useEffect, useCallback } from 'react'
import { CallDataValidator, FunctionParameter, CallDataValidationResult } from '@/lib/calldata-validator'

interface ActionEditorProps {
  index: number
  contractAddress: string
  originalCalldata: string
  onUpdate: (data: any) => void
}

export function ActionEditor({ 
  index, 
  contractAddress, 
  originalCalldata,
  onUpdate 
}: ActionEditorProps) {
  const [title, setTitle] = useState('')
  const [functionSignature, setFunctionSignature] = useState('')
  const [parameters, setParameters] = useState<FunctionParameter[]>([])
  const [validationResult, setValidationResult] = useState<CallDataValidationResult | null>(null)
  const [parseError, setParseError] = useState('')

  const handleSignatureChange = useCallback((signature: string) => {
    setFunctionSignature(signature)
    setParseError('')

    if (!signature.trim()) {
      setParameters([])
      setValidationResult(null)
      return
    }

    const parsed = CallDataValidator.parseFunctionSignature(signature)
    if (parsed) {
      const newParams = parsed.inputs.map((input, idx) => ({
        name: `param${idx}`,
        type: input.type,
        value: ''
      }))
      setParameters(newParams)
    } else {
      setParseError('Invalid function signature format')
      setParameters([])
    }
  }, [])

  const handleParameterChange = useCallback((index: number, value: string) => {
    const newParams = [...parameters]
    newParams[index].value = value
    setParameters(newParams)

    // Validate if all parameters have values
    if (newParams.every(p => p.value.trim())) {
      const result = CallDataValidator.validateCallData(
        contractAddress,
        functionSignature,
        newParams,
        originalCalldata
      )
      setValidationResult(result)
    } else {
      setValidationResult(null)
    }
  }, [contractAddress, functionSignature, originalCalldata, parameters])

  useEffect(() => {
    onUpdate({
      title,
      contractAddress,
      method: functionSignature,
      calldata: originalCalldata,
      parameters,
      isValid: validationResult?.isValid || false
    })
  }, [title, contractAddress, functionSignature, originalCalldata, parameters, validationResult, onUpdate])

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">Action {index + 1}</h4>
        {validationResult && (
          <span className={`text-sm font-medium ${
            validationResult.isValid ? 'text-green-600' : 'text-red-600'
          }`}>
            {validationResult.isValid ? '✓ Valid' : '✗ Invalid'}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Action Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Transfer TON tokens"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contract Address
        </label>
        <input
          type="text"
          value={contractAddress}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Function Signature <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={functionSignature}
          onChange={(e) => handleSignatureChange(e.target.value)}
          placeholder="e.g., transfer(address,uint256)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {parseError && (
          <p className="text-red-500 text-sm mt-1">{parseError}</p>
        )}
      </div>

      {parameters.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Parameters
          </label>
          {parameters.map((param, idx) => (
            <div key={idx}>
              <label className="block text-xs text-gray-500 mb-1">
                {param.type} (param{idx})
              </label>
              <input
                type="text"
                value={param.value}
                onChange={(e) => handleParameterChange(idx, e.target.value)}
                placeholder={`Enter ${param.type} value`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {param.value && !CallDataValidator.validateParameterValue(param.type, param.value).isValid && (
                <p className="text-red-500 text-xs mt-1">
                  {CallDataValidator.validateParameterValue(param.type, param.value).error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {validationResult && (
        <div className={`p-3 rounded-lg ${
          validationResult.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className="text-sm font-medium mb-2">
            Calldata Validation {validationResult.isValid ? 'Success' : 'Failed'}
          </p>
          {!validationResult.isValid && validationResult.error && (
            <p className="text-sm text-red-600">{validationResult.error}</p>
          )}
          <div className="text-xs mt-2 space-y-1">
            <div>
              <span className="font-medium">Generated:</span>
              <div className="font-mono break-all mt-1">
                {validationResult.generated.slice(0, 20)}...
              </div>
            </div>
            <div>
              <span className="font-medium">Original:</span>
              <div className="font-mono break-all mt-1">
                {validationResult.original.slice(0, 20)}...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}