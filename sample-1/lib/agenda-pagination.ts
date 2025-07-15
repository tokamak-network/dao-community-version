/**
 * 아젠다 페이지네이션 전용 모듈
 * 기존 로직과 분리하여 페이지 단위로 아젠다를 로드
 */

import { AgendaWithMetadata } from "@/types/agenda";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { daoAgendaManagerAbi } from "@/abis/dao-agenda-manager";
import { queueRPCRequest, getSharedPublicClient } from "@/lib/shared-rpc-client";
import {
  getAllAgendaMetadata,
  getNetworkName,
  getMetadataUrl,
  AgendaMetadata
} from "@/lib/utils";
import { getCreatorAddress, getCreatorSignature } from "./agenda-context-functions";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  loadedPages: Set<number>;
  agendas: AgendaWithMetadata[];
  isLoading: boolean;
  error: string | null;
}

export interface PaginationCallbacks {
  onStateChange: (state: PaginationState) => void;
  onStatusMessage: (message: string) => void;
  onBatchLoaded?: (batch: AgendaWithMetadata[]) => void;
}

/**
 * 1. 총 아젠다 개수 가져오기
 */
export const getTotalAgendaCount = async (): Promise<number> => {
  return await queueRPCRequest(async () => {
    const publicClient = await getSharedPublicClient();
    const result = await publicClient.readContract({
      address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
      abi: daoAgendaManagerAbi,
      functionName: "numAgendas",
    });
    return Number(result);
  }, "Load total agenda count", "MEDIUM");
};

/**
 * 특정 아젠다 데이터 조회 (상세정보용 - LOW 우선순위)
 */
const getAgendaData = async (agendaId: number) => {
  return await queueRPCRequest(async () => {
    const publicClient = await getSharedPublicClient();
    return await publicClient.readContract({
      address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
      abi: daoAgendaManagerAbi,
      functionName: "agendas",
      args: [BigInt(agendaId)],
    });
  }, `Load agenda data for ID ${agendaId}`, "LOW");
};

/**
 * 트랜잭션 데이터 가져오기 (calldata) - LOW 우선순위
 */
const getTransactionData = async (txHash: string): Promise<string | null> => {
  return await queueRPCRequest(async () => {
    const publicClient = await getSharedPublicClient();
    const transaction = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    return transaction.input || null;
  }, `Load transaction data for ${txHash}`, "LOW");
};

/**
 * 2. 특정 페이지의 아젠다들을 블록 단위로 로드 (중단 지원)
 */
