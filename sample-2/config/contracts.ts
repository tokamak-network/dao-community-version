export const DAO_AGENDA_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS as `0x${string}`;

export const DAO_COMMITTEE_PROXY_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`;

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
