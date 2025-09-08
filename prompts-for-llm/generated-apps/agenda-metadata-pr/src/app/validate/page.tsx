'use client'

import { useState } from 'react'
import { AgendaMetadata, ValidationResult } from '@/types/agenda'
import { performFullValidation } from '@/lib/validation'
import Link from 'next/link'
import { WalletConnection } from '@/components/WalletConnection'

export default function ValidatePage() {
  const [jsonInput, setJsonInput] = useState('')
  const [metadata, setMetadata] = useState<AgendaMetadata | null>(null)
  const [parseError, setParseError] = useState('')
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

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
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid JSON')
      setMetadata(null)
    }
  }

  const handleValidate = () => {
    if (!metadata) {
      setParseError('Please enter valid JSON metadata')
      return
    }

    const result = performFullValidation(metadata, false)
    setValidationResult(result)
  }

  const placeholder = `{
  "id": 123,
  "title": "Example Agenda",
  "description": "This is an example agenda description",
  "network": "sepolia",
  "transaction": "0x...",
  "creator": {
    "address": "0x...",
    "signature": "0x..."
  },
  "actions": [
    {
      "title": "Transfer tokens",
      "contractAddress": "0x...",
      "method": "transfer(address,uint256)",
      "calldata": "0x...",
      "abi": []
    }
  ],
  "createdAt": "${new Date().toISOString()}",
  "snapshotUrl": "https://snapshot.org/#/...",
  "discourseUrl": "https://forum.tokamak.network/..."
}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Metadata Validation Tool
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Validate agenda metadata JSON
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Generator
              </Link>
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">JSON Input</h2>
              <p className="text-gray-600 mb-4">
                Paste your agenda metadata JSON below to validate its structure and content
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata JSON
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={placeholder}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {parseError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-1">JSON Parse Error</h4>
                <p className="text-sm text-red-600">{parseError}</p>
              </div>
            )}

            {metadata && !parseError && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  ✓ JSON parsed successfully
                </p>
              </div>
            )}

            <button
              onClick={handleValidate}
              disabled={!metadata || !!parseError}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Validate Metadata
            </button>

            {validationResult && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Validation Results</h3>
                
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
        </div>
      </main>

      <footer className="mt-16 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2024 Tokamak Network. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="https://github.com/tokamak-network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                GitHub
              </a>
              <a
                href="https://docs.tokamak.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}