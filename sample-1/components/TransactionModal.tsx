"use client";

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExecuting: boolean;
  isSuccess: boolean;
  error: string | null | undefined;
  txHash: string | null;
  operation: string | null | undefined;
  operationDisplayName?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  isExecuting,
  isSuccess,
  error,
  txHash,
  operation,
  operationDisplayName
}: TransactionModalProps) {
  const chainId = useChainId();
  const [isMounted, setIsMounted] = useState(false);

  // 🎯 Hydration Error 방지
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 체인 ID에 따른 익스플로러 URL 생성
  const getExplorerUrl = (hash: string) => {
    if (!isMounted) return '#'; // 마운트 전에는 빈 링크

    switch (chainId) {
      case 1: // Ethereum Mainnet
        return `https://etherscan.io/tx/${hash}`;
      case 11155111: // Sepolia Testnet
        return `https://sepolia.etherscan.io/tx/${hash}`;
      case 5: // Goerli Testnet
        return `https://goerli.etherscan.io/tx/${hash}`;
      case 17000: // Holesky Testnet
        return `https://holesky.etherscan.io/tx/${hash}`;
      default:
        return `https://etherscan.io/tx/${hash}`;
    }
  };

  const getOperationDisplayName = (op: string | null) => {
    switch (op) {
      case 'changeMember': return '멤버 챌린지';
      case 'retireMember': return '멤버 은퇴';
      case 'claimActivityReward': return '활동 보상 청구';
      case 'castVote': return '투표';
      case 'updateSeigniorage': return '시뇨리지 업데이트';
      default: return operationDisplayName || '트랜잭션';
    }
  };

  const getOperationIcon = (op: string | null) => {
    switch (op) {
      case 'changeMember': return '⚔️';
      case 'retireMember': return '👋';
      case 'claimActivityReward': return '💰';
      case 'castVote': return '🗳️';
      case 'updateSeigniorage': return '⚡';
      default: return '🔄';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {getOperationIcon(operation || null)} {getOperationDisplayName(operation || null)}
          </h3>
          {(isSuccess || error) && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* 진행 상태 */}
        <div className="space-y-4">
          {/* 로딩 중 */}
          {isExecuting && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">트랜잭션 처리 중...</p>
                <p className="text-sm text-gray-600">
                  {!txHash ? '지갑에서 트랜잭션을 승인해주세요' : '블록체인 확인을 기다리는 중...'}
                </p>
              </div>
            </div>
          )}

          {/* 성공 */}
          {isSuccess && (
            <div className="text-center">
              <div className="text-green-500 text-4xl mb-4">✅</div>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">트랜잭션이 성공적으로 완료되었습니다!</p>
                <p className="text-sm text-gray-600">
                  {getOperationDisplayName(operation || null)}이(가) 성공적으로 실행되었습니다.
                </p>
              </div>
            </div>
          )}

          {/* 실패 */}
          {error && (
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">❌</div>
              <div className="space-y-2">
                <p className="text-gray-800 font-medium">트랜잭션이 실패했습니다</p>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* 트랜잭션 해시 표시 */}
          {txHash && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 mb-3">트랜잭션 해시:</p>

              {/* 전체 해시 표시 - 선택 가능하고 줄바꿈 허용 */}
              <div className="mb-4">
                <div className="text-xs bg-white px-3 py-3 rounded border w-full break-all select-all font-mono leading-relaxed cursor-text">
                  {txHash}
                </div>
                <p className="text-xs text-gray-500 mt-1">💡 위 텍스트를 선택해서 복사할 수 있습니다</p>
              </div>

              {/* Explorer 링크 */}
              <div className="text-center">
                <a
                  href={getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                >
                  🔍 Explorer에서 보기
                </a>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-3 mt-6">
            {error && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                닫기
              </button>
            )}

            {isSuccess && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                확인
              </button>
            )}
          </div>

          {/* 진행 단계 표시 */}
          {isExecuting && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span className={!txHash ? 'text-blue-600 font-medium' : 'text-green-600'}>
                  1. 지갑 승인
                </span>
                <span className={txHash && !isSuccess && !error ? 'text-blue-600 font-medium' : txHash ? 'text-green-600' : ''}>
                  2. 블록체인 확인
                </span>
                <span className={isSuccess ? 'text-green-600 font-medium' : ''}>
                  3. 완료
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: !txHash ? '33%' : isSuccess ? '100%' : '66%'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}