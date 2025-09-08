'use client'

import { useState, useCallback } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { useChainId } from 'wagmi'

import { config } from '@/lib/wagmi'
import { useAgendaData } from '@/hooks/useAgendaData'
import { useMembers } from '@/hooks/useMembers'

import { Header } from './Header'
import { AgendaNavigation } from './AgendaNavigation'
import { AgendaDetails } from './AgendaDetails'
import { VotingSystem } from './VotingSystem'
import { ExecutionSystem } from './ExecutionSystem'
import { LoadingSpinner, ErrorMessage } from './LoadingSpinner'

const queryClient = new QueryClient()

function MainContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chainId = useChainId()
  
  const agendaIdParam = searchParams.get('id')
  const agendaId = agendaIdParam ? parseInt(agendaIdParam) : 0
  
  const [refreshing, setRefreshing] = useState(false)

  const {
    agendaData,
    currentStatus,
    agendaMemo,
    totalAgendas,
    isLoading: agendaLoading,
    refetchAll: refetchAgendaData
  } = useAgendaData(agendaId, chainId)

  const {
    members,
    isLoading: membersLoading
  } = useMembers(chainId, agendaData)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refetchAgendaData()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refetchAgendaData])

  const isLoading = agendaLoading || membersLoading

  if (agendaId < 0 || (totalAgendas > 0 && agendaId >= totalAgendas)) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          totalAgendas={totalAgendas}
          currentAgendaId={agendaId}
        />
        <main className="container mx-auto px-4 py-8">
          <ErrorMessage 
            error={`Invalid agenda ID. Please select an agenda between 0 and ${Math.max(0, totalAgendas - 1)}.`}
            onRetry={() => router.push('?id=0')}
          />
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          totalAgendas={totalAgendas}
          currentAgendaId={agendaId}
        />
        <main className="container mx-auto px-4 py-8">
          <LoadingSpinner message="Loading agenda data..." />
        </main>
      </div>
    )
  }

  if (!agendaData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header
          onRefresh={handleRefresh}
          isRefreshing={refreshing}
          totalAgendas={totalAgendas}
          currentAgendaId={agendaId}
        />
        <main className="container mx-auto px-4 py-8">
          <ErrorMessage 
            error="Failed to load agenda data. Please try refreshing."
            onRetry={handleRefresh}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        totalAgendas={totalAgendas}
        currentAgendaId={agendaId}
      />
      
      <main className="container mx-auto px-4 py-8">
        <AgendaNavigation
          totalAgendas={totalAgendas}
          currentAgendaId={agendaId}
        />
        
        <AgendaDetails
          agendaId={agendaId}
          agendaData={agendaData}
          currentStatus={currentStatus}
          agendaMemo={agendaMemo}
        />
        
        <VotingSystem
          agendaId={agendaId}
          agendaData={agendaData}
          members={members}
        />
        
        <ExecutionSystem
          agendaId={agendaId}
          agendaData={agendaData}
          currentStatus={currentStatus}
        />
      </main>
    </div>
  )
}

export function ClientComponent() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <MainContent />
      </QueryClientProvider>
    </WagmiProvider>
  )
}