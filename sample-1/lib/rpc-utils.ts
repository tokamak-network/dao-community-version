import { createPublicClient, http } from "viem";
import { getAllRPCUrls, RPC_RETRY_CONFIG, RATE_LIMIT_CONFIG, CURRENT_CHAIN } from "@/config/rpc";
import { CONTRACT_READ_SETTINGS } from '@/config/contracts';

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

// 간단한 컨트랙트 읽기 함수 (기존 BATCH_DELAY_MS 활용)
export const readContractWithRetry = async <T>(
  contractCall: () => Promise<T>,
  context: string = 'Contract read'
): Promise<T> => {
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