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

      async getMemberDetails(memberAddress: string): Promise<{
        stakedAmount: bigint;
        votingPower: bigint;
        isActive: boolean;
      }> {
        const result = await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'getMemberDetails',
          args: [memberAddress as `0x${string}`],
        });
        const [stakedAmount, votingPower, isActive] = result as [bigint, bigint, boolean];
        return { stakedAmount, votingPower, isActive };
      },

      // V3 함수들 (있는 경우)
      async getCommitteeSnapshot(): Promise<{
        members: string[];
        stakes: bigint[];
        totalStake: bigint;
      }> {
        try {
          const result = await publicClient.readContract({
            address: CONTRACTS.daoCommittee.address,
            abi: daoCommitteeAbi,
            functionName: 'getCommitteeSnapshot',
          });
          const [members, stakes, totalStake] = result as [string[], bigint[], bigint];
          return { members, stakes, totalStake };
        } catch (error) {
          // V3 함수가 없는 경우 fallback
          console.warn('getCommitteeSnapshot not available, falling back to basic functions');
          const members = await this.getCommitteeMembers();
          return {
            members,
            stakes: new Array(members.length).fill(BigInt(0)),
            totalStake: BigInt(0)
          };
        }
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