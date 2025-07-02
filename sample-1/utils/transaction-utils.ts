/**
 * 트랜잭션 관련 유틸리티 함수들
 */

export interface TransactionState {
  isExecuting: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
  operation: string | null;
}

export interface TransactionError {
  message?: string;
  code?: number;
  name?: string;
  cause?: any;
}

/**
 * 사용자가 트랜잭션을 취소했는지 확인하는 함수
 */
export function isUserCancelledError(error: TransactionError | null | undefined): boolean {
  if (!error) return false;

  const errorMessage = error.message || '';
  const errorCode = error.code;

  return (
    errorCode === 4001 || // MetaMask user rejection code
    errorMessage.includes("User denied") ||
    errorMessage.includes("User rejected") ||
    errorMessage.includes("User cancelled") ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("denied") ||
    errorMessage.includes("rejected") ||
    errorMessage.includes("cancelled")
  );
}

/**
 * 에러 메시지를 사용자 친화적으로 변환하는 함수
 */
export function formatTransactionError(error: TransactionError | null | undefined): string {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error.message || 'An unknown error occurred';

  // 사용자 취소 에러는 간단한 메시지로 처리
  if (isUserCancelledError(error)) {
    return 'Transaction was cancelled';
  }

  // 기타 에러는 원본 메시지 반환 (필요시 추가 필터링 가능)
  return errorMessage;
}

/**
 * 트랜잭션 상태를 초기화하는 함수
 */
export function createInitialTransactionState(): TransactionState {
  return {
    isExecuting: false,
    isSuccess: false,
    error: null,
    txHash: null,
    operation: null,
  };
}

/**
 * 트랜잭션 실행 시작 상태로 업데이트하는 함수
 */
export function createExecutingState(operation: string): TransactionState {
  return {
    isExecuting: true,
    isSuccess: false,
    error: null,
    txHash: null,
    operation,
  };
}

/**
 * 트랜잭션 성공 상태로 업데이트하는 함수
 */
export function createSuccessState(prevState: TransactionState, txHash?: string): TransactionState {
  return {
    ...prevState,
    isExecuting: false,
    isSuccess: true,
    txHash: txHash || prevState.txHash,
  };
}

/**
 * 트랜잭션 에러 상태로 업데이트하는 함수
 */
export function createErrorState(prevState: TransactionState, error: TransactionError): TransactionState {
  return {
    ...prevState,
    isExecuting: false,
    isSuccess: false,
    error: formatTransactionError(error),
  };
}

/**
 * 트랜잭션 해시 업데이트 함수
 */
export function updateTransactionHash(prevState: TransactionState, txHash: string): TransactionState {
  return {
    ...prevState,
    txHash,
  };
}

/**
 * 트랜잭션 상태 리셋 함수
 */
export function resetTransactionState(): TransactionState {
  return createInitialTransactionState();
}

/**
 * 트랜잭션 상태를 콘솔에 로깅하는 함수 (디버깅용)
 */
export function logTransactionState(state: TransactionState, context?: string): void {
  const prefix = context ? `[${context}]` : '[Transaction]';
  console.log(`${prefix} State:`, {
    isExecuting: state.isExecuting,
    isSuccess: state.isSuccess,
    hasError: !!state.error,
    error: state.error,
    hasTxHash: !!state.txHash,
    operation: state.operation,
  });
}

/**
 * 트랜잭션 에러를 콘솔에 로깅하는 함수 (디버깅용)
 */
export function logTransactionError(error: TransactionError, context?: string): void {
  const prefix = context ? `[${context}]` : '[Transaction Error]';
  console.error(`${prefix}:`, {
    message: error.message,
    code: error.code,
    name: error.name,
    cause: error.cause,
    isUserCancelled: isUserCancelledError(error),
  });
}