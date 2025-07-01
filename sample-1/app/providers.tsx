"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/config/wagmi'
import { CombinedDAOProvider } from '@/contexts/CombinedDAOContext'



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true') {
    console.log("🏗️ Providers 렌더링", {
      timestamp: new Date().toLocaleTimeString()
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <CombinedDAOProvider>
            {children}
          </CombinedDAOProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}