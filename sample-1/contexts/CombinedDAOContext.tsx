"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useAccount, useChainId } from 'wagmi'

// import { DAOProvider, useDAOContext } from "@/contexts/DAOContext";
// import { AgendaProvider, useAgenda } from "@/contexts/AgendaContext";
import { CombinedDAOContextType } from "@/types/combined-dao";
import { CommitteeMember, VoterInfo, Candidate } from "@/types/dao";
import {
  AgendaWithMetadata,
  AgendaCreatedEvent,
  AgendaAction,
} from "@/types/agenda";

import { DEFAULT_CONTRACT_INFO } from "@/constants/dao";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";

import { daoAgendaManagerAbi } from "@/abis/dao-agenda-manager";
import { DAO_ABI } from "@/abis/dao";

import { chain } from "@/config/chain";
import { MESSAGES, AGENDA_STATUS } from "@/constants/dao";

import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";
import { createPublicClient, http } from "viem";

import {
  getAllAgendaMetadata,
  fetchAgendaEvents,
  getLatestBlockNumber,
  getNetworkName,
  getMetadataUrl,
  AgendaMetadata
} from "@/lib/utils";
// 분리된 핸들러 함수들 import
import {
  createAgendaCreatedHandler,
  createAgendaVoteCastedHandler,
  createAgendaExecutedHandler
} from "@/lib/agenda-event-handlers";

import {
  createMemberChangedHandler,
  createActivityRewardClaimedHandler,
  createLayer2RegisteredHandler
} from "@/lib/dao-event-handlers";

// 모듈화된 DAO Context 함수들 import
import { createDAOContextFunctions, type DAOContextFunctions } from "@/lib/dao-context-functions";
import { createAgendaContextFunctions } from "@/lib/agenda-context-functions";

import { setupAgendaEventMonitoring } from "@/lib/agenda-event-monitor";
import { setupEventMonitoring } from "@/lib/dao-event-monitor";

// 🎯 전역 변수로 중복 로딩 방지 (페이지 이동 시에도 유지)
let loadedMaxMembers: boolean = false;
let loadedCommitteeMembers: boolean = false;

// Context 생성
const CombinedDAOContext = createContext<CombinedDAOContextType | undefined>(undefined);


