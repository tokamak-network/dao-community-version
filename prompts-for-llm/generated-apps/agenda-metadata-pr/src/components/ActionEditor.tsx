'use client'

import { useState, useEffect, useCallback } from 'react'
import { CallDataValidator } from '@/lib/calldata-validator'
import { FunctionParameter } from '@/types/agenda'
import { Action } from '@/types/agenda'

interface ActionEditorProps {
  index: number
  action: Partial<Action>
  originalCalldata: string
  onUpdate: (action: Partial<Action>) => void
}

export function ActionEditor({
  index,
  action,
  originalCalldata,
  onUpdate
}: ActionEditorProps) {
  const [functionSignature, setFunctionSignature] = useState(action.method || '')
  const [parameters, setParameters] = useState<FunctionParameter[]>([])
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    error?: string
  } | null>(null)
  const [parsedFunction, setParsedFunction] = useState<{
    name: string
    inputs: { name: string; type: string }[]
  } | null>(null)

  useEffect(() => {
    if (functionSignature) {
      const parsed = CallDataValidator.parseFunctionSignature(functionSignature)
      setParsedFunction(parsed)
      
      if (parsed) {
        const newParams = parsed.inputs.map((input, i) => ({
          name: input.name,
          type: input.type,
          value: parameters[i]?.value || ''
        }))
        setParameters(newParams)
      }
    } else {
      setParsedFunction(null)
      setParameters([])
    }
  }, [functionSignature, parameters])

  useEffect(() => {
    if (action.contractAddress && functionSignature && parameters.length > 0) {
      const allParamsHaveValues = parameters.every(p => p.value.trim() !== '')
      if (allParamsHaveValues) {
        const result = CallDataValidator.validateCallData(
          action.contractAddress,
          functionSignature,
          parameters,
          originalCalldata
        )
        setValidationResult({
          isValid: result.isValid,
          error: result.error
        })
        
        if (result.isValid) {
          onUpdate({
            ...action,
            method: functionSignature,
            calldata: result.generated,
            abi: parsedFunction ? [{
              name: parsedFunction.name,
              type: 'function',
              inputs: parsedFunction.inputs.map(input => ({
                ...input,
                internalType: input.type
              })),
              outputs: [],
              stateMutability: 'nonpayable'
            }] : []
          })
        }
      } else {
        setValidationResult(null)
      }
    }
  }, [action, functionSignature, parameters, originalCalldata, parsedFunction, onUpdate])

  const updateParameter = (index: number, value: string) => {
    const newParams = [...parameters]
    newParams[index].value = value
    setParameters(newParams)
  }

  const validateParameter = (type: string, value: string) => {
    return CallDataValidator.validateParameterValue(type, value)
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Action {index + 1}</h4>
        {validationResult && (
          <div className={`text-sm px-2 py-1 rounded ${
            validationResult.isValid 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {validationResult.isValid ? '✓ Calldata matches' : '✗ Calldata mismatch'}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={action.title || ''}
          onChange={(e) => onUpdate({ ...action, title: e.target.value })}
          placeholder="Action title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contract Address *
        </label>
        <input
          type="text"
          value={action.contractAddress || ''}
          onChange={(e) => onUpdate({ ...action, contractAddress: e.target.value })}
          placeholder="0x..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Function Signature *
        </label>
        <input
          type="text"
          value={functionSignature}
          onChange={(e) => setFunctionSignature(e.target.value)}
          placeholder="transfer(address,uint256)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {parsedFunction && parsedFunction.inputs.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-700">Parameters</h5>
          {parsedFunction.inputs.map((input, i) => {
            const param = parameters[i]
            const validation = param?.value ? validateParameter(input.type, param.value) : null
            
            return (
              <div key={i}>
                <label className="block text-sm text-gray-600 mb-1">
                  {input.name} ({input.type})
                </label>
                <input
                  type="text"
                  value={param?.value || ''}
                  onChange={(e) => updateParameter(i, e.target.value)}
                  placeholder={`Enter ${input.type}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validation && !validation.isValid ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validation && !validation.isValid && (
                  <p className="text-xs text-red-600 mt-1">{validation.error}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {validationResult && !validationResult.isValid && validationResult.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{validationResult.error}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>Original calldata: {originalCalldata.slice(0, 20)}...</p>
      </div>
    </div>
  )
}