import { useState, useCallback } from 'react';
import { AgendaWithMetadata } from '@/types/dao';
import { MESSAGES, AGENDA_STATUS } from '@/constants/dao';
import { CONTRACTS, CONTRACT_READ_SETTINGS } from '@/config/contracts';
import { daoCommitteeAbi } from '@/abis/dao-committee-versions';
import { daoAgendaManagerAbi } from '@/abis/dao-agenda-manager';
import { createRobustPublicClient, readContractWithRetry } from '@/lib/rpc-utils';

interface UseAgendasProps {
  isConnected: boolean;
  setStatusMessage: (message: string) => void;
}

// Agenda 상태 매핑 (sample-2 기준)
const getAgendaStatusText = (status: number): string => {
  switch (status) {
    case 0: return "NONE";
    case 1: return "NOTICE";
    case 2: return "VOTING";
    case 3: return "WAITING EXECUTION";
    case 4: return "EXECUTED";
    case 5: return "ENDED";
    default: return "UNKNOWN";
  }
};

const getAgendaStatusColor = (status: number): string => {
  switch (status) {
    case 1: return "yellow"; // NOTICE
    case 2: return "purple"; // VOTING
    case 3: return "blue"; // WAITING EXECUTION
    case 4: return "green"; // EXECUTED
    case 5: return "red"; // ENDED
    default: return "gray";
  }
};

