import { useState, useMemo, useCallback } from 'react';
import { MESSAGES } from '@/constants/dao';
import { CONTRACTS } from '@/config/contracts';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import { createRobustPublicClient, readContractWithRetry } from '@/lib/rpc-utils';

interface UseDAOOwnerProps {
  isConnected: boolean;
  address: string | null;
  setStatusMessage: (message: string) => void;
}

export function useDAOOwner({ isConnected, address, setStatusMessage }: UseDAOOwnerProps) {
  const [daoOwner, setDaoOwner] = useState<string | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);

  // Owner인지 확인 (연결된 지갑 주소와 DAO owner 주소 비교) - 지갑 연결된 경우에만 의미있음
  const isOwner = useMemo(() => {
    if (!isConnected || !address || !daoOwner) return false;
    return address.toLowerCase() === daoOwner.toLowerCase();
  }, [isConnected, address, daoOwner]);

  // Owner 정보 로드 함수 - 지갑 연결 없이도 public 데이터 가져오기 (견고한 RPC 사용)
  const loadOwnerInfo = useCallback(async () => {
    setIsLoadingOwner(true);
    try {
      setStatusMessage(MESSAGES.LOADING.OWNER);

      // 견고한 Public Client 생성 (Fallback & 재시도 지원)
      const publicClient = await createRobustPublicClient();

      // 재시도 로직을 포함한 컨트랙트 호출
      const ownerAddress = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'owner',
        }) as Promise<string>,
        'DAO Owner fetch'
      );

      setDaoOwner(ownerAddress);
      setStatusMessage(MESSAGES.SUCCESS.OWNER);
    } catch (error) {
      console.error("Failed to load DAO owner:", error);
      setStatusMessage(MESSAGES.ERROR.OWNER);
      setDaoOwner(null);
    } finally {
      setIsLoadingOwner(false);
    }
  }, [setStatusMessage]);

  // Owner 권한 체크 함수 - 지갑 연결된 경우에만 의미있음
  const checkOwnerPermissions = useCallback(async (): Promise<boolean> => {
    if (!isConnected || !address || !daoOwner) {
      return false;
    }

    const hasPermissions = address.toLowerCase() === daoOwner.toLowerCase();

    if (!hasPermissions) {
      setStatusMessage(MESSAGES.ERROR.ACCESS_DENIED);
    }

    return hasPermissions;
  }, [isConnected, address, daoOwner, setStatusMessage]);

  // Owner 정보 새로고침 함수 - 지갑 연결 여부와 관계없이 가능
  const refreshOwnerInfo = useCallback(async () => {
    await loadOwnerInfo();
  }, [loadOwnerInfo]);

  // 상태 초기화 함수 (필요한 경우)
  const resetOwnerState = useCallback(() => {
    setDaoOwner(null);
  }, []);

  return {
    daoOwner,
    isOwner,
    isLoadingOwner,
    loadOwnerInfo,
    checkOwnerPermissions,
    refreshOwnerInfo,
    resetOwnerState,
  };
}