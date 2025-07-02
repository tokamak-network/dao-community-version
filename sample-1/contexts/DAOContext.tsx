"use client";

import {
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
import { useAccount } from 'wagmi'
import { DAOContextType, CommitteeMember, VoterInfo, Candidate } from "@/types/dao";
import { DEFAULT_CONTRACT_INFO } from "@/constants/dao";
import { CONTRACTS } from "@/config/contracts";
import { useChainId } from 'wagmi';


import { createRobustPublicClient } from "@/lib/rpc-utils";

// 분리된 핸들러 함수들 import
import {
  loadMaxMembers as loadMaxMembersFromHandler,
  loadCommitteeMembers as loadCommitteeMembersFromHandler,
  refreshSpecificMember as refreshSpecificMemberFromHandler
} from "@/lib/dao-member-handlers";
import {
  loadLayer2Candidates as loadLayer2CandidatesFromHandler,
  resetLayer2Cache as resetLayer2CacheFromHandler
} from "@/lib/dao-layer2-handlers";
import {
  createMemberChangedHandler,
  createActivityRewardClaimedHandler,
  createLayer2RegisteredHandler
} from "@/lib/dao-event-handlers";
import { setupEventMonitoring } from "@/lib/dao-event-monitor";

const DAOContext = createContext<DAOContextType | undefined>(undefined);

// 🎯 전역 변수로 중복 로딩 방지 (페이지 이동 시에도 유지)
let loadedMaxMembers: boolean = false;
let loadedCommitteeMembers: boolean = false;

const DAOProvider = memo(function DAOProvider({ children }: { children: ReactNode }) {
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


  console.log(`🔄 DAOProvider 렌더링 #${renderCount.current}`, {
    timestamp: new Date().toLocaleTimeString(),
    isConnected,
    address,
    renderNumber: renderCount.current,
    propsChanged,
    reason: propsChanged ? 'Props 변경' : '내부 상태 변경',
    test: 'wagmi 제거 테스트',
    previousConnectionState,
    isMember,
  });


  console.log(`📊 현재 상태 #${renderCount.current}`, {
    timestamp: new Date().toLocaleTimeString(),
    hasCommitteeMembers: !!committeeMembers,
    committeeCount: committeeMembers?.length || 0,
    maxMember,
    isLoadingMembers,
    loadedMaxMembers,
    loadedCommitteeMembers,
    statusMessage
  });

  // 🔍 멤버들의 상세 정보 출력 (operatorManager, manager 포함)
  if (committeeMembers && committeeMembers.length > 0) {
    console.log('👥 [MEMBER DETAILS] 현재 위원회 멤버들의 상세 정보:',
      committeeMembers.map(member => ({
        name: member.name,
        slotIndex: member.indexMembers,
        creationAddress: member.creationAddress,
        candidateContract: member.candidateContract,
        operatorManager: member.operatorManager,
        manager: member.manager,
        totalStaked: `${(Number(member.totalStaked) / 1e18).toFixed(2)} TON`,
        claimableReward: member.claimableActivityReward ?
          `${(Number(member.claimableActivityReward) / 1e18).toFixed(4)} TON` : '0 TON'
      }))
    );
  }


  const loadMaxMembers = useCallback(async () => {
    console.log("🚀 loadMaxMembers maxMember ", maxMember);
    console.log("🚀 loadMaxMembers loadedMaxMembers ", loadedMaxMembers);

    try {
      if (maxMember === 0) {
        const _maxMember = await loadMaxMembersFromHandler();
        loadedMaxMembers = true;
        setMaxMember(_maxMember);

        if (!loadedCommitteeMembers) {
          loadCommitteeMembers(_maxMember);
        }
      }
    } catch (err) {
      console.error("Failed to load maxMember:", err);
    }
  }, [maxMember]);

  const loadCommitteeMembers = useCallback(async (_maxMember?: number) => {
    console.log("🔄 loadCommitteeMembers 시작 (분리된 핸들러 사용)");
    loadedCommitteeMembers = true;

    try {
      setIsLoadingMembers(true);
      setMembersError(null);
      setStatusMessage("Loading committee members from blockchain...");

      const actualMaxMember = _maxMember || maxMember;

            // 분리된 핸들러 함수 사용 (상태 메시지 업데이트 포함)
      const memberDetails = await loadCommitteeMembersFromHandler(
        actualMaxMember,
        committeeMembers,
        lastFetchTimestamp,
        // 상태 메시지만 업데이트 (멤버는 전체 완료 후 한 번에 표시)
        (message) => {
          setStatusMessage(message);
        }
      );

      setCommitteeMembers(memberDetails);
      setStatusMessage(`✅ Loaded ${memberDetails.length} committee members`);
      console.log(`✅ Committee members loaded: ${memberDetails.length}`);

    } catch (err) {
      console.error("Failed to load committee members:", err);
      setMembersError("Failed to load committee members");
      setStatusMessage("❌ Error loading committee members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [maxMember, committeeMembers, lastFetchTimestamp]);

  // 🎯 Layer2 Candidates 로드 함수 (분리된 핸들러 사용)
  const loadLayer2Candidates = useCallback(async (force = false, onProgress?: (current: number, total: number, message: string) => void) => {
    setIsLoadingLayer2(true);
    setLayer2Error(null);

    try {
      // 분리된 핸들러 함수 사용 (진행 상황 콜백 포함)
      const result = await loadLayer2CandidatesFromHandler(
        force,
        hasLoadedLayer2Once,
        layer2Candidates,
        onProgress
      );

      // 상태 업데이트
      setLayer2Candidates(result.candidates);
      setLayer2Total(result.total);
      setHasLoadedLayer2Once(true);

      console.log('🎯 Layer2 캐싱 완료:', result.candidates.length, '개');

    } catch (error) {
      console.error('❌ Layer2 캐싱 실패:', error);
      setLayer2Error('Failed to load Layer2 candidates');
    } finally {
      setIsLoadingLayer2(false);
    }
  }, [hasLoadedLayer2Once, layer2Candidates]);

  // 🎯 빈 슬롯으로 설정하는 함수
  const setEmptySlot = useCallback((slotIndex: number) => {
    const emptyMember: CommitteeMember = {
      name: `Empty Slot ${slotIndex}`,
      description: "This committee slot is currently empty",
      creationAddress: "0x0000000000000000000000000000000000000000",
      candidateContract: "0x0000000000000000000000000000000000000000",
      claimedTimestamp: 0,
      rewardPeriod: 0,
      indexMembers: slotIndex,
      totalStaked: "0",
      lastCommitBlock: 0,
      lastUpdateSeigniorageTime: 0,
      claimableActivityReward: "0",
      operatorManager: "0x0000000000000000000000000000000000000000",
      manager: null
    };

    // 기존 멤버 목록에서 해당 슬롯을 빈 멤버 정보로 업데이트
    setCommitteeMembers(prevMembers => {
      if (!prevMembers) return [emptyMember];

      const existingIndex = prevMembers.findIndex(member => member.indexMembers === slotIndex);

      if (existingIndex >= 0) {
        // 기존 멤버를 빈 멤버로 교체
        const newMembers = [...prevMembers];
        newMembers[existingIndex] = emptyMember;
        return newMembers;
      } else {
        // 새 빈 슬롯 추가
        return [...prevMembers, emptyMember];
      }
    });

    console.log(`✅ 슬롯 ${slotIndex} 멤버 제거됨 - 빈 슬롯으로 설정`);
  }, []);

  // 🎯 특정 슬롯 인덱스의 멤버 정보만 업데이트하는 함수 (분리된 핸들러 사용)
  const refreshSpecificMember = useCallback(async (slotIndex: number) => {
    try {
      // 분리된 핸들러 함수 사용
      const updatedMember = await refreshSpecificMemberFromHandler(slotIndex);

      if (updatedMember === null) {
        // 멤버가 제거된 경우 - 빈 슬롯으로 설정
        setEmptySlot(slotIndex);
        return;
      }

      // 기존 멤버 목록에서 해당 슬롯의 멤버 정보 업데이트
      setCommitteeMembers(prevMembers => {
        if (!prevMembers) return [updatedMember];

        // 기존 멤버 인덱스 찾기
        const existingIndex = prevMembers.findIndex(member => member.indexMembers === slotIndex);

        if (existingIndex >= 0) {
          // 기존 멤버 업데이트
          const newMembers = [...prevMembers];
          newMembers[existingIndex] = updatedMember;
          return newMembers;
        } else {
          // 새 멤버 추가
          return [...prevMembers, updatedMember];
        }
      });

      console.log(`✅ 슬롯 ${slotIndex} 멤버 정보 업데이트 완료: ${updatedMember.name}`);

    } catch (error) {
      console.error(`❌ 슬롯 ${slotIndex} 멤버 업데이트 실패:`, error);
      setMembersError(`Failed to update member at slot ${slotIndex}`);
    }
  }, [setEmptySlot]);

  // 🎯 Layer2 캐시 리셋 함수 (새로고침용)
  const resetLayer2Cache = useCallback(() => {
    resetLayer2CacheFromHandler(); // 분리된 함수 호출
    // 상태 리셋
    setLayer2Candidates([]);
    setHasLoadedLayer2Once(false);
    setIsLoadingLayer2(false);
    setLayer2Error(null);
    setLayer2Total(0);
  }, []);


  useEffect(() => {
    console.log("🚀 DAO Context 초기화 - 앱 시작 시 바로 멤버 정보 로드", {
      timestamp: new Date().toLocaleTimeString(),
      hasCommitteeMembers: !!committeeMembers,
      committeeCount: committeeMembers?.length || 0,
    });

    // 앱 시작 시 바로 DAO 멤버 정보 로드 (조건 없이)
    console.log("🚀 앱 시작 - DAO 멤버 정보 로딩 시작");
    loadMaxMembers().then(() => {
      console.log('✅ DAO Context - loadMaxMembers 완료');
    }).catch((error) => {
      console.error('❌ DAO Context - loadMaxMembers 실패:', error);
    });

    return () => {
      console.log("🔄 DAOProvider 언마운트", {
        maxMember,
        memberCount: committeeMembers?.length || 0
      });
    }
  }, []); // 빈 의존성 배열 - 앱 시작 시 한 번만 실행

  // 🎯 지갑 연결 상태 변경 처리
   useEffect(() => {
     if (previousConnectionState !== isConnected) {
       if (isConnected && address) {
         // 네트워크 체크 및 자동 스위칭
         checkAndSwitchNetwork();

         // isMember 체크
         const memberCheck = committeeMembers?.some(member => member.creationAddress.toLowerCase() === address.toLowerCase());
         setIsMember(memberCheck || false);
         console.log('🔗 Wallet connected, loading private data...', { isMember: memberCheck });
       } else if (previousConnectionState === true && isConnected === false) {
         setIsMember(false);
         console.log('🔌 Wallet disconnected, clearing private data');
       }
       setPreviousConnectionState(isConnected);
     }
   }, [isConnected, address, previousConnectionState, committeeMembers]);

  // 네트워크 체크 및 자동 스위칭 함수
  const checkAndSwitchNetwork = async () => {
    try {
      if (!window.ethereum) {
        console.warn("MetaMask not detected");
        return;
      }

      const { BrowserProvider } = await import("ethers");
      const provider = new BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();

      const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
      console.log("🔍 Network check - Current:", network.chainId, "Expected:", expectedChainId);

      if (Number(network.chainId) !== expectedChainId) {
        console.log("🔄 Network mismatch detected. Attempting to switch...");

        const hexChainId = `0x${expectedChainId.toString(16)}`;

        try {
          // 네트워크 스위칭 시도
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: hexChainId }],
          });
          console.log("✅ Network switched successfully");
        } catch (switchError: any) {
          // 네트워크가 추가되지 않은 경우 추가
          if (switchError.code === 4902) {
            try {
              const networkConfig = expectedChainId === 1 ? {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://ethereum.publicnode.com'],
                blockExplorerUrls: ['https://etherscan.io'],
              } : {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://ethereum-sepolia.publicnode.com'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              };

              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig],
              });
              console.log("✅ Network added and switched successfully");
            } catch (addError) {
              console.error("❌ Failed to add network:", addError);
              const networkName = expectedChainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet";
              alert(`Please manually switch to ${networkName} (Chain ID: ${expectedChainId}) in your wallet.`);
            }
          } else {
            console.error("❌ Failed to switch network:", switchError);
            const networkName = expectedChainId === 1 ? "Ethereum Mainnet" : "Sepolia Testnet";
            alert(`Please manually switch to ${networkName} (Chain ID: ${expectedChainId}) in your wallet.`);
          }
        }
      } else {
        console.log("✅ Network is correct");
      }
    } catch (error) {
      console.error("❌ Network check failed:", error);
    }
  };

  // 🎯 Committee Members 로드 후 isMember 체크
  useEffect(() => {
    if (isConnected && address && committeeMembers && committeeMembers.length > 0) {
      const memberCheck = committeeMembers.some(member => member.creationAddress.toLowerCase() === address.toLowerCase());
      setIsMember(memberCheck);
      console.log('📋 Committee members loaded, checking membership:', {
        address,
        isMember: memberCheck,
        totalMembers: committeeMembers.length
      });
    }
    }, [committeeMembers, isConnected, address]);

  // 🎯 DAO 이벤트 모니터링 (직접 통합)
  const chainId = useChainId();

  // 🎯 이벤트 핸들러 정의 (분리된 함수 사용)
  const handleMemberChanged = useMemo(() =>
    createMemberChangedHandler(refreshSpecificMember),
    [refreshSpecificMember]
  );

  const handleActivityRewardClaimed = useMemo(() =>
    createActivityRewardClaimedHandler(refreshSpecificMember, maxMember, committeeMembers),
    [refreshSpecificMember, maxMember, committeeMembers]
  );

  const handleLayer2Registered = useMemo(() =>
    createLayer2RegisteredHandler(resetLayer2Cache),
    [resetLayer2Cache]
  );


  // 🎯 이벤트 모니터링 설정 (분리된 함수 사용)
  useEffect(() => {
    const cleanup = setupEventMonitoring(
      chainId,
      handleMemberChanged,
      handleActivityRewardClaimed,
      handleLayer2Registered
    );

    return cleanup;
  }, [handleMemberChanged, handleActivityRewardClaimed, handleLayer2Registered]);

  // 위원회 멤버 체크 함수
  const isCommitteeMember = useCallback((checkAddress: string): boolean => {
    console.log("isCommitteeMember", committeeMembers, checkAddress)
    if (!committeeMembers || !checkAddress) return false;

    return committeeMembers.some(member => {
      console.log("isCommitteeMember member", member, checkAddress)
      const lowerCheckAddress = checkAddress.toLowerCase();

      // creationAddress와 비교
      if (member.creationAddress.toLowerCase() === lowerCheckAddress) {
        return true;
      }

      // manager 주소가 Zero 주소가 아니면 manager 주소와도 비교
      if (member.manager &&
          member.manager.toLowerCase() !== '0x0000000000000000000000000000000000000000' &&
          member.manager.toLowerCase() === lowerCheckAddress) {
        return true;
      }

      return false;
    });
  }, [committeeMembers]);

  //  useMemo로 value 최적화
  const contextValue = useMemo(() => ({
    // Member 관련
    isMember,
    isCommitteeMember,

    // Committee Members 관련
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers: loadCommitteeMembers,
    refreshSpecificMember,

    // Layer2 Candidates 관련 (챌린징용)
    layer2Total,
    layer2Candidates,
    isLoadingLayer2,
    layer2Error,
    hasLoadedLayer2Once,
    loadLayer2Candidates,
    resetLayer2Cache,

    // Challenge Analysis 관련
    globalChallengeCandidates,
    setGlobalChallengeCandidates,
    analysisCompletedTime,
    setAnalysisCompletedTime,

    // // Owner 권한 관련
    // daoOwner: daoOwner.daoOwner,
    // isOwner: daoOwner.isOwner,
    // isLoadingOwner: daoOwner.isLoadingOwner,
    // checkOwnerPermissions: daoOwner.checkOwnerPermissions,
    // refreshOwnerInfo: daoOwner.refreshOwnerInfo,

    // // TON 잔액 및 제안 권한 관련
    // tonBalance: tonBalance.tonBalance,
    // isLoadingTonBalance: tonBalance.isLoadingTonBalance,
    // canProposeAgenda: tonBalance.canProposeAgenda,
    // canExecuteAgenda: agendas.canExecuteAgenda,
    // refreshTonBalance: tonBalance.refreshTonBalance,
    // checkAgendaProposalRequirements: tonBalance.checkAgendaProposalRequirements,

    // 공통
    statusMessage,
    contract: DEFAULT_CONTRACT_INFO,
    daoContract: DEFAULT_CONTRACT_INFO,
    events: [],
    isPolling: isConnected,
    progress: null,
    // createAgendaFees: tonBalance.createAgendaFees,
    minimumNoticePeriodSeconds: null,
    minimumVotingPeriodSeconds: null,
    quorum: null,




  }), [
    isMember,
    isCommitteeMember,
    committeeMembers,
    isLoadingMembers,
    membersError,
    loadCommitteeMembers,
    layer2Total,
    layer2Candidates,
    isLoadingLayer2,
    layer2Error,
    hasLoadedLayer2Once,
    loadLayer2Candidates,
    resetLayer2Cache,
    globalChallengeCandidates,
    analysisCompletedTime,
    statusMessage,
    isConnected,
  ]);

  return (
    <DAOContext.Provider value={contextValue}>
      {children}
    </DAOContext.Provider>
  );
});

export function useDAOContext() {
  const context = useContext(DAOContext);
  if (context === undefined) {
    throw new Error("useDAOContext must be used within a DAOProvider");
  }
  return context;
}

export { DAOProvider };