// React example: Agenda Creation Form with wagmi v2 integration
import React, { useState } from 'react'
import { useWriteContract, useReadContract, useChainId, useAccount } from 'wagmi'
import { encodeFunctionData, parseEther } from 'viem'
import { getContracts } from '../../lib/wagmi'
import { TON_ABI, AGENDA_MANAGER_ABI } from '../../lib/abis'

interface Transaction {
  targetAddress: string
  functionAbi: string
  parameters: string
}

const AgendaCreate: React.FC = () => {
  const { address } = useAccount()
  const chainId = useChainId()
  const contracts = getContracts(chainId)

  const [url, setUrl] = useState('')
  const [transactions, setTransactions] = useState<Transaction[]>([
    { targetAddress: '', functionAbi: '', parameters: '' }
  ])
  const [noticePeriod, setNoticePeriod] = useState<number>(86400) // 1 day in seconds
  const [votingPeriod, setVotingPeriod] = useState<number>(604800) // 7 days in seconds
  const [atomicExecute, setAtomicExecute] = useState<boolean>(true) // atomic execution

  const { writeContract: approveAndCall } = useWriteContract()

  // Get creation fee
  const { data: creationFee } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'createAgendaFees',
  })

  // Get minimum periods
  const { data: minNoticePeriod } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumNoticePeriodSeconds',
  })

  const { data: minVotingPeriod } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'minimumVotingPeriodSeconds',
  })

  const handleTransactionChange = (idx: number, field: keyof Transaction, value: string) => {
    setTransactions(prev => prev.map((tx, i) =>
      i === idx ? { ...tx, [field]: value } : tx
    ))
  }

  const addTransaction = () => {
    setTransactions(prev => [...prev, { targetAddress: '', functionAbi: '', parameters: '' }])
  }

  const removeTransaction = (idx: number) => {
    if (transactions.length > 1) {
      setTransactions(prev => prev.filter((_, i) => i !== idx))
    }
  }

  const encodeTransactions = (): { targets: `0x${string}`[], bytecodes: `0x${string}`[] } => {
    const targets: `0x${string}`[] = []
    const bytecodes: `0x${string}`[] = []

    transactions.forEach(tx => {
      if (tx.targetAddress && tx.functionAbi) {
        try {
          // Parse function signature and parameters
          const [functionName, paramsString] = tx.functionAbi.split('(')
          const paramTypes = paramsString.replace(')', '').split(',').map(p => p.trim()).filter(Boolean)
          const paramValues = tx.parameters ? JSON.parse(`[${tx.parameters}]`) : []

          const encoded = encodeFunctionData({
            abi: [{
              name: functionName,
              type: 'function',
              inputs: paramTypes.map((type, i) => ({ name: `param${i}`, type })),
              outputs: [],
              stateMutability: 'nonpayable'
            }],
            functionName,
            args: paramValues
          })

          targets.push(tx.targetAddress as `0x${string}`)
          bytecodes.push(encoded)
        } catch (error) {
          console.error('Error encoding transaction:', error)
        }
      }
    })

    return { targets, bytecodes }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !contracts?.agendaManager || !contracts?.ton) {
      alert('Please connect your wallet and ensure you are on a supported network')
      return
    }

    if (!creationFee) {
      alert('Unable to get creation fee')
      return
    }

    try {
      const { targets, bytecodes } = encodeTransactions()

      if (targets.length === 0) {
        alert('Please add at least one valid transaction')
        return
      }

      // Create agenda parameters - encode newAgenda call for approveAndCall
      const agendaData = encodeFunctionData({
        abi: AGENDA_MANAGER_ABI,
        functionName: 'newAgenda',
        args: [
          targets,
          BigInt(noticePeriod),
          BigInt(votingPeriod),
          atomicExecute, // Use state value instead of hardcoded true
          bytecodes
        ]
      })

      // Use approveAndCall to pay fee and create agenda in one transaction
      // This follows the contract-usage.md pattern exactly
      await approveAndCall({
        address: contracts.ton as `0x${string}`,
        abi: TON_ABI,
        functionName: 'approveAndCall',
        args: [
          contracts.agendaManager as `0x${string}`,
          creationFee,
          agendaData // This is the encoded newAgenda call
        ]
      })

      alert('Agenda creation transaction submitted!')

      // Reset form
      setUrl('')
      setTransactions([{ targetAddress: '', functionAbi: '', parameters: '' }])

    } catch (error) {
      console.error('Error creating agenda:', error)
      alert('Failed to create agenda: ' + (error as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">
          Announcement URL:
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="mt-1 block w-full border rounded px-3 py-2"
            placeholder="https://..."
            required
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Notice Period (seconds):
          <input
            type="number"
            value={noticePeriod}
            onChange={e => setNoticePeriod(Number(e.target.value))}
            min={Number(minNoticePeriod || 0)}
            className="mt-1 block w-full border rounded px-3 py-2"
            required
          />
          <small className="text-gray-500">Minimum: {Number(minNoticePeriod || 0)} seconds</small>
        </label>

        <label className="block text-sm font-medium">
          Voting Period (seconds):
          <input
            type="number"
            value={votingPeriod}
            onChange={e => setVotingPeriod(Number(e.target.value))}
            min={Number(minVotingPeriod || 0)}
            className="mt-1 block w-full border rounded px-3 py-2"
            required
          />
          <small className="text-gray-500">Minimum: {Number(minVotingPeriod || 0)} seconds</small>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">
          <input
            type="checkbox"
            checked={atomicExecute}
            onChange={e => setAtomicExecute(e.target.checked)}
            className="mr-2"
          />
          Atomic Execution (execute all transactions together or fail all)
        </label>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Execution Transactions:</h3>
        {transactions.map((tx, idx) => (
          <div key={idx} className="border p-4 rounded mb-3">
            <div className="grid grid-cols-1 gap-3">
              <input
                placeholder="Target Contract Address (0x...)"
                value={tx.targetAddress}
                onChange={e => handleTransactionChange(idx, 'targetAddress', e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                placeholder="Function Signature (e.g., transfer(address,uint256))"
                value={tx.functionAbi}
                onChange={e => handleTransactionChange(idx, 'functionAbi', e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                placeholder="Parameters (e.g., '0x123...', '1000000000000000000')"
                value={tx.parameters}
                onChange={e => handleTransactionChange(idx, 'parameters', e.target.value)}
                className="border rounded px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removeTransaction(idx)}
                disabled={transactions.length === 1}
                className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addTransaction}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Transaction
        </button>
      </div>

      {creationFee && (
        <div className="bg-yellow-50 p-3 rounded">
          <p className="text-sm"><strong>Creation Fee:</strong> {(Number(creationFee) / 1e18).toFixed(4)} TON</p>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-green-500 text-white py-3 rounded font-medium hover:bg-green-600"
        disabled={!address || !contracts?.agendaManager}
      >
        {!address ? 'Connect Wallet' : 'Create Agenda'}
      </button>
    </form>
  )
}

export default AgendaCreate