'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatDateSimple, getStatusMessage, calculateAgendaStatus, getAgendaResult } from '@/lib/utils'
import AgendaInfo from './AgendaInfo'
import AgendaEffects from './AgendaEffects'
import AgendaComments from './AgendaComments'

interface AgendaDetailProps {
  agenda: AgendaWithMetadata
}

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState('info')

  // Calculate dynamic status
  const currentStatus = calculateAgendaStatus(agenda, BigInt(Math.floor(Date.now() / 1000)))
  const statusMessage = getStatusMessage(agenda, currentStatus)
  const agendaResult = getAgendaResult(agenda, currentStatus)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <Link
          href="/agenda"
          className="px-3 py-1.5 bg-white border border-gray-300 text-blue-600 text-xs rounded-md hover:bg-gray-50 transition-colors"
        >
          ← BACK TO ALL AGENDAS
        </Link>

        <div className="flex gap-3">
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-500 text-xs rounded-md hover:bg-gray-50 transition-colors">
            ← PREVIOUS AGENDA
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-500 text-xs rounded-md hover:bg-gray-50 transition-colors">
            NEXT AGENDA →
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-sm font-medium">#{agenda.id}</span>
            <span className="text-gray-400 text-sm">Posted {formatDateSimple(Number(agenda.createdTimestamp))}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-700 font-['Inter'] mb-4">
            {agenda.title || `Agenda #${agenda.id}`}
          </h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex justify-between items-baseline">
            <div className="flex gap-8">
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'effects'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('effects')}
              >
                On-Chain Effects
              </button>
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
            </div>

            {/* Voting Status - 같은 baseline */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
                <span>⚡</span>
                {statusMessage}
              </span>
              <button
                className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                  currentStatus === 2 && agenda.votingStartedTimestamp > BigInt(0)
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-white border border-gray-300 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!(currentStatus === 2 && agenda.votingStartedTimestamp > BigInt(0))}
              >
                <span>📋</span>
                Vote
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={activeTab === 'info' ? 'block' : 'hidden'}>
          <AgendaInfo agenda={agenda} />
        </div>
        <div className={activeTab === 'effects' ? 'block' : 'hidden'}>
          <AgendaEffects agenda={agenda} />
        </div>
        <div className={activeTab === 'comments' ? 'block' : 'hidden'}>
          <AgendaComments agenda={agenda} />
        </div>
      </div>
    </div>
  )
}