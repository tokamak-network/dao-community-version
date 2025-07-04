/**
 * Agenda 이벤트 모니터링 설정 및 관리
 */
import { createPublicClient, http } from 'viem';
import { chain } from '@/config/chain';
import { CONTRACTS } from '@/config/contracts';
import { DAO_ABI } from '@/abis/dao';
import { daoAgendaManagerAbi } from '@/abis/dao-agenda-manager';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import type {
  AgendaCreatedHandler,
  AgendaVoteCastedHandler,
  AgendaExecutedHandler
} from './agenda-event-handlers';

/**
 * 아젠다 이벤트 모니터링 설정 함수
 */
export const setupAgendaEventMonitoring = (
  handleAgendaCreated: AgendaCreatedHandler,
  handleAgendaVoteCasted: AgendaVoteCastedHandler,
  handleAgendaExecuted: AgendaExecutedHandler
) => {
  console.log("[setupAgendaEventMonitoring] Setting up agenda event monitoring", {
    timestamp: new Date().toISOString(),
    agendaManagerAddress: CONTRACTS.daoAgendaManager.address,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT,
    fallbackRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    actualRpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'undefined',
    handlersReady: {
      handleAgendaCreated: !!handleAgendaCreated,
      handleAgendaVoteCasted: !!handleAgendaVoteCasted,
      handleAgendaExecuted: !!handleAgendaExecuted
    }
  });

  const publicClient = createPublicClient({
    chain: {
      ...chain,
      id: chain.id,
    },
    transport: http(
      process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT ||
      process.env.NEXT_PUBLIC_RPC_URL ||
      'https://ethereum-sepolia-rpc.publicnode.com'
    ),
  });

  // AgendaCreated 이벤트 모니터링 설정
  const unwatchAgendaCreated = setupAgendaCreatedWatcher(publicClient, handleAgendaCreated);

  // AgendaVoteCasted 이벤트 모니터링 설정
  const unwatchAgendaVoteCasted = setupAgendaVoteCastedWatcher(publicClient, handleAgendaVoteCasted);

  // AgendaExecuted 이벤트 모니터링 설정
  const unwatchAgendaExecuted = setupAgendaExecutedWatcher(publicClient, handleAgendaExecuted);

  // 정리 함수 반환
  return () => {
    console.log('🔌 아젠다 이벤트 워처들 정리 중...', {
      timestamp: new Date().toISOString()
    });

    unwatchAgendaCreated();
    unwatchAgendaVoteCasted();
    unwatchAgendaExecuted();

  };
};

/**
 * AgendaCreated 이벤트 워처 설정
 */
const setupAgendaCreatedWatcher = (publicClient: any, handleAgendaCreated: AgendaCreatedHandler) => {
  console.log('🎯 Setting up AgendaCreated watcher', {
    address: CONTRACTS.daoAgendaManager.address,
    eventName: 'AgendaCreated'
  });

  const unwatchAgendaCreated = publicClient.watchContractEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    abi: daoAgendaManagerAbi,
    eventName: 'AgendaCreated',
    onLogs: (logs: any[]) => {
      console.log('📥 AgendaCreated events received:', logs.length);
      logs.forEach((log) => {
        const {  from, id, targets, noticePeriodSeconds, votingPeriodSeconds, atomicExecute } = log.args;
        console.log('🆕 New agenda created:', { id: id?.toString(), from });
        handleAgendaCreated({
          id,
          from,
          noticePeriodSeconds,
          votingPeriodSeconds,
          atomicExecute
        });
      });
    },
    onError: (error: any) => {
      console.error('❌ AgendaCreated 이벤트 워처 오류:', error);
    }
  });

  return unwatchAgendaCreated;
};

/**
 * AgendaVoteCasted 이벤트 워처 설정
 */
const setupAgendaVoteCastedWatcher = (publicClient: any, handleAgendaVoteCasted: AgendaVoteCastedHandler) => {
  console.log('🎯 Setting up AgendaVoteCasted watcher', {
    address: CONTRACTS.daoAgendaManager.address,
    eventName: 'AgendaVoteCasted'
  });

  const unwatchAgendaVoteCasted = publicClient.watchContractEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    abi: daoAgendaManagerAbi,
    eventName: 'AgendaVoteCasted',
    onLogs: (logs: any[]) => {
      console.log('📥 AgendaVoteCasted events received:', logs.length);
      logs.forEach((log) => {
        const { from, id, voting, comment } = log.args;
        console.log('🗳️ Vote cast:', { id: id?.toString(), from, voting: voting?.toString() });
        handleAgendaVoteCasted({
          from, id, voting, comment
        });
      });
    },
    onError: (error: any) => {
      console.error('❌ AgendaVoteCasted 이벤트 워처 오류:', error);
    }
  });

  return unwatchAgendaVoteCasted;
};

/**
 * AgendaExecuted 이벤트 워처 설정
 */
const setupAgendaExecutedWatcher = (publicClient: any, handleAgendaExecuted: AgendaExecutedHandler) => {
  console.log('🎯 Setting up AgendaExecuted watcher', {
    address: CONTRACTS.daoAgendaManager.address,
    eventName: 'AgendaExecuted'
  });

  const unwatchAgendaExecuted = publicClient.watchContractEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    abi: daoAgendaManagerAbi,
    eventName: 'AgendaExecuted',
    onLogs: (logs: any[]) => {
      console.log('📥 AgendaExecuted events received:', logs.length);
      logs.forEach((log) => {
        const { id, target } = log.args;
        console.log('✅ Agenda executed:', { id: id?.toString(), target });
        handleAgendaExecuted({
          id,
          target
        });
      });
    },
    onError: (error: any) => {
      console.error('❌ AgendaExecuted 이벤트 워처 오류:', error);
    }
  });

  return unwatchAgendaExecuted;
};