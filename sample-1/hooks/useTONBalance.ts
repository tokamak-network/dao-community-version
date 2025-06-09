import { useState, useMemo, useCallback } from 'react';
import { MOCK_TON_BALANCE, MOCK_CREATE_AGENDA_FEES, MESSAGES } from '@/constants/dao';
import { AgendaProposalCheck } from '@/types/dao';

interface UseTONBalanceProps {
  isConnected: boolean;
  address: string | null;
  setStatusMessage: (message: string) => void;
}

export function useTONBalance({ isConnected, address, setStatusMessage }: UseTONBalanceProps) {
  const [tonBalance, setTonBalance] = useState<bigint | null>(null);
  const [isLoadingTonBalance, setIsLoadingTonBalance] = useState(false);
  const [createAgendaFees, setCreateAgendaFees] = useState<bigint | null>(null);

  // 아젠다 제안 가능 여부 (TON 잔액 충분한지)
  const canProposeAgenda = useMemo(() => {
    if (!isConnected || !tonBalance || !createAgendaFees) return false;
    return tonBalance >= createAgendaFees;
  }, [isConnected, tonBalance, createAgendaFees]);

  // TON 잔액 로드 함수
  const loadTonBalance = useCallback(async () => {
    if (!isConnected || !address) return;

    setIsLoadingTonBalance(true);
    try {
      setStatusMessage(MESSAGES.LOADING.TON_BALANCE);

      // Mock implementation - 실제로는 TON 컨트랙트에서 잔액 조회
      // const balance = await tonContract.read.balanceOf(address);

      setTonBalance(MOCK_TON_BALANCE);
      setStatusMessage(MESSAGES.SUCCESS.TON_BALANCE);
    } catch (error) {
      console.error("Failed to load TON balance:", error);
      setStatusMessage(MESSAGES.ERROR.TON_BALANCE);
      setTonBalance(null);
    } finally {
      setIsLoadingTonBalance(false);
    }
  }, [isConnected, address, setStatusMessage]);

  // 아젠다 생성 수수료 로드 함수
  const loadCreateAgendaFees = useCallback(async () => {
    try {
      // Mock implementation - 실제로는 DAO Agenda Manager 컨트랙트에서 조회
      // const fees = await daoAgendaManagerContract.read.createAgendaFees();

      setCreateAgendaFees(MOCK_CREATE_AGENDA_FEES);
    } catch (error) {
      console.error("Failed to load create agenda fees:", error);
      setCreateAgendaFees(null);
    }
  }, []);

  // TON 잔액 새로고침 함수
  const refreshTonBalance = useCallback(async () => {
    await Promise.all([
      loadTonBalance(),
      loadCreateAgendaFees()
    ]);
  }, [loadTonBalance, loadCreateAgendaFees]);

  // 아젠다 제안 요구사항 체크 함수
  const checkAgendaProposalRequirements = useCallback(async (): Promise<AgendaProposalCheck> => {
    if (!isConnected) {
      return { canPropose: false, message: MESSAGES.ERROR.WALLET_NOT_CONNECTED };
    }

    if (!address) {
      return { canPropose: false, message: MESSAGES.ERROR.WALLET_ADDRESS_ERROR };
    }

    if (!tonBalance) {
      return { canPropose: false, message: MESSAGES.ERROR.TON_BALANCE_ERROR };
    }

    if (!createAgendaFees) {
      return { canPropose: false, message: MESSAGES.ERROR.AGENDA_FEES_ERROR };
    }

    if (tonBalance < createAgendaFees) {
      const balanceInTon = Number(tonBalance) / 1e18;
      const feesInTon = Number(createAgendaFees) / 1e18;
      return {
        canPropose: false,
        message: `TON이 부족합니다. 필요: ${feesInTon} TON, 보유: ${balanceInTon.toFixed(2)} TON`
      };
    }

    return { canPropose: true };
  }, [isConnected, address, tonBalance, createAgendaFees]);

  // 지갑 연결 해제시 상태 초기화
  const resetTonState = useCallback(() => {
    setTonBalance(null);
    setCreateAgendaFees(null);
  }, []);

  return {
    tonBalance,
    isLoadingTonBalance,
    createAgendaFees,
    canProposeAgenda,
    loadTonBalance,
    loadCreateAgendaFees,
    refreshTonBalance,
    checkAgendaProposalRequirements,
    resetTonState,
  };
}