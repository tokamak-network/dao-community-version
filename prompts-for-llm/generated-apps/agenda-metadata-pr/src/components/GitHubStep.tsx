'use client'

import { useState } from 'react'
import { validateGitHubToken } from '@/lib/github'
import { GitHubConfig } from '@/types/agenda'

interface GitHubStepProps {
  onConfigComplete: (config: GitHubConfig) => void
  onError: (error: string) => void
}

export function GitHubStep({ onConfigComplete, onError }: GitHubStepProps) {
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')

  const handleValidate = async () => {
    if (!username.trim() || !token.trim()) {
      onError('Username and token are required')
      return
    }

    setIsValidating(true)
    setValidationStatus('idle')

    try {
      const isValid = await validateGitHubToken(username, token)
      
      if (isValid) {
        setValidationStatus('valid')
        const config: GitHubConfig = {
          username,
          token,
          owner: 'tokamak-network',
          repo: 'dao-agenda-metadata-repository',
          branch: 'main'
        }
        onConfigComplete(config)
      } else {
        setValidationStatus('invalid')
        onError('Invalid GitHub credentials. Please check your username and token.')
      }
    } catch (error) {
      setValidationStatus('invalid')
      onError('Failed to validate GitHub credentials')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 5: GitHub Configuration</h2>
        <p className="text-gray-600 mb-6">
          Configure your GitHub account to create a pull request
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-github-username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isValidating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Access Token *
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isValidating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Create a token at{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              GitHub Settings → Developer settings → Personal access tokens
            </a>
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Required Token Permissions:</h4>
          <ul className="list-disc list-inside text-sm text-blue-700">
            <li>repo (Full control of private repositories)</li>
            <li>workflow (Update GitHub Action workflows)</li>
          </ul>
        </div>

        {validationStatus === 'valid' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              ✓ GitHub credentials validated successfully!
            </p>
          </div>
        )}

        {validationStatus === 'invalid' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              ✗ Invalid GitHub credentials. Please check your username and token.
            </p>
          </div>
        )}

        <button
          onClick={handleValidate}
          disabled={isValidating || !username.trim() || !token.trim()}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isValidating ? 'Validating...' : 'Validate and Continue'}
        </button>
      </div>
    </div>
  )
}