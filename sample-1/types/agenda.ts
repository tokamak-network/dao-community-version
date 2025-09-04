export interface Agenda {
  id: number;
  createdTimestamp: bigint;
  noticeEndTimestamp: bigint;
  votingPeriodInSeconds: bigint;
  votingStartedTimestamp: bigint;
  votingEndTimestamp: bigint;
  executableLimitTimestamp: bigint;
  executedTimestamp: bigint;
  countingYes: bigint;
  countingNo: bigint;
  countingAbstain: bigint;
  status: number;
  result: number;
  voters: string[];
  executed: boolean;
  creator: {
    address: `0x${string}`;
    signature?: string;
  };
  targets?: {
    type: string;
    address: string;
    value?: string;
  }[];
  atomicExecute?: boolean;
}

export interface AgendaAction {
  id?: string;
  title: string;
  contractAddress: string;
  method: string;
  calldata: string;
  abi?: any[];
  sendEth?: boolean;
  type?: string;
}

export interface AgendaWithMetadata extends Agenda {
  title?: string;
  description?: string;
  snapshotUrl?: string;
  discourseUrl?: string;
  network?: string;
  transaction?: string;
  creationCalldata?: string;
  actions?: AgendaAction[];
  createdAt?: string;
  updatedAt?: string;
}

// 완전한 메타데이터 스키마 (dao-agenda-metadata-repository 호환)
export interface AgendaMetadata {
  id: number;
  title: string;
  description: string;
  network: "mainnet" | "sepolia";
  transaction: string;
  creator: {
    address: string;
    signature: string;
  };
  actions: AgendaAction[];
  createdAt: string;
  updatedAt?: string;
  snapshotUrl?: string; // Reference link URL (Snapshot proposal, official announcement, etc.)
  discourseUrl?: string; // Discussion link URL (Discourse forum, official announcement, etc.)
}

export interface AgendaCreatedEvent {
  from: `0x${string}`;
  id: bigint;
  targets: `0x${string}`[];
  noticePeriodSeconds: bigint;
  votingPeriodSeconds: bigint;
  atomicExecute: boolean;
}

export type AgendaContractResult = {
  createdTimestamp: bigint;
  noticeEndTimestamp: bigint;
  votingPeriodInSeconds: bigint;
  votingStartedTimestamp: bigint;
  votingEndTimestamp: bigint;
  executableLimitTimestamp: bigint;
  executedTimestamp: bigint;
  countingYes: bigint;
  countingNo: bigint;
  countingAbstain: bigint;
  status: number;
  result: number;
  voters: string[];
  executed: boolean;
  creator: {
    address: string;
    signature?: string;
  };
};
