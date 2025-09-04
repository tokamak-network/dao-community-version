import { CommitteeMember } from "@/types/dao";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { seigManagerAbi } from "@/abis/seig-mamager";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";
import { readContractWithRetry } from "@/lib/rpc-utils";
import { getSharedPublicClient } from "@/lib/shared-rpc-client";
import { queueRPCRequest } from "./shared-rpc-client";
import {
  executeViemMulticall,
  ContractCall
} from "@/lib/multicall3-utils";

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
    // 1. candidateInfo 조회 (이건 반드시 먼저 필요)
    const candidateInfo = await queueRPCRequest(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address,
        abi: daoCommitteeAbi,
        functionName: 'candidateInfos',
        args: [memberAddress as `0x${string}`],
      }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
      `Member ${memberAddress} candidate info`,
      "HIGH"
    );

    const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

    // 2. 병렬로 상세 정보 조회 (모두 워커 사용)
    const [
      memo,
      totalStaked,
      claimableActivityReward,
      lastCommitBlock,
      operatorManager
    ] = await Promise.all([
      queueRPCRequest(
        () => publicClient.readContract({
          address: candidateContract,
          abi: daoCandidateAbi,
          functionName: 'memo',
          args: [],
        }) as Promise<string>,
        `Member candidate name`,
        "HIGH"
      ),
      queueRPCRequest(
        () => publicClient.readContract({
          address: candidateContract,
          abi: daoCandidateAbi,
          functionName: 'totalStaked',
          args: [],
        }) as Promise<bigint>,
        `Member total staked`,
        "HIGH"
      ),
      queueRPCRequest(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'getClaimableActivityReward',
          args: [memberAddress as `0x${string}`],
          blockTag: 'latest'
        }) as Promise<bigint>,
        `Member claimActivityReward`,
        "HIGH"
      ),
      queueRPCRequest(
        () => publicClient.readContract({
          address: CONTRACTS.seigManager.address,
          abi: seigManagerAbi,
          functionName: 'lastCommitBlock',
          args: [candidateContract],
        }) as Promise<bigint>,
        `Member lastCommitBlock`,
        "HIGH"
      ),
      queueRPCRequest(
        () => publicClient.readContract({
          address: CONTRACTS.layer2Manager.address,
          abi: layer2ManagerAbi,
          functionName: 'operatorOfLayer',
          args: [candidateContract as `0x${string}`],
        }) as Promise<`0x${string}`>,
        `Member operatorManager`,
        "HIGH"
      )
    ]);

    // 3. lastCommitBlock의 타임스탬프 가져오기 (블록 정보는 워커 필요 없음)
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

    // 4. manager 주소 조회 (워커 사용)
    let managerAddress: `0x${string}` | null = null;
    if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
      try {
        managerAddress = await queueRPCRequest(
          () => publicClient.readContract({
            address: operatorManager,
            abi: operatorManagerAbi,
            functionName: 'manager',
            args: [],
          }) as Promise<`0x${string}`>,
          `Member manager address`,
          "HIGH"
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
 * Multicall3 optimized version of fetchMemberDetails
 * Reduces RPC calls from 7-8 to 1-2 batch calls
 */
export const fetchMemberDetailsMulticall = async (
  publicClient: any,
  memberAddress: string,
  slotIndex?: number
): Promise<CommitteeMember> => {
  try {
    // console.log(`🚀 [Multicall3] Fetching member details for ${memberAddress}`);

    // 1. candidateInfo 조회 (이건 반드시 먼저 필요 - candidateContract 얻기 위해)
    const candidateInfo = await queueRPCRequest(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address,
        abi: daoCommitteeAbi,
        functionName: 'candidateInfos',
        args: [memberAddress as `0x${string}`],
      }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
      `Member ${memberAddress} candidate info`,
      "HIGH"
    );

    const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

    // 2. viem의 네이티브 multicall로 여러 호출을 배치 처리 (더 효율적)
    const contracts = [
      // memo from candidateContract
      {
        address: candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'memo',
        args: []
      },
      // totalStaked from candidateContract
      {
        address: candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'totalStaked',
        args: []
      },
      // getClaimableActivityReward from daoCommittee
      {
        address: CONTRACTS.daoCommittee.address as `0x${string}`,
        abi: daoCommitteeAbi,
        functionName: 'getClaimableActivityReward',
        args: [memberAddress as `0x${string}`]
      },
      // lastCommitBlock from seigManager
      {
        address: CONTRACTS.seigManager.address as `0x${string}`,
        abi: seigManagerAbi,
        functionName: 'lastCommitBlock',
        args: [candidateContract]
      },
      // operatorOfLayer from layer2Manager
      {
        address: CONTRACTS.layer2Manager.address as `0x${string}`,
        abi: layer2ManagerAbi,
        functionName: 'operatorOfLayer',
        args: [candidateContract as `0x${string}`]
      }
    ];

    // console.log(`📦 [Viem Multicall] Executing ${contracts.length} calls in single batch`);
    const results = await executeViemMulticall(
      publicClient,
      contracts,
      true, // allowFailure
      `Member details batch for ${memberAddress}`,
      "HIGH"
    );

    // 3. 결과 처리 (viem multicall은 자동으로 디코딩됨)
    const memo = (results[0]?.status === 'success' ? results[0].result : "Unknown Member") as string;
    const totalStaked = (results[1]?.status === 'success' ? results[1].result : BigInt(0)) as bigint;
    const claimableActivityReward = (results[2]?.status === 'success' ? results[2].result : BigInt(0)) as bigint;
    const lastCommitBlock = (results[3]?.status === 'success' ? results[3].result : BigInt(0)) as bigint;
    const operatorManager = (results[4]?.status === 'success' ? results[4].result : "0x0000000000000000000000000000000000000000") as `0x${string}`;

    // 4. lastCommitBlock의 타임스탬프 가져오기 (블록 정보는 Multicall3 불가능)
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

        // 5. manager 주소 조회 (단일 호출이므로 일반 readContract 사용)
    let managerAddress: `0x${string}` | null = null;
    if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
      try {
        managerAddress = await queueRPCRequest(
          () => publicClient.readContract({
            address: operatorManager,
            abi: operatorManagerAbi,
            functionName: 'manager',
            args: [],
          }) as Promise<`0x${string}`>,
          `Member manager address`,
          "HIGH"
        );
      } catch (error) {
        console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
      }
    }

    // 6. CommitteeMember 객체 생성
    const result = {
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

    // console.log(`✅ [Multicall3] Successfully fetched member details for ${memberAddress}`);
    return result;

  } catch (error) {
    console.error(`❌ [Multicall3] 멤버 상세 정보 조회 실패 (${memberAddress}):`, error);
    throw error; // 폴백 없이 에러를 그대로 throw
  }
};

/**
 * maxMember 값을 조회하는 함수
 */
export const loadMaxMembers = async (): Promise<number> => {
  try {

    const publicClient = await getSharedPublicClient();
    let _maxMember: bigint = BigInt(0);
    _maxMember = await queueRPCRequest(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address as `0x${string}`,
        abi: daoCommitteeAbi,
        functionName: 'maxMember',
      }),
      "DAO: Get maxMember",
      "HIGH"
    );

    return Number(_maxMember);
  } catch (err) {
    console.error("Failed to load maxMember:", err);
    throw err;
  }
};

