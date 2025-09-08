'use client'

import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { AGENDA_MANAGER_ABI, CANDIDATE_ABI } from '@/lib/abis'
import type { VoteStatus, MemberInfo } from '@/lib/types'
import { useMemo, useState } from 'react'

export function useVoting(agendaId: number, chainId: number, members: MemberInfo[]) {
  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [voteType, setVoteType] = useState<number>(1)
  const [comment, setComment] = useState<string>('')

  const voteStatusContracts = useMemo(() => {
    if (!contracts || members.length === 0) return []
    return members.map(member => ({
      address: contracts.agendaManager,
      abi: AGENDA_MANAGER_ABI,
      functionName: 'getVoteStatus' as const,
      args: [BigInt(agendaId), member.address],
    }))
  }, [contracts, members, agendaId])

  const { data: voteStatusResults, isLoading: voteStatusLoading, refetch: refetchVoteStatus } = useReadContracts({
    contracts: voteStatusContracts,
    query: {
      enabled: voteStatusContracts.length > 0,
      staleTime: 10_000,
      refetchOnWindowFocus: false,
    },
    allowFailure: true,
  })

  const membersWithVoteStatus = useMemo(() => {
    if (!voteStatusResults || voteStatusResults.length === 0) return members

    return members.map((member, index) => {
      const voteResult = voteStatusResults[index]
      if (voteResult?.status === 'success' && Array.isArray(voteResult.result)) {
        const [hasVoted, vote] = voteResult.result as [boolean, bigint]
        return {
          ...member,
          hasVoted,
          vote: Number(vote),
        }
      }
      return member
    })
  }, [members, voteStatusResults])

  const availableMembers = useMemo(() => {
    return membersWithVoteStatus.filter(member => !member.hasVoted)
  }, [membersWithVoteStatus])

  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleVote = async () => {
    if (!selectedMember || !contracts) return

    const memberInfo = members.find(m => m.address === selectedMember)
    if (!memberInfo?.candidateContract) {
      console.error('Candidate contract not found for selected member:', selectedMember)
      return
    }

    try {
      writeContract({
        address: memberInfo.candidateContract,
        abi: CANDIDATE_ABI,
        functionName: 'castVote',
        args: [BigInt(agendaId), BigInt(voteType), comment],
      })
    } catch (err) {
      console.error('Vote casting error:', err)
    }
  }

  const resetForm = () => {
    setSelectedMember('')
    setVoteType(1)
    setComment('')
  }

  return {
    membersWithVoteStatus,
    availableMembers,
    selectedMember,
    setSelectedMember,
    voteType,
    setVoteType,
    comment,
    setComment,
    handleVote,
    resetForm,
    isPending,
    isConfirming,
    isSuccess,
    error,
    isLoading: voteStatusLoading,
    refetchVoteStatus,
  }
}