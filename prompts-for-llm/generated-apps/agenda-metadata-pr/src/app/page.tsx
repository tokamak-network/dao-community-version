'use client'

import { useState } from 'react'
import { WalletConnection } from '@/components/WalletConnection'
import { TransactionInput } from '@/components/TransactionInput'
import { MetadataInput } from '@/components/MetadataInput'
import { SignatureStep } from '@/components/SignatureStep'
import { ValidationStep } from '@/components/ValidationStep'
import { GitHubStep } from '@/components/GitHubStep'
import { PRCreationStep } from '@/components/PRCreationStep'
import { ParsedTransaction, AgendaMetadata, GitHubConfig } from '@/types/agenda'
import { getContracts } from '@/constants/contracts'
import Link from 'next/link'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null)
  const [metadata, setMetadata] = useState<Partial<AgendaMetadata>>({})
  const [githubConfig, setGitHubConfig] = useState<GitHubConfig | null>(null)
  const [error, setError] = useState('')
  const [prUrl, setPrUrl] = useState('')

  const handleTransactionParsed = (transaction: ParsedTransaction) => {
    setParsedTransaction(transaction)
    setCurrentStep(2)
    setError('')
  }

  const handleMetadataComplete = (completedMetadata: Partial<AgendaMetadata>) => {
    setMetadata(completedMetadata)
    setCurrentStep(3)
    setError('')
  }

  const handleSignatureComplete = (signedMetadata: Partial<AgendaMetadata>) => {
    setMetadata(signedMetadata)
    setCurrentStep(4)
    setError('')
  }

  const handleValidationComplete = () => {
    setCurrentStep(5)
    setError('')
  }

  const handleGitHubConfigComplete = (config: GitHubConfig) => {
    setGitHubConfig(config)
    setCurrentStep(6)
    setError('')
  }

  const handlePRCreated = (url: string) => {
    setPrUrl(url)
    setError('')
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  const steps = [
    { number: 1, title: 'Transaction Input', active: currentStep === 1 },
    { number: 2, title: 'Metadata Input', active: currentStep === 2 },
    { number: 3, title: 'Signature', active: currentStep === 3 },
    { number: 4, title: 'Validation', active: currentStep === 4 },
    { number: 5, title: 'GitHub Config', active: currentStep === 5 },
    { number: 6, title: 'Create PR', active: currentStep === 6 },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tokamak DAO Agenda Metadata Generator
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Generate and submit metadata for DAO agendas
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/validate"
                className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Validate Tool
              </Link>
              <WalletConnection />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : step.active
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-xs mt-2 ${step.active ? 'font-medium' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 1 && (
            <TransactionInput
              onTransactionParsed={handleTransactionParsed}
              onError={handleError}
            />
          )}

          {currentStep === 2 && parsedTransaction && (
            <MetadataInput
              parsedTransaction={parsedTransaction}
              onMetadataComplete={handleMetadataComplete}
              onError={handleError}
            />
          )}

          {currentStep === 3 && metadata && (
            <SignatureStep
              metadata={metadata}
              onSignatureComplete={handleSignatureComplete}
              onError={handleError}
            />
          )}

          {currentStep === 4 && metadata && (
            <ValidationStep
              metadata={metadata}
              onValidationComplete={handleValidationComplete}
              onError={handleError}
            />
          )}

          {currentStep === 5 && (
            <GitHubStep
              onConfigComplete={handleGitHubConfigComplete}
              onError={handleError}
            />
          )}

          {currentStep === 6 && metadata && githubConfig && (
            <PRCreationStep
              metadata={metadata as AgendaMetadata}
              githubConfig={githubConfig}
              onPRCreated={handlePRCreated}
              onError={handleError}
            />
          )}
        </div>

        {/* Navigation */}
        {currentStep > 1 && currentStep < 6 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Previous
            </button>
          </div>
        )}
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
