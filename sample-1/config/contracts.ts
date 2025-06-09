// Chain definitions
export const mainnet = {
  id: 1,
  name: 'Ethereum',
  network: 'homestead',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://eth.llamarpc.com'] },
    public: { http: ['https://eth.llamarpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  testnet: false,
};

export const sepolia = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'SEP',
  },
  rpcUrls: {
    default: { http: ['https://sepolia.infura.io/v3/'] },
    public: { http: ['https://sepolia.infura.io/v3/'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
};

export const SEIG_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_SEIG_MANAGER_ADDRESS as `0x${string}`;

export const DAO_AGENDA_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS as `0x${string}`;

// 프록시를 통해 모든 버전을 자동 처리
export const DAO_COMMITTEE_PROXY_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`;

export const TON_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_TON_CONTRACT_ADDRESS as `0x${string}`;

export const LAYER2_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_LAYER2_MANAGER_ADDRESS as `0x${string}`;

export const L1_BRIDGE_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_L1_BRIDGE_REGISTRY_ADDRESS as `0x${string}`;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111");

export const EVENT_START_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0"
);

export const BLOCK_RANGE = BigInt(process.env.NEXT_PUBLIC_BLOCK_RANGE || "500");

export const POLLING_INTERVAL = Number(
  process.env.NEXT_PUBLIC_POLLING_INTERVAL || "60000"
);

// Contract read settings
export const CONTRACT_READ_SETTINGS = {
  BATCH_SIZE: Number(process.env.NEXT_PUBLIC_CONTRACT_BATCH_SIZE || "3"),
  BATCH_DELAY_MS: Number(
    process.env.NEXT_PUBLIC_CONTRACT_BATCH_DELAY_MS || "300"
  ),
  CACHE_DURATION_MS: Number(
    process.env.NEXT_PUBLIC_CONTRACT_CACHE_DURATION_MS || "12000"
  ), // 12 초

  // Rate limiting 설정 추가
  MAX_CALLS_PER_SECOND: Number(
    process.env.NEXT_PUBLIC_MAX_CALLS_PER_SECOND || "10"
  ),
  MIN_CALL_INTERVAL_MS: Number(
    process.env.NEXT_PUBLIC_MIN_CALL_INTERVAL_MS || "100"
  ),
} as const;

// 지원하는 체인 설정 (메인넷과 세폴리아)
export const SUPPORTED_CHAINS = [mainnet, sepolia];

// 현재 체인 (환경변수에 따라 결정)
export const getCurrentChain = () => {
  const chainId = CHAIN_ID;
  if (chainId === 1) return mainnet;
  if (chainId === 11155111) return sepolia;
  return sepolia; // 기본값
};

export const CONTRACTS = {
  daoAgendaManager: {
    address: DAO_AGENDA_MANAGER_ADDRESS,
    chain: getCurrentChain(),
  },
  daoCommittee: {
    // 프록시 주소 하나로 모든 버전 처리
    address: DAO_COMMITTEE_PROXY_ADDRESS,
    chain: getCurrentChain(),
  },
  ton: {
    address: TON_CONTRACT_ADDRESS,
    chain: getCurrentChain(),
  },
  seigManager: {
    address: SEIG_MANAGER_ADDRESS,
    chain: getCurrentChain(),
  },
  layer2Manager: {
    address: LAYER2_MANAGER_ADDRESS,
    chain: getCurrentChain(),
  },
  l1BridgeRegistry: {
    address: L1_BRIDGE_REGISTRY_ADDRESS,
    chain: getCurrentChain(),
  },

};