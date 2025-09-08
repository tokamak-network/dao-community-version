'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useChainId, useReadContract, useSwitchChain, useConnect, useDisconnect } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';
import { getContracts } from '@/lib/wagmi';
import { AGENDA_MANAGER_ABI, COMMITTEE_ABI } from '@/lib/abis';
import { AGENDA_STATUS, AGENDA_RESULT, COMMITTEE_STATUS, COMMITTEE_RESULT } from '@/lib/constants';
import { safe } from '@/lib/safe-utils';
import AgendaDetails from '@/components/AgendaDetails';
import VotingVisualization from '@/components/VotingVisualization';
import TimelineVisualization from '@/components/TimelineVisualization';
import VoterList from '@/components/VoterList';

export default function AgendaPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const agendaId = params.id as string;
  const agendaIdNum = Number(agendaId);

  const contracts = getContracts(chainId);

  // Get total agendas for navigation validation
  const { data: totalAgendas } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'numAgendas',
    chainId,
  });

  // Get agenda details
  const { data: agendaData, isLoading: agendaLoading, error: agendaError, refetch: refetchAgenda } = useReadContract({
    address: contracts?.agendaManager,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'agendas',
    args: [BigInt(agendaIdNum)],
    chainId,
    query: {
      enabled: !isNaN(agendaIdNum) && agendaIdNum >= 0,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    }
  });

  // Get real-time status from committee
  const { data: committeeStatus, isLoading: committeeLoading, refetch: refetchCommittee } = useReadContract({
    address: contracts?.committee,
    abi: COMMITTEE_ABI,
    functionName: 'currentAgendaStatus',
    args: [BigInt(agendaIdNum)],
    chainId,
    query: {
      enabled: !isNaN(agendaIdNum) && agendaIdNum >= 0,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    }
  });

  const totalAgendasNum = safe.bigInt(totalAgendas);
  const maxId = totalAgendasNum ? Number(totalAgendasNum) - 1 : 0;

  const handleConnect = () => {
    connect({ connector: metaMask() });
  };

  const handleNetworkSwitch = (targetChainId: number) => {
    switchChain({ chainId: targetChainId });
  };

  const handlePrevious = useCallback(() => {
    if (agendaIdNum > 0) {
      router.push(`/agenda/${agendaIdNum - 1}`);
    }
  }, [agendaIdNum, router]);

  const handleNext = useCallback(() => {
    if (agendaIdNum < maxId) {
      router.push(`/agenda/${agendaIdNum + 1}`);
    }
  }, [agendaIdNum, maxId, router]);

  const handleRefresh = useCallback(() => {
    refetchAgenda();
    refetchCommittee();
  }, [refetchAgenda, refetchCommittee]);

  // Parse agenda data
  const parsedAgenda = useMemo(() => {
    if (!agendaData) return null;

    const data = agendaData as any;
    
    return {
      createdTimestamp: safe.bigInt(data.createdTimestamp),
      noticeEndTimestamp: safe.bigInt(data.noticeEndTimestamp),
      votingPeriodInSeconds: safe.bigInt(data.votingPeriodInSeconds),
      votingStartedTimestamp: safe.bigInt(data.votingStartedTimestamp),
      votingEndTimestamp: safe.bigInt(data.votingEndTimestamp),
      executableLimitTimestamp: safe.bigInt(data.executableLimitTimestamp),
      executedTimestamp: safe.bigInt(data.executedTimestamp),
      countingYes: safe.bigInt(data.countingYes),
      countingNo: safe.bigInt(data.countingNo),
      countingAbstain: safe.bigInt(data.countingAbstain),
      status: Number(data.status),
      result: Number(data.result),
      voters: data.voters as string[],
      executed: Boolean(data.executed)
    };
  }, [agendaData]);

  // Parse committee status
  const parsedCommitteeStatus = useMemo(() => {
    if (!committeeStatus) return null;

    const data = committeeStatus as any;
    return {
      status: Number(data[1]), // agendaStatus is second element
      result: Number(data[0])  // agendaResult is first element
    };
  }, [committeeStatus]);

  if (isNaN(agendaIdNum) || agendaIdNum < 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Invalid Agenda ID</h2>
          <p className="text-gray-600 mb-6">Please provide a valid agenda ID (0 or greater).</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (totalAgendasNum !== null && agendaIdNum > maxId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Agenda Not Found</h2>
          <p className="text-gray-600 mb-6">
            Agenda ID {agendaId} does not exist. Maximum agenda ID is {maxId}.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Agenda #{agendaId} Details
              </h1>
              <p className="text-sm text-gray-600">
                Real-time agenda information and voting status
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-md text-sm font-medium"
              >
                ↻ Refresh
              </button>

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

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={agendaIdNum <= 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium"
              >
                ← Previous
              </button>
              
              <span className="text-gray-600">
                {totalAgendasNum !== null && `${agendaIdNum + 1} of ${totalAgendasNum}`}
              </span>
              
              <button
                onClick={handleNext}
                disabled={totalAgendasNum !== null && agendaIdNum >= maxId}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {agendaLoading || committeeLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading agenda data...</span>
          </div>
        ) : agendaError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Agenda</h3>
            <p className="text-red-600">
              Failed to load agenda data. Please check your connection and try again.
            </p>
            <button
              onClick={handleRefresh}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Retry
            </button>
          </div>
        ) : parsedAgenda ? (
          <div className="space-y-8">
            {/* Agenda Details */}
            <AgendaDetails 
              agenda={parsedAgenda}
              committeeStatus={parsedCommitteeStatus}
              agendaId={agendaIdNum}
            />

            {/* Voting Visualization */}
            <VotingVisualization agenda={parsedAgenda} />

            {/* Timeline */}
            <TimelineVisualization agenda={parsedAgenda} />

            {/* Voter List */}
            <VoterList 
              voters={parsedAgenda.voters}
              chainId={chainId}
            />
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Data Available</h3>
            <p className="text-yellow-600">
              This agenda may not exist or there was an issue loading the data.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}