/**
 * Agenda 이벤트 모니터링 설정 및 관리
 */
import { createPublicClient, http } from 'viem';
import { chain } from '@/config/chain';
import { CONTRACTS } from '@/config/contracts';
import { daoAgendaManagerAbi } from '@/abis/dao-agenda-manager';
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
  // console.log("[setupAgendaEventMonitoring] Setting up agenda event monitoring", {
  //   timestamp: new Date().toISOString(),
  //   agendaManagerAddress: CONTRACTS.daoAgendaManager.address,
  //   rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT,
  //   fallbackRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  //   actualRpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'undefined',
  //   handlersReady: {
  //     handleAgendaCreated: !!handleAgendaCreated,
  //     handleAgendaVoteCasted: !!handleAgendaVoteCasted,
  //     handleAgendaExecuted: !!handleAgendaExecuted
  //   }
  // });

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

  // console.log("[setupAgendaEventMonitoring] Public client created");

  // AgendaCreated 이벤트 모니터링 설정
  const unwatchAgendaCreated = setupAgendaCreatedWatcher(publicClient, handleAgendaCreated);

  // AgendaVoteCasted 이벤트 모니터링 설정
  const unwatchAgendaVoteCasted = setupAgendaVoteCastedWatcher(publicClient, handleAgendaVoteCasted);

  // AgendaExecuted 이벤트 모니터링 설정
  const unwatchAgendaExecuted = setupAgendaExecutedWatcher(publicClient, handleAgendaExecuted);

  // console.log('🎯 모든 아젠다 이벤트 워처 설정 완료', {
  //   timestamp: new Date().toISOString(),
  //   watchers: ['AgendaCreated', 'AgendaVoteCasted', 'AgendaExecuted']
  // });

  // 정리 함수 반환
  return () => {
    // console.log('🔌 아젠다 이벤트 워처들 정리 중...', {
    //   timestamp: new Date().toISOString()
    // });

    unwatchAgendaCreated();
    unwatchAgendaVoteCasted();
    unwatchAgendaExecuted();

    // console.log('✅ 모든 아젠다 이벤트 워처 정리 완료');
  };
};

/**
 * AgendaCreated 이벤트 워처 설정
 */
const setupAgendaCreatedWatcher = (publicClient: any, handleAgendaCreated: AgendaCreatedHandler) => {
  // console.log("[setupAgendaCreatedWatcher] Setting up AgendaCreated event watcher");

  const unwatchAgendaCreated = publicClient.watchEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    event: {
      type: 'event',
      name: 'AgendaCreated',
      inputs: [
        { name: 'id', type: 'uint256', indexed: true },
        { name: 'from', type: 'address', indexed: true },
        { name: 'noticePeriod', type: 'uint256', indexed: false },
        { name: 'votingPeriod', type: 'uint256', indexed: false },
      ],
    },
    onLogs: (logs: any[]) => {
      // console.log("🎉 AgendaCreated 이벤트 감지:", logs);
      logs.forEach((log) => {
        const { id, from, noticePeriod, votingPeriod } = log.args;
        handleAgendaCreated({
          id,
          from,
          noticePeriod,
          votingPeriod
        });
      });
    },
  });

  // console.log('✅ AgendaCreated 이벤트 워처 설정 완료');
  return unwatchAgendaCreated;
};

/**
 * AgendaVoteCasted 이벤트 워처 설정
 */
const setupAgendaVoteCastedWatcher = (publicClient: any, handleAgendaVoteCasted: AgendaVoteCastedHandler) => {
  // console.log("[setupAgendaVoteCastedWatcher] Setting up AgendaVoteCasted event watcher");

  const unwatchAgendaVoteCasted = publicClient.watchEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    event: {
      type: 'event',
      name: 'AgendaVoteCasted',
      inputs: [
        { name: 'id', type: 'uint256', indexed: true },
        { name: 'from', type: 'address', indexed: true },
        { name: 'isSupport', type: 'uint8', indexed: false },
        { name: 'stake', type: 'uint256', indexed: false },
      ],
    },
    onLogs: (logs: any[]) => {
      // console.log("🗳️ AgendaVoteCasted 이벤트 감지:", logs);
      logs.forEach((log) => {
        const { id, from, isSupport, stake } = log.args;
        handleAgendaVoteCasted({
          id,
          from,
          isSupport,
          stake
        });
      });
    },
  });

  // console.log('✅ AgendaVoteCasted 이벤트 워처 설정 완료');
  return unwatchAgendaVoteCasted;
};

/**
 * AgendaExecuted 이벤트 워처 설정
 */
const setupAgendaExecutedWatcher = (publicClient: any, handleAgendaExecuted: AgendaExecutedHandler) => {
  // console.log("[setupAgendaExecutedWatcher] Setting up AgendaExecuted event watcher");

  const unwatchAgendaExecuted = publicClient.watchEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    event: {
      type: 'event',
      name: 'AgendaExecuted',
      inputs: [
        { name: 'id', type: 'uint256', indexed: true },
        { name: 'from', type: 'address', indexed: true },
      ],
    },
    onLogs: (logs: any[]) => {
      // console.log("⚡ AgendaExecuted 이벤트 감지:", logs);
      logs.forEach((log) => {
        const { id, from } = log.args;
        handleAgendaExecuted({
          id,
          from
        });
      });
    },
  });

  // console.log('✅ AgendaExecuted 이벤트 워처 설정 완료');
  return unwatchAgendaExecuted;
};