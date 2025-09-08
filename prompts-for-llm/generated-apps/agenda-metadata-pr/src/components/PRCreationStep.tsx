'use client'

import { useState } from 'react'
import { AgendaMetadata, GitHubConfig } from '@/types/agenda'
import { createPR } from '@/lib/github'

interface PRCreationStepProps {
  metadata: AgendaMetadata
  githubConfig: GitHubConfig
  onPRCreated: (prUrl: string) => void
  onError: (error: string) => void
  isUpdate?: boolean
}

export function PRCreationStep({
  metadata,
  githubConfig,
  onPRCreated,
  onError,
  isUpdate = false
}: PRCreationStepProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [prUrl, setPrUrl] = useState('')
  const [creationStatus, setCreationStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle')

  const handleCreatePR = async () => {
    setIsCreating(true)
    setCreationStatus('creating')

    try {
      const url = await createPR(githubConfig, metadata, isUpdate)
      setPrUrl(url)
      setCreationStatus('success')
      onPRCreated(url)
    } catch (error) {
      setCreationStatus('error')
      onError(error instanceof Error ? error.message : 'Failed to create PR')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 6: PR Creation</h2>
        <p className="text-gray-600 mb-6">
          Create a pull request to submit your metadata
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metadata JSON
          </label>
          <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">PR Details:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Repository:</strong> tokamak-network/dao-agenda-metadata-repository</li>
            <li><strong>File Path:</strong> data/agendas/{metadata.network}/agenda-{metadata.id}.json</li>
            <li><strong>PR Title:</strong> {isUpdate ? '[Agenda Update]' : '[Agenda]'} {metadata.network} - {metadata.id} - {metadata.title}</li>
          </ul>
        </div>

        {creationStatus === 'creating' && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <p className="text-gray-700">Creating pull request...</p>
            </div>
          </div>
        )}

        {creationStatus === 'success' && prUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">✓ Pull Request Created Successfully!</h4>
            <p className="text-sm text-green-700 mb-3">
              Your metadata has been submitted for review.
            </p>
            <div className="flex items-center gap-2">
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                {prUrl}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(prUrl)}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {creationStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Failed to create pull request. Please try again.
            </p>
          </div>
        )}

        <button
          onClick={handleCreatePR}
          disabled={isCreating || creationStatus === 'success'}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Creating PR...' : creationStatus === 'success' ? 'PR Created' : 'Create Pull Request'}
        </button>
      </div>
    </div>
  )
}