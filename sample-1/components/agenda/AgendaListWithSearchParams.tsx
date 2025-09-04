'use client'
import { Suspense } from 'react'
import AgendaList from './AgendaList'

export default function AgendaListWithSearchParams() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-600">Loading agenda list...</div>
        </div>
      </div>
    }>
      <AgendaList />
    </Suspense>
  )
}