'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount, useChainId, useWriteContract, useReadContract, useWaitForTransactionReceipt, useEstimateGas } from 'wagmi'
import { encodeAbiParameters, decodeEventLog, encodeFunctionData } from 'viem'
import { safe, validate } from '@/lib/safe-utils'
import { getContracts, isChainSupported, getEtherscanUrl } from '@/lib/wagmi'
import { TON_ABI, COMMITTEE_ABI, AGENDA_MANAGER_ABI } from '@/lib/abis'
import { FormData, ValidationResult, AgendaCreationResult, Transaction } from '@/lib/types'

export function AgendaForm() {
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    url: '',
    transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
  })
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: false, errors: [] })
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<AgendaCreationResult | null>(null)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const isSupported = isChainSupported(chainId)

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const { data: tonBalance, refetch: refetchBalance } = useReadContract({
    address: contracts?.ton,
    abi: TON_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!contracts }
  })

  const { data: agendaFee, isLoading: feeLoading } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'createAgendaFees',
    query: { enabled: !!contracts }
  })

  const { data: noticePeriod } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumNoticePeriodSeconds',
    query: { enabled: !!contracts }
  })

  const { data: votingPeriod } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumVotingPeriodSeconds',
    query: { enabled: !!contracts }
  })

  const encodeTransactionData = useCallback((formData: FormData, noticePeriod: bigint, votingPeriod: bigint) => {
    const targets = formData.transactions.map(tx => tx.targetAddress as `0x${string}`)

    const callData = formData.transactions.map((tx, index) => {
      const functionAbi = safe.json(tx.functionAbi)
      const parameters = safe.json(tx.parameters)

      if (!functionAbi || !parameters) {
        throw new Error(`Transaction ${index + 1}: Invalid ABI or parameters`)
      }

      const abi = Array.isArray(functionAbi) ? functionAbi[0] : functionAbi
      const abiObj = abi as { inputs?: unknown[] }
      const inputs = abiObj.inputs || []
      const parametersArray = Array.isArray(parameters) ? parameters : []

      if (inputs.length !== parametersArray.length) {
        throw new Error(`Transaction ${index + 1}: Expected ${inputs.length} parameters, got ${parametersArray.length}`)
      }

      try {
        const abiFunction = abi as { name: string; inputs: unknown[] }
        return encodeFunctionData({
          abi: [abiFunction as { name: string; type: string; inputs: unknown[] }],
          functionName: abiFunction.name,
          args: parametersArray as readonly unknown[]
        })
      } catch (error) {
        throw new Error(`Transaction ${index + 1}: Failed to encode function data - ${error}`)
      }
    })

    return encodeAbiParameters([
      { name: 'targetAddresses', type: 'address[]' },
      { name: 'minimumNoticePeriodSeconds', type: 'uint256' },
      { name: 'minimumVotingPeriodSeconds', type: 'uint256' },
      { name: 'executeImmediately', type: 'bool' },
      { name: 'callDataArray', type: 'bytes[]' },
      { name: 'agendaUrl', type: 'string' }
    ], [
      targets,
      noticePeriod,
      votingPeriod,
      true,
      callData,
      formData.url
    ])
  }, [])

  const encodedData = useMemo(() => {
    if (!validationResult.isValid || !noticePeriod || !votingPeriod) return null

    try {
      return encodeTransactionData(formData, noticePeriod, votingPeriod)
    } catch {
      return null
    }
  }, [formData, validationResult.isValid, noticePeriod, votingPeriod, encodeTransactionData])

  const { data: estimatedGas } = useEstimateGas({
    to: contracts?.ton,
    data: encodedData ? `0x${encodedData.slice(2)}` : undefined,
    query: { enabled: !!encodedData && !!contracts && validationResult.isValid }
  })

  useEffect(() => {
    if (hasUserInteracted) {
      const result = validate.form(formData)
      setValidationResult(result)
    }
  }, [formData, hasUserInteracted])

  useEffect(() => {
    setMounted(true)
    const saved = safe.storage.get('agenda-form', {
      url: '',
      transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
    })
    setFormData(saved)

    if (!saved.url && saved.transactions.length === 1 &&
        !saved.transactions[0].targetAddress &&
        !saved.transactions[0].functionAbi &&
        !saved.transactions[0].parameters) {
      setHasUserInteracted(false)
      setValidationResult({ isValid: false, errors: [] })
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const timeout = setTimeout(() => {
      safe.storage.set('agenda-form', formData)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [formData, mounted])

  const hasEnoughBalance = useMemo(() => {
    if (!tonBalance || !agendaFee) return false
    return safe.bigInt(tonBalance)! >= safe.bigInt(agendaFee)!
  }, [tonBalance, agendaFee])

  const handleSubmit = useCallback(async () => {
    const currentValidation = validate.form(formData)
    setValidationResult(currentValidation)
    setHasUserInteracted(true)

    if (!isSupported || !contracts || !agendaFee || !currentValidation.isValid) return

    setIsSubmitting(true)
    setResult(null)

    try {
      if (!hasEnoughBalance) {
        throw new Error(`Insufficient TON balance. Need ${safe.formatTON(agendaFee || null)} TON but have ${safe.formatTON(tonBalance || null)}`)
      }

      const encodedData = encodeTransactionData(formData, noticePeriod!, votingPeriod!)

      await writeContract({
        address: contracts.ton,
        abi: TON_ABI,
        functionName: 'approveAndCall',
        args: [contracts.committee, agendaFee, encodedData]
      })

    } catch (error) {
      setIsSubmitting(false)
      setResult({
        hash: '0x0',
        agendaId: '',
        success: false,
        error: safe.getErrorMessage(error)
      })
    }
  }, [isSupported, contracts, agendaFee, hasEnoughBalance, formData, noticePeriod, votingPeriod, writeContract, tonBalance, encodeTransactionData])

  useEffect(() => {
    if (receipt) {
      setIsSubmitting(false)

      let agendaId = ''
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: COMMITTEE_ABI,
            data: log.data,
            topics: log.topics
          })

          if (decoded.eventName === 'AgendaCreated' && decoded.args) {
            agendaId = (decoded.args as { id: bigint }).id.toString()
            break
          }
        } catch {}
      }

      setResult({
        hash: receipt.transactionHash,
        agendaId,
        success: true
      })

      setFormData({
        url: '',
        transactions: [{ targetAddress: '', functionAbi: '', parameters: '' }]
      })
      setHasUserInteracted(false)
      setValidationResult({ isValid: false, errors: [] })
      safe.storage.clear('agenda-form')
      refetchBalance()
    }
  }, [receipt, refetchBalance])

  useEffect(() => {
    if (writeError) {
      setIsSubmitting(false)
      setResult({
        hash: '0x0',
        agendaId: '',
        success: false,
        error: safe.getErrorMessage(writeError)
      })
    }
  }, [writeError])

  const addTransaction = () => {
    setFormData(prev => ({
      ...prev,
      transactions: [...prev.transactions, { targetAddress: '', functionAbi: '', parameters: '' }]
    }))
  }

  const removeTransaction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index)
    }))
  }

  const updateTransaction = (index: number, field: keyof Transaction, value: string) => {
    setHasUserInteracted(true)
    setFormData(prev => ({
      ...prev,
      transactions: prev.transactions.map((tx, i) =>
        i === index ? { ...tx, [field]: value } : tx
      )
    }))
  }

  if (!mounted) {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">🔗 Wallet Connection Required</div>
        <p className="text-gray-600">Please connect your wallet above to create DAO agendas.</p>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ Unsupported Network</div>
        <p className="text-gray-600">Please switch to Ethereum Mainnet or Sepolia Testnet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Account Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">TON Balance</p>
            <p className="text-xl font-mono">{safe.formatTON(tonBalance || null)} TON</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Creation Fee</p>
            <p className="text-xl font-mono">{feeLoading ? '⏳' : `${safe.formatTON(agendaFee || null)} TON`}</p>
          </div>
        </div>

        {!hasEnoughBalance && agendaFee && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">
              ❌ Insufficient balance. Need {safe.formatTON(agendaFee || null)} TON for agenda creation.
            </p>
          </div>
        )}
      </div>

      {(noticePeriod || votingPeriod) && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Agenda Periods</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {noticePeriod && (
              <div>
                <span className="text-blue-700">Notice Period:</span>
                <span className="ml-2 font-mono">{Number(noticePeriod)}s ({Math.floor(Number(noticePeriod) / 60)}m)</span>
              </div>
            )}
            {votingPeriod && (
              <div>
                <span className="text-blue-700">Voting Period:</span>
                <span className="ml-2 font-mono">{Number(votingPeriod)}s ({Math.floor(Number(votingPeriod) / 60)}m)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className={`rounded-lg p-4 border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {result.success ? (
            <div>
              <div className="text-green-800 font-medium">✅ Agenda Created Successfully!</div>
              {result.agendaId && <div className="text-green-700 mt-1">Agenda ID: #{result.agendaId}</div>}
              <div className="mt-3 flex items-center justify-between">
                <a
                  href={getEtherscanUrl(result.hash, chainId, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm hover:text-blue-800"
                >
                  View Transaction on Etherscan →
                </a>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          ) : (
            <div className="text-red-800">❌ {result.error}</div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Agenda</h2>
          <div className="text-xs text-gray-500">Auto-saved</div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agenda URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => {
                setHasUserInteracted(true)
                setFormData(prev => ({ ...prev, url: e.target.value }))
              }}
              placeholder="https://example.com/agenda-proposal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Transactions ({formData.transactions.length})
              </label>
              <button
                onClick={addTransaction}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                + Add Transaction
              </button>
            </div>

            {formData.transactions.map((transaction, index) => (
              <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Transaction #{index + 1}</h4>
                  {formData.transactions.length > 1 && (
                    <button
                      onClick={() => removeTransaction(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Target Address</label>
                    <input
                      type="text"
                      value={transaction.targetAddress}
                      onChange={(e) => updateTransaction(index, 'targetAddress', e.target.value)}
                      placeholder="0x..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Function ABI (JSON)</label>
                    <textarea
                      value={transaction.functionAbi}
                      onChange={(e) => updateTransaction(index, 'functionAbi', e.target.value)}
                      placeholder='{"name": "transfer", "type": "function", "inputs": [...]}'
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Parameters (JSON Array)</label>
                    <textarea
                      value={transaction.parameters}
                      onChange={(e) => updateTransaction(index, 'parameters', e.target.value)}
                      placeholder='["0x...", "1000000000000000000"]'
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasUserInteracted && validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-red-800 font-medium mb-2">Please fix these errors:</h4>
              <ul className="text-red-700 text-sm space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {estimatedGas && validationResult.isValid && (
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <span className="text-gray-600">Estimated Gas: </span>
              <span className="font-mono">{estimatedGas.toString()} units</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={(!validationResult.isValid && hasUserInteracted) || !hasEnoughBalance || isSubmitting || isPending || isConfirming}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              (!hasUserInteracted || validationResult.isValid) && hasEnoughBalance && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting || isPending ? '⏳ Creating Agenda...' :
             isConfirming ? '🔄 Confirming Transaction...' :
             !hasEnoughBalance ? '💰 Insufficient TON Balance' :
             (hasUserInteracted && !validationResult.isValid) ? '❌ Please Fix Validation Errors' :
             '🚀 Create Agenda'}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use</h3>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>• <strong>Agenda URL:</strong> Link to your proposal document (GitHub, IPFS, etc.)</p>
          <p>• <strong>Transactions:</strong> Smart contract calls to execute if agenda passes</p>
          <p>• <strong>Target Address:</strong> Contract address to call</p>
          <p>• <strong>Function ABI:</strong> JSON definition of the function to call</p>
          <p>• <strong>Parameters:</strong> Array of parameter values matching the ABI</p>
          <p>• <strong>Fee:</strong> TON tokens required to create agenda (refundable if rejected)</p>
        </div>
      </div>
    </div>
  )
}