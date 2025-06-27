import { mainnet, sepolia } from './contracts'

// 네트워크별 Public RPC URLs (Fallback 포함)
const RPC_ENDPOINTS: Record<number, string[]> = {
  [mainnet.id]: [
    "https://ethereum-rpc.publicnode.com", // Primary
    "https://rpc.ankr.com/eth", // Fallback 1
    "https://eth.llamarpc.com", // Fallback 2
  ],
  [sepolia.id]: [
    "https://ethereum-sepolia-rpc.publicnode.com", // Primary
    "https://rpc.ankr.com/eth_sepolia", // Fallback 1
    "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161", // Fallback 2
  ],
};

// RPC 설정
export const CURRENT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || sepolia.id;
export const CURRENT_CHAIN = CURRENT_CHAIN_ID === mainnet.id ? mainnet : sepolia;

// Primary RPC URL
export const CURRENT_RPC_URL = RPC_ENDPOINTS[CURRENT_CHAIN_ID]?.[0] || RPC_ENDPOINTS[sepolia.id][0];

// 모든 RPC 엔드포인트 반환
export const getAllRPCUrls = (chainId: number = CURRENT_CHAIN_ID): string[] => {
  return RPC_ENDPOINTS[chainId] || RPC_ENDPOINTS[sepolia.id];
};

// RPC 재시도 설정
export const RPC_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1초
  backoffMultiplier: 2, // 지수 백오프
  timeoutMs: 10000, // 10초 타임아웃
};

// Rate Limit 대응 설정
export const RATE_LIMIT_CONFIG = {
  requestDelay: 300, // 요청 간 최소 지연 (ms)
  batchSize: 5, // 배치당 최대 요청 수
  dailyLimit: 5000, // 일일 요청 제한 (추정치)
};

console.log(`🌐 Using Chain: ${CURRENT_CHAIN.name} (${CURRENT_CHAIN_ID})`);
console.log(`🔗 Primary RPC: ${CURRENT_RPC_URL}`);
console.log(`🔄 Fallback RPCs: ${getAllRPCUrls().slice(1).join(', ')}`);