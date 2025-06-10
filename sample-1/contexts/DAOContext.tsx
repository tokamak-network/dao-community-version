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
import { useWatchContractEvent, useChainId } from 'wagmi';
import { createPublicClient, http } from "viem";
import { chain } from "@/config/chain";

import { daoCommitteeAbi } from "@/abis/dao-committee-versions";
import { daoCandidateAbi } from "@/abis/dao-candidate";
import { seigManagerAbi } from "@/abis/seig-mamager";
import { layer2ManagerAbi } from "@/abis/layer2-manager";
import { operatorManagerAbi } from "@/abis/operator-manager";
import { layer2RegistryAbi } from "@/abis/layer2-registry";

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

  // 🎯 Layer2 Candidates 캐싱 상태
  const [layer2Total, setLayer2Total] = useState<number>(0);
  const [layer2LoadingIndex, setLayer2LoadingIndex] = useState<number>(0);
  const [layer2Candidates, setLayer2Candidates] = useState<Candidate[]>([]);
  const [isLoadingLayer2, setIsLoadingLayer2] = useState(false);
  const [layer2Error, setLayer2Error] = useState<string | null>(null);
  const [hasLoadedLayer2Once, setHasLoadedLayer2Once] = useState(false);
  const [layer2LastFetchTimestamp, setLayer2LastFetchTimestamp] = useState<number>(0);



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

  // 🎯 단일 멤버의 상세 정보를 가져오는 공통 함수
  const fetchMemberDetails = useCallback(async (
    publicClient: any,
    memberAddress: string,
    slotIndex?: number
  ): Promise<CommitteeMember> => {
    try {
      // 1. candidateInfo 조회
      const candidateInfo = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'candidateInfos',
          args: [memberAddress as `0x${string}`],
        }) as Promise<readonly [`0x${string}`, bigint, bigint, bigint, bigint]>,
        `Member ${memberAddress} candidate info`
      );

      const [candidateContract, indexMembers, memberJoinedTime, rewardPeriod, claimedTimestamp] = candidateInfo;

      // 2. 순차적으로 상세 정보 조회 (RPC rate limit 고려)
      // candidate memo
      const memo = await readContractWithRetry(
        () => publicClient.readContract({
          address: candidateContract,
          abi: daoCandidateAbi,
          functionName: 'memo',
          args: [],
        }) as Promise<string>,
        `Member candidate name`
      );

      // total staked
      const totalStaked = await readContractWithRetry(
        () => publicClient.readContract({
          address: candidateContract,
          abi: daoCandidateAbi,
          functionName: 'totalStaked',
          args: [],
        }) as Promise<bigint>,
        `Member total staked`
      );

      // 청구 가능한 활동비
      const claimableActivityReward = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'getClaimableActivityReward',
          args: [memberAddress as `0x${string}`],
        }) as Promise<bigint>,
        `Member claimActivityReward`
      );

      // 마지막 커밋 블록
      const lastCommitBlock = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.seigManager.address,
          abi: seigManagerAbi,
          functionName: 'lastCommitBlock',
          args: [candidateContract],
        }) as Promise<bigint>,
        `Member lastCommitBlock`
      );

      // operator manager
      const operatorManager = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.layer2Manager.address,
          abi: layer2ManagerAbi,
          functionName: 'operatorOfLayer',
          args: [candidateContract as `0x${string}`],
        }) as Promise<`0x${string}`>,
        `Member operatorManager`
      );

      // 3. lastCommitBlock의 타임스탬프 가져오기
      let lastUpdateSeigniorageTime = 0;
      if (lastCommitBlock > 0) {
        try {
          const block = await publicClient.getBlock({
            blockNumber: lastCommitBlock
          });
          lastUpdateSeigniorageTime = Number(block.timestamp);
        } catch (error) {
          console.warn(`Failed to get block ${lastCommitBlock} timestamp:`, error);
        }
      }

      // 4. manager 주소 조회
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
            `Member manager address`
          );
        } catch (error) {
          console.warn(`Failed to get manager address for operator ${operatorManager}:`, error);
        }
      }

      // 5. CommitteeMember 객체 생성
      return {
        name: memo,
        description: `Joined as committee member on ${new Date(Number(memberJoinedTime) * 1000).toLocaleDateString()}`,
        creationAddress: memberAddress,
        candidateContract: candidateContract,
        claimedTimestamp: Number(claimedTimestamp),
        rewardPeriod: Number(rewardPeriod),
        indexMembers: Number(indexMembers),
        totalStaked: totalStaked.toString(),
        lastCommitBlock: Number(lastCommitBlock),
        lastUpdateSeigniorageTime: lastUpdateSeigniorageTime,
        claimableActivityReward: claimableActivityReward.toString(),
        operatorManager: operatorManager,
        manager: managerAddress
      };

    } catch (error) {
      console.error(`❌ 멤버 상세 정보 조회 실패 (${memberAddress}):`, error);
      // 에러 시 기본값 반환
      return {
        name: `Committee Member`,
        description: "Committee member details unavailable",
        creationAddress: memberAddress,
        candidateContract: "",
        claimedTimestamp: 0,
        rewardPeriod: 0,
        indexMembers: slotIndex || 0,
        totalStaked: "0",
        lastCommitBlock: 0,
        lastUpdateSeigniorageTime: 0,
        claimableActivityReward: "0",
        operatorManager: "0x0000000000000000000000000000000000000000",
        manager: null
      };
    }
  }, []);

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

        // 모든 슬롯(0~maxMember-1) 순회하며 멤버 정보 또는 빈 슬롯 처리
        const memberDetails: CommitteeMember[] = [];

        for (let slotIndex = 0; slotIndex < actualMaxMember; slotIndex++) {
          try {
            console.log(`슬롯 ${slotIndex + 1}/${actualMaxMember} 처리 중...`);

            const memberAddress = await readContractWithRetry(
              () => publicClient.readContract({
                address: CONTRACTS.daoCommittee.address,
                abi: daoCommitteeAbi,
                functionName: 'members',
                args: [BigInt(slotIndex)],
              }) as Promise<string>,
              `Member slot ${slotIndex} address`
            );

            if (memberAddress && memberAddress !== '0x0000000000000000000000000000000000000000') {
              // 실제 멤버가 있는 경우
              console.log(`✅ 슬롯 ${slotIndex}: 멤버 발견`, memberAddress);
              const memberDetail = await fetchMemberDetails(publicClient, memberAddress, slotIndex);
              memberDetails.push(memberDetail);
            } else {
              // 빈 슬롯인 경우
              console.log(`📭 슬롯 ${slotIndex}: 빈 슬롯`);
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
              memberDetails.push(emptyMember);
            }

            // 요청 간 딜레이 (RPC 부하 방지)
            if (slotIndex < actualMaxMember - 1) {
              await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
            }

          } catch (error) {
            console.error(`❌ 슬롯 ${slotIndex} 처리 실패:`, error);
            // 오류 시에도 빈 슬롯으로 처리
            const emptyMember: CommitteeMember = {
              name: `Empty Slot ${slotIndex}`,
              description: "Failed to load committee member details",
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
            memberDetails.push(emptyMember);
          }
        }

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

  // 🎯 Layer2 Candidates 로드 함수 (캐싱용)
  const loadLayer2Candidates = useCallback(async (force = false) => {
    if (!force && hasLoadedLayer2Once && layer2Candidates.length > 0) {
      console.log('📦 Layer2 캐시 데이터 존재, 로드 스킵');
      return;
    }

    console.log('🔄 Layer2 Candidates 로드 시작');
    setIsLoadingLayer2(true);
    setLayer2Error(null);

    try {
      const publicClient = await createRobustPublicClient();
      const allLayer2Candidates: Candidate[] = [];

      // 1. Layer2Registry에서 총 레이어2 개수 조회
      const numLayer2s = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.layer2Registry.address,
          abi: layer2RegistryAbi,
          functionName: 'numLayer2s',
        }) as Promise<bigint>,
        'Total Layer2s count for caching'
      );
      setLayer2Total(Number(numLayer2s));
      console.log('📊 캐싱할 Layer2 개수:', Number(numLayer2s));

      // 2. 모든 레이어2 정보를 한 번에 로드하여 캐싱
      for (let i = 0; i < Number(numLayer2s); i++) {
        setLayer2LoadingIndex(i + 1); // 진행률 업데이트 (1부터 시작하여 완료시 total과 같아짐)
        try {
          // 레이어2 컨트랙트 주소 조회
          const layer2Address = await readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.layer2Registry.address,
              abi: layer2RegistryAbi,
              functionName: 'layer2ByIndex',
              args: [BigInt(i)],
            }) as Promise<string>,
            `Layer2 ${i} address for cache`
          );

          // 빈 주소는 스킵
          if (!layer2Address || layer2Address === '0x0000000000000000000000000000000000000000') {
            continue;
          }

          // 레이어2 기본 정보 조회
          const [memo, totalStaked] = await Promise.all([
            readContractWithRetry(
              () => publicClient.readContract({
                address: layer2Address as `0x${string}`,
                abi: daoCandidateAbi,
                functionName: 'memo',
              }) as Promise<string>,
              `Layer2 ${i} memo for cache`
            ).catch(() => `Layer2 #${i}`),
            readContractWithRetry(
              () => publicClient.readContract({
                address: layer2Address as `0x${string}`,
                abi: daoCandidateAbi,
                functionName: 'totalStaked',
              }) as Promise<bigint>,
              `Layer2 ${i} total staked for cache`
            )
          ]);

          // 오퍼레이터 정보 조회
          const operatorManager = await readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.layer2Manager.address,
              abi: layer2ManagerAbi,
              functionName: 'operatorOfLayer',
              args: [layer2Address as `0x${string}`],
            }) as Promise<`0x${string}`>,
            `Layer2 ${i} operator manager for cache`
          );

          // EOA 정보 조회
          let operatorEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';
          let managerEOA: `0x${string}` | null = '0x0000000000000000000000000000000000000000';

          try {
            operatorEOA = await readContractWithRetry(
              () => publicClient.readContract({
                address: layer2Address as `0x${string}`,
                abi: daoCandidateAbi,
                functionName: 'operator',
              }) as Promise<`0x${string}`>,
              `Layer2 ${i} operator EOA for cache`
            );
          } catch (error) {
            // operator 함수가 없는 경우 스킵
            // operatorEOA = '0x0000000000000000000000000000000000000000';
          }

          if (operatorManager && operatorManager !== '0x0000000000000000000000000000000000000000') {
            try {
              managerEOA = await readContractWithRetry(
                () => publicClient.readContract({
                  address: operatorManager,
                  abi: operatorManagerAbi,
                  functionName: 'manager',
                }) as Promise<`0x${string}`>,
                `Layer2 ${i} manager EOA for cache`
              );
            } catch (error) {
              // manager 조회 실패시 스킵
              // managerEOA = '0x0000000000000000000000000000000000000000';
            }
          }

          // DAO Committee에서 cooldown 조회
          const cooldown = await readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoCommittee.address,
              abi: daoCommitteeAbi,
              functionName: 'cooldown',
              args: [layer2Address as `0x${string}`],
            }) as Promise<bigint>,
            `Layer2 ${i} cooldown for cache`
          );

          const candidate: Candidate = {
            name: memo || `Layer2 #${i}`,
            description: `Layer2 Contract with ${(Number(totalStaked) / 1e18).toFixed(2)} TON staked`,
            creationAddress: operatorEOA ,
            candidateContract: layer2Address,
            totalStaked: totalStaked.toString(),
            operator: (managerEOA!=='0x0000000000000000000000000000000000000000'?managerEOA:operatorEOA) as `0x${string}`,
            operatorManager,
            manager: managerEOA,
            cooldown: Number(cooldown), // DAO Committee에서 조회한 cooldown 추가
            isCommitteeMember: false // 나중에 위원회 멤버 체크에서 업데이트
          };

          allLayer2Candidates.push(candidate);
          console.log(`✅ Layer2 캐싱 완료: ${memo} (${(Number(totalStaked) / 1e18).toFixed(2)} TON)`);

        } catch (error) {
          console.warn(`Failed to cache Layer2 ${i}:`, error);
          continue;
        }
      }

      // 스테이킹 순으로 정렬 (높은 순)
      allLayer2Candidates.sort((a, b) =>
        Number(BigInt(b.totalStaked) - BigInt(a.totalStaked))
      );

      setLayer2Candidates(allLayer2Candidates);
      setHasLoadedLayer2Once(true);
      setLayer2LastFetchTimestamp(Date.now());
      console.log('🎯 Layer2 캐싱 완료:', allLayer2Candidates.length, '개');

    } catch (error) {
      console.error('❌ Layer2 캐싱 실패:', error);
      setLayer2Error('Failed to load Layer2 candidates');
    } finally {
      setIsLoadingLayer2(false);
    }
  }, [hasLoadedLayer2Once, layer2Candidates.length]);

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

  // 🎯 특정 슬롯 인덱스의 멤버 정보만 업데이트하는 함수
  const refreshSpecificMember = useCallback(async (slotIndex: number) => {
    console.log(`🔄 특정 멤버 업데이트 시작 - 슬롯 ${slotIndex}`, {
      timestamp: new Date().toLocaleTimeString(),
      currentCommitteeCount: committeeMembers?.length || 0
    });

    try {
      const publicClient = await createRobustPublicClient();

      // 해당 슬롯의 멤버 주소 조회
      const memberAddress = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoCommittee.address,
          abi: daoCommitteeAbi,
          functionName: 'members',
          args: [BigInt(slotIndex)],
        }) as Promise<string>,
        `Member slot ${slotIndex} address`
      );

      if (!memberAddress || memberAddress === '0x0000000000000000000000000000000000000000') {
        // 멤버가 제거된 경우 - 빈 슬롯으로 설정
        setEmptySlot(slotIndex);
        return;
      }

      // 공통 함수를 사용하여 멤버 상세 정보 조회
      const updatedMember = await fetchMemberDetails(publicClient, memberAddress, slotIndex);

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
  }, [fetchMemberDetails, setEmptySlot]);

  // 🎯 Layer2 캐시 리셋 함수 (새로고침용)
  const resetLayer2Cache = useCallback(() => {
    console.log('🗑️ Layer2 캐시 리셋');
    setLayer2Candidates([]);
    setHasLoadedLayer2Once(false);
    setIsLoadingLayer2(false);
    setLayer2Error(null);
    setLayer2Total(0);
    setLayer2LoadingIndex(0);
    setLayer2LastFetchTimestamp(0);
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

  // 🎯 DAO 이벤트 모니터링 (직접 통합)
  const chainId = useChainId();

  // 🎯 이벤트 핸들러 정의
  const handleMemberChanged = useCallback((data: { slotIndex: bigint; prevMember: string; newMember: string }) => {
    console.log('🔄 Member changed, refreshing data...', data);
    refreshSpecificMember(Number(data.slotIndex));
  }, [refreshSpecificMember]);

  const handleActivityRewardClaimed = useCallback((data: { candidate: string; receiver: string; amount: bigint }) => {
    console.log('🎉 [SUCCESS] Activity reward claimed, refreshing data...', {
      ...data,
      timestamp: new Date().toISOString(),
      maxMember,
      willRefreshSlots: Array.from({ length: maxMember }, (_, i) => i)
    });

    // 정확하게 슬롯번호를 알려주지 않음. 하나씩 다시 가져와도 될까?
    for(let i = 0; i < maxMember; i++){
      console.log(`🔄 Refreshing member slot ${i} due to activity reward claim`);
      refreshSpecificMember(i);
    }
    // loadCommitteeMembers(maxMember);
  }, [refreshSpecificMember, maxMember]);

  const handleLayer2Registered = useCallback((data: { candidate: string; candidateContract: string; memo: string }) => {
    console.log('🏗️ Layer2 registered, refreshing cache...', data);
    resetLayer2Cache();
  }, [resetLayer2Cache]);


  // 이벤트 모니터링을 위한 useEffect
  useEffect(() => {
    console.log("[useEffect] Setting up event monitoring", {
      timestamp: new Date().toISOString(),
      chainId: chainId,
      daoCommitteeAddress: CONTRACTS.daoCommittee.address,
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT,
      fallbackRpcUrl: process.env.NEXT_PUBLIC_RPC_URL,
      actualRpcUrl: process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'undefined',
      handlersReady: {
        handleMemberChanged: !!handleMemberChanged,
        handleActivityRewardClaimed: !!handleActivityRewardClaimed,
        handleLayer2Registered: !!handleLayer2Registered
      }
    });

    const publicClient = createPublicClient({
      chain: {
        ...chain,
        id: chain.id,
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL_FOR_EVENT || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'),
    });

    console.log("[monitorDAOEvents] Public client created", {
      clientChainId: publicClient.chain?.id,
      transport: "http"
    });

    //  ChangedMember 이벤트 모니터링 (챌린지 성공)
    console.log("[monitorDAOEvents] Setting up ChangedMember event watcher", {
      contractAddress: CONTRACTS.daoCommittee.address,
      eventName: 'ChangedMember'
    });

    const unwatchChangedMember = publicClient.watchContractEvent({
      address: CONTRACTS.daoCommittee.address,
      abi: daoCommitteeAbi,
      eventName: 'ChangedMember',
      onLogs(logs) {
        console.log('📡 ChangedMember onLogs 호출됨', {
          timestamp: new Date().toISOString(),
          logsCount: logs.length,
          logs: logs.map(log => ({
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            args: log.args
          }))
        });

        logs.forEach((log, index) => {
          const { slotIndex, prevMember, newMember } = log.args;
          console.log(`🔄 ChangedMember 이벤트 감지 [${index + 1}/${logs.length}]:`, {
            slotIndex: slotIndex?.toString(),
            prevMember,
            newMember,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            logIndex: log.logIndex
          });

          if (slotIndex !== undefined && prevMember && newMember) {
            console.log('✅ ChangedMember 핸들러 호출', {
              slotIndex: slotIndex.toString(),
              handlerExists: !!handleMemberChanged
            });

            handleMemberChanged({
              slotIndex,
              prevMember,
              newMember
            });
          } else {
            console.warn('⚠️ ChangedMember 이벤트 데이터 불완전:', {
              hasSlotIndex: slotIndex !== undefined,
              hasPrevMember: !!prevMember,
              hasNewMember: !!newMember
            });
          }
        });
      },
      onError(error) {
        console.error('❌ ChangedMember 이벤트 워처 오류:', error);
      }
    });

    console.log('✅ ChangedMember 이벤트 워처 설정 완료');


    // ClaimedActivityReward 이벤트 모니터링
    console.log("[monitorDAOEvents] Setting up ClaimedActivityReward event watcher");

    const unwatchClaimedActivityReward = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'ClaimedActivityReward',
    onLogs(logs) {
      console.log('🎯 [EVENT DETECTED] ClaimedActivityReward onLogs 호출됨', {
        timestamp: new Date().toISOString(),
        logsCount: logs.length,
        contractAddress: CONTRACTS.daoCommittee.address,
        eventName: 'ClaimedActivityReward'
      });

      logs.forEach((log, index) => {
        const { candidate, receiver, amount } = log.args;
        console.log(`💰 [EVENT ${index + 1}/${logs.length}] ClaimedActivityReward 이벤트 감지:`, {
          candidate,
          receiver,
          amount: amount?.toString(),
          amountETH: amount ? (Number(amount) / 1e18).toFixed(6) : 'N/A',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber?.toString(),
          logIndex: log.logIndex,
          timestamp: new Date().toISOString()
        });

        if (candidate && receiver && amount !== undefined) {
          console.log('✅ [HANDLER CALL] ClaimedActivityReward 핸들러 호출 시작');
          handleActivityRewardClaimed({
            candidate,
            receiver,
            amount
          });
          console.log('✅ [HANDLER DONE] ClaimedActivityReward 핸들러 호출 완료');
        } else {
          console.warn('⚠️ [EVENT ERROR] ClaimedActivityReward 이벤트 데이터 불완전:', {
            hasCandidate: !!candidate,
            hasReceiver: !!receiver,
            hasAmount: amount !== undefined
          });
        }
      });
    },
    onError(error) {
      console.error('❌ [EVENT ERROR] ClaimedActivityReward 이벤트 워처 오류:', {
        error: error.message || error,
        timestamp: new Date().toISOString(),
        contractAddress: CONTRACTS.daoCommittee.address
      });
    }
  });

  console.log('✅ ClaimedActivityReward 이벤트 워처 설정 완료');

  // Layer2Registered 이벤트 모니터링
  console.log("[monitorDAOEvents] Setting up Layer2Registered event watcher");

  const unwatchLayer2Registered = publicClient.watchContractEvent({
    address: CONTRACTS.daoCommittee.address,
    abi: daoCommitteeAbi,
    eventName: 'Layer2Registered',
    onLogs(logs) {
      console.log('📡 Layer2Registered onLogs 호출됨', {
        timestamp: new Date().toISOString(),
        logsCount: logs.length
      });

      logs.forEach((log, index) => {
        const { candidate, candidateContract, memo } = log.args;
        console.log(`🏗️ Layer2Registered 이벤트 감지 [${index + 1}/${logs.length}]:`, {
          candidate,
          candidateContract,
          memo,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber
        });

        if (candidate && candidateContract && memo) {
          console.log('✅ Layer2Registered 핸들러 호출');
          handleLayer2Registered({
            candidate,
            candidateContract,
            memo
          });
        } else {
          console.warn('⚠️ Layer2Registered 이벤트 데이터 불완전');
        }
      });
    },
    onError(error) {
      console.error('❌ Layer2Registered 이벤트 워처 오류:', error);
    }
  });

  console.log('✅ Layer2Registered 이벤트 워처 설정 완료');
  console.log('🎯 모든 이벤트 워처 설정 완료', {
    timestamp: new Date().toISOString(),
    watchers: ['ChangedMember', 'ClaimedActivityReward', 'Layer2Registered']
  });

    return () => {
      console.log('🔌 이벤트 워처들 정리 중...', {
        timestamp: new Date().toISOString()
      });

      unwatchChangedMember();
      unwatchClaimedActivityReward();
      unwatchLayer2Registered();

      console.log('✅ 모든 이벤트 워처 정리 완료');
    };

  }, [handleMemberChanged, handleActivityRewardClaimed, handleLayer2Registered]);





  // const isCommitteeMember = useCallback((address: string): boolean => {
  //   if (!address) return false;

  //   const member = committeeMembers.find(
  //     member => member.creationAddress.toLowerCase() === address.toLowerCase()
  //   );

  //   return !!member;
  // }, [committeeMembers]);

  //  useMemo로 value 최적화
  const contextValue = useMemo(() => ({
    // Member 관련
    isMember,

    // Committee Members 관련
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers: loadCommitteeMembers,
    refreshSpecificMember,

    // Layer2 Candidates 관련 (챌린징용)
    layer2Total,
    layer2LoadingIndex,
    layer2Candidates,
    isLoadingLayer2,
    layer2Error,
    hasLoadedLayer2Once,
    layer2LastFetchTimestamp,
    loadLayer2Candidates,
    resetLayer2Cache,

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


    getVoterInfos: async (agendaId: number, voters: string[]): Promise<VoterInfo[]> => {
      return [];
    },


  }), [
    isMember,
    committeeMembers,
    isLoadingMembers,
    membersError,
    loadCommitteeMembers,
    layer2Total,
    layer2LoadingIndex,
    layer2Candidates,
    isLoadingLayer2,
    layer2Error,
    hasLoadedLayer2Once,
    layer2LastFetchTimestamp,
    loadLayer2Candidates,
    resetLayer2Cache,
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