const CombinedDAOProvider = memo(function CombinedDAOProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()


  // 🔍 렌더링 원인 추적
  const renderCount = useRef(0);
  const prevProps = useRef({ address, isConnected });

  renderCount.current += 1;

  // 이전 props와 비교
  const propsChanged =
    prevProps.current.address !== address ||
    prevProps.current.isConnected !== isConnected;

  // 🎯 상태 관리 - Context에서 직접 관리 (sample-2 방식)
  const [statusMessage, setStatusMessage] = useState("");
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const [previousConnectionState, setPreviousConnectionState] = useState<boolean | null>(null);

  // 이전 props 업데이트
  prevProps.current = { address, isConnected };

    // 🎯 Committee Members 상태를 전역 상태와 동기화
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>();
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [maxMember, setMaxMember] = useState<number>(0);
  const [isMember, setIsMember] = useState<boolean>(false);

  // 🎯 Layer2 Candidates 캐싱 상태
  const [layer2Total, setLayer2Total] = useState<number>(0);
  const [layer2Candidates, setLayer2Candidates] = useState<Candidate[]>([]);
  const [isLoadingLayer2, setIsLoadingLayer2] = useState(false);
  const [layer2Error, setLayer2Error] = useState<string | null>(null);
  const [hasLoadedLayer2Once, setHasLoadedLayer2Once] = useState(false);


  // 🎯 Challenge Analysis 상태
  const [globalChallengeCandidates, setGlobalChallengeCandidates] = useState<any[]>([]);
  const [analysisCompletedTime, setAnalysisCompletedTime] = useState<Date | null>(null);

  // 🎯 Agenda 상태 관리
  const [agendas, setAgendas] = useState<AgendaWithMetadata[]>([]);
  const [isLoadingAgendas, setIsLoadingAgendas] = useState(false);
  const [agendasError, setAgendasError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [events, setEvents] = useState<AgendaCreatedEvent[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [progress, setProgress] = useState<{
    current: bigint;
    total: bigint;
    percentage: number;
  } | null>(null);

  // 컨트랙트 설정값들
  const [createAgendaFees, setCreateAgendaFees] = useState<bigint | null>(null);
  const [minimumNoticePeriodSeconds, setMinimumNoticePeriodSeconds] = useState<bigint | null>(null);
  const [minimumVotingPeriodSeconds, setMinimumVotingPeriodSeconds] = useState<bigint | null>(null);
  const [agendaQuorum, setAgendaQuorum] = useState<bigint | null>(null);

  // Runtime checks for contract addresses
  if (!CONTRACTS.daoAgendaManager.address) {
    throw new Error('DAO_AGENDA_MANAGER_ADDRESS is not configured');
  }
  if (!CONTRACTS.daoCommittee.address) {
    throw new Error('DAO_COMMITTEE_PROXY_ADDRESS is not configured');
  }

  if (process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true') {
    console.log(`🔄 CombinedDAOProvider 렌더링 #${renderCount.current}`, {
      timestamp: new Date().toLocaleTimeString(),
      isConnected,
      address,
      renderNumber: renderCount.current,
      propsChanged,
      reason: propsChanged ? 'Props 변경' : '내부 상태 변경'
    });
  }


  //----------------------------------------
  // DAO 모듈 - 핵심 DAO 기능들 (모듈화)
  //----------------------------------------

  // 모듈화된 DAO 함수들 생성
  const daoFunctions = useMemo(() => createDAOContextFunctions(
    // 상태 업데이트 함수들
    setMaxMember,
    setCommitteeMembers,
    setIsLoadingMembers,
    setMembersError,
    setStatusMessage,
    setLayer2Candidates,
    setLayer2Total,
    setIsLoadingLayer2,
    setLayer2Error,
    setHasLoadedLayer2Once,
    // 현재 상태값들
    maxMember,
    committeeMembers,
    lastFetchTimestamp,
    hasLoadedLayer2Once,
    layer2Candidates
  ), [
    maxMember, committeeMembers, lastFetchTimestamp,
    hasLoadedLayer2Once, layer2Candidates
  ]);

  // 모듈화된 Agenda 함수들 생성
  const agendaFunctions = useMemo(() => createAgendaContextFunctions(
    {
      setAgendas,
      setIsLoadingAgendas,
      setAgendasError,
      setStatusMessage,
      setHasLoadedOnce,
      setEvents,
      setIsPolling,
      setProgress,
      setCreateAgendaFees,
      setMinimumNoticePeriodSeconds,
      setMinimumVotingPeriodSeconds,
      setAgendaQuorum,
    },
    agendas
  ), [agendas]);

  // 초기 데이터 로드
  useEffect(() => {
    const { getLoadedStates } = daoFunctions;
    const { loadedMaxMembers } = getLoadedStates();

    if (!loadedMaxMembers) {
      daoFunctions.loadMaxMembers();
    }

    // Agenda 컨트랙트 설정값들 로드 (한 번만)
    if (!createAgendaFees && !minimumNoticePeriodSeconds) {
      agendaFunctions.loadContractSettings();
    }

    // 아젠다 목록 초기 로드 (한 번만)
    if (!hasLoadedOnce && agendaFunctions.refreshAgendas) {
      if (process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true') {
        console.log('🔄 첫 번째 아젠다 목록 로드 시작');
      }
      agendaFunctions.refreshAgendas();
    }
  }, [hasLoadedOnce, createAgendaFees, minimumNoticePeriodSeconds]);

  // 연결 상태 변경 시 처리
  useEffect(() => {
    if (previousConnectionState !== null && previousConnectionState !== isConnected) {
      if (process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true') {
        console.log(`🔄 지갑 연결 상태 변경: ${previousConnectionState} → ${isConnected}`);
      }

      if (isConnected && address) {
        // 연결되었을 때 멤버 여부 확인
        const memberStatus = daoFunctions.isCommitteeMember(address);
        setIsMember(memberStatus);
        if (process.env.NEXT_PUBLIC_RPC_WORKER_LOG === 'true') {
          console.log(`👤 멤버 상태 업데이트: ${address} → ${memberStatus ? '멤버' : '비멤버'}`);
        }
      } else {
        // 연결 해제되었을 때
        setIsMember(false);
      }
    }
    setPreviousConnectionState(isConnected);
  }, [isConnected, address, previousConnectionState, daoFunctions]);

  //----------------------------------------
  // Agenada
  //----------------------------------------

  //----------------------------------------
  // Events
  //----------------------------------------


  // 모듈화된 함수들을 사용한 contextValue
  const contextValue = useMemo(() => ({
    // DAO 관련
    isMember,
    isCommitteeMember: daoFunctions.isCommitteeMember,
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers: daoFunctions.refreshCommitteeMembers,
    refreshSpecificMember: daoFunctions.refreshSpecificMember,
    layer2Total,
    layer2Candidates,
    isLoadingLayer2,
    layer2Error,
    hasLoadedLayer2Once,
    loadLayer2Candidates: daoFunctions.loadLayer2Candidates,
    resetLayer2Cache: daoFunctions.resetLayer2Cache,
    globalChallengeCandidates,
    setGlobalChallengeCandidates,
    analysisCompletedTime,
    setAnalysisCompletedTime,

    // Agenda 관련
    agendas,
    isLoading: isLoadingAgendas,
    error: agendasError,
    refreshAgendas: agendaFunctions.refreshAgendas || (async () => {}),
    refreshAgenda: agendaFunctions.refreshAgenda || (async () => {}),
    refreshAgendaWithoutCache: agendaFunctions.refreshAgendaWithoutCache || (async () => null),
    getAgenda: agendaFunctions.getAgenda || (async () => null),
    events,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    quorum: agendaQuorum,
    getVoterInfos: agendaFunctions.getVoterInfos || (async () => []),
    getTransactionData: agendaFunctions.getTransactionData || (async () => null),
    updateAgendaCalldata: agendaFunctions.updateAgendaCalldata || (async () => {}),

    // 공통
    statusMessage,
    contract: DEFAULT_CONTRACT_INFO,
    daoContract: DEFAULT_CONTRACT_INFO,
    isPolling,
    progress,
  }), [
    isMember, committeeMembers, isLoadingMembers, membersError,
    layer2Total, layer2Candidates, isLoadingLayer2, layer2Error, hasLoadedLayer2Once,
    globalChallengeCandidates, analysisCompletedTime,
    agendas, isLoadingAgendas, agendasError, events,
    createAgendaFees, minimumNoticePeriodSeconds, minimumVotingPeriodSeconds, agendaQuorum,
    statusMessage, isPolling, progress
    // daoFunctions, agendaFunctions 제거 - 함수는 의존성에서 제외
  ]);

  return (
    <CombinedDAOContext.Provider value={contextValue}>
      {children}
    </CombinedDAOContext.Provider>
  );
});


// 통합 hook - CombinedDAOContext 사용
export function useCombinedDAOContext() {
  const context = useContext(CombinedDAOContext);
  if (context === undefined) {
    throw new Error("useCombinedDAOContext must be used within a CombinedDAOProvider");
  }
  return context;
}


export { CombinedDAOProvider };
