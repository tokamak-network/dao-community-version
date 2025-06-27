'use client'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatDate, formatDateSimple, getStatusMessage, calculateAgendaStatus, getAgendaResult } from '@/lib/utils'

interface AgendaInfoProps {
  agenda: AgendaWithMetadata
}

export default function AgendaInfo({ agenda }: AgendaInfoProps) {
  // Calculate dynamic status
  const currentStatus = calculateAgendaStatus(agenda, BigInt(Math.floor(Date.now() / 1000)))
  const statusMessage = getStatusMessage(agenda, currentStatus)
  const agendaResult = getAgendaResult(agenda, currentStatus)

  return (
    <div className="space-y-4">
      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Creator</span>
        <a href="#" className="text-blue-600 hover:text-blue-700 text-sm font-mono break-all">
          {agenda.creator.address}
        </a>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Creation Time</span>
        <span className="text-gray-900 text-sm">{formatDate(Number(agenda.createdTimestamp))}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Notice End Time</span>
        <span className="text-gray-900 text-sm">{formatDate(Number(agenda.noticeEndTimestamp))}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Voting Start Time</span>
        <span className="text-gray-900 text-sm">
          {agenda.votingStartedTimestamp > BigInt(0) ? formatDate(Number(agenda.votingStartedTimestamp)) : "-"}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Voting End Time</span>
        <span className="text-gray-900 text-sm">
          {agenda.votingEndTimestamp > BigInt(0) ? formatDate(Number(agenda.votingEndTimestamp)) : "-"}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Status</span>
        <span className="text-gray-900 text-sm">{statusMessage}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Result</span>
        <span className="text-gray-900 text-sm font-medium">
          {agendaResult}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Execution Time Limit</span>
        <span className="text-gray-900 text-sm">
          {agenda.executableLimitTimestamp > BigInt(0) ? formatDate(Number(agenda.executableLimitTimestamp)) : "-"}
        </span>
      </div>

      {agenda.executed && (
        <div className="flex justify-between py-2">
          <span className="text-gray-600 text-sm">Executed Time</span>
          <span className="text-gray-900 text-sm">
            {agenda.executedTimestamp > BigInt(0) ? formatDate(Number(agenda.executedTimestamp)) : "-"}
          </span>
        </div>
      )}

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Description</span>
        <div className="text-gray-900 text-sm max-w-md text-right">
          {agenda.description || 'No description available'}
        </div>
      </div>
    </div>
  )
}