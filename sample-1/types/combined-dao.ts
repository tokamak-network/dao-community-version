import { DAOContextType, CommitteeMember } from "./dao";
import { AgendaWithMetadata, AgendaCreatedEvent } from "./agenda";

// 아젠다 컨텍스트에서 사용하던 타입들 (AgendaContext.tsx에서 가져옴)
interface AgendaContextType {
  agendas: AgendaWithMetadata[];
  isLoading: boolean;
  error: string | null;
  refreshAgendas: () => Promise<void>;
  refreshAgenda: (agendaId: number) => Promise<void>;
  refreshAgendaWithoutCache: (agendaId: number) => Promise<AgendaWithMetadata | null>;
  getAgenda: (agendaId: number) => Promise<AgendaWithMetadata | null>;
  statusMessage: string;
  contract: {
    address: `0x${string}`;
    abi: any;
    chainId: number;
  };
  daoContract: {
    address: `0x${string}`;
    abi: any;
    chainId: number;
  };
  events: AgendaCreatedEvent[];
  isPolling: boolean;
  progress: {
    current: bigint;
    total: bigint;
    percentage: number;
  } | null;
  createAgendaFees: bigint | null;
  minimumNoticePeriodSeconds: bigint | null;
  minimumVotingPeriodSeconds: bigint | null;
  quorum: bigint | null;
  getVoterInfos: (
    agendaId: number,
    voters: string[]
  ) => Promise<
    {
      isVoter: boolean;
      hasVoted: boolean;
      vote: bigint;
    }[]
  >;
  getTransactionData: (txHash: string) => Promise<string | null>;
  updateAgendaCalldata: (agendaId: number) => Promise<void>;
}

// DAO와 아젠다 기능을 모두 포함하는 통합 컨텍스트 타입
// DAOContextType과 AgendaContextType을 합치되, 중복되는 필드들은 AgendaContextType 것을 우선시
export interface CombinedDAOContextType extends Omit<DAOContextType, keyof Overlapping>, AgendaContextType {
  // DAOContextType에서만 제공하는 고유 기능들
  isMember: boolean;
  isCommitteeMember: (address: string) => boolean;
  getCommitteeMemberInfo: (address: string) => { isMember: boolean; memberInfo?: CommitteeMember; ownershipType?: 'creation' | 'manager' };

  // Committee Members 관련
  committeeMembers: DAOContextType['committeeMembers'];
  isLoadingMembers: boolean;
  membersError: string | null;
  refreshCommitteeMembers: DAOContextType['refreshCommitteeMembers'];
  refreshSpecificMember: DAOContextType['refreshSpecificMember'];

  // Layer2 Candidates 관련 (챌린징용)
  layer2Total: number;
  layer2Candidates: DAOContextType['layer2Candidates'];
  isLoadingLayer2: boolean;
  layer2Error: string | null;
  hasLoadedLayer2Once: boolean;
  loadLayer2Candidates: DAOContextType['loadLayer2Candidates'];
  resetLayer2Cache: () => void;

  // Challenge Analysis 관련
  globalChallengeCandidates: any[];
  setGlobalChallengeCandidates: (candidates: any[]) => void;
  analysisCompletedTime: Date | null;
  setAnalysisCompletedTime: (time: Date | null) => void;
  challengeProgress: {
    step: 'idle' | 'loading-layer2' | 'checking-members' | 'completed' | 'error';
    currentMemberIndex: number;
    totalMembers: number;
    message: string;
    error: string;
  };
  setChallengeProgress: (progress: {
    step: 'idle' | 'loading-layer2' | 'checking-members' | 'completed' | 'error';
    currentMemberIndex: number;
    totalMembers: number;
    message: string;
    error: string;
  }) => void;

  // NEW: status messages for committee and agenda
  committeeStatusMessage: string;
  agendaStatusMessage: string;

  paginationState?: any;
  paginationStatus?: string;
  loadToPage?: (page: number) => void;
  loadNextPage?: () => void;
  hasMore?: () => boolean;
  getRemainingCount?: () => number;
  upsertAgenda?: (agenda: AgendaWithMetadata) => void;
}

// 중복되는 필드들 정의 (AgendaContextType 것을 우선시하기 위해)
interface Overlapping {
  statusMessage: string;
  contract: any;
  daoContract: any;
  isPolling: boolean;
  progress: any;
}