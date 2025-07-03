import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createPublicClient, http } from "viem";
import { AgendaWithMetadata } from "@/types/agenda";

const GITHUB_DAO_AGENDA_URL =
  "https://raw.githubusercontent.com/tokamak-network/dao-agenda-metadata-repository/refs/heads/main/data/agendas/";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AgendaStatus = {
  NONE: 0,
  NOTICE: 1,
  VOTING: 2,
  WAITING_EXEC: 3,
  EXECUTED: 4,
  ENDED: 5,
} as const;

export const AgendaResult = {
  PENDING: 0,
  ACCEPT: 1,
  REJECT: 2,
  DISMISS: 3,
} as const;

export function getStatusClass(status: number) {
  switch (status) {
    case AgendaStatus.EXECUTED:
      return "bg-green-100 text-green-600";
    case AgendaStatus.ENDED:
      return "bg-red-100 text-red-600";
    case AgendaStatus.WAITING_EXEC:
      return "bg-blue-100 text-blue-600";
    case AgendaStatus.VOTING:
      return "bg-purple-100 text-purple-600";
    case AgendaStatus.NOTICE:
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function getStatusText(status: number): string {
  switch (status) {
    case AgendaStatus.EXECUTED:
      return "EXECUTED";
    case AgendaStatus.ENDED:
      return "ENDED";
    case AgendaStatus.WAITING_EXEC:
      return "WAITING EXECUTION";
    case AgendaStatus.VOTING:
      return "VOTING";
    case AgendaStatus.NOTICE:
      return "NOTICE";
    case AgendaStatus.NONE:
      return "NONE";
    default:
      return "UNKNOWN";
  }
}

export function getResultText(result: number): string {
  switch (result) {
    case AgendaResult.ACCEPT:
      return "ACCEPTED";
    case AgendaResult.REJECT:
      return "REJECTED";
    case AgendaResult.DISMISS:
      return "DISMISSED";
    case AgendaResult.PENDING:
      return "PENDING";
    default:
      return "UNKNOWN";
  }
}

export function formatDateSimple(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year} / ${month} / ${day} / ${hours}:${minutes}`;
}

export function formatDate(
  timestamp: number,
  includeTimezone: boolean = true
): string {
  const date = new Date(timestamp * 1000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (!includeTimezone) {
    return `${month} ${day}${getOrdinalSuffix(
      day
    )}, ${year} ${hours}:${minutes}`;
  }

  // Get timezone offset in minutes and convert to hours
  const timezoneOffset = -date.getTimezoneOffset();
  const timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const timezoneMinutes = Math.abs(timezoneOffset) % 60;
  const timezoneSign = timezoneOffset >= 0 ? "+" : "-";
  const timezone = `UTC${timezoneSign}${timezoneHours
    .toString()
    .padStart(2, "0")}:${timezoneMinutes.toString().padStart(2, "0")}`;

  return `${month} ${day}${getOrdinalSuffix(
    day
  )}, ${year} ${hours}:${minutes} ${timezone}`;
}

export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function getRemainingTime(timestamp: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (timestamp <= now) return "Ended";

  const remaining = timestamp - now;
  const days = remaining / BigInt(86400);
  const hours = (remaining % BigInt(86400)) / BigInt(3600);
  const minutes = (remaining % BigInt(3600)) / BigInt(60);

  if (days > BigInt(0)) {
    return `${days}d ${hours}h`;
  } else if (hours > BigInt(0)) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function getAgendaTimeInfo(agenda: {
  createdTimestamp: bigint;
  noticeEndTimestamp: bigint;
  votingStartedTimestamp: bigint;
  votingEndTimestamp: bigint;
  executableLimitTimestamp: bigint;
  executedTimestamp: bigint;
}) {
  const now = BigInt(Math.floor(Date.now() / 1000));

  return {
    noticePeriod: {
      start: agenda.createdTimestamp,
      end: agenda.noticeEndTimestamp,
      remaining: getRemainingTime(agenda.noticeEndTimestamp),
    },
    votingPeriod: {
      start: agenda.votingStartedTimestamp,
      end: agenda.votingEndTimestamp,
      remaining: getRemainingTime(agenda.votingEndTimestamp),
    },
    executionPeriod: {
      start: agenda.votingEndTimestamp,
      end: agenda.executableLimitTimestamp,
      remaining: getRemainingTime(agenda.executableLimitTimestamp),
    },
  };
}

export function formatAddress(address: string | { address: string }): string {
  if (!address) return "";

  const addressStr = typeof address === "string" ? address : address.address;
  if (!addressStr || typeof addressStr !== "string") return "";

  return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
}

export function calculateAgendaStatus(
  agenda: {
    status: number;
    createdTimestamp: bigint;
    noticeEndTimestamp: bigint;
    votingStartedTimestamp: bigint;
    votingEndTimestamp: bigint;
    executableLimitTimestamp: bigint;
    executedTimestamp: bigint;
    executed: boolean;
    countingYes: bigint;
    countingNo: bigint;
    countingAbstain: bigint;
  },
  quorum: bigint
): number {
  const now = BigInt(Math.floor(Date.now() / 1000));

  // 이미 실행된 경우
  if (agenda.executed || agenda.executedTimestamp > BigInt(0)) {
    return AgendaStatus.EXECUTED;
  }

  // NOTICE 상태: noticeEndTimestamp가 0이 아니고, 현재 시간이 noticeEndTimestamp보다 이전
  if (
    agenda.noticeEndTimestamp > BigInt(0) &&
    now < agenda.noticeEndTimestamp
  ) {
    return AgendaStatus.NOTICE;
  }

  // VOTING 상태: 투표 기간 중
  if (agenda.votingStartedTimestamp > BigInt(0) && now < agenda.votingEndTimestamp) {
    return AgendaStatus.VOTING;
  }

  // 투표가 종료된 경우 처리
  if (agenda.votingStartedTimestamp > BigInt(0) && now >= agenda.votingEndTimestamp) {
    const totalVotes = agenda.countingYes + agenda.countingNo + agenda.countingAbstain;
    const hasQuorum = totalVotes >= quorum;
    const isApproved = agenda.countingYes > agenda.countingNo;

    // 승인되고 quorum을 만족한 경우 → 실행 대기
    if (hasQuorum && isApproved && now < agenda.executableLimitTimestamp) {
      return AgendaStatus.WAITING_EXEC;
    }
  }

  // Notice 기간이지만 투표가 시작되지 않은 경우
  if (agenda.noticeEndTimestamp > BigInt(0) && now > agenda.noticeEndTimestamp && agenda.votingStartedTimestamp === BigInt(0)) {
    return AgendaStatus.VOTING;
  }

  // 그 외 모든 경우는 종료
  return AgendaStatus.ENDED;
}

export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return "ethereum";
    case 137:
      return "polygon";
    case 56:
      return "bsc";
    case 42161:
      return "arbitrum";
    case 10:
      return "optimism";
    case 100:
      return "gnosis";
    case 1101:
      return "polygon-zkevm";
    case 11155111:
      return "sepolia";
    default:
      return "ethereum";
  }
}

export function getEtherscanUrl(hash: string, chainId?: number): string {
  const currentChainId = chainId || Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111;

  switch (currentChainId) {
    case 1:
      return `https://etherscan.io/tx/${hash}`;
    case 137:
      return `https://polygonscan.com/tx/${hash}`;
    case 56:
      return `https://bscscan.com/tx/${hash}`;
    case 42161:
      return `https://arbiscan.io/tx/${hash}`;
    case 10:
      return `https://optimistic.etherscan.io/tx/${hash}`;
    case 100:
      return `https://gnosisscan.io/tx/${hash}`;
    case 1101:
      return `https://zkevm.polygonscan.com/tx/${hash}`;
    case 11155111:
      return `https://sepolia.etherscan.io/tx/${hash}`;
    default:
      return `https://sepolia.etherscan.io/tx/${hash}`;
  }
}

