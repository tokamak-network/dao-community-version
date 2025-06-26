'use client'
import { useAgenda } from '@/contexts/AgendaContext'

export default function AgendaTestComponent() {
  const {
    agendas,
    isLoading,
    error,
    statusMessage,
    refreshAgendas,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    quorum
  } = useAgenda();

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Agenda Provider Test</h3>

      <div className="space-y-2">
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <p><strong>Status:</strong> {statusMessage}</p>
        <p><strong>Agendas Count:</strong> {agendas.length}</p>

        <div className="mt-4">
          <h4 className="font-medium">Contract Settings:</h4>
          <p><strong>Create Agenda Fees:</strong> {createAgendaFees?.toString() || 'Loading...'}</p>
          <p><strong>Min Notice Period:</strong> {minimumNoticePeriodSeconds?.toString() || 'Loading...'}</p>
          <p><strong>Min Voting Period:</strong> {minimumVotingPeriodSeconds?.toString() || 'Loading...'}</p>
          <p><strong>Quorum:</strong> {quorum?.toString() || 'Loading...'}</p>
        </div>

        <button
          onClick={refreshAgendas}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Agendas
        </button>

        {agendas.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium">First Agenda:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(agendas[0], (key, value) =>
                typeof value === 'bigint' ? value.toString() : value, 2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}