/**
 * 공유 RPC 클라이언트 관리 with Multi-Worker Priority Queue
 * 여러 워커가 동시에 처리하여 속도 향상, DAO 정보 우선 처리
 */
import { createRobustPublicClient } from "./rpc-utils";
import type { PublicClient } from "viem";
import { MULTI_WORKER_CONFIG } from "@/config/rpc";

// 로그 출력 제어 함수
const isWorkerLogEnabled = () => process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true';
const workerLog = (...args: any[]) => {
  if (isWorkerLogEnabled()) {
    console.log(...args);
  }
};

// 우선순위 큐를 위한 요청 타입
interface PriorityQueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  context: string;
  priority: number; // 1=HIGH, 2=MEDIUM, 3=LOW
  timestamp: number;
}

// 워커 상태 타입
interface WorkerState {
  id: number;
  isActive: boolean;
  currentRequest: string | null;
  requestCount: number;
  lastRequestTime: number;
  queue: PriorityQueuedRequest<any>[]; // 개별 워커 큐
}

// 진행률 추적 타입
interface ProgressState {
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;
  percentage: number;
  currentTasks: string[];
}

class MultiWorkerRPCClient {
  private static instance: MultiWorkerRPCClient;
  private publicClient: PublicClient | null = null;
  private isInitializing = false;
  private initPromise: Promise<PublicClient> | null = null;

  // Multi-Worker Request Queue 관리
  private priorityQueue: PriorityQueuedRequest<any>[] = [];
  private isProcessingQueue = false;
  private workers: WorkerState[] = [];
  private currentWorkerIndex = 0; // 라운드 로빈을 위한 현재 워커 인덱스
  private progressState: ProgressState = {
    totalRequests: 0,
    completedRequests: 0,
    failedRequests: 0,
    percentage: 0,
    currentTasks: []
  };

  // 진행률 업데이트 콜백
  private progressCallbacks: ((progress: ProgressState) => void)[] = [];

  private constructor() {
    this.initializeWorkers();
    this.startProgressTracking();
  }

  public static getInstance(): MultiWorkerRPCClient {
    if (!MultiWorkerRPCClient.instance) {
      MultiWorkerRPCClient.instance = new MultiWorkerRPCClient();
    }
    return MultiWorkerRPCClient.instance;
  }

  /**
   * 워커들 초기화
   */
  private initializeWorkers() {
    for (let i = 0; i < MULTI_WORKER_CONFIG.workerCount; i++) {
      this.workers.push({
        id: i,
        isActive: false,
        currentRequest: null,
        requestCount: 0,
        lastRequestTime: 0,
        queue: [] // 개별 워커 큐 초기화
      });
    }
    workerLog(`🚀 Workers initialization completed:`);
    workerLog(`  📍 HIGH priority (DAO queries + DAO challenges): Worker 0-1 (2 workers)`);
    workerLog(`  📍 MEDIUM priority (Agenda list): Worker 2 (1 worker)`);
    workerLog(`  📍 LOW priority (Agenda details + Config values): Worker 3-4 (2 workers)`);
  }

  /**
   * 진행률 추적 시작
   */
  private startProgressTracking() {
    if (!MULTI_WORKER_CONFIG.progressTracking.enabled) return;

    setInterval(() => {
      this.updateProgress();
    }, MULTI_WORKER_CONFIG.progressTracking.updateInterval);
  }

  /**
   * 진행률 업데이트
   */
  private updateProgress() {
    const total = this.progressState.totalRequests;
    const completed = this.progressState.completedRequests;
    const failed = this.progressState.failedRequests;

    this.progressState.percentage = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
    this.progressState.currentTasks = this.workers
      .filter(w => w.isActive && w.currentRequest)
      .map(w => w.currentRequest!);

    // 등록된 콜백들에게 진행률 알림
    this.progressCallbacks.forEach(callback => {
      try {
        callback({ ...this.progressState });
      } catch (error) {
        console.error("Progress callback error:", error);
      }
    });
  }

