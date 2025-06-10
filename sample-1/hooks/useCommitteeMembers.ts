import { useState, useCallback } from 'react';
import { CommitteeMember } from '@/types/dao';
import { MESSAGES } from '@/constants/dao';
import { CONTRACTS } from '@/config/contracts';
import { createRobustPublicClient, readContractWithRetry } from '@/lib/rpc-utils';

import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { seigManagerAbi } from "@/abis/seig-mamager";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";

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

              // candidate meno
              const memo = await readContractWithRetry(
                () => publicClient.readContract({
                  address: candidateContract,
                  abi: daoCandidateAbi,
                  functionName: 'memo',
                  args: [],
                }) as Promise<string>,
                `Member ${index + 1} candidate name`
              );

              // total staked
              const totalStaked = await readContractWithRetry(
                () => publicClient.readContract({
                  address: candidateContract,
                  abi: daoCandidateAbi,
                  functionName: 'totalStaked',
                  args: [],
                }) as Promise<bigint>,
                `Member ${index + 1} total staked`
              );

              // 청구 가능한 활동비 계산
              const claimableActivityReward = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.daoCommittee.address,
                  abi: daoCommitteeAbi,
                  functionName: 'getClaimableActivityReward',
                  args: [address as `0x${string}`],
                }) as Promise<bigint>,
                `claimActivityReward`
              );

              // 마지막 커밋 블록 조회
              const lastCommitBlock = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.seigManager.address,
                  abi: seigManagerAbi,
                  functionName: 'lastCommitBlock',
                  args: [candidateContract],
                }) as Promise<bigint>,
                `lastCommitBlock`
              );

              console.log("lastCommitBlock", lastCommitBlock)

              // lastCommitBlock의 타임스탬프 가져오기
              let lastUpdateSeigniorageTime = 0;
              if (lastCommitBlock > 0) {
                try {
                  const block = await publicClient.getBlock({
                    blockNumber: lastCommitBlock
                  });
                  lastUpdateSeigniorageTime = Number(block.timestamp);
                  console.log(`Block ${lastCommitBlock} timestamp:`, lastUpdateSeigniorageTime);
                } catch (error) {
                  console.warn(`Failed to get block ${lastCommitBlock} timestamp:`, error);
                }
              }

              console.log("claimableActivityReward", address, index, claimableActivityReward)

              // Layer2Manager 에서 operatorManager 주소를 찾아서 저장하고, manager 주소도 저장하자.
              const operatorManager = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.layer2Manager.address,
                  abi: layer2ManagerAbi,
                  functionName: 'operatorOfLayer',
                  args: [candidateContract as `0x${string}`],
                }) as Promise<`0x${string}`>,
                `operatorManager`
              );
              console.log("operatorManager", operatorManager)

              // operatorManager가 null 주소가 아닐 때만 manager() 함수 호출
              let managerAddress: `0x${string}` | null = null;
              if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
                try {
                  managerAddress = await readContractWithRetry(
                    () => publicClient.readContract({
                      address: operatorManager,
                      abi: operatorManagerAbi,
                      functionName: 'manager',
                      args: [],
                    }) as Promise<`0x${string}`>,
                    `Member ${index + 1} manager address`
                  );
                  console.log("managerAddress", managerAddress);
                } catch (error) {
                  console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
                }
              }

              console.log("managerAddress", managerAddress)

            // CommitteeMember 인터페이스에 맞게 변환
            const member: CommitteeMember = {
              name: memo,
                description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
                creationAddress: address,
                candidateContract: candidateContract,
                claimedTimestamp: Number(claimedTimestamp),
                rewardPeriod: Number(rewardPeriod),
                indexMembers: Number(indexMembers),
                totalStaked: totalStaked.toString(),
                lastCommitBlock: Number(lastCommitBlock),
                lastUpdateSeigniorageTime: lastUpdateSeigniorageTime,
                claimableActivityReward: claimableActivityReward.toString(), // wei 단위로 저장
                operatorManager: operatorManager,
                manager: managerAddress
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
              totalStaked: "0",
              lastCommitBlock: 0,
              lastUpdateSeigniorageTime: 0,
              claimableActivityReward: "0",
              operatorManager: "0x0000000000000000000000000000000000000000",
              manager: null
            } satisfies CommitteeMember;

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