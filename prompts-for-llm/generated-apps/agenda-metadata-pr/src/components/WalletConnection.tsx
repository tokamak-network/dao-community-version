'use client'

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useState, useEffect } from 'react'
import { safe, UI_TEXT } from '@/lib/utils'

export function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-gray-200 rounded-lg" disabled>
          {UI_TEXT.LOADING}
        </button>
      </div>
    )
  }

  const handleConnect = () => {
    const metaMaskConnector = connectors.find(c => c.id === 'injected' || c.name === 'MetaMask')
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    } else {
      alert('Please install MetaMask to continue')
    }
  }

  const handleNetworkSwitch = (targetChainId: number) => {
    if (switchChain) {
      switchChain({ chainId: targetChainId })
    }
  }

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {chainId === 1 ? UI_TEXT.MAINNET : chainId === 11155111 ? UI_TEXT.SEPOLIA : 'Unknown Network'}
            </span>
          </div>
          <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
            {safe.formatAddress(address || '')}
          </div>
          <button
            onClick={() => disconnect()}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {UI_TEXT.DISCONNECT}
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {UI_TEXT.CONNECT_WALLET}
        </button>
      )}
      
      {isConnected && chainId !== 1 && chainId !== 11155111 && (
        <div className="flex gap-2">
          <button
            onClick={() => handleNetworkSwitch(1)}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Switch to Mainnet
          </button>
          <button
            onClick={() => handleNetworkSwitch(11155111)}
            className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
          >
            Switch to Sepolia
          </button>
        </div>
      )}
    </div>
  )
}