  /**
   * 진행률 콜백 등록
   */
  public onProgress(callback: (progress: ProgressState) => void) {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 공유 Public Client 가져오기 (싱글톤)
   */
  public async getPublicClient(): Promise<PublicClient> {
    if (this.publicClient) {
      return this.publicClient;
    }

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.initializeClient();

    try {
      this.publicClient = await this.initPromise;
      workerLog("🔗 Shared PublicClient initialization completed");
      return this.publicClient;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  private async initializeClient(): Promise<PublicClient> {
    workerLog("🔗 Initializing Shared PublicClient...");
    return await createRobustPublicClient();
  }

  /**
   * 우선순위를 가진 요청을 큐에 추가 (우선순위별 워커 할당)
   */
  public async queueRequest<T>(
    requestFn: () => Promise<T>,
    context: string = "Unknown request",
    priority: "HIGH" | "MEDIUM" | "LOW" = "LOW"
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const priorityValue = MULTI_WORKER_CONFIG.priorities[priority];

      const queuedRequest: PriorityQueuedRequest<T> = {
        id: requestId,
        execute: requestFn,
        resolve,
        reject,
        context,
        priority: priorityValue,
        timestamp: Date.now()
      };

      // 우선순위별 워커 할당
      let selectedWorker: WorkerState;

      if (priority === "HIGH") {
        // HIGH: Worker 0-1 (2개) - DAO 조회 + DAO 챌린지
        const highWorkerIndex = this.currentWorkerIndex % 2; // 0, 1 중 선택
        selectedWorker = this.workers[highWorkerIndex];
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % 2;
      } else if (priority === "MEDIUM") {
        // MEDIUM: Worker 2 (1개) - 아젠다 목록
        selectedWorker = this.workers[2];
      } else {
        // LOW: Worker 3-4 (2개) - 아젠다 상세 + 환경설정값
        const lowWorkerIndex = 3 + (this.currentWorkerIndex % 2); // 3, 4 중 선택
        selectedWorker = this.workers[lowWorkerIndex];
        this.currentWorkerIndex = (this.currentWorkerIndex + 1) % 2;
      }

      // 우선순위에 따라 워커의 개별 큐에 삽입
      const insertIndex = this.findInsertIndexForWorker(selectedWorker.queue, priorityValue);
      selectedWorker.queue.splice(insertIndex, 0, queuedRequest);

      // 총 요청 수 증가
      this.progressState.totalRequests++;

      // 해당 워커가 비활성 상태면 시작
      if (!selectedWorker.isActive) {
        this.runWorker(selectedWorker);
      }
    });
  }

  /**
   * 우선순위에 따른 삽입 위치 찾기 (전역 큐용)
   */
  private findInsertIndex(priority: number): number {
    for (let i = 0; i < this.priorityQueue.length; i++) {
      if (this.priorityQueue[i].priority > priority) {
        return i;
      }
    }
    return this.priorityQueue.length;
  }

  /**
   * 워커 개별 큐에서 우선순위에 따른 삽입 위치 찾기
   */
  private findInsertIndexForWorker(workerQueue: PriorityQueuedRequest<any>[], priority: number): number {
    for (let i = 0; i < workerQueue.length; i++) {
      if (workerQueue[i].priority > priority) {
        return i;
      }
    }
    return workerQueue.length;
  }

  /**
   * 멀티워커 큐 프로세서 시작
   */
  private async startQueueProcessor() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    workerLog(`🚀 Starting multi-worker queue processor (${MULTI_WORKER_CONFIG.workerCount} workers)`);

    // 모든 워커를 동시에 실행
    const workerPromises = this.workers.map(worker => this.runWorker(worker));

    try {
      await Promise.allSettled(workerPromises);
    } finally {
      this.isProcessingQueue = false;
      workerLog("✅ All workers processing completed");
    }
  }

