// Mock 상수들
export const MOCK_OWNER_ADDRESS = "0x1234567890123456789012345678901234567890";
export const MOCK_TON_BALANCE = BigInt("1000000000000000000000"); // 1000 TON
export const MOCK_CREATE_AGENDA_FEES = BigInt("100000000000000000"); // 0.1 TON

// 기본 컨트랙트 정보
export const DEFAULT_CONTRACT_INFO = {
  address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
  abi: [],
  chainId: 1,
};

// 메시지
export const MESSAGES = {
  LOADING: {
    OWNER: "Loading DAO owner information...",
    TON_BALANCE: "Loading TON balance...",
    AGENDAS: "Loading agendas...",
    COMMITTEE_MEMBERS: "Loading committee members...",
  },
  SUCCESS: {
    OWNER: "DAO owner information loaded successfully",
    TON_BALANCE: "TON balance loaded successfully",
  },
  ERROR: {
    OWNER: "Failed to load DAO owner information",
    TON_BALANCE: "Failed to load TON balance",
    ACCESS_DENIED: "Access denied: Only DAO owner can perform this action",
    WALLET_NOT_CONNECTED: "지갑을 먼저 연결해주세요.",
    WALLET_ADDRESS_ERROR: "지갑 주소를 확인할 수 없습니다.",
    TON_BALANCE_ERROR: "TON 잔액을 확인할 수 없습니다.",
    AGENDA_FEES_ERROR: "아젠다 생성 수수료를 확인할 수 없습니다.",
  },
} as const;

// 아젠다 상태
export const AGENDA_STATUS = {
  PENDING: "Pending",
  OPEN: "Open",
  VOTING: "Voting",
  ON_GOING: "On going",
  WAITING_EXECUTION: "Waiting Execution",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;