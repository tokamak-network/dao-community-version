import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { daoCandidateAbi } from '@/abis/dao-candidate';
import { CommitteeMember } from '@/types/dao';
import {
  TransactionState,
  TransactionError,
  createInitialTransactionState,
  createExecutingState,
  createSuccessState,
  createErrorState,
  updateTransactionHash,
  resetTransactionState,
  logTransactionState,
  logTransactionError
} from '@/utils/transaction-utils';

// Parameter interfaces for write functions
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

// Parameter interfaces for read functions
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

  const [operationState, setOperationState] = useState<TransactionState>(createInitialTransactionState());

  // Write functions
  const changeMember = async (params: ChangeMemberParams) => {
    if (!address) {
      throw new Error('Please connect your wallet first');
    }

    setOperationState(createExecutingState('changeMember'));

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'changeMember',
        args: [BigInt(params.targetMemberIndex)],
      });


    } catch (err: any) {
      console.error('❌ Failed to execute changeMember:', err);
      logTransactionError(err, 'changeMember');
      setOperationState(prev => createErrorState(prev, err));
      throw err;
    }
  };

  const castVote = async (params: CastVoteParams) => {
    if (!address) {
      throw new Error('Please connect your wallet first');
    }

    setOperationState(createExecutingState('castVote'));

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'castVote',
        args: [BigInt(params.agendaId), BigInt(params.vote), params.comment],
      });

    } catch (err: any) {
      console.error('❌ Failed to execute castVote:', err);
      const errorMessage = err?.message || 'An error occurred while executing castVote';

      // Handle user cancellation errors with a simple message
      const isUserCancelled =
        err?.code === 4001 ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("cancelled");

      const finalErrorMessage = isUserCancelled
        ? "Transaction was cancelled"
        : errorMessage;

      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: finalErrorMessage,
      }));
      throw err;
    }
  };

  const claimActivityReward = async (params: ClaimActivityRewardParams) => {
    if (!address) {
      throw new Error('Please connect your wallet first');
    }

    setOperationState(createExecutingState('claimActivityReward'));

    try {
      const result = await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'claimActivityReward',
        args: [],
      });
    } catch (err: any) {
      console.error('❌ Failed to execute claimActivityReward:', err);
      const errorMessage = err?.message || 'An error occurred while executing claimActivityReward';

      // Handle user cancellation errors with a simple message
      const isUserCancelled =
        err?.code === 4001 ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User cancelled") ||
        errorMessage.includes("user rejected") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("cancelled");

      const finalErrorMessage = isUserCancelled
        ? "Transaction was cancelled"
        : errorMessage;

      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: finalErrorMessage,
      }));
      throw err;
    }
  };

  const retireMember = async (params: RetireMemberParams) => {
    if (!address) {
      throw new Error('Please connect your wallet first');
    }

    setOperationState(createExecutingState('retireMember'));

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'retireMember',
        args: [],
      });
    } catch (err: any) {
      console.error('❌ Failed to execute retireMember:', err);
      const errorMessage = err?.message || 'An error occurred while executing retireMember';
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
      throw new Error('Please connect your wallet first');
    }

    setOperationState(createExecutingState('updateSeigniorage'));

    try {
      await writeContract({
        address: params.candidateContract as `0x${string}`,
        abi: daoCandidateAbi,
        functionName: 'updateSeigniorage',
        args: [],
      });
    } catch (err: any) {
      console.error('❌ Failed to execute updateSeigniorage:', err);
      const errorMessage = err?.message || 'An error occurred while executing updateSeigniorage';
      setOperationState(prev => ({
        ...prev,
        isExecuting: false,
        error: errorMessage,
      }));
      throw err;
    }
  };

  // Read functions (use useReadContract directly - use individually as needed)
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

  // Transaction state update
  if (hash && !operationState.txHash) {
    setOperationState(prev => updateTransactionHash(prev, hash));
  }

  if (isSuccess && !operationState.isSuccess) {
    setOperationState(prev => createSuccessState(prev));
  }

  if ((error || receiptError) && !operationState.error) {
    const rawError = error || receiptError;
    if (rawError) {
      logTransactionError(rawError as TransactionError, 'useDAOCandidate');
      setOperationState(prev => createErrorState(prev, rawError as TransactionError));
    }
  }

  return {
    // Write functions
    changeMember,
    castVote,
    claimActivityReward,
    retireMember,
    updateSeigniorage,

    // Read functions
    useMemo,
    useTotalStaked,
    useOperator,
    useStakedOf,

    // State
    isExecuting: isPending || isConfirming || operationState.isExecuting,
    isSuccess: operationState.isSuccess,
    error: operationState.error || error?.message || receiptError?.message,
    txHash: operationState.txHash,
    lastOperation: operationState.operation || null,

    // Utility
    reset: () => setOperationState(resetTransactionState()),
  };
}