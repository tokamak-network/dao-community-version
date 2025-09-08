// Example: Committee member voting using wagmi v2
import { useWriteContract, useReadContract, useChainId } from 'wagmi'
import { getContracts } from '../../lib/wagmi'
import { COMMITTEE_ABI, CANDIDATE_ABI, AGENDA_MANAGER_ABI } from '../../lib/abis'

interface VoteOnAgendaParams {
  agendaId: number
  voteType: 1 | 2 | 3 // 1=YES, 2=NO, 3=ABSTAIN
  comment: string
  memberAddress: `0x${string}`
}

export const useAgendaVoting = () => {
  const chainId = useChainId()
  const contracts = getContracts(chainId)
  const { writeContract: castVote } = useWriteContract()

  // Get committee member's candidate contract address
  const getCandidateContract = async (memberAddress: `0x${string}`) => {
    if (!contracts?.committee) {
      throw new Error('Committee contract not available')
    }

    // Get candidate information from committee contract
    const candidateInfo = await contracts.committee.read.candidateInfos([memberAddress])
    return candidateInfo.candidateContract
  }

  // Check if user has already voted
  const { data: voteStatus, refetch: refetchVoteStatus } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'getVoteStatus',
    args: [BigInt(0), '0x' as `0x${string}`], // Will be updated dynamically
  })

  // Helper function to check vote status for specific agenda and member
  const checkVoteStatus = async (agendaId: number, memberAddress: `0x${string}`) => {
    if (!contracts?.agendaManager) {
      throw new Error('Agenda manager contract not available')
    }

    const [hasVoted, vote] = await contracts.agendaManager.read.getVoteStatus([
      BigInt(agendaId),
      memberAddress
    ])

    return { hasVoted, vote: Number(vote) }
  }

  // Check if agenda is in voting status
  const { data: agendaData } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'agendas',
    args: [BigInt(0)], // Will be updated dynamically
  })

  const voteOnAgenda = async ({ agendaId, voteType, comment, memberAddress }: VoteOnAgendaParams) => {
    if (!contracts?.committee) {
      throw new Error('Committee contract not available')
    }

    try {
      // Get the candidate contract for the member
      const candidateContract = await getCandidateContract(memberAddress)

      // Cast vote through the candidate contract
      await castVote({
        address: candidateContract,
        abi: CANDIDATE_ABI,
        functionName: 'castVote',
        args: [
          BigInt(agendaId),
          BigInt(voteType),
          comment
        ]
      })

      return true
    } catch (error) {
      console.error('Voting failed:', error)
      throw error
    }
  }

  return {
    voteOnAgenda,
    voteStatus,
    refetchVoteStatus,
    agendaData,
    checkVoteStatus
  }
}