export function useAgendas({ isConnected, setStatusMessage }: UseAgendasProps) {
  const [agendas, setAgendas] = useState<AgendaWithMetadata[]>([]);
  const [isLoadingAgendas, setIsLoadingAgendas] = useState(false);
  const [agendasError, setAgendasError] = useState<string | null>(null);
  const [hasLoadedAgendasOnce, setHasLoadedAgendasOnce] = useState(false);

  // Agenda 로드 함수 - 실제 AgendaManager 컨트랙트에서 데이터 가져오기
  const loadAgendas = useCallback(async () => {
    setIsLoadingAgendas(true);
    setAgendasError(null);
    setStatusMessage(MESSAGES.LOADING.AGENDAS);

    try {
      // 견고한 Public Client 생성 (Fallback & 재시도 지원)
      const publicClient = await createRobustPublicClient();

      // AgendaManager 주소는 설정 파일에서 직접 사용
      const agendaManagerAddress = CONTRACTS.daoAgendaManager.address;
      console.log('📍 AgendaManager contract address:', agendaManagerAddress);

      if (!agendaManagerAddress) {
        throw new Error('AgendaManager contract address not configured');
      }

      // AgendaManager에서 총 agenda 개수 가져오기
      const numAgendas = await readContractWithRetry(
        () => publicClient.readContract({
          address: agendaManagerAddress,
          abi: daoAgendaManagerAbi,
          functionName: 'numAgendas',
        }) as Promise<bigint>,
        'Total agendas count'
      );

      const totalAgendas = Number(numAgendas);
      console.log('📊 Total agendas:', totalAgendas);

      if (totalAgendas === 0) {
        setAgendas([]);
        setHasLoadedAgendasOnce(true);
        setStatusMessage("No agendas found");
        return;
      }

      // 각 agenda 데이터 가져오기 (최신순으로 처리)
      const agendaDetails: AgendaWithMetadata[] = [];
      const BATCH_SIZE = CONTRACT_READ_SETTINGS.BATCH_SIZE;
      const BATCH_DELAY_MS = CONTRACT_READ_SETTINGS.BATCH_DELAY_MS;

      for (let i = totalAgendas - 1; i >= 0; i -= BATCH_SIZE) {
        const startIndex = Math.max(0, i - BATCH_SIZE + 1);
        const currentBatch = i - startIndex + 1;
        const progress = Math.round(((totalAgendas - i) / totalAgendas) * 100);

        setStatusMessage(`Loading agendas... ${totalAgendas - i}/${totalAgendas} (${progress}%)`);

        // 배치로 agenda 데이터 가져오기
        const batchPromises = Array.from({ length: currentBatch }, (_, j) => {
          const agendaId = i - j;
          return readContractWithRetry(
            () => publicClient.readContract({
              address: agendaManagerAddress,
              abi: daoAgendaManagerAbi,
              functionName: 'agendas',
              args: [BigInt(agendaId)],
            }) as Promise<{
              createdTimestamp: bigint;
              noticeEndTimestamp: bigint;
              votingPeriodInSeconds: bigint;
              votingStartedTimestamp: bigint;
              votingEndTimestamp: bigint;
              executableLimitTimestamp: bigint;
              executedTimestamp: bigint;
              countingYes: bigint;
              countingNo: bigint;
              countingAbstain: bigint;
              status: number;
              result: number;
              voters: readonly string[];
              executed: boolean;
            }>,
            `Agenda ${agendaId} data`
          ).then((agendaData) => {
            // AgendaWithMetadata 인터페이스에 맞게 변환
            const agenda: AgendaWithMetadata = {
              id: agendaId,
              title: `Agenda #${agendaId}`,
              description: `Agenda ${agendaId} from blockchain`,
              author: "Unknown", // TODO: 이벤트나 메타데이터에서 가져와야 함
              date: new Date(Number(agendaData.createdTimestamp) * 1000).toLocaleDateString(),
              status: getAgendaStatusText(agendaData.status),
              statusColor: getAgendaStatusColor(agendaData.status),
              votesFor: Number(agendaData.countingYes),
              votesAgainst: Number(agendaData.countingNo),
              executionTime: agendaData.executedTimestamp > 0 ? Number(agendaData.executedTimestamp) : null,
              isExecuted: agendaData.executed,
            };

            return agenda;
          }).catch((error) => {
            console.warn(`Failed to fetch agenda ${agendaId}:`, error);
            return null;
          });
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((result): result is AgendaWithMetadata => result !== null);

        agendaDetails.push(...validResults);

        // 마지막 배치가 아니면 잠시 대기 (Rate limiting)
        if (startIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      setAgendas(agendaDetails);
      setHasLoadedAgendasOnce(true);
      setStatusMessage(`Loaded ${agendaDetails.length} agendas from AgendaManager contract`);

    } catch (err) {
      console.error("Failed to load agendas from AgendaManager:", err);
      setAgendasError("Failed to load agendas from blockchain");
      setStatusMessage("Error loading agendas from AgendaManager contract");
      setAgendas([]);
    } finally {
      setIsLoadingAgendas(false);
    }
  }, [setStatusMessage]);

  // Agenda 새로고침 - 지갑 연결 여부와 관계없이 가능
  const refreshAgendas = useCallback(async () => {
    setHasLoadedAgendasOnce(false);
    await loadAgendas();
  }, [loadAgendas]);

  // 특정 Agenda 새로고침 - 실제 AgendaManager에서 가져오기
  const refreshAgenda = useCallback(async (agendaId: number) => {
    try {
      const publicClient = await createRobustPublicClient();

      // AgendaManager 주소는 설정 파일에서 직접 사용
      const agendaManagerAddress = CONTRACTS.daoAgendaManager.address;

      if (!agendaManagerAddress) {
        throw new Error('AgendaManager contract address not configured');
      }

      // 특정 agenda 데이터 가져오기
      const agendaData = await readContractWithRetry(
        () => publicClient.readContract({
          address: agendaManagerAddress,
          abi: daoAgendaManagerAbi,
          functionName: 'agendas',
          args: [BigInt(agendaId)],
        }) as Promise<{
          createdTimestamp: bigint;
          noticeEndTimestamp: bigint;
          votingPeriodInSeconds: bigint;
          votingStartedTimestamp: bigint;
          votingEndTimestamp: bigint;
          executableLimitTimestamp: bigint;
          executedTimestamp: bigint;
          countingYes: bigint;
          countingNo: bigint;
          countingAbstain: bigint;
          status: number;
          result: number;
          voters: readonly string[];
          executed: boolean;
        }>,
        `Refresh agenda ${agendaId}`
      );

      // 기존 agenda 목록에서 해당 agenda만 업데이트
      setAgendas(prev => prev.map(agenda =>
        agenda.id === agendaId
          ? {
              ...agenda,
              status: getAgendaStatusText(agendaData.status),
              statusColor: getAgendaStatusColor(agendaData.status),
              votesFor: Number(agendaData.countingYes),
              votesAgainst: Number(agendaData.countingNo),
              isExecuted: agendaData.executed,
              executionTime: agendaData.executedTimestamp > 0 ? Number(agendaData.executedTimestamp) : agenda.executionTime,
            }
          : agenda
      ));

      console.log(`✅ Refreshed agenda ${agendaId}`);
    } catch (error) {
      console.error(`Failed to refresh agenda ${agendaId}:`, error);
    }
  }, []);

  // 특정 Agenda 가져오기 - AgendaManager에서 실제 데이터 조회
  const getAgenda = useCallback(async (agendaId: number): Promise<AgendaWithMetadata | null> => {
    // 메모리에서 찾기
    const existingAgenda = agendas.find(agenda => agenda.id === agendaId);
    if (existingAgenda) {
      return existingAgenda;
    }

    // 메모리에 없으면 AgendaManager에서 가져오기
    try {
      const publicClient = await createRobustPublicClient();

      // AgendaManager 주소는 설정 파일에서 직접 사용
      const agendaManagerAddress = CONTRACTS.daoAgendaManager.address;

      if (!agendaManagerAddress) {
        throw new Error('AgendaManager contract address not configured');
      }

      const agendaData = await readContractWithRetry(
        () => publicClient.readContract({
          address: agendaManagerAddress,
          abi: daoAgendaManagerAbi,
          functionName: 'agendas',
          args: [BigInt(agendaId)],
        }) as Promise<{
          createdTimestamp: bigint;
          noticeEndTimestamp: bigint;
          votingPeriodInSeconds: bigint;
          votingStartedTimestamp: bigint;
          votingEndTimestamp: bigint;
          executableLimitTimestamp: bigint;
          executedTimestamp: bigint;
          countingYes: bigint;
          countingNo: bigint;
          countingAbstain: bigint;
          status: number;
          result: number;
          voters: readonly string[];
          executed: boolean;
        }>,
        `Get agenda ${agendaId}`
      );

      return {
        id: agendaId,
        title: `Agenda #${agendaId}`,
        description: `Agenda ${agendaId} from blockchain`,
        author: "Unknown",
        date: new Date(Number(agendaData.createdTimestamp) * 1000).toLocaleDateString(),
        status: getAgendaStatusText(agendaData.status),
        statusColor: getAgendaStatusColor(agendaData.status),
        votesFor: Number(agendaData.countingYes),
        votesAgainst: Number(agendaData.countingNo),
        executionTime: agendaData.executedTimestamp > 0 ? Number(agendaData.executedTimestamp) : null,
        isExecuted: agendaData.executed,
      };
    } catch (error) {
      console.error(`Failed to get agenda ${agendaId}:`, error);
      return null;
    }
  }, [agendas]);

  // 아젠다 실행 가능 여부 체크 함수 - 지갑 연결된 경우에만 의미있음
  const canExecuteAgenda = useCallback((agendaId: number): boolean => {
    if (!isConnected) return false; // 실행은 지갑 연결 필요

    // 실제로는 아젠다 상태와 사용자 권한을 확인
    const agenda = agendas.find(a => a.id === agendaId);
    if (!agenda) return false;

    // 승인된 아젠다만 실행 가능
    return agenda.status === "WAITING EXECUTION" && !agenda.isExecuted;
  }, [isConnected, agendas]);

  // 상태 초기화 함수 (필요한 경우)
  const resetAgendasState = useCallback(() => {
    setAgendas([]);
    setAgendasError(null);
    setHasLoadedAgendasOnce(false);
  }, []);

  return {
    agendas,
    isLoadingAgendas,
    agendasError,
    hasLoadedAgendasOnce,
    loadAgendas,
    refreshAgendas,
    refreshAgenda,
    getAgenda,
    canExecuteAgenda,
    resetAgendasState,
  };
}