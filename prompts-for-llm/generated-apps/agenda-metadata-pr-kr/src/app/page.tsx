'use client'

import { useState, useCallback } from 'react'
import { TransactionInput } from '@/components/TransactionInput'
import { MetadataInput } from '@/components/MetadataInput'
import { SignatureStep } from '@/components/SignatureStep'
import { ValidationStep } from '@/components/ValidationStep'
import { GitHubSetup } from '@/components/GitHubSetup'
import { PRCreation } from '@/components/PRCreation'
import { ParsedTransaction } from '@/lib/transaction-parser'
import { AgendaMetadata, GitHubConfig } from '@/lib/github'

type Step = 'transaction' | 'metadata' | 'signature' | 'validation' | 'github' | 'pr'

interface WorkflowStep {
  id: Step
  name: string
  number: number
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'transaction', name: 'Transaction Input', number: 1 },
  { id: 'metadata', name: 'Metadata Input', number: 2 },
  { id: 'signature', name: 'Signature', number: 3 },
  { id: 'validation', name: 'Validation', number: 4 },
  { id: 'github', name: 'GitHub Setup', number: 5 },
  { id: 'pr', name: 'Create PR', number: 6 },
]

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('transaction')
  const [parsedTransaction, setParsedTransaction] = useState<ParsedTransaction | null>(null)
  const [metadata, setMetadata] = useState<Partial<AgendaMetadata> | null>(null)
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null)
  const [error, setError] = useState<string>('')

  const handleTransactionParsed = useCallback((tx: ParsedTransaction) => {
    setParsedTransaction(tx)
    setError('')
    setCurrentStep('metadata')
  }, [])

  const handleMetadataComplete = useCallback((data: Partial<AgendaMetadata>) => {
    setMetadata(data)
    setError('')
    setCurrentStep('signature')
  }, [])

  const handleSignatureComplete = useCallback((signedMetadata: Partial<AgendaMetadata>) => {
    setMetadata(signedMetadata)
    setError('')
    setCurrentStep('validation')
  }, [])

  const handleValidationComplete = useCallback(() => {
    setError('')
    setCurrentStep('github')
  }, [])

  const handleGitHubSetupComplete = useCallback((config: GitHubConfig) => {
    setGithubConfig(config)
    setError('')
    setCurrentStep('pr')
  }, [])

  const handlePRCreated = useCallback((url: string) => {
    setError('')
    // Success! The PR URL is already displayed in the PRCreation component
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
  }, [])

  const getStepStatus = (step: Step) => {
    const stepOrder = ['transaction', 'metadata', 'signature', 'validation', 'github', 'pr']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    getStepStatus(step.id) === 'completed'
                      ? 'bg-green-600 text-white'
                      : getStepStatus(step.id) === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {getStepStatus(step.id) === 'completed' ? '✓' : step.number}
                </div>
                <span className="text-xs mt-2 text-center">{step.name}</span>
              </div>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    getStepStatus(WORKFLOW_STEPS[index + 1].id) !== 'pending'
                      ? 'bg-green-600'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        {currentStep === 'transaction' && (
          <TransactionInput
            onTransactionParsed={handleTransactionParsed}
            onError={handleError}
          />
        )}

        {currentStep === 'metadata' && parsedTransaction && (
          <MetadataInput
            parsedTransaction={parsedTransaction}
            onMetadataComplete={handleMetadataComplete}
            onError={handleError}
          />
        )}

        {currentStep === 'signature' && metadata && (
          <SignatureStep
            metadata={metadata}
            onSignatureComplete={handleSignatureComplete}
            onError={handleError}
          />
        )}

        {currentStep === 'validation' && metadata && (
          <ValidationStep
            metadata={metadata}
            onValidationComplete={handleValidationComplete}
            onError={handleError}
          />
        )}

        {currentStep === 'github' && (
          <GitHubSetup
            onSetupComplete={handleGitHubSetupComplete}
            onError={handleError}
          />
        )}

        {currentStep === 'pr' && metadata && githubConfig && (
          <PRCreation
            metadata={metadata}
            githubConfig={githubConfig}
            onPRCreated={handlePRCreated}
            onError={handleError}
          />
        )}
      </div>
    </div>
  )
}
