'use client'

import { useAccount, useChainId } from 'wagmi'
import { useExecution } from '@/hooks/useExecution'
import type { AgendaData, AgendaStatus } from '@/lib/types'
import { MESSAGES } from '@/lib/types'

interface ExecutionSystemProps {
  agendaId: number
  agendaData: AgendaData
  currentStatus?: AgendaStatus
}

export function ExecutionSystem({ agendaId, agendaData, currentStatus }: ExecutionSystemProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  
  const {
    canExecute,
    executionMessage,
    handleExecute,
    isPending,
    isConfirming,
    isSuccess,
    error
  } = useExecution(agendaId, chainId, agendaData, currentStatus)

  const showExecutionButton = canExecute && isConnected
  const showWalletRequired = canExecute && !isConnected

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Execution System</h3>
      
      <div className="mb-4">
        <div className={`p-4 rounded-lg ${
          executionMessage.includes('✅') ? 'bg-green-50 text-green-800' :
          executionMessage.includes('⏳') ? 'bg-blue-50 text-blue-800' :
          executionMessage.includes('⏰') || executionMessage.includes('❌') ? 'bg-red-50 text-red-800' :
          'bg-gray-50 text-gray-800'
        }`}>
          {executionMessage}
        </div>
      </div>

      {showWalletRequired && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          {MESSAGES.EXECUTION_WALLET_REQUIRED}
        </div>
      )}

      {showExecutionButton && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Execution Information</h4>
            <p className="text-blue-800 text-sm">
              Execution is open to anyone - not just committee members. 
              Anyone can execute an approved agenda once voting is complete.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExecute}
              disabled={isPending || isConfirming}
              className={`px-6 py-3 rounded-md font-medium ${
                isPending || isConfirming
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isPending ? 'Executing...' : isConfirming ? 'Confirming...' : '🚀 Execute Agenda'}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              Error: {error.message}
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
              {MESSAGES.AGENDA_EXECUTED}
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-gray-900 mb-2">Execution Conditions</h4>
        <div className="text-sm text-gray-700 space-y-1">
          <div>✓ Voting must be completed</div>
          <div>✓ Agenda must be approved (more For votes than Against)</div>
          <div>✓ Execution deadline must not have passed</div>
          <div>✓ Agenda must not already be executed</div>
          <div>✓ Must not be in "No Consensus" state (DAO v2)</div>
        </div>
      </div>
    </div>
  )
}