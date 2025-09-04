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
import { MESSAGES, AGENDA_STATUS, METADATA_CACHE_CONFIG } from "@/constants/dao";

import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";
import { createPublicClient, http } from "viem";

import {
  getAllAgendaMetadata,
  fetchAgendaEvents,
  getNetworkName,
  getLatestBlockNumber,
  getMetadataUrl,
  AgendaMetadata
} from "@/lib/utils";
import { queueRPCRequest, getSharedPublicClient } from "@/lib/shared-rpc-client";
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

// AgendaPagination 클래스 제거 - Context에서 직접 페이지네이션 관리

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

  // 🎯 디버그 로깅
  useEffect(() => {
    console.log('🏛️ CombinedDAOProvider: Render #', renderCount.current, {
      isConnected,
      address: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null,
      propsChanged
    })
  }, [isConnected, address, propsChanged])

  // 🎯 상태 관리 - Context에서 직접 관리 (sample-2 방식)
  const [committeeStatusMessage, setCommitteeStatusMessage] = useState("");
  const [agendaStatusMessage, setAgendaStatusMessage] = useState("");
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
  const [challengeProgress, setChallengeProgress] = useState({
    step: 'idle' as 'idle' | 'loading-layer2' | 'checking-members' | 'completed' | 'error',
    currentMemberIndex: 0,
    totalMembers: 0,
    message: '',
    error: ''
  });

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

  // 페이지네이션 상태를 Context에서 직접 관리
  const [totalAgendaCount, setTotalAgendaCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [paginatedAgendas, setPaginatedAgendas] = useState<AgendaWithMetadata[]>([]);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [paginationError, setPaginationError] = useState<string | null>(null);
  const [paginationStatus, setPaginationStatus] = useState('');
  const pageSize = 10;

  // // totalAgendaCount 변경 추적
  // useEffect(() => {
  //   console.log('🔍 [Context] totalAgendaCount changed:', totalAgendaCount);
  // }, [totalAgendaCount]);

  // 메타데이터 ID 목록 캐싱
  const [cachedMetadataIds, setCachedMetadataIds] = useState<Set<number>>(new Set());
  const [metadataIdListLastUpdated, setMetadataIdListLastUpdated] = useState<Date | null>(null);
  const [isLoadingMetadataIdList, setIsLoadingMetadataIdList] = useState(false);
  const [metadataIdListError, setMetadataIdListError] = useState<string | null>(null);

  // Runtime checks for contract addresses
  if (!CONTRACTS.daoAgendaManager.address) {
    throw new Error('DAO_AGENDA_MANAGER_ADDRESS is not configured');
  }
  if (!CONTRACTS.daoCommittee.address) {
    throw new Error('DAO_COMMITTEE_PROXY_ADDRESS is not configured');
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
    setCommitteeStatusMessage,
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

  // 📍 agendaFunctions는 hasValidAgendaWithMetadata 정의 이후로 이동됨


  // 📍 초기 데이터 로드는 agendaFunctions 정의 이후로 이동됨

  // 연결 상태 변경 시 처리
  useEffect(() => {
    if (previousConnectionState !== null && previousConnectionState !== isConnected) {


      if (isConnected && address) {
        // 연결되었을 때 멤버 여부 확인
        const memberStatus = daoFunctions.isCommitteeMember(address);
        setIsMember(memberStatus);

      } else {
        // 연결 해제되었을 때
        setIsMember(false);
      }
    }
    setPreviousConnectionState(isConnected);
  }, [isConnected, address, previousConnectionState, daoFunctions]);


  //----------------------------------------
  // Events
  //----------------------------------------

    // AgendaPagination 인스턴스 제거 - Context에서 직접 상태 관리

  // Context 기반 upsert 함수 - pagination 인스턴스 없이 직접 상태 업데이트
  const contextUpsertAgenda = useCallback((agenda: AgendaWithMetadata) => {
    setPaginatedAgendas(prev => {
      const existingIndex = prev.findIndex(a => a.id === agenda.id);
      if (existingIndex >= 0) {
        // 기존 아젠다 업데이트
        const updated = [...prev];
        updated[existingIndex] = agenda;
        return updated;
      } else {
        // 새 아젠다 추가 (ID 순서대로 정렬 유지)
        const newList = [...prev, agenda].sort((a, b) => b.id - a.id);
        return newList;
      }
    });
  }, []);

    // 중복 이벤트 방지용 ref
  const refreshCountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 메타데이터 캐시 초기화는 아래 loadMetadataCache 정의 이후에 배치

  // 이벤트 모니터링 useEffect: deps 최소화
  useEffect(() => {

    const updateAgendaData = agendaFunctions.updateAgendaData || (async () => {});
    const getAgenda = agendaFunctions.getAgenda || (async () => null);

    // totalAgendaCount 업데이트를 포함한 커스텀 핸들러
    const handleAgendaCreated = async (data: any) => {
      const agendaId = Number(data.id);

      // 먼저 totalAgendaCount를 즉시 업데이트 (validation 문제 방지)
      refreshTotalAgendaCount(0); // 지연없이 즉시 실행

      const newAgenda = await updateAgendaData(agendaId, true);
      if (contextUpsertAgenda && newAgenda) {
        contextUpsertAgenda(newAgenda);
      }
    };
    const handleAgendaVoteCasted = createAgendaVoteCastedHandler(
      updateAgendaData,
      contextUpsertAgenda
    );
    const handleAgendaExecuted = createAgendaExecutedHandler(
      updateAgendaData,
      contextUpsertAgenda
    );


    const cleanupAgenda = setupAgendaEventMonitoring(
      handleAgendaCreated,
      handleAgendaVoteCasted,
      handleAgendaExecuted
    );
    return cleanupAgenda;
  }, [chain.id, CONTRACTS.daoAgendaManager.address, contextUpsertAgenda]);

  // DAO 이벤트 모니터링 설정
  useEffect(() => {
    // DAO 이벤트 핸들러들 생성
    const handleMemberChanged = createMemberChangedHandler(daoFunctions.refreshSpecificMember);
    const handleActivityRewardClaimed = createActivityRewardClaimedHandler(
      daoFunctions.refreshSpecificMember,
      maxMember,
      committeeMembers
    );
    const handleLayer2Registered = createLayer2RegisteredHandler(daoFunctions.resetLayer2Cache);

    // DAO 이벤트 모니터링 설정
    const cleanupDAO = setupEventMonitoring(
      chain.id,
      handleMemberChanged,
      handleActivityRewardClaimed,
      handleLayer2Registered
    );

    // 컴포넌트 언마운트 시 이벤트 워처 정리
    return cleanupDAO;
  }, [chain.id, CONTRACTS.daoCommittee.address, maxMember, committeeMembers, daoFunctions.refreshSpecificMember, daoFunctions.resetLayer2Cache]);

    // 메타데이터 ID 목록 관리 함수들
  const loadMetadataIdList = useCallback(async (startId: number = 0, endId: number = 999999): Promise<Set<number> | null> => {
    setIsLoadingMetadataIdList(true);
    setMetadataIdListError(null);

    try {
      const networkName = getNetworkName(chain.id);

      // console.log(`🔍 Loading metadata cache for ${networkName}, range: ${startId} ~ ${endId}`);

      // metadata-range API를 사용해서 지정된 범위 가져오기
      const response = await fetch(`/api/metadata-range?network=${networkName}&start=${startId}&end=${endId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata cache: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const idsSet = new Set(data.existingIds as number[]);
        setCachedMetadataIds(idsSet);
        setMetadataIdListLastUpdated(new Date());
        // console.log(`✅ Metadata cache loaded: ${idsSet.size} IDs for ${networkName} (range: ${startId}~${endId})`);
        return idsSet; // 새로운 Set 반환
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Failed to load metadata cache:', error);
      setMetadataIdListError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsLoadingMetadataIdList(false);
    }
  }, []);

  const refreshMetadataIdList = useCallback(async (startId?: number, endId?: number): Promise<Set<number> | null> => {
    // console.log('🔄 Refreshing metadata ID list...');
    return await loadMetadataIdList(startId, endId);
  }, [loadMetadataIdList]);

  const hasMetadata = useCallback((agendaId: number): boolean => {
    return cachedMetadataIds.has(agendaId);
  }, [cachedMetadataIds]);

    // 아젠다 ID가 유효하고 메타데이터가 존재하는지 확인
  const hasValidAgendaWithMetadata = useCallback((agendaId: number): boolean => {
    // 1. 아젠다 ID가 음수가 아닌지만 확인 (더 관대한 validation)
    const isValidId = agendaId >= 0;
    // 2. 메타데이터가 존재하는지 확인
    const hasMetadataCache = cachedMetadataIds.has(agendaId);

    return isValidId && hasMetadataCache;
  }, [cachedMetadataIds]);

  // 모듈화된 Agenda 함수들 생성 (hasValidAgendaWithMetadata 이후로 이동)
  const agendaFunctions = useMemo(() => createAgendaContextFunctions(
    {
      setAgendas,
      setIsLoadingAgendas,
      setAgendasError,
      setAgendaStatusMessage,
      setHasLoadedOnce,
      setEvents,
      setIsPolling,
      setProgress,
      setCreateAgendaFees,
      setMinimumNoticePeriodSeconds,
      setMinimumVotingPeriodSeconds,
      setAgendaQuorum,
    },
    agendas,
    hasValidAgendaWithMetadata
  ), [agendas, hasValidAgendaWithMetadata]);

  // totalAgendaCount 업데이트 전용 함수 (디바운싱 포함)
  const refreshTotalAgendaCount = useCallback(async (delayMs: number = 500) => {
    // 중복 호출 방지
    if (refreshCountTimeoutRef.current) {
      clearTimeout(refreshCountTimeoutRef.current);
    }

    refreshCountTimeoutRef.current = setTimeout(async () => {
      try {
        const actualCount = await agendaFunctions.getTotalAgendaCount();
        setTotalAgendaCount(actualCount);
      } catch (error) {
        console.warn('Failed to refresh total agenda count:', error);
      }
    }, delayMs);
  }, [agendaFunctions.getTotalAgendaCount]);

  // 초기 데이터 로드 (agendaFunctions 정의 이후로 이동)
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

    // Context에서 총 아젠다 개수 초기화
    if (totalAgendaCount === 0) {
      setIsPaginationLoading(true);
      setPaginationError(null);
      setPaginationStatus('Loading total agenda count...');

      agendaFunctions.getTotalAgendaCount()
        .then(async (count: number) => {
          setTotalAgendaCount(count);
          setPaginationStatus(`Found ${count} total agendas`);
          // console.log('✅ [Context] Total agenda count loaded:', count);

          // 바로 메타데이터 ID 목록도 가져오기
          if (count > 0 && cachedMetadataIds.size === 0) {
            setPaginationStatus(`Loading metadata ID list for ${count} agendas...`);
            // console.log(`🔍 Loading metadata cache for ${count} agendas...`);

            try {
              await loadMetadataIdList(0, count - 1);
              setPaginationStatus(`Loaded metadata cache for ${count} agendas`);
              // console.log('✅ [Context] Metadata cache loaded, ready to load first page');
            } catch (metadataError: any) {
              console.warn('Failed to load metadata ID list:', metadataError);
              // 메타데이터 로드 실패는 치명적이지 않으므로 계속 진행
            }
          }
        })
        .catch((error: any) => {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get total agenda count';
          setPaginationError(errorMessage);
          setPaginationStatus(errorMessage);
          console.error('❌ [Context] Failed to load total count:', error);
        })
        .finally(() => {
          setIsPaginationLoading(false);
        });
    }

  }, [hasLoadedOnce, createAgendaFees, minimumNoticePeriodSeconds, totalAgendaCount, agendaFunctions, cachedMetadataIds.size, loadMetadataIdList]);

  // 메타데이터 캐시 자동 업데이트 (5분마다)
  useEffect(() => {
    if (totalAgendaCount === 0) return; // 아젠다 개수가 로드되지 않으면 대기

    const intervalId = setInterval(async () => {
      // console.log('🔄 [Context] Auto-updating metadata cache...');
      try {
        await refreshMetadataIdList(0, totalAgendaCount - 1);
        // console.log('✅ [Context] Metadata cache auto-updated successfully');
      } catch (error) {
        console.warn('⚠️ [Context] Failed to auto-update metadata cache:', error);
      }
    }, METADATA_CACHE_CONFIG.AUTO_UPDATE_INTERVAL_MS);

    // console.log(`⏰ [Context] Metadata cache auto-update started (every ${METADATA_CACHE_CONFIG.AUTO_UPDATE_INTERVAL_MS / 1000 / 60} minutes)`);

    return () => {
      clearInterval(intervalId);
      // console.log('🛑 [Context] Metadata cache auto-update stopped');
    };
  }, [totalAgendaCount, refreshMetadataIdList]);

  // Context에서 페이지별 아젠다 로드
  const loadAgendaPage = useCallback(async (page: number): Promise<AgendaWithMetadata[]> => {
    if (totalAgendaCount === 0) {
      console.warn('Total agenda count not loaded yet');
      return [];
    }

    setIsPaginationLoading(true);
    setPaginationError(null);
    setPaginationStatus(`Loading page ${page}...`);

    try {
      // 페이지 범위 계산 (최신순)
      const startId = Math.max(0, totalAgendaCount - (page * pageSize));
      const endId = Math.min(totalAgendaCount - 1, totalAgendaCount - ((page - 1) * pageSize) - 1);

      // console.log(`🔍 [Context] Loading page ${page}: agendas ${startId} to ${endId} (total: ${totalAgendaCount})`);

      // loadAgendaRange 함수 사용
      const pageAgendas = await agendaFunctions.loadAgendaRange(startId, endId, hasMetadata);

      // 상태 업데이트
      if (page === 1) {
        // 첫 페이지면 전체 교체
        setPaginatedAgendas(pageAgendas);
        setLoadedPages(new Set([1]));
      } else {
        // 추가 페이지면 기존 데이터에 추가
        setPaginatedAgendas(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newAgendas = pageAgendas.filter(a => !existingIds.has(a.id));
          return [...prev, ...newAgendas];
        });
        setLoadedPages(prev => new Set([...Array.from(prev), page]));
      }

      setCurrentPage(page);
      setPaginationStatus(`Loaded ${pageAgendas.length} agendas for page ${page}`);
      // console.log(`✅ [Context] Page ${page} loaded: ${pageAgendas.length} agendas`);

      return pageAgendas;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to load page ${page}`;
      setPaginationError(errorMessage);
      setPaginationStatus(errorMessage);
      console.error(`❌ [Context] Failed to load page ${page}:`, error);
      return [];
    } finally {
      setIsPaginationLoading(false);
    }
  }, [totalAgendaCount, pageSize, agendaFunctions, hasMetadata]);

  // 다음 페이지 로드
  const loadNextPage = useCallback(async (): Promise<AgendaWithMetadata[]> => {
    const nextPage = currentPage + 1;
    const maxPage = Math.ceil(totalAgendaCount / pageSize);

    if (nextPage > maxPage) {
      console.warn('No more pages to load');
      return [];
    }

    return await loadAgendaPage(nextPage);
  }, [currentPage, totalAgendaCount, pageSize, loadAgendaPage]);



  // 조건이 만족되면 첫 번째 페이지 자동 로드
  useEffect(() => {
    const shouldLoadFirstPage =
      totalAgendaCount > 0 &&
      cachedMetadataIds.size > 0 &&
      paginatedAgendas.length === 0 &&
      !isPaginationLoading &&
      loadAgendaPage; // 함수가 정의되었는지 확인

    if (shouldLoadFirstPage) {
      // console.log('🔄 [Context] Auto-loading first page...', {
      //   totalAgendaCount,
      //   metadataCacheSize: cachedMetadataIds.size,
      //   paginatedAgendasLength: paginatedAgendas.length,
      //   isPaginationLoading
      // });

      loadAgendaPage(1).catch(error => {
        console.error('❌ [Context] Failed to auto-load first page:', error);
      });
    }
  }, [totalAgendaCount, cachedMetadataIds.size, paginatedAgendas.length, isPaginationLoading, loadAgendaPage]);

  // 모듈화된 함수들을 사용한 contextValue
  const contextValue = useMemo(() => ({
    // DAO 관련
    isMember,
    isCommitteeMember: daoFunctions.isCommitteeMember,
    getCommitteeMemberInfo: daoFunctions.getCommitteeMemberInfo,
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
    challengeProgress,
    setChallengeProgress,
    committeeStatusMessage,
    agendaStatusMessage,

    // Agenda 관련 - Context에서 직접 관리
    agendas: paginatedAgendas,
    isLoading: isPaginationLoading,
    error: paginationError,
    refreshAgendas: async () => {
      // Context 기반 페이징 시스템 재초기화
      try {
        setIsPaginationLoading(true);
        setPaginationError(null);
        setPaginationStatus('Refreshing agendas...');

        // 첫 페이지 다시 로드
        await loadAgendaPage(1);
        setPaginationStatus('Agendas refreshed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh agendas';
        setPaginationError(errorMessage);
        setPaginationStatus(errorMessage);
      } finally {
        setIsPaginationLoading(false);
      }
    },
    refreshAgenda: agendaFunctions.refreshAgenda || (async () => {}),
    refreshAgendaWithoutCache: agendaFunctions.refreshAgendaWithoutCache || (async (agendaId: number, overrideMetadataCache?: Set<number>) => null),
    getAgenda: agendaFunctions.getAgenda || (async () => null),
    events,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    quorum: agendaQuorum,
    getVoterInfos: agendaFunctions.getVoterInfos || (async () => []),
    getTransactionData: agendaFunctions.getTransactionData || (async () => null),
    updateAgendaCalldata: agendaFunctions.updateAgendaCalldata || (async () => {}),

    // 페이지네이션 관련 추가
    paginationState: {
      totalCount: totalAgendaCount,
      currentPage,
      loadedPages: Array.from(loadedPages),
      agendas: paginatedAgendas,
      isLoading: isPaginationLoading,
      error: paginationError
    },
    paginationStatus,
    loadAgendaPage,
    loadNextPage,
    hasMore: () => {
      // Context 상태 기반으로 더 로드할 아젠다가 있는지 확인
      const hasMoreItems = paginatedAgendas.length < totalAgendaCount;
      // console.log('🔍 [Context] hasMore check:', {
      //   paginatedCount: paginatedAgendas.length,
      //   totalCount: totalAgendaCount,
      //   hasMore: hasMoreItems
      // });
      return hasMoreItems;
    },
    getRemainingCount: () => {
      // 남은 아젠다 개수 계산
      const remaining = Math.max(0, totalAgendaCount - paginatedAgendas.length);
      // console.log('🔍 [Context] getRemainingCount:', {
      //   paginatedCount: paginatedAgendas.length,
      //   totalCount: totalAgendaCount,
      //   remaining: remaining
      // });
      return remaining;
    },
    upsertAgenda: contextUpsertAgenda,

    // 메타데이터 ID 목록 관련
    cachedMetadataIds,
    metadataIdListLastUpdated,
    isLoadingMetadataIdList,
    metadataIdListError,
    loadMetadataIdList,
    refreshMetadataIdList,
    hasMetadata,
    hasValidAgendaWithMetadata,

    // 공통
    statusMessage,
    contract: DEFAULT_CONTRACT_INFO,
    daoContract: DEFAULT_CONTRACT_INFO,
    isPolling,
    progress,
  }), [
    isMember, committeeMembers, isLoadingMembers, membersError,
    layer2Total, layer2Candidates, isLoadingLayer2, layer2Error, hasLoadedLayer2Once,
    globalChallengeCandidates, analysisCompletedTime, challengeProgress,
    events, // 기존 아젠다 state 제거, 페이징으로 교체
    createAgendaFees, minimumNoticePeriodSeconds, minimumVotingPeriodSeconds, agendaQuorum,
    statusMessage, isPolling, progress,
    daoFunctions, agendaFunctions,
    committeeStatusMessage, agendaStatusMessage,
    // 페이지네이션 관련 deps
    totalAgendaCount, currentPage, loadedPages, paginatedAgendas, isPaginationLoading, paginationError,
    paginationStatus, loadAgendaPage, loadNextPage,

    // 메타데이터 ID 목록 관련 deps
    cachedMetadataIds, metadataIdListLastUpdated, isLoadingMetadataIdList, metadataIdListError,
    loadMetadataIdList, refreshMetadataIdList, hasMetadata, hasValidAgendaWithMetadata
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
