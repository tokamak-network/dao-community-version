'use client'

import type { AgendaData, AgendaStatus } from '@/lib/types'
import { AGENDA_STATUS, AGENDA_RESULT, VOTE_TYPES } from '@/lib/types'

interface AgendaDetailsProps {
  agendaId: number
  agendaData: AgendaData
  currentStatus?: AgendaStatus
  agendaMemo?: string
}

function formatTimestamp(timestamp: bigint): string {
  if (timestamp === BigInt(0)) return 'Not set'
  return new Date(Number(timestamp) * 1000).toLocaleString()
}

function formatDuration(seconds: bigint): string {
  const totalSeconds = Number(seconds)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function createEtherscanLink(address: string, chainId: number): string {
  const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io'
  return `${baseUrl}/address/${address}`
}

function renderWithLinks(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

export function AgendaDetails({ agendaId, agendaData, currentStatus, agendaMemo }: AgendaDetailsProps) {
  const totalVotes = agendaData.countingYes + agendaData.countingNo + agendaData.countingAbstain
  const yesPercentage = totalVotes > BigInt(0) ? Number(agendaData.countingYes * BigInt(100) / totalVotes) : 0
  const noPercentage = totalVotes > BigInt(0) ? Number(agendaData.countingNo * BigInt(100) / totalVotes) : 0
  const abstainPercentage = totalVotes > BigInt(0) ? Number(agendaData.countingAbstain * BigInt(100) / totalVotes) : 0

  const votingStartTime = agendaData.votingStartedTimestamp > BigInt(0) ? agendaData.votingStartedTimestamp : null
  const votingEndTime = votingStartTime ? votingStartTime + agendaData.votingPeriodInSeconds : null

  const agendaStatusText = currentStatus ? AGENDA_STATUS[Number(currentStatus.agendaStatus) as keyof typeof AGENDA_STATUS] || 'Unknown' : AGENDA_STATUS[agendaData.status as keyof typeof AGENDA_STATUS] || 'Unknown'
  const agendaResultText = currentStatus ? AGENDA_RESULT[Number(currentStatus.agendaResult) as keyof typeof AGENDA_RESULT] || 'Unknown' : AGENDA_RESULT[agendaData.result as keyof typeof AGENDA_RESULT] || 'Unknown'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Agenda #{agendaId}
        </h2>
        <h3 className="text-lg text-gray-700">Agenda Details</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Timeline Information</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Created:</span> {formatTimestamp(agendaData.createdTimestamp)}</div>
              <div><span className="font-medium">Notice End:</span> {formatTimestamp(agendaData.noticeEndTimestamp)}</div>
              <div><span className="font-medium">Voting Period:</span> {formatDuration(agendaData.votingPeriodInSeconds)}</div>
              {votingStartTime && (
                <>
                  <div><span className="font-medium">Voting Started:</span> {formatTimestamp(votingStartTime)}</div>
                  {votingEndTime && (
                    <div><span className="font-medium">Voting Ends:</span> {formatTimestamp(votingEndTime)}</div>
                  )}
                </>
              )}
              {agendaData.executableLimitTimestamp > BigInt(0) && (
                <div><span className="font-medium">Executable Deadline:</span> {formatTimestamp(agendaData.executableLimitTimestamp)}</div>
              )}
              {agendaData.executed && (
                <div><span className="font-medium">Executed:</span> {formatTimestamp(agendaData.executedTimestamp)}</div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Status Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  agendaStatusText === 'Executed' ? 'bg-green-100 text-green-800' :
                  agendaStatusText === 'Voting' ? 'bg-blue-100 text-blue-800' :
                  agendaStatusText === 'Waiting for Execution' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {agendaStatusText}
                </span>
              </div>
              <div>
                <span className="font-medium">Result:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  agendaResultText === 'Approved' ? 'bg-green-100 text-green-800' :
                  agendaResultText === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {agendaResultText}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Voting Results</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-green-700">For</span>
                  <span className="text-sm text-gray-600">{agendaData.countingYes.toString()} ({yesPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${yesPercentage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-red-700">Against</span>
                  <span className="text-sm text-gray-600">{agendaData.countingNo.toString()} ({noPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${noPercentage}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Abstain</span>
                  <span className="text-sm text-gray-600">{agendaData.countingAbstain.toString()} ({abstainPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${abstainPercentage}%` }}></div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Total Votes: {totalVotes.toString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {agendaMemo && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-2">Agenda Memo</h4>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {renderWithLinks(agendaMemo)}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <h4 className="font-semibold text-gray-900 mb-3">Voter Information</h4>
        {agendaData.voters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agendaData.voters.map((voter, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <a
                  href={createEtherscanLink(voter, 1)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-mono break-all"
                >
                  {voter}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No votes cast yet</p>
        )}
      </div>
    </div>
  )
}