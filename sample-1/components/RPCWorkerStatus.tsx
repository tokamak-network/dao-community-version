"use client";

import React, { useState, useEffect } from 'react';
import { getSharedClientStatus, logSharedQueueStatus, onRPCProgress } from '@/lib/shared-rpc-client';
import { MULTI_WORKER_CONFIG } from '@/config/rpc';

interface WorkerStatusProps {
  showDetails?: boolean;
}

export default function RPCWorkerStatus({ showDetails = false }: WorkerStatusProps) {
  const [status, setStatus] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 환경 변수로 워커 로그 표시 여부 제어
  const isWorkerLogEnabled = process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true';

  // 워커 로그가 비활성화되어 있으면 컴포넌트를 렌더링하지 않음
  if (!isWorkerLogEnabled) {
    return null;
  }

  useEffect(() => {
    // 진행률 추적 시작
    const unsubscribe = onRPCProgress((progressData) => {
      setProgress(progressData);
    });

    // 상태 업데이트 주기적 실행
    const interval = setInterval(() => {
      const currentStatus = getSharedClientStatus();
      setStatus(currentStatus);
    }, 1000);

    // 초기 상태 로드
    const currentStatus = getSharedClientStatus();
    setStatus(currentStatus);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!status) return null;

  const handleToggleDetails = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      // 디테일 열 때 콘솔에 상태 로깅
      logSharedQueueStatus();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* 요약 정보 - 더 컴팩트하게 */}
      <div
        className="bg-gray-800 bg-opacity-90 text-white rounded-lg p-2 cursor-pointer hover:bg-opacity-100 transition-all duration-200 text-xs"
        onClick={handleToggleDetails}
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-medium">
            {MULTI_WORKER_CONFIG.workerCount}W
          </span>
          {status.activeWorkers > 0 && (
            <span className="text-green-300">
              {status.activeWorkers}↑
            </span>
          )}
          {status.queueLength > 0 && (
            <span className="text-orange-300">
              Q{status.queueLength}
            </span>
          )}
          {progress && progress.percentage > 0 && (
            <span className="text-blue-300">
              {progress.percentage}%
            </span>
          )}
        </div>
      </div>

      {/* 상세 정보 - 하단에서 위로 펼쳐지도록 */}
      {isVisible && showDetails && (
        <div className="mb-2 bg-gray-800 bg-opacity-95 text-white border border-gray-600 rounded-lg p-3 shadow-xl w-80 min-h-[300px] text-xs">
          <h3 className="font-semibold text-gray-100 mb-2 text-sm">RPC Workers</h3>

          {/* 진행률 바 - 고정 높이 */}
          <div className="mb-3 h-16">
            {progress && progress.totalRequests > 0 ? (
              <>
                <div className="flex justify-between text-gray-300 mb-1">
                  <span>Progress</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1.5">
                  <div
                    className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="text-gray-400 mt-1">
                  {progress.completedRequests}/{progress.totalRequests}
                  {progress.failedRequests > 0 && (
                    <span className="text-red-400 ml-1">({progress.failedRequests} failed)</span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">No active requests</div>
            )}
          </div>

          {/* 워커 상태 - 고정 높이 */}
          <div className="space-y-1 mb-3 h-16">
            <div className="flex justify-between">
              <span className="text-gray-300">Active:</span>
              <span className="text-green-300">{status.activeWorkers}/{status.workerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Queue:</span>
              <span className="text-orange-300">{status.queueLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Processed:</span>
              <span className="text-blue-300">{status.totalProcessed}</span>
            </div>
          </div>

          {/* 개별 워커 상태 - 고정 높이 */}
          <div className="mb-3 h-12">
            {status.workers && status.workers.length > 0 ? (
              <>
                <div className="text-gray-300 mb-1">Workers:</div>
                <div className="flex gap-1 flex-wrap">
                  {status.workers.map((worker: any) => (
                    <div key={worker.id} className="flex items-center gap-1">
                      <span className="text-gray-400">W{worker.id}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${worker.isActive ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                      <span className="text-gray-500">{worker.requestCount}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">No workers</div>
            )}
          </div>

          {/* 현재 작업 중인 태스크 - 고정 높이 */}
          <div className="mb-3 h-20">
            {progress && progress.currentTasks && progress.currentTasks.length > 0 ? (
              <>
                <div className="text-gray-300 mb-1">Tasks:</div>
                <div className="space-y-0.5 overflow-hidden">
                  {progress.currentTasks.slice(0, 3).map((task: string, index: number) => (
                    <div key={index} className="text-gray-400 truncate">
                      {task.substring(0, 30)}...
                    </div>
                  ))}
                  {progress.currentTasks.length > 3 && (
                    <div className="text-gray-500">+{progress.currentTasks.length - 3} more...</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-center py-2">No active tasks</div>
            )}
          </div>

          {/* 설정 정보 - 고정 높이 */}
          <div className="border-t border-gray-600 pt-2 h-12">
            <div className="text-gray-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Interval:</span>
                <span>{MULTI_WORKER_CONFIG.workerRequestInterval}ms</span>
              </div>
              <div className="text-gray-500 text-center">HIGH→MEDIUM→LOW</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}