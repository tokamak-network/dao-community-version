import { createPublicClient, http } from "viem";
import { getAllRPCUrls, RPC_RETRY_CONFIG, RATE_LIMIT_CONFIG, CURRENT_CHAIN } from "@/config/rpc";
import { CONTRACT_READ_SETTINGS } from '@/config/contracts';

// Rate limiting을 위한 호출 추적
class RpcRateLimiter {
  private callTimestamps: number[] = [];
  private lastCallTime: number = 0;

  // 호출 가능한지 확인하고 필요시 대기
  async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // 1초 내 호출 기록 정리
    this.callTimestamps = this.callTimestamps.filter(timestamp => timestamp > oneSecondAgo);

    // 초당 최대 호출 수 체크
    if (this.callTimestamps.length >= CONTRACT_READ_SETTINGS.MAX_CALLS_PER_SECOND) {
      const waitTime = this.callTimestamps[0] + 1000 - now;
      if (waitTime > 0) {
        console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // 최소 호출 간격 체크
    const timeSinceLastCall = now - this.lastCallTime;
    if (timeSinceLastCall < CONTRACT_READ_SETTINGS.MIN_CALL_INTERVAL_MS) {
      const waitTime = CONTRACT_READ_SETTINGS.MIN_CALL_INTERVAL_MS - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // 호출 시간 기록
    this.callTimestamps.push(Date.now());
    this.lastCallTime = Date.now();
  }

  // 현재 초당 호출 수 반환
  getCurrentCallsPerSecond(): number {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    this.callTimestamps = this.callTimestamps.filter(timestamp => timestamp > oneSecondAgo);
    return this.callTimestamps.length;
  }
}

// 전역 rate limiter 인스턴스
const rateLimiter = new RpcRateLimiter();

// RPC 요청 지연 함수
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 에러가 Rate Limit인지 확인
const isRateLimitError = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || '';
  return errorMessage.includes('rate limit') ||
         errorMessage.includes('too many requests') ||
         errorMessage.includes('429');
};

// 재시도 가능한 에러인지 확인
const isRetryableError = (error: any): boolean => {
  const errorMessage = error?.message?.toLowerCase() || '';
  return errorMessage.includes('network') ||
         errorMessage.includes('timeout') ||
         errorMessage.includes('connection') ||
         isRateLimitError(error);
};

// 견고한 Public Client 생성 (Fallback 지원)
export const createRobustPublicClient = async (chainId?: number) => {
  const rpcUrls = getAllRPCUrls(chainId);

  for (let i = 0; i < rpcUrls.length; i++) {
    try {
      const client = createPublicClient({
        chain: CURRENT_CHAIN,
        transport: http(rpcUrls[i], {
          timeout: RPC_RETRY_CONFIG.timeoutMs,
        })
      });

      // 간단한 연결 테스트
      await client.getChainId();
      console.log(`✅ RPC Connected: ${rpcUrls[i]}`);
      return client;
    } catch (error) {
      console.warn(`❌ RPC Failed: ${rpcUrls[i]}`, error);
      if (i === rpcUrls.length - 1) {
        throw new Error(`All RPC endpoints failed. Last error: ${error}`);
      }
    }
  }

  throw new Error('No RPC endpoints available');
};

// 재시도 로직을 포함한 컨트랙트 호출 함수
export const callWithRetry = async <T>(
  contractCall: () => Promise<T>,
  context: string = 'Contract call'
): Promise<T> => {
  const { maxRetries, retryDelay, backoffMultiplier } = RPC_RETRY_CONFIG;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Rate limiting 적용
      await rateLimiter.waitForRateLimit();

      const result = await contractCall();

      if (attempt > 1) {
        console.log(`✅ ${context} succeeded on attempt ${attempt}`);
      }

      return result;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const errorMessage = error?.message || 'Unknown error';

      // Rate limit 에러 감지
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        console.warn(`⚠️ Rate limit detected for ${context}, waiting longer...`);
        await delay(retryDelay * 2 * attempt); // Rate limit 시 더 오래 대기
      } else if (!isLastAttempt) {
        const delayTime = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
        console.warn(`⚠️ ${context} failed on attempt ${attempt}/${maxRetries}. Retrying in ${delayTime}ms...`);
        await delay(delayTime);
      } else {
        console.error(`❌ ${context} failed after ${maxRetries} attempts:`, error);
        throw error;
      }
    }
  }

  throw new Error(`Failed ${context} after ${maxRetries} attempts`);
};

// Rate limiting을 포함한 컨트랙트 읽기 함수
export const readContractWithRetry = async <T>(
  contractCall: () => Promise<T>,
  context: string = 'Contract read'
): Promise<T> => {
  // Rate limiter 상태 로깅
  const currentCalls = rateLimiter.getCurrentCallsPerSecond();
  if (currentCalls > CONTRACT_READ_SETTINGS.MAX_CALLS_PER_SECOND * 0.8) {
    console.log(`📊 Rate limiter: ${currentCalls}/${CONTRACT_READ_SETTINGS.MAX_CALLS_PER_SECOND} calls/sec`);
  }

  return callWithRetry(contractCall, context);
};

// 요청 통계 추적
let requestCount = 0;
export const trackRequest = (): void => {
  requestCount++;
  if (requestCount % 100 === 0) {
    console.log(`📊 RPC Requests made: ${requestCount}`);
  }
};

// Rate Limit 관리용 요청 큐
let lastRequestTime = 0;
export const rateLimit = async (): Promise<void> => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_CONFIG.requestDelay) {
    const waitTime = RATE_LIMIT_CONFIG.requestDelay - timeSinceLastRequest;
    await delay(waitTime);
  }

  lastRequestTime = Date.now();
};