'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { COMMITTEE_ABI } from '@/lib/abis'
import type { AgendaData, AgendaStatus } from '@/lib/types'
import { useMemo } from 'react'

export function useExecution(agendaId: number, chainId: number, agendaData?: AgendaData, currentStatus?: AgendaStatus) {
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const executionConditions = useMemo(() => {
    if (!agendaData) return { canExecute: false, message: 'Loading agenda data...' }

    const currentTime = BigInt(Math.floor(Date.now() / 1000))

    if (currentStatus?.agendaStatus === BigInt(2) || agendaData.status === 2) {
      return { canExecute: false, message: '⏳ Waiting for voting to complete' }
    }

    if (agendaData.executed) {
      return { canExecute: false, message: '✅ Executed' }
    }

    if (agendaData.executableLimitTimestamp > BigInt(0) && currentTime > agendaData.executableLimitTimestamp) {
      return { canExecute: false, message: '⏰ Execution period has expired' }
    }

    const hasV2Status = currentStatus !== undefined
    if (hasV2Status) {
      if (currentStatus.agendaResult === BigInt(4)) {
        return { canExecute: false, message: '❌ Agenda failed to reach consensus' }
      }
      if (currentStatus.agendaStatus === BigInt(3)) {
        return { canExecute: true, message: '✅ Execution ready! The agenda can be executed.' }
      }
    } else {
      if (agendaData.status === 3 && agendaData.result === 1) {
        return { canExecute: true, message: '✅ Execution ready! The agenda can be executed.' }
      }
    }

    return { canExecute: false, message: 'Execution conditions not met' }
  }, [agendaData, currentStatus])

  const handleExecute = async () => {
    if (!contracts || !executionConditions.canExecute) return

    try {
      writeContract({
        address: contracts.committee,
        abi: COMMITTEE_ABI,
        functionName: 'executeAgenda',
        args: [BigInt(agendaId)],
      })
    } catch (err) {
      console.error('Execution error:', err)
    }
  }

  return {
    canExecute: executionConditions.canExecute,
    executionMessage: executionConditions.message,
    handleExecute,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}