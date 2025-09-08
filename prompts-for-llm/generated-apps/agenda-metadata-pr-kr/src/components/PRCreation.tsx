'use client'

import { useState, useCallback, useEffect } from 'react'
import { createPR, GitHubConfig, AgendaMetadata } from '@/lib/github'

interface PRCreationProps {
  metadata: Partial<AgendaMetadata>
  githubConfig: GitHubConfig
  onPRCreated: (url: string) => void
  onError: (error: string) => void
}

export function PRCreation({ 
  metadata, 
  githubConfig, 
  onPRCreated, 
  onError 
}: PRCreationProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [prUrl, setPrUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleCreatePR = useCallback(async () => {
    setIsCreating(true)
    setStatus('creating')
    setErrorMessage('')

    try {
      const url = await createPR(
        githubConfig,
        metadata as AgendaMetadata,
        false // Not an update
      )
      setPrUrl(url)
      setStatus('success')
      onPRCreated(url)
    } catch (error) {
      setStatus('error')
      const message = error instanceof Error ? error.message : 'Failed to create PR'
      setErrorMessage(message)
      onError(message)
    } finally {
      setIsCreating(false)
    }
  }, [githubConfig, metadata, onPRCreated, onError])

  useEffect(() => {
    // Auto-start PR creation when component mounts
    if (status === 'idle') {
      handleCreatePR()
    }
  }, []) // Only run once on mount

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 6: Pull Request Creation</h2>
        <p className="text-gray-600 mb-6">
          Creating a pull request with your agenda metadata
        </p>
      </div>

      {/* Metadata Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Metadata Summary</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">Agenda ID:</span> {metadata.id}</p>
          <p><span className="font-medium">Title:</span> {metadata.title}</p>
          <p><span className="font-medium">Network:</span> {metadata.network}</p>
          <p><span className="font-medium">Transaction:</span> {metadata.transaction}</p>
          <p><span className="font-medium">Creator:</span> {metadata.creator?.address}</p>
          <p><span className="font-medium">Actions:</span> {metadata.actions?.length || 0}</p>
        </div>
      </div>

      {/* Status Display */}
      <div className="space-y-4">
        {status === 'creating' && (
          <div className="flex flex-col items-center py-8">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Creating pull request...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        )}

        {status === 'success' && prUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Pull Request Created Successfully!</h3>
                <p className="text-green-700 mb-3">Your agenda metadata has been submitted for review.</p>
                <div className="bg-white border border-green-200 rounded p-3">
                  <p className="text-xs text-gray-500 mb-1">Pull Request URL:</p>
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all text-sm"
                  >
                    {prUrl}
                  </a>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.open(prUrl, '_blank')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Open PR
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(prUrl)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Failed to Create Pull Request</h3>
                <p className="text-red-700 mb-3">{errorMessage}</p>
                <button
                  onClick={handleCreatePR}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Complete Metadata JSON */}
      <details className="mt-8">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          View Complete Metadata JSON
        </summary>
        <pre className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-xs">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </div>
  )
}