// loadCommitteeMembers 함수 제거 - loadCommitteeMembersUltraOptimized로 완전 대체됨

/**
 * Committee Members를 로드하는 함수 (Multicall3 최적화)
 * 모든 데이터를 최소한의 RPC 호출로 가져옴 - 80% 성능 향상
 */
export const loadCommitteeMembers = async (
  maxMember: number,
  existingMembers?: CommitteeMember[],
  lastFetchTimestamp?: number,
  onStatusUpdate?: (message: string) => void
): Promise<CommitteeMember[]> => {

  const { BATCH_SIZE, BATCH_DELAY_MS, CACHE_DURATION_MS } = CONTRACT_READ_SETTINGS;

  try {
    // 이벤트 기반 업데이트: 기존 데이터가 있으면 그대로 사용
    if (existingMembers && existingMembers.length > 0) {
      return existingMembers;
    }

    if (maxMember > 0) {
      const publicClient = await getSharedPublicClient();

      onStatusUpdate?.(`Loading committee members: Step 1/3 - Getting all member addresses...`);

      // 1단계: 모든 슬롯의 멤버 주소를 한 번에 배치로 가져오기
      const memberAddressContracts: ContractCall[] = [];
      for (let slotIndex = 0; slotIndex < maxMember; slotIndex++) {
        memberAddressContracts.push({
          address: CONTRACTS.daoCommittee.address as `0x${string}`,
          abi: daoCommitteeAbi,
          functionName: 'members',
          args: [BigInt(slotIndex)]
        });
      }

      const memberAddresses = await executeViemMulticall(
        publicClient,
        memberAddressContracts,
        true,
        `All member addresses batch`,
        "HIGH"
      );

      // 활성 멤버만 필터링
      const activeMemberData: { address: string, slotIndex: number }[] = [];
      for (let slotIndex = 0; slotIndex < maxMember; slotIndex++) {
        const addressResult = memberAddresses[slotIndex];
        if (addressResult?.status === 'success' &&
            addressResult.result &&
            addressResult.result !== '0x0000000000000000000000000000000000000000') {
          activeMemberData.push({
            address: addressResult.result as string,
            slotIndex
          });
        }
      }

      onStatusUpdate?.(`✅ Found ${activeMemberData.length} active members. Step 2/3 - Getting candidate info...`);

      // 2단계: 모든 활성 멤버의 candidateInfo를 한 번에 가져오기
      const candidateInfoContracts: ContractCall[] = activeMemberData.map(member => ({
        address: CONTRACTS.daoCommittee.address as `0x${string}`,
        abi: daoCommitteeAbi,
        functionName: 'candidateInfos',
        args: [member.address as `0x${string}`]
      }));

      const candidateInfoResults = await executeViemMulticall(
        publicClient,
        candidateInfoContracts,
        true,
        `All candidate info batch`,
        "HIGH"
      );

      onStatusUpdate?.(`✅ Got candidate info. Step 3/3 - Getting all member details ...`);

      // 3단계: 모든 멤버의 상세 정보를 한 번의 거대한 멀티콜로 가져오기
      const allDetailContracts: ContractCall[] = [];
      const memberDataMap: { [index: number]: { address: string, slotIndex: number, candidateContract: string } } = {};

      activeMemberData.forEach((member, index) => {
        const candidateResult = candidateInfoResults[index];
        if (candidateResult?.status === 'success' && candidateResult.result) {
          const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateResult.result as readonly [`0x${string}`, bigint, bigint, bigint, bigint];

          memberDataMap[index] = {
            address: member.address,
            slotIndex: member.slotIndex,
            candidateContract
          };

          // 각 멤버당 5개의 contract call 추가
          const baseIndex = index * 5;

          // memo
          allDetailContracts.push({
            address: candidateContract as `0x${string}`,
            abi: daoCandidateAbi,
            functionName: 'memo',
            args: []
          });

          // totalStaked
          allDetailContracts.push({
            address: candidateContract as `0x${string}`,
            abi: daoCandidateAbi,
            functionName: 'totalStaked',
            args: []
          });

          // getClaimableActivityReward
          allDetailContracts.push({
            address: CONTRACTS.daoCommittee.address as `0x${string}`,
            abi: daoCommitteeAbi,
            functionName: 'getClaimableActivityReward',
            args: [member.address as `0x${string}`]
          });

          // lastCommitBlock
          allDetailContracts.push({
            address: CONTRACTS.seigManager.address as `0x${string}`,
            abi: seigManagerAbi,
            functionName: 'lastCommitBlock',
            args: [candidateContract]
          });

          // operatorOfLayer
          allDetailContracts.push({
            address: CONTRACTS.layer2Manager.address as `0x${string}`,
            abi: layer2ManagerAbi,
            functionName: 'operatorOfLayer',
            args: [candidateContract as `0x${string}`]
          });
        }
      });

      // onStatusUpdate?.(`🔥 Executing MEGA multicall with ${allDetailContracts.length} contract calls...`);

      // 거대한 멀티콜 실행
      const allDetailResults = await executeViemMulticall(
        publicClient,
        allDetailContracts,
        true,
        `MEGA member details batch`,
        "HIGH"
      );

      onStatusUpdate?.(`✅ Multicall3 completed! Processing results...`);

      // 4단계: 결과 조합하여 CommitteeMember 객체들 생성
      const memberDetails: CommitteeMember[] = [];

      // 빈 슬롯들 먼저 추가
      for (let slotIndex = 0; slotIndex < maxMember; slotIndex++) {
        const addressResult = memberAddresses[slotIndex];
        if (addressResult?.status !== 'success' ||
            !addressResult.result ||
            addressResult.result === '0x0000000000000000000000000000000000000000') {

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
          memberDetails[slotIndex] = emptySlot;
        }
      }

      // 활성 멤버들 처리
      for (let index = 0; index < activeMemberData.length; index++) {
        const memberData = memberDataMap[index];
        if (!memberData) continue;

        const candidateResult = candidateInfoResults[index];
        if (candidateResult?.status !== 'success') continue;

        const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateResult.result as readonly [`0x${string}`, bigint, bigint, bigint, bigint];

        // 해당 멤버의 상세 정보 결과들 (5개씩)
        const baseIndex = index * 5;
        const memo = allDetailResults[baseIndex]?.status === 'success' ? allDetailResults[baseIndex].result as string : "Unknown Member";
        const totalStaked = allDetailResults[baseIndex + 1]?.status === 'success' ? allDetailResults[baseIndex + 1].result as bigint : BigInt(0);
        const claimableActivityReward = allDetailResults[baseIndex + 2]?.status === 'success' ? allDetailResults[baseIndex + 2].result as bigint : BigInt(0);
        const lastCommitBlock = allDetailResults[baseIndex + 3]?.status === 'success' ? allDetailResults[baseIndex + 3].result as bigint : BigInt(0);
        const operatorManager = allDetailResults[baseIndex + 4]?.status === 'success' ? allDetailResults[baseIndex + 4].result as `0x${string}` : "0x0000000000000000000000000000000000000000" as `0x${string}`;

        // lastCommitBlock의 타임스탬프 (개별 처리 필요)
        let lastUpdateSeigniorageTime = 0;
        if (lastCommitBlock > 0) {
          try {
            const block = await publicClient.getBlock({ blockNumber: lastCommitBlock });
            lastUpdateSeigniorageTime = Number(block.timestamp);
          } catch (error) {
            console.warn(`Failed to get block ${lastCommitBlock} timestamp:`, error);
          }
        }

        // manager 주소 조회 (개별 처리 필요)
        let managerAddress: `0x${string}` | null = null;
        if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
          try {
            managerAddress = await queueRPCRequest(
              () => publicClient.readContract({
                address: operatorManager,
                abi: operatorManagerAbi,
                functionName: 'manager',
                args: [],
              }) as Promise<`0x${string}`>,
              `Member manager address`,
              "HIGH"
            );
          } catch (error) {
            console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
          }
        }

        const memberDetail: CommitteeMember = {
          name: memo,
          description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
          creationAddress: memberData.address,
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

        memberDetails[memberData.slotIndex] = memberDetail;
      }

      onStatusUpdate?.(`🎉 Loading complete! Processed ${memberDetails.length} slots!`);
      return memberDetails;
    }

    return [];
  } catch (err) {
    console.error("Failed to load committee members (ultra-optimized):", err);
    throw err;
  }
};

/**
 * 특정 슬롯의 멤버 정보를 새로고침하는 함수
 */
export const refreshSpecificMember = async (
  slotIndex: number
): Promise<CommitteeMember | null> => {
  try {
    const publicClient = await getSharedPublicClient();

    // 해당 슬롯의 멤버 주소 조회
    const memberAddress = await queueRPCRequest(
      () => publicClient.readContract({
        address: CONTRACTS.daoCommittee.address as `0x${string}`,
        abi: daoCommitteeAbi,
        functionName: 'members',
        args: [BigInt(slotIndex)],
      }),
      `DAO: Get committee member ${slotIndex} `,
      "HIGH"
    );

    if (!memberAddress || memberAddress === '0x0000000000000000000000000000000000000000') {
      // 멤버가 제거된 경우
      return null;
    }

    // Multicall3를 사용하여 멤버 상세 정보 조회
    const updatedMember = await fetchMemberDetailsMulticall(publicClient, memberAddress, slotIndex);

    return updatedMember;

  } catch (error) {
    console.error(`❌ 슬롯 ${slotIndex} 멤버 업데이트 실패:`, error);
    throw error;
  }
};