export function getMetadataUrl(
  agendaId: number,
  network: string = "mainnet"
): string {
  return `${GITHUB_DAO_AGENDA_URL}${network}/agenda-${agendaId}.json`;
}

export interface AgendaMetadata {
  id: number;
  title: string;
  description: string;
  createdAt: number;
  creator: {
    address: string;
    signature?: string;
  };
  targets: string[];
  atomicExecute: boolean;
  snapshotUrl?: string;
  discourseUrl?: string;
  network?: string;
  transaction?: string;
  actions?: {
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi: any[];
  }[];
}

export async function getAgendaMetadata(
  agendaId: number
): Promise<AgendaMetadata | null> {
  try {
    const networkName = getNetworkName(Number(process.env.NEXT_PUBLIC_CHAIN_ID));
    const metadataUrl = getMetadataUrl(agendaId, networkName);
    const response = await fetch(metadataUrl);

    if (!response.ok) {
      // 404 에러 로그를 숨김 - 메타데이터가 없는 것은 정상적인 상황
      return null;
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    // 404 에러가 아닌 다른 에러만 로그 출력
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // 네트워크 에러만 로그 출력
      console.error(`Network error fetching metadata for agenda ${agendaId}:`, error);
    }
    return null;
  }
}

export async function getAllAgendaMetadata(
  agendaIds: number[]
): Promise<{ [key: number]: AgendaMetadata }> {
  const metadataPromises = agendaIds.map(async (id) => {
    const metadata = await getAgendaMetadata(id);
    return { id, metadata };
  });

  const results = await Promise.all(metadataPromises);
  const metadataMap: { [key: number]: AgendaMetadata } = {};

  results.forEach(({ id, metadata }) => {
    if (metadata) {
      metadataMap[id] = metadata;
    }
  });

  return metadataMap;
}

