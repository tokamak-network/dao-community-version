// Chain configurations
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

export const EVENT_START_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0"
);

export const BLOCK_RANGE = BigInt(process.env.NEXT_PUBLIC_BLOCK_RANGE || "500");

export const POLLING_INTERVAL = Number(
  process.env.NEXT_PUBLIC_POLLING_INTERVAL || "60000"
);

// Contract read settings
export const CONTRACT_READ_SETTINGS = {
  BATCH_SIZE: Number(process.env.NEXT_PUBLIC_CONTRACT_BATCH_SIZE || "5"),
  BATCH_DELAY_MS: Number(
    process.env.NEXT_PUBLIC_CONTRACT_BATCH_DELAY_MS || "100"
  ),
  CACHE_DURATION_MS: Number(
    process.env.NEXT_PUBLIC_CONTRACT_CACHE_DURATION_MS || "12000"
  ), // 12 초
} as const;

// Network configurations
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
    public: { http: ['https://ethereum.publicnode.com'] },
    default: { http: ['https://ethereum.publicnode.com'] },
  },
};

export const sepolia = {
  id: 11155111,
  name: 'Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://ethereum-sepolia.publicnode.com'] },
    default: { http: ['https://ethereum-sepolia.publicnode.com'] },
  },
};

// Get current chain configuration
export function getCurrentChain() {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  return chainId === 1 ? mainnet : sepolia;
}

// Get current chain contracts
const currentChainId = getCurrentChain().id;

// 🔍 환경변수 디버깅
console.log('🔍 [DEBUG] Environment Variables:');
console.log('NEXT_PUBLIC_CHAIN_ID:', process.env.NEXT_PUBLIC_CHAIN_ID);
console.log('NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS:', process.env.NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS);
console.log('NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS:', process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS);
console.log('NEXT_PUBLIC_TON_CONTRACT_ADDRESS:', process.env.NEXT_PUBLIC_TON_CONTRACT_ADDRESS);

// Export individual addresses for backward compatibility
export const DAO_AGENDA_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS;
export const DAO_COMMITTEE_PROXY_ADDRESS = process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS;
export const TON_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TON_CONTRACT_ADDRESS;
export const SEIG_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_SEIG_MANAGER_ADDRESS;
export const LAYER2_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_LAYER2_MANAGER_ADDRESS;
export const LAYER2_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_LAYER2_REGISTRY_ADDRESS;

const CONTRACT_ADDRESSES = {
  DAO_AGENDA_MANAGER: DAO_AGENDA_MANAGER_ADDRESS,
  DAO_COMMITTEE_PROXY: DAO_COMMITTEE_PROXY_ADDRESS,
  TON_CONTRACT: TON_CONTRACT_ADDRESS,
  SEIG_MANAGER: SEIG_MANAGER_ADDRESS,
  LAYER2_MANAGER: LAYER2_MANAGER_ADDRESS,
  LAYER2_REGISTRY: LAYER2_REGISTRY_ADDRESS
};

console.log('🔍 [DEBUG] Contract Addresses:');
console.log('CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES);

// Export contracts in the format expected by AgendaContext
export const CONTRACTS = {
  daoAgendaManager: {
    address: CONTRACT_ADDRESSES.DAO_AGENDA_MANAGER,
    abi: [],
    chainId: currentChainId,
  },
  daoCommittee: {
    address: CONTRACT_ADDRESSES.DAO_COMMITTEE_PROXY,
    abi: [],
    chainId: currentChainId,
  },
  tonContract: {
    address: CONTRACT_ADDRESSES.TON_CONTRACT,
    abi: [],
    chainId: currentChainId,
  },
  seigManager: {
    address: CONTRACT_ADDRESSES.SEIG_MANAGER,
    abi: [],
    chainId: currentChainId,
  },
  layer2Manager: {
    address: CONTRACT_ADDRESSES.LAYER2_MANAGER,
    abi: [],
    chainId: currentChainId,
  },
  layer2Registry: {
    address: CONTRACT_ADDRESSES.LAYER2_REGISTRY,
    abi: [],
    chainId: currentChainId,
  },
};

console.log('🔍 [DEBUG] Final CONTRACTS object:');
console.log('CONTRACTS:', CONTRACTS);
