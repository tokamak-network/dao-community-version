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
}

export interface AgendaWithMetadata extends Agenda {
  title?: string;
  description?: string;
  snapshotUrl?: string;
  discourseUrl?: string;
  network?: string;
  transaction?: string;
  actions?: AgendaAction[];
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