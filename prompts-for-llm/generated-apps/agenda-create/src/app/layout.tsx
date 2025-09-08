'use client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'
import './globals.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000,
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <title>Tokamak DAO Agenda Creator</title>
        <meta name="description" content="Create DAO agendas with advanced transaction management" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <div className="container mx-auto px-4 py-6">
              <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  🚀 Tokamak DAO Agenda Creator
                </h1>
                <p className="text-gray-600">
                  Create comprehensive DAO proposals with multi-transaction support
                </p>
              </header>
              {children}
            </div>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
