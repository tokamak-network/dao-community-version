'use client'

import { useState } from 'react'
import { parseAgendaTransaction } from '@/lib/transaction-parser'
import { safe, ERROR_MESSAGES } from '@/lib/utils'
import { ParsedTransaction } from '@/types/agenda'

interface TransactionInputProps {
  onTransactionParsed: (transaction: ParsedTransaction) => void
  onError: (error: string) => void
  initialNetwork?: 'mainnet' | 'sepolia'
}

export function TransactionInput({
  onTransactionParsed,
  onError,
  initialNetwork = 'sepolia'
}: TransactionInputProps) {
  const [txHash, setTxHash] = useState('')
  const [network, setNetwork] = useState<'mainnet' | 'sepolia'>(initialNetwork)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')

  const handleParse = async () => {
    setValidationError('')
    
    if (!txHash.trim()) {
      setValidationError('Transaction hash is required')
      return
    }
    
    if (!safe.validateTxHash(txHash)) {
      setValidationError(ERROR_MESSAGES.INVALID_HASH)
      return
    }

    setIsLoading(true)
    try {
      const chainId = network === 'mainnet' ? 1 : 11155111
      const parsedTx = await parseAgendaTransaction(txHash, chainId)
      onTransactionParsed(parsedTx)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction'
      setValidationError(errorMessage)
      onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Step 1: Transaction Input</h2>
        <p className="text-gray-600 mb-6">
          Enter the transaction hash of the agenda creation to extract information
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network *
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'sepolia')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="sepolia">Sepolia Testnet</option>
            <option value="mainnet">Ethereum Mainnet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Hash *
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {validationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isLoading || !txHash.trim()}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Parsing Transaction...' : 'Parse Transaction'}
        </button>
      </div>
    </div>
  )
}