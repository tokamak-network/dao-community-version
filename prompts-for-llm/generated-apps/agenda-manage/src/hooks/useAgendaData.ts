'use client'

import { useReadContract, useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { AGENDA_MANAGER_ABI, COMMITTEE_ABI } from '@/lib/abis'
import type { AgendaData, AgendaStatus } from '@/lib/types'
import { useMemo } from 'react'

export function useAgendaData(agendaId: number, chainId: number) {
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  const { data: numAgendas, isLoading: numAgendasLoading, refetch: refetchNumAgendas } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'numAgendas',
    query: {
      enabled: !!contracts?.agendaManager,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  })

  const { data: agendaRaw, isLoading: agendaLoading, refetch: refetchAgenda } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'agendas',
    args: [BigInt(agendaId)],
    query: {
      enabled: !!contracts?.agendaManager && agendaId >= 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  })

  const { data: currentStatusRaw, isLoading: statusLoading, refetch: refetchStatus } = useReadContract({
    address: contracts?.committee,
    abi: COMMITTEE_ABI,
    functionName: 'currentAgendaStatus',
    args: [BigInt(agendaId)],
    query: {
      enabled: !!contracts?.committee && agendaId >= 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  })

  const { data: agendaMemo, isLoading: memoLoading, refetch: refetchMemo } = useReadContract({
    address: contracts?.committee,
    abi: COMMITTEE_ABI,
    functionName: 'agendaMemo',
    args: [BigInt(agendaId)],
    query: {
      enabled: !!contracts?.committee && agendaId >= 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  })

  const agendaData = useMemo(() => {
    if (!agendaRaw) return undefined
    return agendaRaw as unknown as AgendaData
  }, [agendaRaw])

  const currentStatus = useMemo(() => {
    if (!currentStatusRaw) return undefined
    const [agendaResult, agendaStatus] = currentStatusRaw as unknown as [bigint, bigint]
    return { agendaResult, agendaStatus } as AgendaStatus
  }, [currentStatusRaw])

  const totalAgendas = useMemo(() => {
    if (!numAgendas) return 0
    return Number(numAgendas)
  }, [numAgendas])

  const refetchAll = async () => {
    await Promise.all([
      refetchNumAgendas(),
      refetchAgenda(),
      refetchStatus(),
      refetchMemo(),
    ])
  }

  return {
    agendaData,
    currentStatus,
    agendaMemo: agendaMemo as string | undefined,
    totalAgendas,
    isLoading: numAgendasLoading || agendaLoading || statusLoading || memoLoading,
    refetchAll,
  }
}