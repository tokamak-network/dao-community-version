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

  const unwatchAgendaCreated = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: DAO_ABI,
    eventName: 'AgendaCreated',
    onLogs: (logs: any[]) => {

      logs.forEach((log) => {
        const {  from, id, targets, noticePeriodSeconds, votingPeriodSeconds, atomicExecute } = log.args;
        handleAgendaCreated({
          id,
          from,
          noticePeriodSeconds,
          votingPeriodSeconds,
          atomicExecute
        });
      });
    },
  });

  return unwatchAgendaCreated;
};

/**
 * AgendaVoteCasted 이벤트 워처 설정
 */
const setupAgendaVoteCastedWatcher = (publicClient: any, handleAgendaVoteCasted: AgendaVoteCastedHandler) => {

  const unwatchAgendaVoteCasted = publicClient.watchContractEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    abi: daoCommitteeAbi,
    eventName: 'AgendaVoteCasted',
    onLogs: (logs: any[]) => {

      logs.forEach((log) => {
        const { from, id, voting, comment } = log.args;
        handleAgendaVoteCasted({
          from, id, voting, comment
        });
      });
    },
  });

  return unwatchAgendaVoteCasted;
};

/**
 * AgendaExecuted 이벤트 워처 설정
 */
const setupAgendaExecutedWatcher = (publicClient: any, handleAgendaExecuted: AgendaExecutedHandler) => {

  const unwatchAgendaExecuted = publicClient.watchContractEvent({
    address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
    abi: daoCommitteeAbi,
    eventName: 'AgendaExecuted',
    onLogs: (logs: any[]) => {

      logs.forEach((log) => {
        const { id, target } = log.args;
        handleAgendaExecuted({
          id,
          target
        });
      });
    },
  });

  return unwatchAgendaExecuted;
};