'use client'
import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { getContracts, isChainSupported } from '@/lib/wagmi'
import { ux } from '@/lib/safe-utils'

export function WalletConnection() {
  const [mounted, setMounted] = useState(false)
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false)

  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const contracts = getContracts(chainId)
  const isSupported = isChainSupported(chainId)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNetworkSwitch = async (targetChainId: number) => {
    setIsNetworkSwitching(true)
    try {
      await switchChain({ chainId: targetChainId })
    } catch (error) {
      console.error('Network switch failed:', error)
    } finally {
      setIsNetworkSwitching(false)
    }
  }

  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Wallet & Network</h2>
        {!isSupported && (
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
            ⚠️ Unsupported Network
          </span>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
            <div>
              <p className="text-sm text-gray-600">Connected Address:</p>
              <p className="font-mono text-sm font-medium">{ux.truncateHash(address || '', 8)}</p>
            </div>
            <button
              onClick={() => disconnect()}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Network:</p>
              <p className="text-sm font-medium">{ux.getNetworkName(chainId)}</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleNetworkSwitch(1)}
                disabled={chainId === 1 || isNetworkSwitching || isSwitching}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chainId === 1
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                {isNetworkSwitching && chainId !== 1 ? '⏳' : 'Mainnet'}
              </button>
              <button
                onClick={() => handleNetworkSwitch(11155111)}
                disabled={chainId === 11155111 || isNetworkSwitching || isSwitching}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  chainId === 11155111
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
                }`}
              >
                {isNetworkSwitching && chainId !== 11155111 ? '⏳' : 'Sepolia'}
              </button>
            </div>
          </div>

          {contracts && (
            <div className="border-t pt-3">
              <p className="text-sm text-gray-600 mb-2">Contract Addresses:</p>
              <div className="space-y-1 text-xs font-mono">
                <div>TON: {contracts.ton}</div>
                <div>Committee: {contracts.committee}</div>
                <div>AgendaManager: {contracts.agendaManager}</div>
              </div>
            </div>
          )}

          {!isSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm">
                ⚠️ Please switch to Ethereum Mainnet or Sepolia Testnet to create agendas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Connect your wallet to create DAO agendas</p>
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isConnecting ? '⏳ Connecting...' : `Connect ${connector.name}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}