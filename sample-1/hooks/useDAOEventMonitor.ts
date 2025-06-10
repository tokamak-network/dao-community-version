import { useEffect, useCallback } from 'react';
import { useWatchContractEvent, useChainId } from 'wagmi';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import { CONTRACTS } from '@/config/contracts';

interface DAOEventMonitorProps {
  onMemberChanged?: (data: { slotIndex: bigint; prevMember: string; newMember: string }) => void;
  onActivityRewardClaimed?: (data: { candidate: string; receiver: string; amount: bigint }) => void;
  onLayer2Registered?: (data: { candidate: string; candidateContract: string; memo: string }) => void;
  onCandidateContractCreated?: (data: { candidate: string; candidateContract: string; memo: string }) => void;
}

export function useDAOEventMonitor({
  onMemberChanged,
  onActivityRewardClaimed,
  onLayer2Registered,
  onCandidateContractCreated,
}: DAOEventMonitorProps) {
  const chainId = useChainId();

  // ChangedMember 이벤트 모니터링 (챌린지 성공)
  useWatchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ChangedMember',
    onLogs(logs) {
      logs.forEach((log) => {
        const { slotIndex, prevMember, newMember } = log.args;
        console.log('🔄 ChangedMember 이벤트 감지:', {
          slotIndex: slotIndex?.toString(),
          prevMember,
          newMember,
          txHash: log.transactionHash
        });

        if (onMemberChanged && slotIndex !== undefined && prevMember && newMember) {
          onMemberChanged({
            slotIndex,
            prevMember,
            newMember
          });
        }
      });
    },
  });

  // ClaimedActivityReward 이벤트 모니터링
  useWatchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ClaimedActivityReward',
    onLogs(logs) {
      logs.forEach((log) => {
        const { candidate, receiver, amount } = log.args;
        console.log('💰 ClaimedActivityReward 이벤트 감지:', {
          candidate,
          receiver,
          amount: amount?.toString(),
          txHash: log.transactionHash
        });

        if (onActivityRewardClaimed && candidate && receiver && amount !== undefined) {
          onActivityRewardClaimed({
            candidate,
            receiver,
            amount
          });
        }
      });
    },
  });

  // Layer2Registered 이벤트 모니터링
  useWatchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'Layer2Registered',
    onLogs(logs) {
      logs.forEach((log) => {
        const { candidate, candidateContract, memo } = log.args;
        console.log('🏗️ Layer2Registered 이벤트 감지:', {
          candidate,
          candidateContract,
          memo,
          txHash: log.transactionHash
        });

        if (onLayer2Registered && candidate && candidateContract && memo) {
          onLayer2Registered({
            candidate,
            candidateContract,
            memo
          });
        }
      });
    },
  });

  return {
    chainId,
    isMonitoring: true,
  };
}
