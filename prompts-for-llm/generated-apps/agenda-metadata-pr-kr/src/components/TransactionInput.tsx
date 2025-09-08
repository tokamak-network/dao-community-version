'use client'

import { useState } from 'react'
import { parseAgendaTransaction, ParsedTransaction } from '@/lib/transaction-parser'
import { safe } from '@/lib/safe'

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
    // 1. Input validation
    if (!txHash.trim()) {
      setValidationError('Transaction hash is required')
      return
    }
    if (!safe.validateTxHash(txHash)) {
      setValidationError('Invalid transaction hash format')
      return
    }

    // 2. Transaction parsing
    setIsLoading(true)
    setValidationError('')
    
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
        <h2 className="text-2xl font-bold mb-4">Step 1: Transaction Input</h2>
        <p className="text-gray-600 mb-6">
          Enter the transaction hash of your agenda creation transaction
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network <span className="text-red-500">*</span>
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'sepolia')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="sepolia">Sepolia Testnet</option>
            <option value="mainnet">Ethereum Mainnet</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Hash <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={txHash}
            onChange={(e) => {
              setTxHash(e.target.value)
              setValidationError('')
            }}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {validationError}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={isLoading || !txHash.trim()}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            isLoading || !txHash.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Parsing Transaction...
            </span>
          ) : (
            'Parse Transaction'
          )}
        </button>
      </div>
    </div>
  )
}