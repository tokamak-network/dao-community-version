

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
  operator: string;
  operatorManager: string;
  manager: string | null;
  isCommitteeMember: boolean; // 현재 위원회 멤버인지 여부
  cooldown: number; // 쿨다운 시간
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

export interface DAOContextType {
  isMember: boolean;
  isCommitteeMember: (address: string) => boolean;

  // Committee Members 관련
  committeeMembers: CommitteeMember[] | undefined;
  isLoadingMembers: boolean;
  membersError: string | null;
  refreshCommitteeMembers: (maxMember?: number) => Promise<void>;
  refreshSpecificMember: (slotIndex: number) => Promise<void>;

  // Layer2 Candidates 관련 (챌린징용)
  layer2Total: number;
  layer2Candidates: Candidate[];
  isLoadingLayer2: boolean;
  layer2Error: string | null;
  hasLoadedLayer2Once: boolean;
  loadLayer2Candidates: (force?: boolean, onProgress?: (current: number, total: number, message: string) => void) => Promise<void>;
  resetLayer2Cache: () => void;

  // Challenge Analysis 관련
  globalChallengeCandidates: any[];
  setGlobalChallengeCandidates: (candidates: any[]) => void;
  analysisCompletedTime: Date | null;
  setAnalysisCompletedTime: (time: Date | null) => void;



  // 공통
  statusMessage: string;
  contract: ContractInfo;
  daoContract: ContractInfo;
  isPolling: boolean;
  progress: ProgressInfo | null;


}