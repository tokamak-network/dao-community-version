import { Candidate } from "@/types/dao";
import { CONTRACTS } from "@/config/contracts";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";
import { layer2RegistryAbi } from "@/abis/layer2-registry";
import { readContractWithRetry } from "@/lib/rpc-utils";
import { getSharedPublicClient, queueRPCRequest } from "@/lib/shared-rpc-client";

/**
 * Layer2 Candidates 관련 핸들러 함수들
 */

/**
 * Layer2 Candidates를 로드하고 캐싱하는 함수
 */
export const loadLayer2Candidates = async (
  force = false,
  hasLoadedOnce?: boolean,
  existingCandidates?: Candidate[],
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{
  candidates: Candidate[];
  total: number;
  lastLoadIndex: number;
}> => {
  if (!force && hasLoadedOnce && existingCandidates && existingCandidates.length > 0) {
    // 캐시된 데이터 사용 시에도 진행률 표시를 위해 콜백 호출
    if (onProgress) {
      const total = existingCandidates.length;
      // 빠른 애니메이션으로 진행률 표시 (0부터 시작)
      onProgress(0, total, `Loading cached Layer2 data...`);

      // 약간의 지연을 두고 완료 상태로 업데이트
      setTimeout(() => {
        onProgress(total, total, `✅ Loaded ${total} Layer2 candidates from cache!`);
      }, 300);
    }

    return {
      candidates: existingCandidates,
      total: existingCandidates.length,
      lastLoadIndex: existingCandidates.length
    };
  }

  try {
    const publicClient = await getSharedPublicClient();
    const allLayer2Candidates: Candidate[] = [];

    // 1. Layer2Registry에서 총 레이어2 개수 조회
    const numLayer2s = await queueRPCRequest(
      () => publicClient.readContract({
        address: CONTRACTS.layer2Registry.address as `0x${string}`,
        abi: layer2RegistryAbi,
        functionName: 'numLayer2s',
      }),
      'DAO 챌린지: Layer2 총 개수 조회',
      'HIGH'
    ) as bigint;

    const totalLayer2s = Number(numLayer2s);

    // 진행 상황 초기 업데이트
    onProgress?.(0, totalLayer2s, `Found ${totalLayer2s} Layer2s in registry`);

    // 2. 모든 레이어2 정보를 한 번에 로드하여 캐싱
    for (let i = 0; i < totalLayer2s; i++) {
      try {
        // 진행 상황 업데이트 (i+1을 전달하여 1부터 시작하도록)
        onProgress?.(i + 1, totalLayer2s, `Processing Layer2 ${i + 1}/${totalLayer2s}...`);

        // 레이어2 컨트랙트 주소 조회
        const layer2Address = await queueRPCRequest(
          () => publicClient.readContract({
            address: CONTRACTS.layer2Registry.address as `0x${string}`,
            abi: layer2RegistryAbi,
            functionName: 'layer2ByIndex',
            args: [BigInt(i)],
          }),
          `DAO 챌린지: Layer2 ${i} 주소 조회`,
          'HIGH'
        ) as string;

        // 빈 주소는 스킵
        if (!layer2Address || layer2Address === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        // 레이어2 기본 정보 조회 (순차적 처리)
        const memo = await queueRPCRequest(
          () => publicClient.readContract({
            address: layer2Address as `0x${string}`,
            abi: daoCandidateAbi,
            functionName: 'memo',
          }),
          `DAO 챌린지: Layer2 ${i} 이름 조회`,
          'HIGH'
        ).catch(() => `Layer2 #${i}`) as string;

        const totalStaked = await queueRPCRequest(
          () => publicClient.readContract({
            address: layer2Address as `0x${string}`,
            abi: daoCandidateAbi,
            functionName: 'totalStaked',
          }),
          `DAO 챌린지: Layer2 ${i} 스테이킹 조회`,
          'HIGH'
        ) as bigint;

        // 오퍼레이터 정보 조회
        const operatorManager = await queueRPCRequest(
          () => publicClient.readContract({
            address: CONTRACTS.layer2Manager.address as `0x${string}`,
            abi: layer2ManagerAbi,
            functionName: 'operatorOfLayer',
            args: [layer2Address as `0x${string}`],
          }),
          `DAO 챌린지: Layer2 ${i} 오퍼레이터 조회`,
          'HIGH'
        ) as `0x${string}`;

        // EOA 정보 조회
        let operatorEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';
        let managerEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';

        try {
          operatorEOA = await queueRPCRequest(
            () => publicClient.readContract({
              address: layer2Address as `0x${string}`,
              abi: daoCandidateAbi,
              functionName: 'operator',
            }),
            `DAO 챌린지: Layer2 ${i} 오퍼레이터 EOA 조회`,
            'HIGH'
          ) as `0x${string}`;
        } catch (error) {
          // operator 함수가 없는 경우 스킵
        }

        if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
          try {
            managerEOA = await queueRPCRequest(
              () => publicClient.readContract({
                address: operatorManager,
                abi: operatorManagerAbi,
                functionName: 'manager',
                args: [],
              }),
              `DAO 챌린지: Layer2 ${i} 매니저 EOA 조회`,
              'HIGH'
            ) as `0x${string}`;
          } catch (error) {
            // manager 조회 실패시 스킵
          }
        }

        // DAO Committee에서 cooldown 조회
        const cooldown = await queueRPCRequest(
          () => publicClient.readContract({
            address: CONTRACTS.daoCommittee.address as `0x${string}`,
            abi: daoCommitteeAbi,
            functionName: 'cooldown',
            args: [layer2Address as `0x${string}`],
          }),
          `DAO 챌린지: Layer2 ${i} 쿨다운 조회`,
          'HIGH'
        ) as bigint;

        const candidate: Candidate = {
          name: memo || `Layer2 #${i}`,
          description: `Layer2 Contract with ${(Number(totalStaked) / 1e18).toFixed(2)} TON staked`,
          creationAddress: operatorEOA,
          candidateContract: layer2Address,
          totalStaked: totalStaked.toString(),
          operator: (managerEOA !== '0x0000000000000000000000000000000000000000' ? managerEOA : operatorEOA) as `0x${string}`,
          operatorManager,
          manager: managerEOA,
          cooldown: Number(cooldown),
          isCommitteeMember: false // 나중에 위원회 멤버 체크에서 업데이트
        };

        allLayer2Candidates.push(candidate);

      } catch (error) {
        continue;
      }
    }

    // 스테이킹 순으로 정렬 (높은 순)
    allLayer2Candidates.sort((a, b) =>
      Number(BigInt(b.totalStaked) - BigInt(a.totalStaked))
    );

    // 최종 진행 상황 업데이트
    onProgress?.(totalLayer2s, totalLayer2s, `✅ Completed! ${allLayer2Candidates.length} Layer2 candidates loaded`);

    return {
      candidates: allLayer2Candidates,
      total: totalLayer2s,
      lastLoadIndex: totalLayer2s
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Layer2 캐시를 리셋하는 함수
 */
export const resetLayer2Cache = () => {
  // 이 함수는 상태 리셋이므로 별도 로직 없이 호출한 곳에서 상태를 초기화
};