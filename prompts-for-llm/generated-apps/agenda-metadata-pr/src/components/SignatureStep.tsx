'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { AgendaMetadata } from '@/types/agenda'
import { createSignatureMessage } from '@/lib/signature'
import { safe } from '@/lib/utils'

interface SignatureStepProps {
  metadata: Partial<AgendaMetadata>
  onSignatureComplete: (signedMetadata: Partial<AgendaMetadata>) => void
  onError: (error: string) => void
  isUpdate?: boolean
}

export function SignatureStep({
  metadata,
  onSignatureComplete,
  onError,
  isUpdate = false
}: SignatureStepProps) {
  const { address, isConnected } = useAccount()
  const { signMessage, isPending } = useSignMessage()
  const [signatureMessage, setSignatureMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    if (metadata.id && metadata.transaction) {
      const now = new Date().toISOString()
      setTimestamp(now)
      const message = createSignatureMessage(
        metadata.id,
        metadata.transaction,
        now,
        isUpdate
      )
      setSignatureMessage(message)
    }
  }, [metadata.id, metadata.transaction, isUpdate])

  const handleSign = async () => {
    if (!isConnected || !address) {
      onError('Please connect your wallet first')
      return
    }

    if (address.toLowerCase() !== metadata.creator?.address.toLowerCase()) {
      onError('Connected wallet does not match the agenda creator address')
      return
    }

    signMessage(
      { message: signatureMessage },
      {
        onSuccess: (sig) => {
          setSignature(sig)
          const signedMetadata: Partial<AgendaMetadata> = {
            ...metadata,
            creator: {
              address: metadata.creator?.address || '',
              signature: sig
            },
            createdAt: timestamp
          }
          onSignatureComplete(signedMetadata)
        },
        onError: (error) => {
          onError(`Failed to sign: ${error.message}`)
        }
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 3: Wallet Connection and Signature</h2>
        <p className="text-gray-600 mb-6">
          Sign the metadata with your wallet to prove ownership
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Required Wallet Address</h3>
          <p className="text-sm text-blue-700 font-mono">
            {metadata.creator?.address}
          </p>
        </div>

        {isConnected && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Connected Wallet</h3>
            <p className="text-sm text-gray-700 font-mono">
              {safe.formatAddress(address || '')}
            </p>
            {address?.toLowerCase() !== metadata.creator?.address.toLowerCase() && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Connected wallet does not match creator address
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature Message
          </label>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {signatureMessage}
            </pre>
          </div>
        </div>

        {signature && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Signature
            </label>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs font-mono break-all">{signature}</p>
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              Please connect your wallet to continue
            </p>
          </div>
        ) : (
          <button
            onClick={handleSign}
            disabled={isPending || !!signature || address?.toLowerCase() !== metadata.creator?.address.toLowerCase()}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Signing...' : signature ? 'Signature Complete' : 'Sign Message'}
          </button>
        )}
      </div>
    </div>
  )
}