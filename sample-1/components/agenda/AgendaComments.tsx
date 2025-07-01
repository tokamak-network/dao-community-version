'use client'
import { useState, useEffect } from 'react'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatAddress } from '@/lib/utils'
import { useAgenda } from "@/contexts/AgendaContext"
import { useCombinedDAOContext } from "@/contexts/CombinedDAOContext"

interface AgendaCommentsProps {
  agenda: AgendaWithMetadata
}

interface VoteInfo {
  address: string
  vote: number
  hasVoted: boolean
}

export default function AgendaComments({ agenda }: AgendaCommentsProps) {
  const [votes, setVotes] = useState<VoteInfo[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(false)

  const { getVoterInfos } = useAgenda()
  const { committeeMembers } = useCombinedDAOContext()

  // Load voting data
  useEffect(() => {
    const loadVotingData = async () => {
      if (!agenda.voters || agenda.voters.length === 0) {
        // Use committee members as voters if agenda.voters is empty
        if (committeeMembers && committeeMembers.length > 0) {
          const voterAddresses = committeeMembers.map(member => member.creationAddress)
          setIsLoadingVotes(true)

          try {
            const voterInfos = await getVoterInfos(agenda.id, voterAddresses)
            const votesInfo = voterAddresses.map((voter, index) => {
              const result = voterInfos[index]
              return {
                address: voter,
                vote: result ? Number(result.vote) : 0,
                hasVoted: result?.hasVoted || false,
              }
            })
            setVotes(votesInfo)
          } catch (error) {
            console.error('Failed to load voting data:', error)
          } finally {
            setIsLoadingVotes(false)
          }
        }
      } else {
        // Use agenda.voters
        setIsLoadingVotes(true)

        try {
          const voterInfos = await getVoterInfos(agenda.id, agenda.voters)
          const votesInfo = agenda.voters.map((voter, index) => {
            const result = voterInfos[index]
            return {
              address: voter,
              vote: result ? Number(result.vote) : 0,
              hasVoted: result?.hasVoted || false,
            }
          })
          setVotes(votesInfo)
        } catch (error) {
          console.error('Failed to load voting data:', error)
        } finally {
          setIsLoadingVotes(false)
        }
      }
    }

    loadVotingData()
  }, [agenda.id, agenda.voters, getVoterInfos, committeeMembers])

  return (
    <div className="space-y-6">
      {/* Individual Votes */}
      <div>
        {isLoadingVotes ? (
          <div className="text-center py-8">
            <div className="text-gray-600">Loading voting records...</div>
          </div>
        ) : (() => {
          const votedRecords = votes.filter(vote => vote.hasVoted)
          return votedRecords.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {votedRecords.map((vote, index) => (
                <div key={index} className="py-4">
                  <div className="text-sm">
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">
                      {formatAddress(vote.address)}
                    </a>
                    <span className="text-gray-700 ml-1">voted</span>
                    {vote.vote === 1 && (
                      <span className="text-blue-600 font-medium ml-1">Yes</span>
                    )}
                    {vote.vote === 2 && (
                      <span className="text-blue-600 font-medium ml-1">No</span>
                    )}
                    {vote.vote === 0 && (
                      <span className="text-blue-600 font-medium ml-1">Abstain</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-600">No voting records available</div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}