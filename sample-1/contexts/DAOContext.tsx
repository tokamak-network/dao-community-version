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
import { CONTRACTS, BLOCK_RANGE, POLLING_INTERVAL } from "@/config/contracts";

import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { seigManagerAbi } from "@/abis/seig-mamager";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";

import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";
import { CONTRACT_READ_SETTINGS } from "@/config/contracts";

const DAOContext = createContext<DAOContextType | undefined>(undefined);

let loadedMaxMembers:boolean = false;
let loadedCommitteeMembers:boolean = false ;

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

  // 🎯 React Strict Mode 보호
  const hasInitialized = useRef(false);

  // 🎯 훅 사용 (committee members 제외)
  // const daoOwner = useDAOOwner({
  //   isConnected,
  //   address: address || null,
  //   setStatusMessage
  // });
  // const tonBalance = useTONBalance({
  //   isConnected,
  //   address: address || null,
  //   setStatusMessage
  // });
  // const agendas = useAgendas({ isConnected, setStatusMessage });

  const loadMaxMembers = useCallback(async () => {

    console.log("🚀 loadMaxMembers maxMember ", maxMember);
    console.log("🚀 loadMaxMembers loadedMaxMembers ", loadedMaxMembers);

    try {
      if (maxMember === 0) {
        console.log("--- read maxMember");
        const publicClient = await createRobustPublicClient();
        let _maxMember: bigint = BigInt(0);
        _maxMember =  await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
            abi: daoCommitteeAbi,
            functionName: 'maxMember',
        });
        console.log("-- ", _maxMember);
        loadedMaxMembers = true;
        setMaxMember(Number(_maxMember));

        if (!loadedCommitteeMembers) {
          loadCommitteeMembers(Number(_maxMember));
        }
      }
    } catch (err) {
      console.error("Failed to load maxMember:", err);
    }
  }, [ ]);


  const loadCommitteeMembers = useCallback(async (_maxMember?: number) => {
    console.log("🔄 loadCommitteeMembers 시작", {
      timestamp: new Date().toLocaleTimeString(),
      _maxMember,
      currentCommitteeCount: committeeMembers?.length || 0,
      loadedCommitteeMembers
    });

    loadedCommitteeMembers = true;
    const { BATCH_SIZE, BATCH_DELAY_MS, CACHE_DURATION_MS } = CONTRACT_READ_SETTINGS;

    console.log("🚀 loadCommitteeMembers maxMember ", _maxMember);
    console.log("🚀 loadCommitteeMembers loadedMaxMembers ", loadedMaxMembers);

    try {

      if (committeeMembers &&
        committeeMembers.length > 0
        // &&
        // Date.now() - lastFetchTimestamp < CACHE_DURATION_MS
      ) {
        console.log("⏭️ 캐시된 데이터 존재, 로드 스킵", {
          committeeCount: committeeMembers.length
        });
        setStatusMessage(
          `Data was recently loaded. Skipping reload.`
        );
        return;
      }

      console.log("✅ 새 데이터 로드 시작");
      setIsLoadingMembers(true);
      setMembersError(null);
      setStatusMessage("Loading committee members from blockchain...");
      const actualMaxMember = _maxMember || maxMember;
      if (actualMaxMember > 0) {
        const publicClient = await createRobustPublicClient();

        let _memberAddresses: string[] = [];
        for (let i = 0; i < actualMaxMember; i++) {
          try {
            const _memberAddress = await readContractWithRetry(
              () => publicClient.readContract({
                address: CONTRACTS.daoCommittee.address,
                abi: daoCommitteeAbi,
                functionName: 'members',
                args: [BigInt(i)],
              }) as Promise<string>,
              `Member ${i} address`
            );
            if (_memberAddress && _memberAddress !== '0x0000000000000000000000000000000000000000') {
              _memberAddresses.push(_memberAddress);
            }
          } catch (error) {
            break;
          }
        }

        const memberDetails = await Promise.all(
          _memberAddresses.map(async (address, index) => {
            try {
              console.log('memberDetails', index)

              const candidateInfo = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.daoCommittee.address,
                  abi: daoCommitteeAbi,
                  functionName: 'candidateInfos',
                  args: [address as `0x${string}`],
                }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
                `Member ${address} candidate info`
              );
              console.log('candidateInfo', candidateInfo)
              const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

              // candidate meno
              const memo = await readContractWithRetry(
                () => publicClient.readContract({
                  address: candidateContract,
                  abi: daoCandidateAbi,
                  functionName: 'memo',
                  args: [],
                }) as Promise<string>,
                `Member ${index + 1} candidate name`
              );

              // total staked
              const totalStaked = await readContractWithRetry(
                () => publicClient.readContract({
                  address: candidateContract,
                  abi: daoCandidateAbi,
                  functionName: 'totalStaked',
                  args: [],
                }) as Promise<bigint>,
                `Member ${index + 1} total staked`
              );

              // 청구 가능한 활동비 계산
              const claimableActivityReward = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.daoCommittee.address,
                  abi: daoCommitteeAbi,
                  functionName: 'getClaimableActivityReward',
                  args: [address as `0x${string}`],
                }) as Promise<bigint>,
                `claimActivityReward`
              );

              // 마지막 커밋 블록 조회
              const lastCommitBlock = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.seigManager.address,
                  abi: seigManagerAbi,
                  functionName: 'lastCommitBlock',
                  args: [candidateContract],
                }) as Promise<bigint>,
                `lastCommitBlock`
              );

              console.log("lastCommitBlock", lastCommitBlock)

              // lastCommitBlock의 타임스탬프 가져오기
              let lastUpdateSeigniorageTime = 0;
              if (lastCommitBlock > 0) {
                try {
                  const block = await publicClient.getBlock({
                    blockNumber: lastCommitBlock
                  });
                  lastUpdateSeigniorageTime = Number(block.timestamp);
                  console.log(`Block ${lastCommitBlock} timestamp:`, lastUpdateSeigniorageTime);
                } catch (error) {
                  console.warn(`Failed to get block ${lastCommitBlock} timestamp:`, error);
                }
              }

              console.log("claimableActivityReward", address, index, claimableActivityReward)

              // Layer2Manager 에서 operatorManager 주소를 찾아서 저장하고, manager 주소도 저장하자.
              const operatorManager = await readContractWithRetry(
                () => publicClient.readContract({
                  address: CONTRACTS.layer2Manager.address,
                  abi: layer2ManagerAbi,
                  functionName: 'operatorOfLayer',
                  args: [candidateContract as `0x${string}`],
                }) as Promise<`0x${string}`>,
                `operatorManager`
              );
              console.log("operatorManager", operatorManager)

              // operatorManager가 null 주소가 아닐 때만 manager() 함수 호출
              let managerAddress: `0x${string}` | null = null;
              if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
                try {
                  managerAddress = await readContractWithRetry(
                    () => publicClient.readContract({
                      address: operatorManager,
                      abi: operatorManagerAbi,
                      functionName: 'manager',
                      args: [],
                    }) as Promise<`0x${string}`>,
                    `Member ${index + 1} manager address`
                  );
                  console.log("managerAddress", managerAddress);
                } catch (error) {
                  console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
                }
              }

              console.log("managerAddress", managerAddress)

              const member: CommitteeMember = {
                name: memo,
                description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
                creationAddress: address,
                candidateContract: candidateContract,
                claimedTimestamp: Number(claimedTimestamp),
                rewardPeriod: Number(rewardPeriod),
                indexMembers: Number(indexMembers),
                totalStaked: totalStaked.toString(),
                lastCommitBlock: Number(lastCommitBlock),
                lastUpdateSeigniorageTime: lastUpdateSeigniorageTime,
                claimableActivityReward: claimableActivityReward.toString(), // wei 단위로 저장
                operatorManager: operatorManager,
                manager: managerAddress
              };

            return member;
          } catch (error) {
            return {
              name: `Committee Member ${index + 1}`,
              description: "Committee member details unavailable",
              creationAddress: address,
              candidateContract: "",
              claimedTimestamp: 0,
              rewardPeriod: 0,
              indexMembers: 0,
              totalStaked: "0",
              lastCommitBlock: 0,
              lastUpdateSeigniorageTime: 0,
              claimableActivityReward: "0",
              operatorManager: "0x0000000000000000000000000000000000000000",
              manager: null
            } satisfies CommitteeMember;
          }
        }));


        setCommitteeMembers(memberDetails);
        setStatusMessage(`✅ Loaded ${memberDetails.length} committee members`);
        console.log(`✅ Committee members loaded: ${memberDetails.length}`);

      }
    } catch (err) {
      console.error("Failed to load committee members:", err);
      setMembersError("Failed to load committee members");
      setStatusMessage("❌ Error loading committee members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);


  useEffect(() => {
    console.log("🚀 useEffect 실행", {
      timestamp: new Date().toLocaleTimeString(),
      hasCommitteeMembers: !!committeeMembers,
      committeeCount: committeeMembers?.length || 0,
      condition: !committeeMembers || committeeMembers.length === 0
    });

    // 데이터가 없을 때만 로드
    if (!committeeMembers || committeeMembers.length === 0) {
      console.log("✅ 조건 만족: 데이터 로드 시작");
      loadMaxMembers().then(() => {
        console.log('🚀 DAO Context - loading loadMaxMembers...');
      });
      return () => {
        console.log("Provider 언마운트", {
          maxMember,
        });
      }
    } else {
      console.log("⏭️ 조건 불만족: 데이터 이미 존재, 로드 스킵");
    }
  }, []); // 빈 의존성 배열

  // useEffect(() => {

  //   loadCommitteeMembers().then(() => {
  //     console.log('🚀 DAO Context - loading loadCommitteeMembers...');
  //   });
  //   return () => {
  //     console.log(" Provider 언마운트", {
  //       loadCommitteeMembers,
  //     });
  //   }
  // }, [maxMember]);


     // 🎯 지갑 연결 상태 변경 처리
   useEffect(() => {
     if (previousConnectionState !== isConnected) {
       if (isConnected && address) {
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

  // // 🎯 새로고침 함수들
  // const forceRefreshSession = useCallback(async () => {
  //   console.log('🔄 Force refreshing all data...');
  //   await Promise.all([
  //     refreshCommitteeMembers(),
  //     agendas.refreshAgendas()
  //   ]);
  //   setLastFetchTimestamp(Date.now());
  //   console.log('✅ Force refresh completed');
  // }, [refreshCommitteeMembers, agendas.refreshAgendas]);

  // const getCacheInfo = useCallback(() => {
  //   return {
  //     hasInitialized: committeeMembers.length > 0,
  //     committeeMembers: {
  //       count: committeeMembers.length,
  //       lastFetch: new Date(lastFetchTimestamp)
  //     },
  //     agendas: {
  //       count: agendas.agendas.length,
  //       lastFetch: new Date(lastFetchTimestamp)
  //     }
  //   };
  // }, [committeeMembers.length, agendas.agendas.length, lastFetchTimestamp]);

  // const isCommitteeMember = useCallback((address: string): boolean => {
  //   if (!address) return false;

  //   const member = committeeMembers.find(
  //     member => member.creationAddress.toLowerCase() === address.toLowerCase()
  //   );

  //   return !!member;
  // }, [committeeMembers]);

  // 🎯 sample-2 방식: useMemo로 value 최적화
  const contextValue = useMemo(() => ({
    // Member 관련
    isMember,

    // Committee Members 관련
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers: loadCommitteeMembers,

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

    // // 캐시 관련 함수들
    // forceRefreshSession,
    // getCacheInfo,
    // isCommitteeMember,

    getVoterInfos: async (agendaId: number, voters: string[]): Promise<VoterInfo[]> => {
      return [];
    },

    // Challenge 관련
    getChallengeCandidates: async (targetMember: CommitteeMember, connectedAddress: string): Promise<Candidate[]> => {
      // TODO: 모든 candidate를 조회하고 조건에 맞는 것들만 필터링
      console.log('Getting challenge candidates for:', targetMember.name, 'by:', connectedAddress);
      return [];
    },
  }), [
    isMember,
    committeeMembers,
    isLoadingMembers,
    membersError,
    loadCommitteeMembers,
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