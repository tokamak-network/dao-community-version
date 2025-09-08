'use client'

import { useAccount, useChainId } from 'wagmi'
import { useVoting } from '@/hooks/useVoting'
import type { AgendaData, MemberInfo } from '@/lib/types'
import { VOTE_TYPES, MESSAGES } from '@/lib/types'

interface VotingSystemProps {
  agendaId: number
  agendaData: AgendaData
  members: MemberInfo[]
}

function createEtherscanLink(address: string, chainId: number): string {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
  return `${baseUrl}/address/${address}`
}

function getVotingPermission(userAddress: string, member: MemberInfo): 'Direct' | 'You' | 'No permission' {
  if (userAddress.toLowerCase() === member.address.toLowerCase()) {
    return 'Direct'
  }
  if (member.managerAddress && userAddress.toLowerCase() === member.managerAddress.toLowerCase()) {
    return 'You'
  }
  return 'No permission'
}

export function VotingSystem({ agendaId, agendaData, members }: VotingSystemProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  const {
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
    isLoading
  } = useVoting(agendaId, chainId, members)

  const currentTime = Math.floor(Date.now() / 1000)
  const noticeEnded = currentTime > Number(agendaData.noticeEndTimestamp)
  const isExecuted = agendaData.executed

  const canVote = noticeEnded && !isExecuted && isConnected && availableMembers.length > 0

  const userEligibleMembers = availableMembers.filter(member => {
    if (!address) return false
    const permission = getVotingPermission(address, member)
    return permission === 'Direct' || permission === 'You'
  })

  const getStatusMessage = (): string => {
    if (!noticeEnded) return "Notice period not ended yet"
    if (isExecuted) return "Agenda already executed"
    if (!isConnected) return MESSAGES.WALLET_CONNECTION_REQUIRED
    if (availableMembers.length === 0) return MESSAGES.ALL_MEMBERS_VOTED
    if (userEligibleMembers.length === 0) return MESSAGES.NO_VOTING_PERMISSION
    return ""
  }

  const statusMessage = getStatusMessage()

  const isVotingStarted = agendaData.votingStartedTimestamp > BigInt(0)
  const voterSectionTitle = isVotingStarted ? "Available Voters (Current Voters)" : "Available Voters (Committee Members)"

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Voting System</h3>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">{voterSectionTitle}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {membersWithVoteStatus.map((member, index) => {
            const permission = isConnected && address ? getVotingPermission(address, member) : 'No permission'
            
            return (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <a
                      href={createEtherscanLink(member.address, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-mono break-all"
                    >
                      {member.address}
                    </a>
                  </div>
                  <div className="ml-2">
                    {isConnected && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        permission === 'Direct' ? 'bg-green-100 text-green-800' :
                        permission === 'You' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {permission}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">Manager: </span>
                  {member.managerAddress ? (
                    <a
                      href={createEtherscanLink(member.managerAddress, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono"
                    >
                      {member.managerAddress}
                    </a>
                  ) : (
                    <span className="text-gray-500">No manager</span>
                  )}
                </div>

                <div className="mt-2">
                  {member.hasVoted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">✓ Voted</span>
                      <span className="text-sm text-gray-600">
                        ({VOTE_TYPES[member.vote as keyof typeof VOTE_TYPES] || 'Unknown'})
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Not voted yet</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">Cast Vote</h4>
        
        {statusMessage ? (
          <div className={`p-4 rounded-lg mb-4 ${
            statusMessage.includes('required') || statusMessage.includes('permission') 
              ? 'bg-yellow-50 text-yellow-800'
              : 'bg-blue-50 text-blue-800'
          }`}>
            {statusMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="member-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Member to Vote As:
              </label>
              <select
                id="member-select"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a member...</option>
                {userEligibleMembers.map((member) => {
                  const permission = getVotingPermission(address!, member)
                  return (
                    <option key={member.address} value={member.address}>
                      {member.address} ({permission})
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vote Option:
              </label>
              <div className="flex gap-3">
                {Object.entries(VOTE_TYPES).map(([value, label]) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="voteType"
                      value={value}
                      checked={voteType === parseInt(value)}
                      onChange={(e) => setVoteType(parseInt(e.target.value))}
                      className="mr-2"
                    />
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      label === 'For' ? 'bg-green-100 text-green-800' :
                      label === 'Against' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional):
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your voting comment..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVote}
                disabled={!selectedMember || isPending || isConfirming}
                className={`px-6 py-2 rounded-md font-medium ${
                  !selectedMember || isPending || isConfirming
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isPending ? 'Voting...' : isConfirming ? 'Confirming...' : 'Cast Vote'}
              </button>
              
              <button
                onClick={resetForm}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Reset
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                Error: {error.message}
              </div>
            )}

            {isSuccess && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm">
                Vote cast successfully! 🎉
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}