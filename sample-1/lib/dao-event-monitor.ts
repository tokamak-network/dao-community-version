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
  // console.log("[setupEventMonitoring] Setting up DAO event monitoring", {
  //   timestamp: new Date().toISOString(),
  //   daoCommitteeAddress: CONTRACTS.daoCommittee.address,
  //   rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT,
  //   fallbackRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
  //   actualRpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org',
  //   handlersReady: {
  //     handleMemberChanged: !!handleMemberChanged,
  //     handleActivityRewardClaimed: !!handleActivityRewardClaimed,
  //     handleLayer2Registered: !!handleLayer2Registered
  //   }
  // });

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
    // console.log('🔌 DAO 이벤트 워처들 정리 중...', {
    //   timestamp: new Date().toISOString()
    // });
    unwatchChangedMember();
    unwatchClaimedActivityReward();
    unwatchLayer2Registered();
  };
};

/**
 * ChangedMember 이벤트 워처 설정
 */
const setupChangedMemberWatcher = (publicClient: any, handleMemberChanged: MemberChangedHandler) => {
  // console.log('🎯 Setting up ChangedMember watcher', {
  //   address: CONTRACTS.daoCommittee.address,
  //   eventName: 'ChangedMember'
  // });

  const unwatchChangedMember = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ChangedMember',
    onLogs(logs: any[]) {
      // console.log('📥 ChangedMember events received:', logs.length);
      logs.forEach((log, index) => {
        const { slotIndex, prevMember, newMember } = log.args;
        if (slotIndex !== undefined && prevMember && newMember) {
          // console.log('👥 Member changed:', {
          //   slotIndex: slotIndex?.toString(),
          //   prevMember,
          //   newMember,
          //   isRetire: newMember === '0x0000000000000000000000000000000000000000',
          //   isJoin: prevMember === '0x0000000000000000000000000000000000000000'
          // });
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
  // console.log('🎯 Setting up ClaimedActivityReward watcher', {
  //   address: CONTRACTS.daoCommittee.address,
  //   eventName: 'ClaimedActivityReward'
  // });

  const unwatchClaimedActivityReward = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ClaimedActivityReward',
    onLogs(logs: any[]) {
      // console.log('📥 ClaimedActivityReward events received:', logs.length);
      logs.forEach((log, index) => {
        const { candidate, receiver, amount } = log.args;
        if (candidate && receiver && amount !== undefined) {
          console.log('💰 Activity reward claimed:', {
            candidate,
            receiver,
            amount: amount?.toString()
          });
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
  // console.log('🎯 Setting up Layer2Registered watcher', {
  //   address: CONTRACTS.daoCommittee.address,
  //   eventName: 'Layer2Registered'
  // });

  const unwatchLayer2Registered = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'Layer2Registered',
    onLogs(logs: any[]) {
      // console.log('📥 Layer2Registered events received:', logs.length);
      logs.forEach((log, index) => {
        const { candidate, candidateContract, memo } = log.args;
        if (candidate && candidateContract && memo) {
          // console.log('🆕 Layer2 registered:', {
          //   candidate,
          //   candidateContract,
          //   memo
          // });
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