export const loadAgendaPageWithAbort = async (
  page: number,
  pageSize: number,
  totalCount: number,
  existingAgendas: AgendaWithMetadata[],
  callbacks: PaginationCallbacks,
  abortSignal?: AbortSignal
): Promise<AgendaWithMetadata[]> => {

  callbacks.onStatusMessage(`Loading page ${page}...`);

  // 페이지네이션 계산 (최신순)
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);

  if (startIndex >= totalCount) {
    return [];
  }

  // 최신순으로 아젠다 ID 계산 (totalCount부터 역순)
  const potentialAgendaIds: number[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const agendaId = totalCount - 1 - i; // 최신순: totalCount-1, totalCount-2, ...
    if (agendaId < 0) break;
    potentialAgendaIds.push(agendaId);
  }

  // 기존 아젠다 목록에서 이미 로드된 것들 확인
  const existingAgendaIds = new Set(existingAgendas.map((agenda: AgendaWithMetadata) => agenda.id));

  // 아직 로드되지 않은 아젠다 ID만 필터링
  const agendaIds = potentialAgendaIds.filter(id => !existingAgendaIds.has(id));

  if (agendaIds.length === 0) {
    callbacks.onStatusMessage(`All agendas for page ${page} already loaded`);
    // 기존 아젠다에서 해당 페이지 범위의 아젠다들 반환
    return existingAgendas.filter((agenda: AgendaWithMetadata) => potentialAgendaIds.includes(agenda.id));
  }

  callbacks.onStatusMessage(`Loading ${agendaIds.length} new agendas for page ${page} (${potentialAgendaIds.length - agendaIds.length} already loaded)...`);

    // 블록 단위로 아젠다 데이터 로드
  const { BATCH_SIZE, BATCH_DELAY_MS } = CONTRACT_READ_SETTINGS;
  const loadedAgendas: AgendaWithMetadata[] = [];

  for (let i = 0; i < agendaIds.length; i += BATCH_SIZE) {
    // 5. 각 블록 시작 전에 중단 확인
    if (abortSignal?.aborted) {
      throw new Error('Loading cancelled');
    }

    const batchIds = agendaIds.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(agendaIds.length / BATCH_SIZE);

    callbacks.onStatusMessage(`Loading batch ${batchNumber}/${totalBatches} for page ${page}...`);

    // 배치 내 아젠다들을 병렬로 로드
    const batchPromises = batchIds.map(async (agendaId) => {
      try {
        // 5. 각 아젠다 로드 전에 중단 확인
        if (abortSignal?.aborted) {
          throw new Error('Loading cancelled');
        }

        const agendaData = await getAgendaData(agendaId);

        // AgendaWithMetadata 인터페이스에 맞게 변환
        const agenda: AgendaWithMetadata = {
          ...agendaData,
          id: agendaId,
          voters: Array.from(agendaData.voters),
          creator: {
            address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
            signature: ""
          }
        };

        return agenda;
      } catch (error) {
        if (error instanceof Error && error.message === 'Loading cancelled') {
          throw error;
        }
        console.warn(`Failed to fetch agenda ${agendaId}:`, error);
        return null;
      }
    });

    // 배치 결과 수집
    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((result): result is AgendaWithMetadata => result !== null);

    loadedAgendas.push(...validResults);

    // 메타데이터 로딩
    if (validResults.length > 0) {
      callbacks.onStatusMessage(`Loading metadata for batch ${batchNumber}/${totalBatches} for page ${page}...`);
      try {
        const agendaIds = validResults.map(a => a.id);
        const metadataMap = await getAllAgendaMetadata(agendaIds);
        validResults.forEach((agenda) => {
          const metadata = metadataMap[agenda.id];
          if (metadata) {
            agenda.title = metadata.title || agenda.title;
            agenda.description = metadata.description || agenda.description;
            agenda.creator = {
              address: getCreatorAddress(metadata.creator),
              signature: getCreatorSignature(metadata.creator),
            };
            agenda.snapshotUrl = metadata.snapshotUrl;
            agenda.discourseUrl = metadata.discourseUrl;
            agenda.network = metadata.network;
            agenda.transaction = metadata.transaction;
            agenda.actions = metadata.actions;
          }
        });
      } catch (error) {
        callbacks.onStatusMessage(`Failed to load metadata for batch ${batchNumber}: ${error}`);
      }
      // 배치 단위로 콜백 호출
      if (callbacks.onBatchLoaded) {
        callbacks.onBatchLoaded(validResults);
      }
    }

    // Rate limiting을 위한 짧은 대기 (마지막 배치가 아닌 경우)
    if (i + BATCH_SIZE < agendaIds.length) {
      // 5. 대기 중에도 중단 확인
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, BATCH_DELAY_MS);
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Loading cancelled'));
          });
        }
      });
    }
  }

  // 기존 아젠다와 새로 로드된 아젠다를 합쳐서 해당 페이지 범위의 모든 아젠다 반환
  const allPageAgendas = [
    ...existingAgendas.filter((agenda: AgendaWithMetadata) => potentialAgendaIds.includes(agenda.id)),
    ...loadedAgendas
  ];

  // ID 순으로 정렬 (최신순)
  allPageAgendas.sort((a, b) => b.id - a.id);

  return allPageAgendas;
};

/**
 * 페이지네이션 관리자 클래스
 */
export class AgendaPagination {
  private state: PaginationState;
  private callbacks: PaginationCallbacks;
  private abortController: AbortController | null = null; // 로딩 중단을 위한 컨트롤러

  constructor(pageSize: number = 10, callbacks: PaginationCallbacks) {
    this.state = {
      currentPage: 0,
      pageSize,
      totalCount: 0,
      loadedPages: new Set(),
      agendas: [],
      isLoading: false,
      error: null,
    };
    this.callbacks = callbacks;
  }

