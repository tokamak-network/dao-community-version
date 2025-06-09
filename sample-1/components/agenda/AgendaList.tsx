'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import PageHeader from '@/components/ui/PageHeader'

export default function AgendaList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('latest')
  const [statusFilter, setStatusFilter] = useState('all')
  const { isConnected } = useAccount();

  // Mock agenda data for demonstration
  const [agendas] = useState<any[]>([]);
  const [isLoadingAgendas] = useState(false);
  const [agendasError] = useState<string | null>(null);

  const refreshAgendas = () => {
    console.log('Refreshing agendas...');
  };

  const loadAgendas = () => {
    console.log('Loading agendas...');
  };

  // Agenda 페이지 진입시 agenda 데이터 로딩
  useEffect(() => {
    if (agendas.length === 0 && !isLoadingAgendas && !agendasError) {
      loadAgendas()
    }
  }, [])

  if (isLoadingAgendas) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading agendas...</p>
        </div>
      </div>
    )
  }

  if (agendasError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500 text-lg">Error: {agendasError}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            onClick={refreshAgendas}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
          {agendas.length > 0 && (
            <p className="text-sm text-gray-500">
              {agendas.length} agendas found
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="#"
            className="text-blue-600 text-sm hover:text-blue-700"
          >
            Go to online agenda
          </Link>
          {isConnected && (
            <button className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">
              + New proposal
            </button>
          )}
        </div>
      </div>

      {/* No data state */}
      {agendas.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No agendas available</h3>
          <p className="text-gray-500 text-center max-w-md">
            There are currently no agendas to display. Check back later or create a new proposal if you're a committee member.
          </p>
        </div>
      )}

      {/* Agenda List */}
      {agendas.length > 0 && (
        <>
          <div className="space-y-4">
            {agendas.map((agenda, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {agenda.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agenda.status === 'Open' ? 'bg-red-100 text-red-600' :
                        agenda.status === 'Notice' ? 'bg-yellow-100 text-yellow-600' :
                        agenda.status === 'Executed' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {agenda.status}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">
                      {agenda.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>by {agenda.author}</span>
                      <span>{agenda.date}</span>
                      {agenda.votesFor !== undefined && (
                        <span>👍 {agenda.votesFor} 👎 {agenda.votesAgainst}</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <button className="px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="#"
              className="text-gray-500 text-sm hover:text-gray-700"
            >
              View more agenda ({agendas.length})
            </Link>
          </div>
        </>
      )}

      {!isConnected && agendas.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            💡 Connect your wallet to create new proposals and interact with agendas
          </p>
        </div>
      )}
    </div>
  )
}