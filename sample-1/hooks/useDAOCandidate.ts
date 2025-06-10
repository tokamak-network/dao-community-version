import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { daoCandidateAbi } from '@/abis/dao-candidate';
import { CommitteeMember } from '@/types/dao';

// Write 함수들을 위한 파라미터 인터페이스들
export interface ChangeMemberParams {
  candidateContract: string;
  targetMemberIndex: number;
}

export interface CastVoteParams {
  candidateContract: string;
  agendaId: number;
  vote: number;
  comment: string;
}

export interface ClaimActivityRewardParams {
  candidateContract: string;
}

export interface RetireMemberParams {
  candidateContract: string;
}

export interface UpdateSeigniorageParams {
  candidateContract: string;
}

// Read 함수들을 위한 파라미터 인터페이스들
export interface StakedOfParams {
  candidateContract: string;
  account: string;
}

export function useDAOCandidate() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  const [operationState, setOperationState] = useState<{
    isExecuting: boolean;
    error: string | null;
    txHash: string | null;
    isSuccess: boolean;
    lastOperation: string | null;
  }>({
    isExecuting: false,
    error: null,
    txHash: null,
    isSuccess: false,
    lastOperation: null,
  });

  // Write 함수들
  const changeMember = async (params: ChangeMemberParams) => {
    if (!address) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    console.log('🔄 changeMember 실행:', params);

    setOperationState({
      isExecuting: true,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: 'changeMember',
    });

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'changeMember',
        args: [BigInt(params.targetMemberIndex)],
      });

      console.log('✅ changeMember 트랜잭션 전송 완료');
    } catch (err: any) {
      console.error('❌ changeMember 실행 실패:', err);
      const errorMessage = err?.message || 'changeMember 실행 중 오류가 발생했습니다';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const castVote = async (params: CastVoteParams) => {
    if (!address) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    console.log('🗳️ castVote 실행:', params);

    setOperationState({
      isExecuting: true,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: 'castVote',
    });

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'castVote',
        args: [BigInt(params.agendaId), BigInt(params.vote), params.comment],
      });

      console.log('✅ castVote 트랜잭션 전송 완료');
    } catch (err: any) {
      console.error('❌ castVote 실행 실패:', err);
      const errorMessage = err?.message || 'castVote 실행 중 오류가 발생했습니다';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const claimActivityReward = async (params: ClaimActivityRewardParams) => {
    if (!address) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    console.log('💰 claimActivityReward 실행:', params);

    setOperationState({
      isExecuting: true,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: 'claimActivityReward',
    });

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'claimActivityReward',
        args: [],
      });

      console.log('✅ claimActivityReward 트랜잭션 전송 완료');
    } catch (err: any) {
      console.error('❌ claimActivityReward 실행 실패:', err);
      const errorMessage = err?.message || 'claimActivityReward 실행 중 오류가 발생했습니다';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const retireMember = async (params: RetireMemberParams) => {
    if (!address) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    console.log('👋 retireMember 실행:', params);

    setOperationState({
      isExecuting: true,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: 'retireMember',
    });

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'retireMember',
        args: [],
      });

      console.log('✅ retireMember 트랜잭션 전송 완료');
    } catch (err: any) {
      console.error('❌ retireMember 실행 실패:', err);
      const errorMessage = err?.message || 'retireMember 실행 중 오류가 발생했습니다';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  const updateSeigniorage = async (params: UpdateSeigniorageParams) => {
    if (!address) {
      throw new Error('지갑을 먼저 연결해주세요');
    }

    console.log('⚡ updateSeigniorage 실행:', params);

    setOperationState({
      isExecuting: true,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: 'updateSeigniorage',
    });

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'updateSeigniorage',
        args: [],
      });

      console.log('✅ updateSeigniorage 트랜잭션 전송 완료');
    } catch (err: any) {
      console.error('❌ updateSeigniorage 실행 실패:', err);
      const errorMessage = err?.message || 'updateSeigniorage 실행 중 오류가 발생했습니다';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  // Read 함수들 (직접 useReadContract 사용 - 필요시 개별적으로 사용)
  const useMemo = (candidateContract: string) => {
    return useReadContract({
      address: candidateContract as `0x${string}`,
      abi: daoCandidateAbi,
      functionName: 'memo',
    });
  };

  const useTotalStaked = (candidateContract: string) => {
    return useReadContract({
      address: candidateContract as `0x${string}`,
      abi: daoCandidateAbi,
      functionName: 'totalStaked',
    });
  };

  const useOperator = (candidateContract: string) => {
    return useReadContract({
      address: candidateContract as `0x${string}`,
      abi: daoCandidateAbi,
      functionName: 'operator',
    });
  };

  const useStakedOf = (candidateContract: string, account: string) => {
    return useReadContract({
      address: candidateContract as `0x${string}`,
      abi: daoCandidateAbi,
      functionName: 'stakedOf',
      args: [account as `0x${string}`],
    });
  };

  // 트랜잭션 상태 업데이트
  if (hash && !operationState.txHash) {
    setOperationState(prev => ({
      ...prev,
      txHash: hash,
    }));
  }

  if (isSuccess && !operationState.isSuccess) {
    setOperationState(prev => ({
      ...prev,
      isExecuting: false,
      isSuccess: true,
    }));
    console.log(`🎉 ${operationState.lastOperation} 성공!`);
  }

  if ((error || receiptError) && !operationState.error) {
    const errorMessage = (error || receiptError)?.message || '트랜잭션 처리 중 오류가 발생했습니다';
    setOperationState(prev => ({
      ...prev,
      isExecuting: false,
      error: errorMessage,
    }));
  }

  return {
    // Write 함수들
    changeMember,
    castVote,
    claimActivityReward,
    retireMember,
    updateSeigniorage,

    // Read 함수들
    useMemo,
    useTotalStaked,
    useOperator,
    useStakedOf,

    // 상태
    isExecuting: isPending || isConfirming || operationState.isExecuting,
    isSuccess: operationState.isSuccess,
    error: operationState.error || error?.message || receiptError?.message,
    txHash: operationState.txHash,
    lastOperation: operationState.lastOperation || null,

    // 유틸리티
    reset: () => setOperationState({
      isExecuting: false,
      error: null,
      txHash: null,
      isSuccess: false,
      lastOperation: null,
    }),
  };
}