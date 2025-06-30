import { CommitteeMember } from "@/types/dao";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { seigManagerAbi } from "@/abis/seig-mamager";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";
import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";

/**
 * Committee Members 관련 핸들러 함수들
 */

/**
 * 단일 멤버의 상세 정보를 가져오는 공통 함수
 */
export const fetchMemberDetails = async (
  publicClient: any,
  memberAddress: string,
  slotIndex?: number
): Promise<CommitteeMember> => {
  try {
    // 1. candidateInfo 조회
    const candidateInfo = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address,
        abi: daoCommitteeAbi,
        functionName: 'candidateInfos',
        args: [memberAddress as `0x${string}`],
      }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
      `Member ${memberAddress} candidate info`
    );

    const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

    // 2. 순차적으로 상세 정보 조회 (RPC rate limit 고려)
    // candidate memo
    const memo = await readContractWithRetry(
      () => publicClient.readContract({
        address: candidateContract,
        abi: daoCandidateAbi,
        functionName: 'memo',
        args: [],
      }) as Promise<string>,
      `Member candidate name`
    );

    // total staked
    const totalStaked = await readContractWithRetry(
      () => publicClient.readContract({
        address: candidateContract,
        abi: daoCandidateAbi,
        functionName: 'totalStaked',
        args: [],
      }) as Promise<bigint>,
      `Member total staked`
    );

    // 청구 가능한 활동비 (최신 블록에서 조회하여 캐시 방지)
    const claimableActivityReward = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address,
        abi: daoCommitteeAbi,
        functionName: 'getClaimableActivityReward',
        args: [memberAddress as `0x${string}`],
        blockTag: 'latest'  // 👈 최신 블록에서 강제 조회
      }) as Promise<bigint>,
      `Member claimActivityReward`
    );

    // 마지막 커밋 블록
    const lastCommitBlock = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.seigManager.address,
        abi: seigManagerAbi,
        functionName: 'lastCommitBlock',
        args: [candidateContract],
      }) as Promise<bigint>,
      `Member lastCommitBlock`
    );

    // operator manager
    const operatorManager = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.layer2Manager.address,
        abi: layer2ManagerAbi,
        functionName: 'operatorOfLayer',
        args: [candidateContract as `0x${string}`],
      }) as Promise<`0x${string}`>,
      `Member operatorManager`
    );

    // 3. lastCommitBlock의 타임스탬프 가져오기
    let lastUpdateSeigniorageTime = 0;
    if (lastCommitBlock > 0) {
      try {
        const block = await publicClient.getBlock({
          blockNumber: lastCommitBlock
        });
        lastUpdateSeigniorageTime = Number(block.timestamp);
      } catch (error) {
        console.warn(`Failed to get block ${lastCommitBlock} timestamp:`, error);
      }
    }

    // 4. manager 주소 조회
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
          `Member manager address`
        );
      } catch (error) {
        console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
      }
    }

    // 5. CommitteeMember 객체 생성
    return {
      name: memo,
      description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
      creationAddress: memberAddress,
      candidateContract: candidateContract,
      claimedTimestamp: Number(claimedTimestamp),
      rewardPeriod: Number(rewardPeriod),
      indexMembers: Number(indexMembers),
      totalStaked: totalStaked.toString(),
      lastCommitBlock: Number(lastCommitBlock),
      lastUpdateSeigniorageTime: lastUpdateSeigniorageTime,
      claimableActivityReward: claimableActivityReward.toString(),
      operatorManager: operatorManager,
      manager: managerAddress
    };

  } catch (error) {
    console.error(`❌ 멤버 상세 정보 조회 실패 (${memberAddress}):`, error);
    // 에러 시 기본값 반환
    return {
      name: `Committee Member`,
      description: "Committee member details unavailable",
      creationAddress: memberAddress,
      candidateContract: "",
      claimedTimestamp: 0,
      rewardPeriod: 0,
      indexMembers: slotIndex || 0,
      totalStaked: "0",
      lastCommitBlock: 0,
      lastUpdateSeigniorageTime: 0,
      claimableActivityReward: "0",
      operatorManager: "0x0000000000000000000000000000000000000000",
      manager: null
    };
  }
};

/**
 * maxMember 값을 조회하는 함수
 */
export const loadMaxMembers = async (): Promise<number> => {
  try {
    console.log("--- read maxMember");
    const publicClient = await createRobustPublicClient();
    let _maxMember: bigint = BigInt(0);
    _maxMember = await publicClient.readContract({
      address: CONTRACTS.daoCommittee.address as `0x${string}`,
      abi: daoCommitteeAbi,
      functionName: 'maxMember',
    });
    console.log("-- ", _maxMember);
    return Number(_maxMember);
  } catch (err) {
    console.error("Failed to load maxMember:", err);
    throw err;
  }
};

/**
 * Committee Members를 로드하는 함수
 */
