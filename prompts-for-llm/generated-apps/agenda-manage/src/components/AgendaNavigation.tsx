'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AgendaNavigationProps {
  totalAgendas: number
  currentAgendaId: number
}

export function AgendaNavigation({ totalAgendas, currentAgendaId }: AgendaNavigationProps) {
  const router = useRouter()
  const [inputValue, setInputValue] = useState(currentAgendaId.toString())
  const [error, setError] = useState('')

  useEffect(() => {
    setInputValue(currentAgendaId.toString())
  }, [currentAgendaId])

  const maxAgendaId = Math.max(0, totalAgendas - 1)

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setError('')
  }

  const handleNavigate = (agendaId: number) => {
    if (agendaId < 0 || agendaId > maxAgendaId) {
      setError(`Please enter a number between 0 and ${maxAgendaId}`)
      return
    }
    router.push(`?id=${agendaId}`)
  }

  const handleInputSubmit = () => {
    const id = parseInt(inputValue)
    if (isNaN(id)) {
      setError('Please enter a valid number')
      return
    }
    handleNavigate(id)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputSubmit()
    }
  }

  const canGoPrevious = currentAgendaId > 0
  const canGoNext = currentAgendaId < maxAgendaId

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="agenda-input" className="text-sm font-medium text-gray-700">
            Agenda ID:
          </label>
          <input
            id="agenda-input"
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleInputSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Go
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate(currentAgendaId - 1)}
            disabled={!canGoPrevious}
            className={`px-4 py-2 rounded-md font-medium ${
              canGoPrevious
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            ← Previous
          </button>
          <button
            onClick={() => handleNavigate(currentAgendaId + 1)}
            disabled={!canGoNext}
            className={`px-4 py-2 rounded-md font-medium ${
              canGoNext
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Next →
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Total Agendas: {totalAgendas} (0-{maxAgendaId})
        </div>
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
    </div>
  )
}