export async function getLatestBlockNumber(): Promise<number> {
  try {
    const publicClient = createPublicClient({
      chain: {
        id: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111,
        name: 'Custom Chain',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [process.env.NEXT_PUBLIC_RPC_URL || ''] }
        }
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL)
    });

    const blockNumber = await publicClient.getBlockNumber();
    return Number(blockNumber);
  } catch (error) {
    console.error('Error getting latest block number:', error);
    return 0;
  }
}

export async function fetchAgendaEvents(
  contract: {
    address: `0x${string}`;
    abi: any;
    chainId: number;
  },
  fromBlock: bigint,
  toBlock: bigint,
  publicClient: any
) {
  try {
    const logs = await publicClient.getLogs({
      address: contract.address as `0x${string}`,
      event: {
        type: "event",
        name: "AgendaCreated",
        inputs: [
          { indexed: true, name: "from", type: "address" },
          { indexed: true, name: "id", type: "uint256" },
          { indexed: false, name: "targets", type: "address[]" },
          { indexed: false, name: "noticePeriodSeconds", type: "uint128" },
          { indexed: false, name: "votingPeriodSeconds", type: "uint128" },
          { indexed: false, name: "atomicExecute", type: "bool" },
        ],
      },
      fromBlock: fromBlock,
      toBlock: toBlock,
    });

    return logs;
  } catch (error) {
    console.error('Error fetching agenda events:', error);
    return [];
  }
}

export function getAgendaResult(
  agenda: AgendaWithMetadata,
  currentStatus: number,
  quorum: bigint = BigInt(2)
): string {
  const totalVotes = agenda.countingYes + agenda.countingNo + agenda.countingAbstain

  // If still in notice period, no result yet
  if (currentStatus === 1) { // NOTICE
    return "Notice Period"
  }

  // If voting is in progress, show voting status
  if (currentStatus === 2) { // VOTING
    return `Voting in progress... (Yes: ${agenda.countingYes.toString()}, No: ${agenda.countingNo.toString()}, Abstain: ${agenda.countingAbstain.toString()})`
  }

  // If quorum not met
  if (totalVotes < quorum) {
    return "NOT APPROVED"
  }

  // If Yes votes are more than No votes
  if (agenda.countingYes > agenda.countingNo) {
    return "ACCEPTED"
  } else {
    return "REJECTED"
  }
}

