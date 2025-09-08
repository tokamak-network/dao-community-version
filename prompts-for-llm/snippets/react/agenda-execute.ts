// Example: Execute approved agenda using wagmi v2
import { useWriteContract, useReadContract, useChainId } from 'wagmi'
import { getContracts } from '../../lib/wagmi'
import { COMMITTEE_ABI, AGENDA_MANAGER_ABI } from '../../lib/abis'

export const useAgendaExecution = () => {
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const { writeContract: executeAgenda } = useWriteContract()

  // Check if agenda can be executed
  const { data: canExecute, refetch: refetchCanExecute } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'canExecuteAgenda',
    args: [BigInt(0)], // Will be updated dynamically
  })

  // Get agenda status
  const { data: agendaStatus, refetch: refetchStatus } = useReadContract({
    address: contracts?.committee as `0x${string}`,
    abi: COMMITTEE_ABI,
    functionName: 'currentAgendaStatus',
    args: [BigInt(0)], // Will be updated dynamically
  })

  const executeApprovedAgenda = async (agendaId: number) => {
    if (!contracts?.committee) {
      throw new Error('Committee contract not available')
    }

    try {
      // Execute the agenda through the committee contract
      // Note: Anyone can execute approved agendas, not just committee members
      await executeAgenda({
        address: contracts.committee as `0x${string}`,
        abi: COMMITTEE_ABI,
        functionName: 'executeAgenda',
        args: [BigInt(agendaId)]
      })

      return true
    } catch (error) {
      console.error('Execution failed:', error)
      throw error
    }
  }

  // Helper function to check execution status
  const getExecutionStatus = (agendaId: number) => {
    // AgendaResult: 0=PENDING, 1=ACCEPT, 2=REJECT, 3=DISMISS, 4=NO_CONSENSUS, 5=NO_AGENDA
    // AgendaStatus: 0=NONE, 1=NOTICE, 2=VOTING, 3=WAITING_EXEC, 4=EXECUTED, 5=ENDED, 6=NO_AGENDA

    if (!agendaStatus) return { canExecute: false, reason: 'Loading...' }

    const [result, status] = agendaStatus as [bigint, bigint]

    // Check if agenda is approved and waiting for execution
    if (Number(result) === 1 && Number(status) === 3) {
      return { canExecute: true, reason: 'Ready for execution' }
    }

    if (Number(status) === 4) {
      return { canExecute: false, reason: 'Already executed' }
    }

    if (Number(result) === 2) {
      return { canExecute: false, reason: 'Agenda was rejected' }
    }

    if (Number(result) === 3) {
      return { canExecute: false, reason: 'Agenda was dismissed' }
    }

    if (Number(status) === 2) {
      return { canExecute: false, reason: 'Still in voting period' }
    }

    return { canExecute: false, reason: 'Not ready for execution' }
  }

  return {
    executeApprovedAgenda,
    canExecute,
    agendaStatus,
    getExecutionStatus,
    refetchCanExecute,
    refetchStatus
  }
}
