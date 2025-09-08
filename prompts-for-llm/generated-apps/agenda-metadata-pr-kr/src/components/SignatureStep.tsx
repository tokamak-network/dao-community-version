'use client'

import { useState, useCallback } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { createSignatureMessage } from '@/lib/signature'
import { AgendaMetadata } from '@/lib/github'

interface SignatureStepProps {
  metadata: Partial<AgendaMetadata>
  onSignatureComplete: (signedMetadata: Partial<AgendaMetadata>) => void
  onError: (error: string) => void
}

export function SignatureStep({ 
  metadata, 
  onSignatureComplete, 
  onError 
}: SignatureStepProps) {
  const { address, isConnected } = useAccount()
  const { signMessage, isPending } = useSignMessage()
  const [signature, setSignature] = useState('')
  const [signatureMessage, setSignatureMessage] = useState('')

  const handleSign = useCallback(async () => {
    if (!isConnected || !address) {
      onError('Please connect your wallet first')
      return
    }

    if (!metadata.id || !metadata.transaction) {
      onError('Missing required metadata')
      return
    }

    const timestamp = new Date().toISOString()
    const message = createSignatureMessage(
      metadata.id,
      metadata.transaction,
      timestamp,
      false
    )

    setSignatureMessage(message)

    signMessage(
      { message },
      {
        onSuccess: (sig) => {
          setSignature(sig)
          const signedMetadata: Partial<AgendaMetadata> = {
            ...metadata,
            creator: {
              address,
              signature: sig
            },
            createdAt: timestamp
          }
          onSignatureComplete(signedMetadata)
        },
        onError: (error) => {
          onError(error.message || 'Failed to sign message')
        }
      }
    )
  }, [isConnected, address, metadata, signMessage, onSignatureComplete, onError])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Step 3: Wallet Connection & Signature</h2>
        <p className="text-gray-600 mb-6">
          Connect your wallet and sign the metadata to verify you are the agenda creator
        </p>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please connect your wallet using the button in the header to continue.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">Connected Wallet</p>
            <p className="font-mono text-sm">{address}</p>
          </div>

          {signatureMessage && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signature Message
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {signatureMessage}
                </p>
              </div>
            </div>
          )}

          {signature && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Signature
              </label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-mono break-all">{signature}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(signature)}
                  className="mt-2 text-sm text-green-700 hover:text-green-800"
                >
                  Copy signature
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSign}
            disabled={isPending || !!signature}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isPending || !!signature
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isPending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing...
              </span>
            ) : signature ? (
              'Signature Complete ✓'
            ) : (
              'Generate Signature'
            )}
          </button>
        </div>
      )}
    </div>
  )
}