export function getStatusMessage(
  agenda: AgendaWithMetadata,
  currentStatus: number,
  quorum: bigint = BigInt(2)
) {
  const timeInfo = getAgendaTimeInfo(agenda);

  switch (currentStatus) {
    case AgendaStatus.NOTICE:
      return timeInfo.noticePeriod.remaining === "Ended"
        ? "NOTICE ENDED"
        : `NOTICE - ends in: ${timeInfo.noticePeriod.remaining}`;

    case AgendaStatus.VOTING:
      // 투표가 실제로 시작되었는지 확인
      if (agenda.votingStartedTimestamp > BigInt(0)) {
        if (timeInfo.votingPeriod.remaining === "Ended") {
          return "VOTING ENDED";
        } else {
          return `VOTING - ends in: ${timeInfo.votingPeriod.remaining}`;
        }
      } else {
        // 투표가 아직 시작되지 않은 경우
        return "Voting in progress";
      }

    case AgendaStatus.WAITING_EXEC:
      if (timeInfo.executionPeriod.remaining === "Ended") {
        return "EXECUTION DEADLINE PASSED";
      } else {
        return `${timeInfo.executionPeriod.remaining} until execution`;
      }

    case AgendaStatus.EXECUTED:
      return "EXECUTED";

    case AgendaStatus.ENDED:
      return "ENDED";

    default:
      return "UNKNOWN";
  }
}

export function findMethodAbi(
  abiArray: any[],
  methodSignature: string
): any | undefined {
  return abiArray.find((func: any) => {
    const paramTypes = func.inputs.map((input: any) => input.type).join(",");
    return `${func.name}(${paramTypes})` === methodSignature;
  });
}

// Parameter validation utilities for proposal actions
export function validateParameterType(value: string, type: string): boolean {
  try {
    if (!value) return false;

    if (type === "address") {
      // 소문자로 변환해서 검증하여 체크섬 오류 방지
      const lowerValue = value.toLowerCase();
      return /^0x[a-f0-9]{40}$/.test(lowerValue);
    } else if (type.startsWith("uint") || type.startsWith("int")) {
      // Check if it's a valid number and not negative for uint
      const num = BigInt(value);
      if (type.startsWith("uint") && num < BigInt(0)) return false;
      return true;
    } else if (type === "bool") {
      return value === "true" || value === "false";
    } else if (type === "bytes" || type.startsWith("bytes")) {
      return /^0x[0-9a-fA-F]*$/.test(value);
    } else if (type === "string") {
      return true; // Any string is valid
    }
    return true;
  } catch {
    return false;
  }
}

export function getParameterTypeErrorMessage(type: string): string {
  if (type === "address") {
    return "Invalid Ethereum address";
  } else if (type.startsWith("uint")) {
    return "Must be a positive number";
  } else if (type.startsWith("int")) {
    return "Must be a valid number";
  } else if (type === "bool") {
    return "Must be true or false";
  } else if (type === "bytes" || type.startsWith("bytes")) {
    return "Must be a valid hex string starting with 0x";
  } else if (type === "string") {
    return "Must be a valid string";
  }
  return "Invalid input type";
}

export function normalizeParameterValue(value: string, type: string): string {
  if (type === "address" && value) {
    // 주소는 소문자로 변환하여 체크섬 오류 방지
    return value.toLowerCase();
  }
  return value;
}

export function getAgendaMetadataRepoFolderUrl(network: string = "mainnet"): string {
  return `https://github.com/tokamak-network/dao-agenda-metadata-repository/tree/main/data/agendas/${network}`;
}