  /**
   * 1. 초기화 - 총 아젠다 개수 가져오기
   */
  async initialize(): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });

      const totalCount = await getTotalAgendaCount();
      this.setState({ totalCount });

      this.callbacks.onStatusMessage(`Found ${totalCount} total agendas`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get total agenda count';
      this.setState({ error: errorMessage });
      this.callbacks.onStatusMessage(errorMessage);
    } finally {
      this.setState({ isLoading: false });
    }
  }

    /**
   * 현재 로딩 중단
   */
  private abortCurrentLoading(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 3. 특정 페이지까지의 데이터 로드 (누적)
   */
  async loadToPage(targetPage: number): Promise<void> {
    // 5. 이전 로딩이 있다면 중단
    this.abortCurrentLoading();

    if (this.state.totalCount === 0) {
      await this.initialize();
    }

    // 새로운 AbortController 생성
    this.abortController = new AbortController();
    const currentAbortController = this.abortController;

    try {
      this.setState({ isLoading: true, error: null });

      // 아직 로드되지 않은 페이지들 찾기
      const pagesToLoad: number[] = [];
      for (let page = 1; page <= targetPage; page++) {
        if (!this.state.loadedPages.has(page)) {
          pagesToLoad.push(page);
        }
      }

      if (pagesToLoad.length === 0) {
        this.setState({ currentPage: targetPage });
        return;
      }

      // 각 페이지를 순차적으로 로드
      for (const page of pagesToLoad) {
        // 5. 로딩이 중단되었는지 확인
        if (currentAbortController.signal.aborted) {
          this.callbacks.onStatusMessage(`Loading cancelled`);
          return;
        }

        const pageAgendas = await loadAgendaPageWithAbort(
          page,
          this.state.pageSize,
          this.state.totalCount,
          this.state.agendas, // 기존 아젠다 목록 전달
          this.callbacks,
          currentAbortController.signal
        );

        // 5. 로딩 완료 후에도 중단되었는지 확인
        if (currentAbortController.signal.aborted) {
          this.callbacks.onStatusMessage(`Loading cancelled`);
          return;
        }

        // 페이지 데이터를 상태에 추가
        const newLoadedPages = new Set(this.state.loadedPages);
        newLoadedPages.add(page);

        this.setState({
          agendas: [...this.state.agendas, ...pageAgendas],
          loadedPages: newLoadedPages,
        });
      }

      this.setState({ currentPage: targetPage });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.callbacks.onStatusMessage('Loading cancelled');
        return;
      }

      const errorMessage = error instanceof Error ? error.message : 'Failed to load agenda page';
      this.setState({ error: errorMessage });
      this.callbacks.onStatusMessage(errorMessage);
    } finally {
      this.setState({ isLoading: false });
      // 완료되면 AbortController 정리
      if (this.abortController === currentAbortController) {
        this.abortController = null;
      }
    }
  }

  /**
   * 4. 다음 페이지 로드 (더보기)
   */
  async loadNextPage(): Promise<void> {
    const nextPage = this.state.currentPage + 1;
    const maxPage = Math.ceil(this.state.totalCount / this.state.pageSize);

    if (nextPage <= maxPage) {
      await this.loadToPage(nextPage);
    }
  }

  /**
   * 현재 상태 가져오기
   */
  getState(): PaginationState {
    return { ...this.state };
  }

  /**
   * 더 로드할 수 있는지 확인
   */
  hasMore(): boolean {
    const maxPage = Math.ceil(this.state.totalCount / this.state.pageSize);
    return this.state.currentPage < maxPage;
  }

  /**
   * 남은 아젠다 개수
   */
  getRemainingCount(): number {
    const loadedCount = this.state.currentPage * this.state.pageSize;
    return Math.max(0, this.state.totalCount - loadedCount);
  }

  private setState(updates: Partial<PaginationState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange(this.state);
  }

  // 아젠다를 upsert(있으면 갱신, 없으면 추가)하는 메서드 (prev 상태 기준, id 중복 방지)
  upsertAgenda(newAgenda: any) {
    const agendas = this.state.agendas || [];
    const exists = agendas.some((a: any) => a.id === newAgenda.id);

    console.log('🔄 UpsertAgenda called:', {
      agendaId: newAgenda.id,
      agendaTitle: newAgenda.title,
      exists,
      currentAgendasCount: agendas.length,
      currentAgendaIds: agendas.map((a: any) => a.id)
    });

    this.state = {
      ...this.state,
      agendas: (() => {
        if (exists) {
          const updated = agendas.map((a: any) => a.id === newAgenda.id ? newAgenda : a);
          console.log('✏️ Updated existing agenda:', { agendaId: newAgenda.id });
          return updated;
        } else {
          const newList = [newAgenda, ...agendas];
          console.log('➕ Added new agenda to list:', {
            agendaId: newAgenda.id,
            newListLength: newList.length,
            newListIds: newList.map((a: any) => a.id)
          });
          return newList;
        }
      })(),
    };
    this.callbacks.onStateChange?.(this.state);
    console.log('📤 State change callback called');
  }
}