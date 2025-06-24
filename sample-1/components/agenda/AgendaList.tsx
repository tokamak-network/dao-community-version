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

  // Mock agenda data based on the screenshot
  const mockAgendas = [
    {
      id: '#14',
      title: '(DAO Committee Proxy)Address of the DAO contract will be upgraded.',
      author: 'OxH65...eJsof',
      date: 'Apr 4, 2023',
      status: 'EXECUTED',
      votesFor: 0,
      votesAgainst: 0
    },
    {
      id: '#13',
      title: '(DAO Committee Proxy)Address of the DAO contract will be upgraded.',
      author: 'OxH65...eJsof',
      date: 'Oct 30, 2024',
      status: 'EXECUTED',
      votesFor: 0,
      votesAgainst: 0
    },
    {
      id: '#12',
      title: '(SeigniorageManager)All the seigniorage rates will be changed',
      author: 'OxT36E...KTBU',
      date: 'May 25, 2024',
      status: 'EXECUTED',
      votesFor: 0,
      votesAgainst: 0
    },
    {
      id: '#11',
      title: '(Deposit Manager) Add logic to use the Deposit Manager contract.',
      author: 'Ox442d...bZ3d',
      date: 'Jul 3, 2024',
      status: 'EXECUTED',
      votesFor: 0,
      votesAgainst: 0
    },
    {
      id: '#10',
      title: '(DAO Committee Proxy)Address of the DAO contract will be upgraded.',
      author: 'OxT36E...KTBU',
      date: 'Jul 3, 2022',
      status: 'EXECUTED',
      votesFor: 0,
      votesAgainst: 0
    }
  ];

  const refreshAgendas = () => {
    console.log('Refreshing agendas...');
  };

  const loadAgendas = () => {
    console.log('Loading agendas...');
  };

  // Agenda 페이지 진입시 agenda 데이터 로딩
  useEffect(() => {
    if (mockAgendas.length === 0) {
      loadAgendas()
    }
  }, [])

  if (mockAgendas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading agendas...</p>
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
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            + New proposal
          </button>
        )}
      </div>

      {/* Agenda List */}
      <div className="flex flex-col gap-4">
        {mockAgendas.map((agenda, index) => (
          <div key={agenda.id} className="bg-white border border-gray-200 rounded-lg p-6">

            {/* Member Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-900 text-[9px] font-normal font-['Inter']">Agenda </span>
                  <span className="text-slate-700 text-[9px] font-normal font-['Inter']">{agenda.id}</span>
                </div>
                <div className="self-stretch justify-start text-slate-700 text-xl font-semibold font-['Inter']">{agenda.title}</div>
                <div className="self-stretch justify-start text-gray-600 text-sm font-normal font-['Inter']">This agenda was made by {agenda.author} on {agenda.date}</div>
              </div>
            </div>

            {/* Status with clock icon */}
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span className="text-gray-600 text-[10px] font-normal font-['Inter']">
                POLL ENDED
              </span>
            </div>

            {/* Buttons at bottom */}
            <div className="flex justify-between items-center">
              <div
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-8">
        <Link
          href="#"
          className="text-gray-500 text-sm hover:text-gray-700"
        >
          View more agenda ({mockAgendas.length + 348})
        </Link>
      </div>

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