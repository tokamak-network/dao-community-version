/**
 * DAO 이벤트 모니터링 설정 및 관리
 */
import { createPublicClient, http } from 'viem';
import { chain } from '@/config/chain';
import { CONTRACTS } from '@/config/contracts';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import type {
  MemberChangedHandler,
  ActivityRewardClaimedHandler,
  Layer2RegisteredHandler
} from './dao-event-handlers';

/**
 * 이벤트 모니터링 설정 함수
 */
export const setupEventMonitoring = (
  chainId: number,
  handleMemberChanged: MemberChangedHandler,
  handleActivityRewardClaimed: ActivityRewardClaimedHandler,
  handleLayer2Registered: Layer2RegisteredHandler
) => {
  // Define publicClient before use
  const publicClient = createPublicClient({
    chain: {
      ...chain,
      id: chain.id,
    },
    transport: http(process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
  });

  // ChangedMember 이벤트 모니터링 설정
  const unwatchChangedMember = setupChangedMemberWatcher(publicClient, handleMemberChanged);

  // ClaimedActivityReward 이벤트 모니터링 설정
  const unwatchClaimedActivityReward = setupClaimedActivityRewardWatcher(publicClient, handleActivityRewardClaimed);

  // Layer2Registered 이벤트 모니터링 설정
  const unwatchLayer2Registered = setupLayer2RegisteredWatcher(publicClient, handleLayer2Registered);

  // 정리 함수 반환
  return () => {
    unwatchChangedMember();
    unwatchClaimedActivityReward();
    unwatchLayer2Registered();
  };
};

/**
 * ChangedMember 이벤트 워처 설정
 */
const setupChangedMemberWatcher = (publicClient: any, handleMemberChanged: MemberChangedHandler) => {
  const unwatchChangedMember = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ChangedMember',
    onLogs(logs: any[]) {
      logs.forEach((log, index) => {
        const { slotIndex, prevMember, newMember } = log.args;
        if (slotIndex !== undefined && prevMember && newMember) {
          handleMemberChanged({
            slotIndex,
            prevMember,
            newMember
          });
        }
      });
    },
    onError(error: any) {
      console.error('❌ ChangedMember 이벤트 워처 오류:', error);
    }
  });

  return unwatchChangedMember;
};

/**
 * ClaimedActivityReward 이벤트 워처 설정
 */
const setupClaimedActivityRewardWatcher = (publicClient: any, handleActivityRewardClaimed: ActivityRewardClaimedHandler) => {
  const unwatchClaimedActivityReward = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ClaimedActivityReward',
    onLogs(logs: any[]) {
      logs.forEach((log, index) => {
        const { candidate, receiver, amount } = log.args;
        if (candidate && receiver && amount !== undefined) {
          handleActivityRewardClaimed({
            candidate,
            receiver,
            amount
          });
        }
      });
    },
    onError(error: any) {
      console.error('❌ [EVENT ERROR] ClaimedActivityReward 이벤트 워처 오류:', {
        error: error.message || error,
        contractAddress: CONTRACTS.daoCommittee.address
      });
    }
  });

  return unwatchClaimedActivityReward;
};

/**
 * Layer2Registered 이벤트 워처 설정
 */
const setupLayer2RegisteredWatcher = (publicClient: any, handleLayer2Registered: Layer2RegisteredHandler) => {
  const unwatchLayer2Registered = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'Layer2Registered',
    onLogs(logs: any[]) {
      logs.forEach((log, index) => {
        const { candidate, candidateContract, memo } = log.args;
        if (candidate && candidateContract && memo) {
          handleLayer2Registered({
            candidate,
            candidateContract,
            memo
          });
        }
      });
    },
    onError(error: any) {
      console.error('❌ Layer2Registered 이벤트 워처 오류:', error);
    }
  });

  return unwatchLayer2Registered;
};