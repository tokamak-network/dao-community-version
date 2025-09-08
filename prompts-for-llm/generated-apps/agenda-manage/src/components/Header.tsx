'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'

interface HeaderProps {
  onRefresh: () => Promise<void>
  isRefreshing: boolean
  totalAgendas: number
  currentAgendaId: number
}

export function Header({ onRefresh, isRefreshing, totalAgendas, currentAgendaId }: HeaderProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setIsMetaMaskInstalled(!!window.ethereum?.isMetaMask)
  }, [])

  const contracts = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]

  const handleConnect = () => {
    const metaMaskConnector = connectors.find(connector => connector.id === 'metaMask')
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    }
  }

  const handleNetworkSwitch = (targetChainId: number) => {
    switchChain({ chainId: targetChainId as 1 | 11155111 })
  }

  const getNetworkName = (id: number) => {
    switch (id) {
      case 1: return 'Mainnet'
      case 11155111: return 'Sepolia'
      default: return 'Unknown'
    }
  }

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center lg:items-start">
            <h1 className="text-2xl font-bold">🏛️ Tokamak DAO Agenda Manager</h1>
            <p className="text-blue-200 text-sm">
              Viewing Agenda #{currentAgendaId} of {totalAgendas} total agendas
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-4">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${
                isRefreshing
                  ? 'bg-blue-500 cursor-not-allowed'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Network:</label>
              <select
                value={chainId}
                onChange={(e) => handleNetworkSwitch(Number(e.target.value))}
                className="px-3 py-1 bg-blue-700 border border-blue-500 rounded text-white text-sm"
              >
                <option value={1}>Mainnet</option>
                <option value={11155111}>Sepolia</option>
              </select>
            </div>

            {isClient && (
              <div className="flex items-center gap-3">
                {!isMetaMaskInstalled ? (
                  <div className="text-center">
                    <p className="text-sm text-blue-200 mb-2">MetaMask required</p>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-md text-sm font-medium"
                    >
                      Install MetaMask
                    </a>
                  </div>
                ) : !isConnected ? (
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium"
                  >
                    Connect Wallet
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                      <div className="text-xs text-blue-200">
                        {getNetworkName(chainId)}
                      </div>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {contracts && (
          <div className="mt-4 pt-4 border-t border-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-medium">Committee:</span>
                <br />
                <span className="font-mono text-blue-200">{contracts.committee}</span>
              </div>
              <div>
                <span className="font-medium">AgendaManager:</span>
                <br />
                <span className="font-mono text-blue-200">{contracts.agendaManager}</span>
              </div>
              <div>
                <span className="font-medium">TON Token:</span>
                <br />
                <span className="font-mono text-blue-200">{contracts.ton}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}