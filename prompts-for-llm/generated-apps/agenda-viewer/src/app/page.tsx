'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain, useReadContract } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import { getContracts } from '@/lib/wagmi';
import { AGENDA_MANAGER_ABI } from '@/lib/abis';
import { safe } from '@/lib/safe-utils';

export default function Home() {
  const [agendaId, setAgendaId] = useState<string>('');
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const contracts = getContracts(chainId);

  const { data: totalAgendas } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'numAgendas',
    chainId,
  });

  const handleConnect = () => {
    connect({ connector: metaMask() });
  };

  const handleNetworkSwitch = (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
  };

  const handleViewAgenda = () => {
    if (agendaId) {
      router.push(`/agenda/${agendaId}`);
    }
  };

  const totalAgendasNum = safe.bigInt(totalAgendas);
  const maxId = totalAgendasNum ? Number(totalAgendasNum) - 1 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tokamak DAO Agenda Viewer
              </h1>
              <p className="text-sm text-gray-600">
                View and analyze DAO agendas with real-time updates
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Network Selector */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleNetworkSwitch(mainnet.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    chainId === mainnet.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Mainnet
                </button>
                <button
                  onClick={() => handleNetworkSwitch(sepolia.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    chainId === sepolia.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Sepolia
                </button>
              </div>

              {/* Wallet Connection */}
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {safe.formatAddress(address || '')}
                  </span>
                  <button
                    onClick={() => disconnect()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contract Info */}
      {contracts && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">TON:</span>
                <span className="ml-2 text-blue-700 font-mono">{contracts.ton}</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Committee:</span>
                <span className="ml-2 text-blue-700 font-mono">{contracts.committee}</span>
              </div>
              <div>
                <span className="font-medium text-blue-900">AgendaManager:</span>
                <span className="ml-2 text-blue-700 font-mono">{contracts.agendaManager}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Agenda Navigation
          </h2>

          {/* Total Agendas Info */}
          {totalAgendasNum !== null && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total Agendas:</span> {totalAgendasNum.toString()}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Valid Range:</span> 0 to {maxId}
              </p>
            </div>
          )}

          {/* Agenda Input */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 max-w-xs">
              <label htmlFor="agendaId" className="block text-sm font-medium text-gray-700 mb-2">
                Agenda ID
              </label>
              <input
                type="number"
                id="agendaId"
                min="0"
                max={maxId}
                value={agendaId}
                onChange={(e) => setAgendaId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter ID (0-${maxId})`}
              />
            </div>
            <button
              onClick={handleViewAgenda}
              disabled={!agendaId || Number(agendaId) < 0 || Number(agendaId) > maxId}
              className="mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium"
            >
              View Agenda
            </button>
          </div>

          {/* Validation Message */}
          {agendaId && (Number(agendaId) < 0 || Number(agendaId) > maxId) && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">
                ⚠️ Invalid agenda ID. Please enter a number between 0 and {maxId}.
              </p>
            </div>
          )}

          {/* Quick Navigation */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Access</h3>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((id) => (
                id <= maxId && (
                  <button
                    key={id}
                    onClick={() => router.push(`/agenda/${id}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
                  >
                    Agenda {id}
                  </button>
                )
              ))}
              {maxId > 5 && (
                <button
                  onClick={() => router.push(`/agenda/${maxId}`)}
                  className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium"
                >
                  Latest (#{maxId})
                </button>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-md">
                <h4 className="font-medium text-green-900">Real-time Updates</h4>
                <p className="text-sm text-green-700 mt-1">
                  Live agenda status and voting results
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-md">
                <h4 className="font-medium text-blue-900">Timeline View</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Visual timeline of agenda lifecycle
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-md">
                <h4 className="font-medium text-purple-900">Voter Analysis</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Detailed voter information and links
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}