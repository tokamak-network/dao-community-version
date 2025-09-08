'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useState } from 'react'
import { safe } from '@/lib/safe'

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleConnect = () => {
    const metamask = connectors.find(c => c.id === 'metaMask')
    if (metamask) {
      connect({ connector: metamask })
    }
  }

  const getNetworkName = () => {
    switch (chainId) {
      case 1: return 'Mainnet'
      case 11155111: return 'Sepolia'
      default: return 'Unknown'
    }
  }

  return (
    <div className="flex items-center gap-4">
      {isConnected && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            {getNetworkName()}
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
              <button
                onClick={() => {
                  switchChain({ chainId: 1 })
                  setIsDropdownOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Mainnet
              </button>
              <button
                onClick={() => {
                  switchChain({ chainId: 11155111 })
                  setIsDropdownOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Sepolia
              </button>
            </div>
          )}
        </div>
      )}

      {isConnected ? (
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {safe.formatAddress(address || '')}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  )
}