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

export function formatAddress(address: string | { address: string }): string {
  if (!address) return "";

  const addressStr = typeof address === "string" ? address : address.address;
  if (!addressStr || typeof addressStr !== "string") return "";

  return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
}

export function calculateAgendaStatus(
  agenda: {
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

  if (agenda.executed || agenda.executedTimestamp > BigInt(0)) {
    return AgendaStatus.EXECUTED;
  }

  if (now > agenda.executableLimitTimestamp) {
    return AgendaStatus.ENDED;
  }

  if (now > agenda.votingEndTimestamp) {
    return AgendaStatus.WAITING_EXEC;
  }

  if (now >= agenda.votingStartedTimestamp) {
    return AgendaStatus.VOTING;
  }

  if (now >= agenda.createdTimestamp && now < agenda.noticeEndTimestamp) {
    return AgendaStatus.NOTICE;
  }

  return AgendaStatus.NONE;
}

export function getNetworkName(chainId: number): string {
  switch (chainId) {
    case 1:
      return "mainnet";
    case 5:
      return "goerli";
    case 11155111:
      return "sepolia";
    case 55004:
      return "titan-goerli";
    case 55007:
      return "titan-sepolia";
    default:
      return "unknown";
  }
}

export function getMetadataUrl(
  agendaId: number,
  network: string = "mainnet"
): string {
  return `${GITHUB_DAO_AGENDA_URL}${network}/${agendaId}.json`;
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
      return null;
    }

    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error(`Failed to fetch metadata for agenda ${agendaId}:`, error);
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
  // Mock implementation for now
  return Math.floor(Date.now() / 1000);
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
  // Mock implementation for now
  return [];
}