export const loadCommitteeMembers = async (
  maxMember: number,
  existingMembers?: CommitteeMember[],
  lastFetchTimestamp?: number,
  onStatusUpdate?: (message: string) => void
): Promise<CommitteeMember[]> => {
  console.log("🔄 loadCommitteeMembers 시작", {
    timestamp: new Date().toLocaleTimeString(),
    maxMember,
    currentCommitteeCount: existingMembers?.length || 0,
  });

  const { BATCH_SIZE, BATCH_DELAY_MS, CACHE_DURATION_MS } = CONTRACT_READ_SETTINGS;

    try {
    // 이벤트 기반 업데이트: 기존 데이터가 있으면 그대로 사용
    // 업데이트는 오직 이벤트를 통해서만 발생 (캐시 시간 체크 없음)
    if (existingMembers && existingMembers.length > 0) {
      console.log("⏭️ 기존 데이터 존재, 이벤트 기반 업데이트만 사용", {
        committeeCount: existingMembers.length,
        updateMethod: "event-driven only"
      });
      return existingMembers;
    }

    console.log("✅ 새 데이터 로드 시작");
    if (maxMember > 0) {
      const publicClient = await createRobustPublicClient();

      // 모든 슬롯(0~maxMember-1) 순회하며 멤버 정보 또는 빈 슬롯 처리
      const memberDetails: CommitteeMember[] = [];

      for (let slotIndex = 0; slotIndex < maxMember; slotIndex++) {
        try {
          // 진행 상황 메시지 업데이트
                      onStatusUpdate?.(`Checking slot ${slotIndex + 1}/${maxMember}...`);
          console.log(`Processing slot ${slotIndex + 1}/${maxMember}...`);

          const memberAddress = await readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoCommittee.address as `0x${string}`,
              abi: daoCommitteeAbi,
              functionName: 'members',
              args: [BigInt(slotIndex)],
            }) as Promise<string>,
            `Member slot ${slotIndex} address`
          );

          if (!memberAddress || memberAddress === '0x0000000000000000000000000000000000000000') {
            console.log(`슬롯 ${slotIndex}: 빈 슬롯`);
            onStatusUpdate?.(`Slot ${slotIndex + 1}/${maxMember} - empty slot`);

            // 빈 슬롯 객체 생성하여 추가
            const emptySlot: CommitteeMember = {
              name: `Empty Slot ${slotIndex}`,
              description: "This committee slot is currently empty",
              creationAddress: "0x0000000000000000000000000000000000000000",
              candidateContract: "0x0000000000000000000000000000000000000000",
              claimedTimestamp: 0,
              rewardPeriod: 0,
              indexMembers: slotIndex,
              totalStaked: "0",
              lastCommitBlock: 0,
              lastUpdateSeigniorageTime: 0,
              claimableActivityReward: "0",
              operatorManager: "0x0000000000000000000000000000000000000000",
              manager: null
            };

            memberDetails.push(emptySlot);
            continue;
          }

          console.log(`슬롯 ${slotIndex}: 멤버 발견 - ${memberAddress}`);
          onStatusUpdate?.(`Slot ${slotIndex + 1}/${maxMember} - Loading member information...`);

          // 공통 함수를 사용하여 멤버 상세 정보 조회
          const memberDetail = await fetchMemberDetails(publicClient, memberAddress, slotIndex);
          memberDetails.push(memberDetail);

          console.log(`✅ 슬롯 ${slotIndex} 로드 완료: ${memberDetail.name}`);
          onStatusUpdate?.(`Slot ${slotIndex + 1}/${maxMember} - ${memberDetail.name} Load complete`);

          // Batch 처리: 일정 간격으로 딜레이 추가 (RPC rate limit 고려)
          if ((slotIndex + 1) % BATCH_SIZE === 0 && slotIndex < maxMember - 1) {
            console.log(`⏸️ Batch ${Math.floor(slotIndex / BATCH_SIZE) + 1} 완료, ${BATCH_DELAY_MS}ms 대기...`);
            onStatusUpdate?.(`Batch ${Math.floor(slotIndex / BATCH_SIZE) + 1} completed, waiting for a moment...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
          }

        } catch (error) {
          console.error(`❌ 슬롯 ${slotIndex} 처리 실패:`, error);
          onStatusUpdate?.(`Slot ${slotIndex + 1}/${maxMember} - Load failed (continue)`);
          continue; // 개별 슬롯 실패 시 계속 진행
        }
      }

      console.log("🎯 Committee Members 로드 완료:", memberDetails.length, "명");
      return memberDetails;
    }

    return [];
  } catch (err) {
    console.error("Failed to load committee members:", err);
    throw err;
  }
};

/**
 * 특정 슬롯의 멤버 정보를 새로고침하는 함수
 */
export const refreshSpecificMember = async (
  slotIndex: number
): Promise<CommitteeMember | null> => {
  console.log(`🔄 특정 멤버 업데이트 시작 - 슬롯 ${slotIndex}`, {
    timestamp: new Date().toLocaleTimeString(),
  });

  try {
    const publicClient = await createRobustPublicClient();

    // 해당 슬롯의 멤버 주소 조회
    const memberAddress = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address as `0x${string}`,
        abi: daoCommitteeAbi,
        functionName: 'members',
        args: [BigInt(slotIndex)],
      }) as Promise<string>,
      `Member slot ${slotIndex} address`
    );

    if (!memberAddress || memberAddress === '0x0000000000000000000000000000000000000000') {
      // 멤버가 제거된 경우
      console.log(`✅ 슬롯 ${slotIndex} 멤버 제거됨 - 빈 슬롯으로 설정`);
      return null;
    }

    // 공통 함수를 사용하여 멤버 상세 정보 조회
    const updatedMember = await fetchMemberDetails(publicClient, memberAddress, slotIndex);

    console.log(`✅ 슬롯 ${slotIndex} 멤버 정보 업데이트 완료: ${updatedMember.name}`, {
      name: updatedMember.name,
      slotIndex: updatedMember.indexMembers,
      claimableActivityReward: updatedMember.claimableActivityReward,
      claimableActivityRewardTON: updatedMember.claimableActivityReward ?
        `${(Number(updatedMember.claimableActivityReward) / 1e18).toFixed(4)} TON` : '0 TON',
      memberAddress,
      candidateContract: updatedMember.candidateContract
    });
    return updatedMember;

  } catch (error) {
    console.error(`❌ 슬롯 ${slotIndex} 멤버 업데이트 실패:`, error);
    throw error;
  }
};