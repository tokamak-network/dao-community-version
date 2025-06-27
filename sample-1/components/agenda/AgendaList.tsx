'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import PageHeader from '@/components/ui/PageHeader'
import { useAgenda } from '@/contexts/AgendaContext'
import { formatAddress, calculateAgendaStatus, getStatusText, getStatusClass, getStatusMessage, getAgendaTimeInfo, AgendaStatus } from '@/lib/utils'

export default function AgendaList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('latest')
  const [statusFilter, setStatusFilter] = useState('all')
  const { isConnected } = useAccount();
  const { agendas, isLoading, error, refreshAgendas, statusMessage, quorum } = useAgenda();

      // Format agenda data for display
  const formatAgendaForDisplay = (agenda: any) => {
    const currentStatus = calculateAgendaStatus(agenda, quorum ?? BigInt(2));
    const statusMessage = getStatusMessage(agenda, currentStatus, quorum ?? BigInt(2));

    return {
      id: `#${agenda.id}`,
      title: agenda.title || `Agenda #${agenda.id}`,
      author: agenda.creator?.address ? formatAddress(agenda.creator.address) : 'Unknown',
      date: agenda.createdTimestamp ? new Date(Number(agenda.createdTimestamp) * 1000).toLocaleDateString() : 'Unknown',
      status: getStatusText(currentStatus),
      statusClass: getStatusClass(currentStatus),
      statusMessage: statusMessage,
      currentStatus: currentStatus,
      votesFor: Number(agenda.countingYes || 0),
      votesAgainst: Number(agenda.countingNo || 0),
      isApproved: Number(agenda.countingYes) > Number(agenda.countingNo)
    };
  };

  const displayAgendas = agendas.map(formatAgendaForDisplay);

  if (isLoading && displayAgendas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">{statusMessage || "Loading agendas..."}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={refreshAgendas}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

    return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-normal text-zinc-900 font-['Inter']">Agenda</h1>
          <Link
            href="#"
            className="text-blue-600 text-sm hover:text-blue-700 underline"
          >
            Go to entire agendas
          </Link>
        </div>

        {isConnected && (
          <Link
            href="/agendas/new"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-block"
          >
            + New proposal
          </Link>
        )}
      </div>

      {/* Agenda List */}
      <div className="flex flex-col gap-4">
        {displayAgendas.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No agendas available</p>
            <p className="text-gray-400 text-sm mt-2">Check back later for new proposals</p>
          </div>
        ) : (
          displayAgendas.map((agenda: any, index: number) => (
          <div key={agenda.id} className="bg-white border border-gray-200 rounded-lg p-6">

            {/* Member Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 text-xs font-normal font-['Inter']">Agenda </span>
                  <span className="text-slate-700 text-xs font-normal font-['Inter']">{agenda.id}</span>
                </div>
                <div className="self-stretch justify-start text-slate-700 text-xl font-semibold font-['Inter']">{agenda.title}</div>
                <div className="self-stretch justify-start text-gray-600 text-sm font-normal font-['Inter']">This agenda was made by {agenda.author} on {agenda.date}</div>
              </div>
            </div>

            {/* Status with time information */}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
                                          <span className="text-gray-600 text-[10px] font-normal font-['Inter']">
                {agenda.statusMessage}
              </span>
            </div>

            {/* Buttons at bottom */}
            <div className="flex justify-between items-center">
              <Link
                href={`/agenda/${agenda.id.replace('#', '')}`}
                data-size="Small"
                data-state="Default"
                data-type="Primary"
                className="w-32 px-4 py-1 rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer border"
                style={{
                  backgroundColor: '#2A72E5',
                  borderColor: '#2A72E5'
                }}
              >
                <div
                  className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose"
                  style={{color: '#FFFFFF'}}
                >
                  View Details
                </div>
              </Link>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Loading Status */}
      {isLoading && displayAgendas.length > 0 && (
        <div className="flex justify-center items-center mt-8 gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 text-sm">{statusMessage}</p>
        </div>
      )}

      {/* Load More */}
      {!isLoading && (
        <div className="flex justify-center mt-8">
          <Link
            href="#"
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            View more agenda ({displayAgendas.length})
          </Link>
        </div>
      )}

      {/* Connect Wallet Notice */}
      {!isConnected && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            💡 Connect your wallet to create new proposals and interact with agendas
          </p>
        </div>
      )}
    </div>
  )
}