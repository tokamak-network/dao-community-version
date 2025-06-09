import { useState, useCallback } from 'react';
import { CommitteeMember } from '@/types/dao';
import { MESSAGES } from '@/constants/dao';
import { CONTRACTS } from '@/config/contracts';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import { createRobustPublicClient, readContractWithRetry } from '@/lib/rpc-utils';

interface UseCommitteeMembersProps {
  isConnected: boolean;
  setStatusMessage: (message: string) => void;
}

export function useCommitteeMembers({ isConnected, setStatusMessage }: UseCommitteeMembersProps) {
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [hasLoadedMembersOnce, setHasLoadedMembersOnce] = useState(false);

  // Committee Members 로드 함수 - 실제 컨트랙트에서 데이터 가져오기
  const loadCommitteeMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    setStatusMessage(MESSAGES.LOADING.COMMITTEE_MEMBERS);

    try {
      // 견고한 Public Client 생성 (Fallback & 재시도 지원)
      const publicClient = await createRobustPublicClient();

      // 1. 최대 멤버 수 조회 (또는 실제 멤버 수를 파악하는 방법)
      const maxMember = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'maxMember',
        }) as Promise<bigint>,
        'Max members count'
      );

      console.log('👥 Max members:', maxMember);

      // 2. members 배열을 인덱스로 순차 조회하여 실제 멤버 찾기
      const memberAddresses: string[] = [];

      for (let i = 0; i < Number(maxMember); i++) {
        try {
          const memberAddress = await readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoCommittee.address,
              abi: daoCommitteeAbi,
              functionName: 'members',
              args: [BigInt(i)],
            }) as Promise<string>,
            `Member ${i} address`
          );

          // 빈 주소(0x000...)가 아닌 경우만 추가
          if (memberAddress && memberAddress !== '0x0000000000000000000000000000000000000000') {
            memberAddresses.push(memberAddress);
          }
        } catch (error) {
          // 인덱스 범위를 벗어나면 루프 종료
          console.log(`No more members at index ${i}`);
          break;
        }
      }

      console.log('📋 Actual committee member addresses:', memberAddresses);

      // 3. 각 멤버의 상세 정보 가져오기
      const memberDetails = await Promise.all(
        memberAddresses.map(async (address, index) => {
          try {
            // CandidateInfo 구조체 조회 (5개 필드)
            const candidateInfo = await readContractWithRetry(
              () => publicClient.readContract({
                address: CONTRACTS.daoCommittee.address,
                abi: daoCommitteeAbi,
                functionName: 'candidateInfos',
                args: [address as `0x${string}`],
              }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
              `Member ${address} candidate info`
            );

            const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

            console.log(`✅ CandidateInfo for ${address}:`, {
              candidateContract,
              indexMembers: Number(indexMembers),
              memberJoinedTime: new Date(Number(memberJoinedTime) * 1000)
            });

            // CommitteeMember 인터페이스에 맞게 변환
            const member: CommitteeMember = {
              name: `Committee Member ${index + 1}`,
              description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
              creationAddress: address,
              candidateContract: candidateContract, // 실제 후보자 컨트랙트 주소
              claimedTimestamp: Number(claimedTimestamp),
              rewardPeriod: Number(rewardPeriod),
              indexMembers: Number(indexMembers),
            };

            return member;
          } catch (error) {
            console.warn(`Failed to fetch candidate info for member ${address}:`, error);
            // 기본값으로 fallback
            return {
              name: `Committee Member ${index + 1}`,
              description: "Committee member details unavailable",
              creationAddress: address,
              candidateContract: "",
              claimedTimestamp: 0,
              rewardPeriod: 0,
              indexMembers: 0,
            } as CommitteeMember;
          }
        })
      );

      setCommitteeMembers(memberDetails);
      setHasLoadedMembersOnce(true);
      setStatusMessage(`Loaded ${memberDetails.length} committee members from blockchain`);

    } catch (err) {
      console.error("Failed to load committee members from contract:", err);
      setMembersError("Failed to load committee members from blockchain");
      setStatusMessage("Error loading committee members from contract");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [setStatusMessage]);

  // Committee Members 새로고침 - 지갑 연결 여부와 관계없이 가능
  const refreshCommitteeMembers = useCallback(async () => {
    setHasLoadedMembersOnce(false);
    await loadCommitteeMembers();
  }, [loadCommitteeMembers]);

  // Committee Member인지 확인 - 실제 컨트랙트에서 확인
  const isMember = useCallback(async (address: string): Promise<boolean> => {
    if (!address) return false;

    try {
      const publicClient = await createRobustPublicClient();

      const result = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'isMember',
          args: [address as `0x${string}`],
        }) as Promise<boolean>,
        `Committee member check for ${address}`
      );

      return result;
    } catch (error) {
      console.error("Failed to check committee membership:", error);
      return false;
    }
  }, []);

  // 상태 초기화 함수 (필요한 경우)
  const resetMembersState = useCallback(() => {
    setCommitteeMembers([]);
    setMembersError(null);
    setHasLoadedMembersOnce(false);
  }, []);

  return {
    committeeMembers,
    isLoadingMembers,
    membersError,
    hasLoadedMembersOnce,
    loadCommitteeMembers,
    refreshCommitteeMembers,
    isMember,
    resetMembersState,
  };
}