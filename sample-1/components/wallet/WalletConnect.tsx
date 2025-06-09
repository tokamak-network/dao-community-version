'use client'

// 간단한 지갑 아이콘
function WalletIcon() {
  return (
    <div className="w-16 h-12 border-2 border-gray-400 rounded-md bg-white relative mx-auto">
      <div className="w-3 h-2 bg-gray-400 rounded-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}

interface WalletConnectProps {
  onConnect: () => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex flex-col items-center gap-8 text-center">
        <WalletIcon />

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Connect your wallet to see your voting
          </h2>
          <h2 className="text-2xl font-bold text-gray-900">
            power and start delegating
          </h2>
        </div>

        <button
          className="px-8 py-3 text-lg bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={onConnect}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  )
}