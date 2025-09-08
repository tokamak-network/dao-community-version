'use client'

import { useReadContracts } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { COMMITTEE_ABI, OPERATOR_MANAGER_ABI } from '@/lib/abis'
import type { MemberInfo, AgendaData } from '@/lib/types'
import { useMemo } from 'react'

export function useMembers(chainId: number, agendaData?: AgendaData) {
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  const maxMember = 3

  const isVotingStarted = agendaData?.votingStartedTimestamp && agendaData.votingStartedTimestamp > BigInt(0)
  const availableAddresses = useMemo(() => {
    if (isVotingStarted && agendaData?.voters) {
      return Array.from(agendaData.voters)
    }
    return []
  }, [isVotingStarted, agendaData?.voters])

  const memberContracts = useMemo(() => {
    if (!contracts) return []
    return Array.from({ length: maxMember }, (_, i) => ({
      address: contracts.committee,
      abi: COMMITTEE_ABI,
      functionName: 'members' as const,
      args: [BigInt(i)],
    }))
  }, [contracts, maxMember])

  const { data: memberResults, isLoading: membersLoading } = useReadContracts({
    contracts: memberContracts,
    query: {
      enabled: !!contracts && memberContracts.length > 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    allowFailure: true,
  })

  const memberAddresses = useMemo(() => {
    if (!memberResults) return []
    return memberResults
      .filter((result): result is { status: 'success'; result: `0x${string}` } => 
        result.status === 'success' && !!result.result
      )
      .map(result => result.result)
  }, [memberResults])

  const candidateInfoContracts = useMemo(() => {
    if (!contracts || memberAddresses.length === 0) return []
    return memberAddresses.map(address => ({
      address: contracts.committee,
      abi: COMMITTEE_ABI,
      functionName: 'candidateInfos' as const,
      args: [address],
    }))
  }, [contracts, memberAddresses])

  const { data: candidateInfoResults, isLoading: candidateInfoLoading } = useReadContracts({
    contracts: candidateInfoContracts,
    query: {
      enabled: candidateInfoContracts.length > 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    allowFailure: true,
  })

  const candidateContracts = useMemo(() => {
    if (!candidateInfoResults) return []
    return candidateInfoResults
      .filter(result => 
        result.status === 'success' && 
        Array.isArray(result.result) && 
        result.result.length > 0
      )
      .map(result => (result as any).result[0] as `0x${string}`)
  }, [candidateInfoResults])

  const addressesToQuery = useMemo(() => {
    return isVotingStarted ? availableAddresses : memberAddresses
  }, [isVotingStarted, availableAddresses, memberAddresses])

  const managerContracts = useMemo(() => {
    if (addressesToQuery.length === 0) return []
    return addressesToQuery.map(address => ({
      address: address,
      abi: OPERATOR_MANAGER_ABI,
      functionName: 'manager' as const,
    }))
  }, [addressesToQuery])

  const { data: managerResults, isLoading: managerLoading } = useReadContracts({
    contracts: managerContracts,
    query: {
      enabled: managerContracts.length > 0,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    allowFailure: true,
  })

  const members = useMemo(() => {
    if (!candidateInfoResults || candidateInfoResults.length === 0) return []

    return memberAddresses.map((address, index): MemberInfo => {
      const candidateInfo = candidateInfoResults?.[index]
      const candidateContract = candidateInfo?.status === 'success' && 
        Array.isArray(candidateInfo.result) && 
        candidateInfo.result.length > 0 
          ? (candidateInfo as any).result[0] as `0x${string}`
          : address

      const managerIndex = addressesToQuery.findIndex(addr => addr === address)
      const managerResult = managerIndex >= 0 ? managerResults?.[managerIndex] : undefined
      const managerAddress = managerResult?.status === 'success' && 
        managerResult.result !== '0x0000000000000000000000000000000000000000'
          ? managerResult.result as `0x${string}`
          : undefined

      return {
        address,
        candidateContract,
        hasVoted: false,
        vote: 0,
        managerAddress,
      }
    })
  }, [memberAddresses, candidateInfoResults, addressesToQuery, managerResults])

  const isLoading = membersLoading || candidateInfoLoading || managerLoading

  return {
    members,
    isLoading,
    memberAddresses,
    candidateContracts,
  }
}