'use client'

import { useState } from 'react'
import { validateMetadata } from '@/lib/metadata-validator'
import { AgendaMetadata } from '@/lib/github'
import Link from 'next/link'

export default function ValidatePage() {
  const [jsonInput, setJsonInput] = useState('')
  const [metadata, setMetadata] = useState<AgendaMetadata | null>(null)
  const [parseError, setParseError] = useState('')
  const [validationResult, setValidationResult] = useState<any>(null)

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    setParseError('')
    setValidationResult(null)

    if (!value.trim()) {
      setMetadata(null)
      return
    }

    try {
      const parsed = JSON.parse(value) as AgendaMetadata
      setMetadata(parsed)
      
      // Automatically validate when JSON is parsed successfully
      const result = validateMetadata(parsed)
      setValidationResult(result)
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid JSON')
      setMetadata(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
        >
          ← Back to Generator
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Metadata Validator</h1>
        <p className="text-gray-600 mb-6">
          Paste your agenda metadata JSON to validate its structure and content
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON Input
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder={`{
  "id": 123,
  "title": "Agenda Title",
  "description": "Agenda description",
  "network": "sepolia",
  "transaction": "0x...",
  "creator": {
    "address": "0x...",
    "signature": "0x..."
  },
  "actions": [
    {
      "title": "Action 1",
      "contractAddress": "0x...",
      "method": "transfer(address,uint256)",
      "calldata": "0x..."
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z"
}`}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-1">JSON Parse Error</p>
              <p className="text-sm">{parseError}</p>
            </div>
          )}

          {validationResult && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Validation Results</h2>
              
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
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index} className="text-sm text-red-700">{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {metadata && !validationResult && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
              JSON parsed successfully. Validating...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}