  /**
   * 개별 워커 실행 (라운드 로빈)
   */
  private async runWorker(worker: WorkerState) {
    while (worker.queue.length > 0) {
      const request = worker.queue.shift();
      if (!request) continue;

      worker.isActive = true;
      worker.currentRequest = request.context;

      try {
        // Rate limiting: 워커별 최소 간격 보장
        const now = Date.now();
        const timeSinceLastRequest = now - worker.lastRequestTime;

        if (timeSinceLastRequest < MULTI_WORKER_CONFIG.workerRequestInterval) {
          const waitTime = MULTI_WORKER_CONFIG.workerRequestInterval - timeSinceLastRequest;
          await this.delay(waitTime);
        }

        // 요청 실행
        const result = await request.execute();
        request.resolve(result);

        // 성공 통계 업데이트
        this.progressState.completedRequests++;
        worker.requestCount++;
        worker.lastRequestTime = Date.now();

      } catch (error) {
        if (isWorkerLogEnabled()) {
          console.error(`❌ Worker-${worker.id} request failed: ${request.context}`, error);
        }
        request.reject(error);
        this.progressState.failedRequests++;
      } finally {
        worker.isActive = false;
        worker.currentRequest = null;
        this.updateProgress();
      }
    }
  }

  /**
   * 딜레이 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 클라이언트 재초기화
   */
  public async resetClient(): Promise<PublicClient> {
    workerLog("🔄 PublicClient 재초기화");
    this.publicClient = null;
    this.isInitializing = false;
    this.initPromise = null;
    return await this.getPublicClient();
  }

  /**
   * 클라이언트 및 큐 상태 확인
   */
  public getStatus() {
    const activeWorkers = this.workers.filter(w => w.isActive).length;
    const totalProcessed = this.workers.reduce((sum, w) => sum + w.requestCount, 0);
    const totalQueueLength = this.workers.reduce((sum, w) => sum + w.queue.length, 0);

    return {
      hasClient: !!this.publicClient,
      isInitializing: this.isInitializing,
      clientChainId: this.publicClient?.chain?.id,
      queueLength: totalQueueLength, // 모든 워커 큐의 총합
      isProcessingQueue: this.isProcessingQueue,
      workerCount: this.workers.length,
      activeWorkers,
      totalProcessed,
      progress: { ...this.progressState },
      workers: this.workers.map(w => ({
        id: w.id,
        isActive: w.isActive,
        currentRequest: w.currentRequest,
        requestCount: w.requestCount,
        queueLength: w.queue.length // 개별 워커 큐 길이 추가
      }))
    };
  }

  /**
   * 큐 상태 로깅
   */
  public logQueueStatus() {
    if (!isWorkerLogEnabled()) return;

    const status = this.getStatus();
    console.log("🔍 Multi-Worker RPC Queue Status:", {
      queueLength: status.queueLength,
      processing: status.isProcessingQueue,
      activeWorkers: `${status.activeWorkers}/${status.workerCount}`,
      totalProcessed: status.totalProcessed,
      progress: `${status.progress.percentage}% (${status.progress.completedRequests}/${status.progress.totalRequests})`,
      currentTasks: status.progress.currentTasks
    });
  }

  /**
   * 진행률 초기화
   */
  public resetProgress() {
    this.progressState = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      percentage: 0,
      currentTasks: []
    };
  }
}

// 편의 함수들 export
const multiWorkerRPCClient = MultiWorkerRPCClient.getInstance();

/**
 * 공유 Public Client 가져오기
 */
export const getSharedPublicClient = () => multiWorkerRPCClient.getPublicClient();

/**
 * 우선순위를 가진 요청을 큐에 추가하여 멀티워커로 처리
 */
export const queueRPCRequest = <T>(
  requestFn: () => Promise<T>,
  context?: string,
  priority?: "HIGH" | "MEDIUM" | "LOW"
): Promise<T> => {
  return multiWorkerRPCClient.queueRequest(requestFn, context, priority);
};

/**
 * 클라이언트 재초기화
 */
export const resetSharedPublicClient = () => multiWorkerRPCClient.resetClient();

/**
 * 클라이언트 상태 확인
 */
export const getSharedClientStatus = () => multiWorkerRPCClient.getStatus();

/**
 * 큐 상태 로깅
 */
export const logSharedQueueStatus = () => multiWorkerRPCClient.logQueueStatus();

/**
 * 진행률 콜백 등록
 */
export const onRPCProgress = (callback: (progress: { totalRequests: number; completedRequests: number; failedRequests: number; percentage: number; currentTasks: string[] }) => void) => {
  return multiWorkerRPCClient.onProgress(callback);
};

/**
 * 진행률 초기화
 */
export const resetRPCProgress = () => multiWorkerRPCClient.resetProgress();