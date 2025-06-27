'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatAddress, formatDate, formatDateSimple, getStatusMessage, calculateAgendaStatus, getAgendaResult } from '@/lib/utils'

interface AgendaDetailProps {
  agenda: AgendaWithMetadata
}

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState('info')

  // Calculate dynamic status
  const currentStatus = calculateAgendaStatus(agenda, BigInt(2))
  const statusMessage = getStatusMessage(agenda, currentStatus, BigInt(2))
  const agendaResult = getAgendaResult(agenda, currentStatus, BigInt(2))

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
            {agenda.title}
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
                Comments (4)
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
        {activeTab === 'info' && (
          <div className="space-y-2">
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
        )}

        {activeTab === 'effects' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Action</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Contract</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Method</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Parameters</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">#1</td>
                    <td className="py-3 text-sm">
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">
                        0xTO0...8770
                      </a>
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      📋 TransferAddresstosc,uir(256)
                    </td>
                    <td className="py-3 text-sm text-blue-600">
                      2 params &gt;
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">DAO Agenda Submission Parameters</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">TON Contract</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm font-mono text-gray-700">
                      0xA2701d4Bb20BE3DD9f60ced579A4FBFfd97e3ab6 ↗
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Function</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm text-gray-700">
                      approveAndCallAddress spender, uint256 amount, bytes data ↗
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Function Parameters</h4>

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Spender</h5>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-sm font-mono text-gray-700">
                          0xA2701d4Bb20BE3DD9f60ced579A4FBFfd97e3ab6 ↗
                        </span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Amount</h5>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <span className="text-sm text-gray-700">100.0 TON</span>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Data</h5>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-xs font-mono text-gray-600 break-all">
                          0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000330d4aae433bae8f8b967be31e67ceaa04ef501950000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d42395423ae883bae8f8b6734e62ea049ef501950000000000000000000000000000000000000000000000000000000000000000000000000
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="divide-y divide-gray-200">
            <div className="py-4">
              <div className="text-gray-500 text-xs mb-1">Apr 22, 2023, 03:02</div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">0x69b02...caa6</a>
                <span className="text-gray-700"> voted </span>
                <span className="text-blue-600 font-medium">Yes</span>
              </div>
            </div>

            <div className="py-4">
              <div className="text-gray-500 text-xs mb-1">Apr 22, 2023, 03:04</div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">0x69b02...caa6</a>
                <span className="text-gray-700"> voted </span>
                <span className="text-blue-600 font-medium">Yes</span>
              </div>
            </div>

            <div className="py-4">
              <div className="text-gray-500 text-xs mb-1">Apr 22, 2023, 03:02</div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">0x69b02...caa6</a>
                <span className="text-gray-700"> voted </span>
                <span className="text-blue-600 font-medium">Yes</span>
              </div>
            </div>

            <div className="py-4">
              <div className="text-gray-500 text-xs mb-1">Apr 22, 2023, 03:04</div>
              <div className="text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">0x69b02...caa6</a>
                <span className="text-gray-700"> voted </span>
                <span className="text-blue-600 font-medium">Yes</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}