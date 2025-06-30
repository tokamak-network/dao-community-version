import { Candidate } from "@/types/dao";
import { CONTRACTS } from "@/config/contracts";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";
import { layer2RegistryAbi } from "@/abis/layer2-registry";
import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";

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
    console.log('📦 Layer2 캐시 데이터 존재, 로드 스킵');
    return {
      candidates: existingCandidates,
      total: existingCandidates.length,
      lastLoadIndex: existingCandidates.length
    };
  }

  console.log('🔄 Layer2 Candidates 로드 시작');

  try {
    const publicClient = await createRobustPublicClient();
    const allLayer2Candidates: Candidate[] = [];

    // 1. Layer2Registry에서 총 레이어2 개수 조회
    const numLayer2s = await readContractWithRetry(
      () => publicClient.readContract({
        address: CONTRACTS.layer2Registry.address as `0x${string}`,
        abi: layer2RegistryAbi,
        functionName: 'numLayer2s',
      }) as Promise<bigint>,
      'Total Layer2s count for caching'
    );

    const totalLayer2s = Number(numLayer2s);
    console.log('📊 캐싱할 Layer2 개수:', totalLayer2s);

    // 진행 상황 초기 업데이트
    onProgress?.(0, totalLayer2s, `Layer2 Registry에서 ${totalLayer2s}개 발견`);

    // 2. 모든 레이어2 정보를 한 번에 로드하여 캐싱
    for (let i = 0; i < totalLayer2s; i++) {
      try {
        // 진행 상황 업데이트
        onProgress?.(i, totalLayer2s, `Processing Layer2 ${i + 1}/${totalLayer2s}...`);

        // 레이어2 컨트랙트 주소 조회
        const layer2Address = await readContractWithRetry(
          () => publicClient.readContract({
            address: CONTRACTS.layer2Registry.address as `0x${string}`,
            abi: layer2RegistryAbi,
            functionName: 'layer2ByIndex',
            args: [BigInt(i)],
          }) as Promise<string>,
          `Layer2 ${i} address for cache`
        );

        // 빈 주소는 스킵
        if (!layer2Address || layer2Address === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        // 레이어2 기본 정보 조회
        const [memo, totalStaked] = await Promise.all([
          readContractWithRetry(
            () => publicClient.readContract({
              address: layer2Address as `0x${string}`,
              abi: daoCandidateAbi,
              functionName: 'memo',
            }) as Promise<string>,
            `Layer2 ${i} memo for cache`
          ).catch(() => `Layer2 #${i}`),
          readContractWithRetry(
            () => publicClient.readContract({
              address: layer2Address as `0x${string}`,
              abi: daoCandidateAbi,
              functionName: 'totalStaked',
            }) as Promise<bigint>,
            `Layer2 ${i} total staked for cache`
          )
        ]);

        // 오퍼레이터 정보 조회
        const operatorManager = await readContractWithRetry(
          () => publicClient.readContract({
            address: CONTRACTS.layer2Manager.address as `0x${string}`,
            abi: layer2ManagerAbi,
            functionName: 'operatorOfLayer',
            args: [layer2Address as `0x${string}`],
          }) as Promise<`0x${string}`>,
          `Layer2 ${i} operator manager for cache`
        );

        // EOA 정보 조회
        let operatorEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';
        let managerEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';

        try {
          operatorEOA = await readContractWithRetry(
            () => publicClient.readContract({
              address: layer2Address as `0x${string}`,
              abi: daoCandidateAbi,
              functionName: 'operator',
            }) as Promise<`0x${string}`>,
            `Layer2 ${i} operator EOA for cache`
          );
        } catch (error) {
          // operator 함수가 없는 경우 스킵
        }

        if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
          try {
            managerEOA = await readContractWithRetry(
              () => publicClient.readContract({
                address: operatorManager,
                abi: operatorManagerAbi,
                functionName: 'manager',
                args: [],
              }) as Promise<`0x${string}`>,
              `Layer2 ${i} manager EOA for cache`
            );
          } catch (error) {
            // manager 조회 실패시 스킵
          }
        }

        // DAO Committee에서 cooldown 조회
        const cooldown = await readContractWithRetry(
          () => publicClient.readContract({
            address: CONTRACTS.daoCommittee.address as `0x${string}`,
            abi: daoCommitteeAbi,
            functionName: 'cooldown',
            args: [layer2Address as `0x${string}`],
          }) as Promise<bigint>,
          `Layer2 ${i} cooldown for cache`
        );

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
        console.log(`✅ Layer2 캐싱 완료: ${memo} (${(Number(totalStaked) / 1e18).toFixed(2)} TON)`);

      } catch (error) {
        console.warn(`Failed to cache Layer2 ${i}:`, error);
        continue;
      }
    }

    // 스테이킹 순으로 정렬 (높은 순)
    allLayer2Candidates.sort((a, b) =>
      Number(BigInt(b.totalStaked) - BigInt(a.totalStaked))
    );

    console.log('🎯 Layer2 캐싱 완료:', allLayer2Candidates.length, '개');

    // 최종 진행 상황 업데이트
    onProgress?.(totalLayer2s, totalLayer2s, `✅ 완료! ${allLayer2Candidates.length}개 Layer2 로드됨`);

    return {
      candidates: allLayer2Candidates,
      total: totalLayer2s,
      lastLoadIndex: totalLayer2s
    };

  } catch (error) {
    console.error('❌ Layer2 캐싱 실패:', error);
    throw error;
  }
};

/**
 * Layer2 캐시를 리셋하는 함수
 */
export const resetLayer2Cache = () => {
  console.log('🗑️ Layer2 캐시 리셋 완료');
  // 이 함수는 상태 리셋이므로 별도 로직 없이 호출한 곳에서 상태를 초기화
};