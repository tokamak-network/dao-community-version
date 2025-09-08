'use client'

import { useState, useCallback } from 'react'
import { validateGitHubToken, GitHubConfig, GITHUB_CONFIG } from '@/lib/github'

interface GitHubSetupProps {
  onSetupComplete: (config: GitHubConfig) => void
  onError: (error: string) => void
}

export function GitHubSetup({ onSetupComplete, onError }: GitHubSetupProps) {
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleValidate = useCallback(async () => {
    if (!username.trim()) {
      onError('GitHub username is required')
      return
    }
    if (!token.trim()) {
      onError('GitHub token is required')
      return
    }

    setIsValidating(true)
    setValidationStatus('idle')

    try {
      const isValid = await validateGitHubToken(username, token)
      
      if (isValid) {
        setValidationStatus('success')
        const config: GitHubConfig = {
          username,
          token,
          owner: GITHUB_CONFIG.owner!,
          repo: GITHUB_CONFIG.repo!,
          branch: GITHUB_CONFIG.branch!
        }
        onSetupComplete(config)
      } else {
        setValidationStatus('error')
        onError('Invalid GitHub token or username mismatch')
      }
    } catch (error) {
      setValidationStatus('error')
      onError('Failed to validate GitHub credentials')
    } finally {
      setIsValidating(false)
    }
  }, [username, token, onSetupComplete, onError])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 5: GitHub Setup</h2>
        <p className="text-gray-600 mb-6">
          Configure your GitHub credentials to create a pull request
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Repository Information</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Repository:</span> {GITHUB_CONFIG.owner}/{GITHUB_CONFIG.repo}</p>
          <p><span className="font-medium">Branch:</span> {GITHUB_CONFIG.branch}</p>
          <p><span className="font-medium">Action:</span> Fork repository and create pull request</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your-github-username"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isValidating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Personal Access Token <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isValidating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Create a token at{' '}
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              github.com/settings/tokens
            </a>
            {' '}with repo scope
          </p>
        </div>

        {validationStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            ✓ GitHub credentials validated successfully
          </div>
        )}

        {validationStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ✗ Invalid GitHub credentials. Please check your username and token.
          </div>
        )}

        <button
          onClick={handleValidate}
          disabled={isValidating || !username.trim() || !token.trim()}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isValidating || !username.trim() || !token.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isValidating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Validating...
            </span>
          ) : (
            'Validate & Continue'
          )}
        </button>
      </div>
    </div>
  )
}