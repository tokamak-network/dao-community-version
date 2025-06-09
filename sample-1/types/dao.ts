export interface AgendaWithMetadata {
  id: number;
  title: string;
  description: string;
  author: string;
  date: string;
  status: string;
  statusColor: string;
  votesFor: number;
  votesAgainst: number;
  executionTime: number | null;
  isExecuted: boolean;
}

export interface CommitteeMember {
  name: string;
  description: string;
  creationAddress: string;
  candidateContract: string;
  claimedTimestamp: number;
  rewardPeriod: number;
  indexMembers: number;
  totalStaked: string;
  lastCommitBlock: number;
  lastUpdateSeigniorageTime: number;
  claimableActivityReward?: string; // 청구 가능한 활동비 (wei 단위, UI에서 TON으로 변환)
  operatorManager: string;
  manager: string | null;
}

export interface Candidate {
  name: string;
  description: string;
  creationAddress: string;
  candidateContract: string;
  totalStaked: string;
  operatorManager: string;
  manager: string | null;
  isCommitteeMember: boolean; // 현재 위원회 멤버인지 여부
}

export interface AgendaCreatedEvent {
  agendaId: number;
  creator: string;
  timestamp: number;
}

export interface AgendaAction {
  type: string;
  data: any;
}

export interface ContractInfo {
  address: `0x${string}`;
  abi: any;
  chainId: number;
}

export interface ProgressInfo {
  current: bigint;
  total: bigint;
  percentage: number;
}

export interface VoterInfo {
  isVoter: boolean;
  hasVoted: boolean;
  vote: bigint;
}

export interface AgendaProposalCheck {
  canPropose: boolean;
  message?: string;
}

export interface DAOContextType {
  isMember: boolean;

  // Committee Members 관련
  committeeMembers: CommitteeMember[] | undefined;
  isLoadingMembers: boolean;
  membersError: string | null;
  refreshCommitteeMembers: (maxMember?: number) => Promise<void>;

  // Challenge 관련 함수
  getChallengeCandidates: (targetMember: CommitteeMember, connectedAddress: string) => Promise<Candidate[]>;

  // 공통
  statusMessage: string;
  contract: ContractInfo;
  daoContract: ContractInfo;
  events: AgendaCreatedEvent[];
  isPolling: boolean;
  progress: ProgressInfo | null;
  minimumNoticePeriodSeconds: bigint | null;
  minimumVotingPeriodSeconds: bigint | null;
  quorum: bigint | null;
  getVoterInfos: (agendaId: number, voters: string[]) => Promise<VoterInfo[]>;
}