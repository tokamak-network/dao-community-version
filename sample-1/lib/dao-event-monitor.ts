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
  console.log("[setupEventMonitoring] Setting up event monitoring", {
    timestamp: new Date().toISOString(),
    chainId: chainId,
    daoCommitteeAddress: CONTRACTS.daoCommittee.address,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT,
    fallbackRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
    actualRpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'undefined',
    handlersReady: {
      handleMemberChanged: !!handleMemberChanged,
      handleActivityRewardClaimed: !!handleActivityRewardClaimed,
      handleLayer2Registered: !!handleLayer2Registered
    }
  });

  const publicClient = createPublicClient({
    chain: {
      ...chain,
      id: chain.id,
    },
    transport: http(process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
  });

  console.log("[setupEventMonitoring] Public client created", {
    clientChainId: publicClient.chain?.id,
    transport: "http"
  });

  // ChangedMember 이벤트 모니터링 설정
  const unwatchChangedMember = setupChangedMemberWatcher(publicClient, handleMemberChanged);

  // ClaimedActivityReward 이벤트 모니터링 설정
  const unwatchClaimedActivityReward = setupClaimedActivityRewardWatcher(publicClient, handleActivityRewardClaimed);

  // Layer2Registered 이벤트 모니터링 설정
  const unwatchLayer2Registered = setupLayer2RegisteredWatcher(publicClient, handleLayer2Registered);

  console.log('🎯 모든 이벤트 워처 설정 완료', {
    timestamp: new Date().toISOString(),
    watchers: ['ChangedMember', 'ClaimedActivityReward', 'Layer2Registered']
  });

  // 정리 함수 반환
  return () => {
    console.log('🔌 이벤트 워처들 정리 중...', {
      timestamp: new Date().toISOString()
    });

    unwatchChangedMember();
    unwatchClaimedActivityReward();
    unwatchLayer2Registered();

    console.log('✅ 모든 이벤트 워처 정리 완료');
  };
};

/**
 * ChangedMember 이벤트 워처 설정
 */
const setupChangedMemberWatcher = (publicClient: any, handleMemberChanged: MemberChangedHandler) => {
  console.log("[setupChangedMemberWatcher] Setting up ChangedMember event watcher", {
    contractAddress: CONTRACTS.daoCommittee.address,
    eventName: 'ChangedMember'
  });

  const unwatchChangedMember = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ChangedMember',
    onLogs(logs: any[]) {
      console.log('📡 ChangedMember onLogs 호출됨', {
        timestamp: new Date().toISOString(),
        logsCount: logs.length,
        logs: logs.map(log => ({
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          args: log.args
        }))
      });

      logs.forEach((log, index) => {
        const { slotIndex, prevMember, newMember } = log.args;
        console.log(`🔄 ChangedMember 이벤트 감지 [${index + 1}/${logs.length}]:`, {
          slotIndex: slotIndex?.toString(),
          prevMember,
          newMember,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.logIndex
        });

        if (slotIndex !== undefined && prevMember && newMember) {
          console.log('✅ ChangedMember 핸들러 호출', {
            slotIndex: slotIndex.toString(),
            handlerExists: !!handleMemberChanged
          });

          handleMemberChanged({
            slotIndex,
            prevMember,
            newMember
          });
        } else {
          console.warn('⚠️ ChangedMember 이벤트 데이터 불완전:', {
            hasSlotIndex: slotIndex !== undefined,
            hasPrevMember: !!prevMember,
            hasNewMember: !!newMember
          });
        }
      });
    },
    onError(error: any) {
      console.error('❌ ChangedMember 이벤트 워처 오류:', error);
    }
  });

  console.log('✅ ChangedMember 이벤트 워처 설정 완료');
  return unwatchChangedMember;
};

/**
 * ClaimedActivityReward 이벤트 워처 설정
 */
const setupClaimedActivityRewardWatcher = (publicClient: any, handleActivityRewardClaimed: ActivityRewardClaimedHandler) => {
  console.log("[setupClaimedActivityRewardWatcher] Setting up ClaimedActivityReward event watcher");

  const unwatchClaimedActivityReward = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ClaimedActivityReward',
    onLogs(logs: any[]) {
      console.log('🎯 [EVENT DETECTED] ClaimedActivityReward onLogs 호출됨', {
        timestamp: new Date().toISOString(),
        logsCount: logs.length,
        contractAddress: CONTRACTS.daoCommittee.address,
        eventName: 'ClaimedActivityReward'
      });

      logs.forEach((log, index) => {
        const { candidate, receiver, amount } = log.args;
        console.log(`💰 [EVENT ${index + 1}/${logs.length}] ClaimedActivityReward 이벤트 감지:`, {
          candidate,
          receiver,
          amount: amount?.toString(),
          amountETH: amount ? (Number(amount) / 1e18).toFixed(6) : 'N/A',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber?.toString(),
          logIndex: log.logIndex,
          timestamp: new Date().toISOString()
        });

        if (candidate && receiver && amount !== undefined) {
          console.log('✅ [HANDLER CALL] ClaimedActivityReward 핸들러 호출 시작');
          handleActivityRewardClaimed({
            candidate,
            receiver,
            amount
          });
          console.log('✅ [HANDLER DONE] ClaimedActivityReward 핸들러 호출 완료');
        } else {
          console.warn('⚠️ [EVENT ERROR] ClaimedActivityReward 이벤트 데이터 불완전:', {
            hasCandidate: !!candidate,
            hasReceiver: !!receiver,
            hasAmount: amount !== undefined
          });
        }
      });
    },
    onError(error: any) {
      console.error('❌ [EVENT ERROR] ClaimedActivityReward 이벤트 워처 오류:', {
        error: error.message || error,
        timestamp: new Date().toISOString(),
        contractAddress: CONTRACTS.daoCommittee.address
      });
    }
  });

  console.log('✅ ClaimedActivityReward 이벤트 워처 설정 완료');
  return unwatchClaimedActivityReward;
};

/**
 * Layer2Registered 이벤트 워처 설정
 */
const setupLayer2RegisteredWatcher = (publicClient: any, handleLayer2Registered: Layer2RegisteredHandler) => {
  console.log("[setupLayer2RegisteredWatcher] Setting up Layer2Registered event watcher");

  const unwatchLayer2Registered = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'Layer2Registered',
    onLogs(logs: any[]) {
      console.log('📡 Layer2Registered onLogs 호출됨', {
        timestamp: new Date().toISOString(),
        logsCount: logs.length
      });

      logs.forEach((log, index) => {
        const { candidate, candidateContract, memo } = log.args;
        console.log(`🏗️ Layer2Registered 이벤트 감지 [${index + 1}/${logs.length}]:`, {
          candidate,
          candidateContract,
          memo,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber
        });

        if (candidate && candidateContract && memo) {
          console.log('✅ Layer2Registered 핸들러 호출');
          handleLayer2Registered({
            candidate,
            candidateContract,
            memo
          });
        } else {
          console.warn('⚠️ Layer2Registered 이벤트 데이터 불완전');
        }
      });
    },
    onError(error: any) {
      console.error('❌ Layer2Registered 이벤트 워처 오류:', error);
    }
  });

  console.log('✅ Layer2Registered 이벤트 워처 설정 완료');
  return unwatchLayer2Registered;
};