import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { ethers } from "ethers";
import { chain } from "@/config/chain";

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

// 시간 관련 유틸리티 함수들
export function getRemainingTime(timestamp: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (timestamp <= now) return "0";

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

export function formatAddress(address: string): string {
  if (!address || typeof address !== "string") return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function calculateAgendaStatus(agenda: {
  status: number;
  createdTimestamp: bigint;
  noticeEndTimestamp: bigint;
  votingStartedTimestamp: bigint;
  votingEndTimestamp: bigint;
  executableLimitTimestamp: bigint;
  executedTimestamp: bigint;
  executed: boolean;
}): number {
  const now = BigInt(Math.floor(Date.now() / 1000));

  // If already executed, return EXECUTED status
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

  // VOTING 상태:
  // 1. noticeEndTimestamp가 0이 아니고, 현재 시간이 noticeEndTimestamp보다 크고, votingStartedTimestamp가 0
  // 2. votingStartedTimestamp가 0이 아니고, 현재 시간이 votingEndTimestamp보다 작음
  if (
    (agenda.noticeEndTimestamp > BigInt(0) &&
      now > agenda.noticeEndTimestamp &&
      agenda.votingStartedTimestamp === BigInt(0)) ||
    (agenda.votingStartedTimestamp > BigInt(0) &&
      now < agenda.votingEndTimestamp)
  ) {
    return AgendaStatus.VOTING;
  }

  // If current time is after voting end but before executable limit
  if (now < agenda.executableLimitTimestamp) {
    return AgendaStatus.WAITING_EXEC;
  }

  // If current time is after executable limit, it's ENDED
  return AgendaStatus.ENDED;
}

interface AgendaMetadata {
  title: string;
  description: string;
  createdAt: number;
  creator: {
    address: string;
    signature: string;
  };
  targets: string[];
  atomicExecute: boolean;
  snapshotUrl?: string;
  discourseUrl?: string;
}

function getNetworkName(chainId: number): string {
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

export async function getAgendaMetadata(
  agendaId: number
): Promise<AgendaMetadata | null> {
  try {
    const networkName = getNetworkName(chain.id);
    const response = await fetch(
      `${GITHUB_DAO_AGENDA_URL}/${networkName}/agenda-${agendaId}.json`
    );
    if (!response.ok) {
      console.log(`No metadata found for agenda ${agendaId} on ${networkName}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching metadata for agenda ${agendaId}:`, error);
    return null;
  }
}

export async function getAllAgendaMetadata(
  agendaIds: number[]
): Promise<{ [key: number]: AgendaMetadata }> {
  const metadata: { [key: number]: AgendaMetadata } = {};

  // 병렬로 모든 메타데이터 가져오기
  const promises = agendaIds.map(async (id) => {
    const data = await getAgendaMetadata(id);
    if (data) {
      metadata[id] = data;
    }
  });

  await Promise.all(promises);
  return metadata;
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
  console.log(`Fetching events from block ${fromBlock} to ${toBlock}`);

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

  console.log(`Found ${logs.length} events in this range`);

  return logs;
}

export async function getLatestBlockNumber(): Promise<number> {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  return await provider.getBlockNumber();
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
