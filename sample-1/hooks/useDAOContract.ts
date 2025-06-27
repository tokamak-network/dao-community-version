import { useMemo } from 'react';
import { createPublicClient, http } from 'viem';
import { CONTRACTS } from '@/config/contracts';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import { CURRENT_CHAIN, CURRENT_RPC_URL } from '@/config/rpc';

export function useDAOContract() {
  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: CURRENT_CHAIN,
      transport: http(CURRENT_RPC_URL)
    });
  }, []);

  const contract = useMemo(() => {
    if (!publicClient) return null;

    return {
      // Owner 관련 함수들
      async getOwner(): Promise<string> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'owner',
        });
        return result as string;
      },

      // Committee Members 관련 함수들
      async getCommitteeMembers(): Promise<string[]> {
        // maxMember를 조회하고 members를 직접 순회
        const maxMember = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'maxMember',
        }) as bigint;

        const members: string[] = [];
        for (let i = 0; i < Number(maxMember); i++) {
          try {
            const member = await publicClient.readContract({
              address: CONTRACTS.daoCommittee.address,
              abi: daoCommitteeAbi,
              functionName: 'members',
              args: [BigInt(i)],
            }) as string;

            if (member && member !== '0x0000000000000000000000000000000000000000') {
              members.push(member);
            }
          } catch (error) {
            break;
          }
        }
        return members;
      },

      async checkMembership(address: string): Promise<boolean> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'isMember',
          args: [address as `0x${string}`],
        });
        return result as boolean;
      },

      // 후보자 정보 조회 (실제 ABI에 있는 함수)
      async getCandidateInfo(candidateAddress: string): Promise<{
        candidateContract: string;
        indexMembers: bigint;
        memberJoinedTime: bigint;
        rewardPeriod: bigint;
        claimedTimestamp: bigint;
      }> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'candidateInfos',
          args: [candidateAddress as `0x${string}`],
        });
        const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = result as [string, bigint, bigint, bigint, bigint];
        return { candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp };
      },

      // 클레임 가능한 리워드 조회
      async getClaimableReward(candidateAddress: string): Promise<bigint> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'getClaimableActivityReward',
          args: [candidateAddress as `0x${string}`],
        });
        return result as bigint;
      },

      // 쿨다운 시간 조회
      async getCooldown(address: string): Promise<bigint> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'cooldown',
          args: [address as `0x${string}`],
        });
        return result as bigint;
      },

      // 범용 read 함수 (타입 안전성을 위해 제거)
      // async read(functionName: string, args?: any[]): Promise<any> {
      //   return await publicClient.readContract({
      //     address: CONTRACTS.daoCommittee.address,
      //     abi: daoCommitteeAbi,
      //     functionName,
      //     args,
      //   });
      // }
    };
  }, [publicClient]);

  return {
    contract,
    isReady: !!publicClient && !!contract,
    contractAddress: CONTRACTS.daoCommittee.address,
  };
}