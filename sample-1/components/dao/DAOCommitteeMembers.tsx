'use client'
import { useState, useRef, useEffect } from 'react'
import { useDAOContext } from '@/contexts/DAOContext'
import { useAccount, useChainId } from 'wagmi'
import { formatTONWithUnit, formatRelativeTime, formatDateTime } from '@/utils/format'
import { CheckChallengeButton } from '@/components/CheckChallengeButton'
import { CommitteeMember, Candidate } from '@/types/dao'
import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils"
import { daoCommitteeAbi } from "@/abis/dao-committee-versions"
import { daoCandidateAbi } from "@/abis/dao-candidate"
import { layer2ManagerAbi } from "@/abis/layer2-manager"
import { operatorManagerAbi } from "@/abis/operator-manager"
import { layer2RegistryAbi } from "@/abis/layer2-registry"
import { CONTRACTS } from "@/config/contracts"
import { useDAOCandidate } from '@/hooks/useDAOCandidate'
import { TransactionModal } from '@/components/TransactionModal'
import { getExplorerUrl } from '@/utils/explorer'

export default function DAOCommitteeMembers() {
  const {
    isMember,
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers,
    layer2Candidates,
    loadLayer2Candidates,
    resetLayer2Cache,
    isLoadingLayer2,
    layer2Total,

    hasLoadedLayer2Once,

  } = useDAOContext()

  const { isConnected: isWalletConnected, address } = useAccount()
  const chainId = useChainId()
  const { changeMember, retireMember, claimActivityReward, isExecuting: isDAOCandidateExecuting, isSuccess: isDAOCandidateSuccess, error: daoCandidateError, txHash, lastOperation, reset: resetDAOCandidate } = useDAOCandidate()

  // 🎯 Hydration Error 방지
  const [isMounted, setIsMounted] = useState(false)

  const [expandedMember, setExpandedMember] = useState<number | null>(null)
  const [showGlobalChallenge, setShowGlobalChallenge] = useState(false)
  const [globalChallengeCandidates, setGlobalChallengeCandidates] = useState<Candidate[]>([])
  const [isCheckingGlobal, setIsCheckingGlobal] = useState(false)
  const [challengeProgress, setChallengeProgress] = useState({
    step: 'idle', // 'idle' | 'loading-layer2' | 'checking-members' | 'completed' | 'error'
    currentMemberIndex: 0,
    totalMembers: 0,
    message: '',
    error: ''
  })

  // Layer2 로딩 완료 후 자동 분석 시작을 위한 ref
  const shouldStartAnalysisRef = useRef(false)

  // 트랜잭션 모달 상태
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  // Layer2 선택 모달 상태
  const [showLayer2SelectModal, setShowLayer2SelectModal] = useState(false)
  const [selectedMemberForChallenge, setSelectedMemberForChallenge] = useState<CommitteeMember | null>(null)
  const [availableLayer2s, setAvailableLayer2s] = useState<Candidate[]>([])
  const [selectedLayer2ForChallenge, setSelectedLayer2ForChallenge] = useState<Candidate | null>(null)
  const [selectedLayer2Index, setSelectedLayer2Index] = useState<number>(-1)

  // 🎯 클라이언트 사이드 마운트 체크
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 이벤트 모니터링은 DAOContext에서 직접 처리됨

  const handleViewDetails = (index: number) => {
    setExpandedMember(expandedMember === index ? null : index)
  }

  // 현재 연결된 지갑으로 해당 멤버에게 챌린지할 수 있는지 확인
  const canChallengeWith = (member: CommitteeMember) => {
    if (!address || !layer2Candidates || layer2Candidates.length === 0 || !committeeMembers) {
      return { canChallenge: false, myLayer2: null, myLayer2s: [] };
    }

    // 내가 operator나 manager인 Layer2 찾기 (쿨다운 체크 + 이미 위원회 멤버 제외)
    const myLayer2s = layer2Candidates.filter(candidate => {
      // 1. 쿨다운 시간이 설정되어 있고, 아직 쿨다운이 끝나지 않았으면 챌린지 불가
      const currentTime = Math.floor(Date.now() / 1000);
      if (candidate.cooldown > 0 && currentTime < candidate.cooldown) {
        return false;
      }

      // 2. 이미 위원회 멤버인 Layer2는 다른 멤버에게 챌린지할 수 없음
      const isAlreadyMember = committeeMembers.some(
        m => m.candidateContract.toLowerCase() === candidate.candidateContract.toLowerCase()
      );
      if (isAlreadyMember) {
        return false;
      }

      // 3. 내가 operator나 manager인 Layer2인지 확인
      return address && (
        candidate.creationAddress.toLowerCase() === address.toLowerCase() ||
        (candidate.operator && candidate.operator.toLowerCase() === address.toLowerCase()) ||
        (candidate.manager && candidate.manager.toLowerCase() === address.toLowerCase())
      );
    });

    // member.creationAddress 이 빈슬롯이면, 챌린지 가능
    if (member.creationAddress === "0x0000000000000000000000000000000000000000") {
      return {
        canChallenge: myLayer2s.length > 0,
        myLayer2: myLayer2s[0] || null,
        myLayer2s: myLayer2s
      };
    }

    // 해당 멤버보다 스테이킹이 높은 내 Layer2들 찾기
    const challengeableLayer2s = myLayer2s.filter(layer2 =>
      BigInt(layer2.totalStaked) > BigInt(member.totalStaked)
    );

    return {
      canChallenge: challengeableLayer2s.length > 0,
      myLayer2: challengeableLayer2s[0] || null,
      myLayer2s: challengeableLayer2s
    };
  }

  const handleChallenge = async (member: CommitteeMember) => {
    if (!address || !committeeMembers) {
      console.error('❌ 챌린지 조건 불충족: 지갑 미연결 또는 멤버 데이터 없음');
      return;
    }

    // 선택된 Layer2가 있으면 우선 사용, 없으면 기본 로직 사용
    let challengeLayer2: Candidate | null = null;

    if (selectedLayer2ForChallenge) {
      // 모달에서 선택된 Layer2 사용
      challengeLayer2 = selectedLayer2ForChallenge;
      console.log('🎯 모달에서 선택된 Layer2 사용:', challengeLayer2.name);

      // 선택된 Layer2 초기화
      setSelectedLayer2ForChallenge(null);
    } else {
      // 기본 로직: 첫 번째 가능한 Layer2 사용
      const { canChallenge, myLayer2 } = canChallengeWith(member);
      if (!canChallenge || !myLayer2) {
        console.error('❌ 챌린지 권한 없음');
        return;
      }
      challengeLayer2 = myLayer2;
    }

    if (!challengeLayer2) {
      console.error('❌ 챌린지할 Layer2를 찾을 수 없음');
      return;
    }

    // 타겟 멤버의 인덱스 찾기
    const memberIndex = committeeMembers.findIndex(m =>
      m.candidateContract.toLowerCase() === member.candidateContract.toLowerCase()
    );

    if (memberIndex === -1) {
      console.error('❌ 멤버 인덱스를 찾을 수 없음');
      return;
    }

    try {
      console.log('🚀 실제 챌린지 실행!', {
        challenger: challengeLayer2.name,
        challengerContract: challengeLayer2.candidateContract,
        target: member.name,
        targetContract: member.candidateContract,
        memberIndex,
        myStaking: challengeLayer2.totalStaked,
        targetStaking: member.totalStaked,
        executor: address
      });

      // 트랜잭션 모달 열기
      setShowTransactionModal(true);

      await changeMember({
        candidateContract: challengeLayer2.candidateContract,
        targetMemberIndex: memberIndex
      });

    } catch (error) {
      console.error('❌ 챌린지 실행 중 오류:', error);
    }
  }

  // 챌린지 분석 실행 함수 (분리)
  const performChallengeAnalysis = async () => {
    console.log('📋 performChallengeAnalysis 호출됨, 조건 체크:', {
      hasCommitteeMembers: !!committeeMembers,
      committeeMembersLength: committeeMembers?.length || 0,
      hasLayer2Candidates: !!layer2Candidates,
      layer2CandidatesLength: layer2Candidates?.length || 0,
      challengeProgressStep: challengeProgress.step
    });

    if (!committeeMembers || committeeMembers.length === 0) {
      console.log('❌ 분석 조건 불충족: 위원회 멤버 없음');
      setChallengeProgress({
        step: 'error',
        currentMemberIndex: 0,
        totalMembers: 0,
        message: '',
        error: '위원회 멤버 정보를 찾을 수 없습니다.'
      });
      return;
    }

    if (!layer2Candidates || layer2Candidates.length === 0) {
      console.log('❌ 분석 조건 불충족: Layer2 데이터 없음');
      setChallengeProgress({
        step: 'error',
        currentMemberIndex: 0,
        totalMembers: 0,
        message: '',
        error: 'Layer2 데이터를 찾을 수 없습니다. 다시 시도해주세요.'
      });
      return;
    }

    console.log('🔍 챌린지 분석 시작');
    setIsCheckingGlobal(true);

    setChallengeProgress({
      step: 'checking-members',
      currentMemberIndex: 0,
      totalMembers: layer2Candidates.length,
      message: '챌린지 가능한 조합을 분석중입니다...',
      error: ''
    });

    try {
      // 위원회 멤버별로 도전당할 수 있는 Layer2들 찾기
      const memberChallengeMap: Array<{
        member: CommitteeMember;
        challengers: Candidate[];
        hasMyLayer2: boolean;
      }> = [];

      committeeMembers.forEach(member => {
        // 이 멤버보다 스테이킹이 높은 Layer2들 찾기
        const challengers = layer2Candidates.filter(candidate => {
          // 쿨다운 시간이 설정되어 있고, 아직 쿨다운이 끝나지 않았으면 챌린지 불가
          const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
          if (candidate.cooldown > 0 && currentTime < candidate.cooldown) {
            return false;
          }

          // 이미 위원회 멤버는 제외
          const isAlreadyMember = committeeMembers.some(
            m => m.candidateContract.toLowerCase() === candidate.candidateContract.toLowerCase()
          );
          if (isAlreadyMember) return false;

          // 스테이킹 비교
          return BigInt(candidate.totalStaked) > BigInt(member.totalStaked);
        });

        if (challengers.length > 0) {
          // 내 Layer2가 이 멤버를 챌린지할 수 있는지 확인 (쿨다운 체크 포함)
          const hasMyLayer2 = address ? challengers.some(challenger => {
            // 쿨다운 시간이 설정되어 있고, 아직 쿨다운이 끝나지 않았으면 챌린지 불가
            const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
            if (challenger.cooldown > 0 && currentTime < challenger.cooldown) {
              return false;
            }

            return challenger.creationAddress.toLowerCase() === address.toLowerCase() ||
              (challenger.operator && challenger.operator.toLowerCase() === address.toLowerCase()) ||
              (challenger.manager && challenger.manager.toLowerCase() === address.toLowerCase());
          }) : false;

          memberChallengeMap.push({
            member,
            challengers: challengers.sort((a, b) =>
              Number(BigInt(b.totalStaked) - BigInt(a.totalStaked)) // 스테이킹 높은 순
            ),
            hasMyLayer2
          });
        }
      });

      // 내가 챌린지할 수 있는 멤버를 앞에 배치
      memberChallengeMap.sort((a, b) => {
        if (a.hasMyLayer2 && !b.hasMyLayer2) return -1;
        if (!a.hasMyLayer2 && b.hasMyLayer2) return 1;
        // 도전자 수가 적은 멤버 (챌린지하기 쉬운) 순으로 정렬
        return a.challengers.length - b.challengers.length;
      });

      setChallengeProgress({
        step: 'completed',
        currentMemberIndex: memberChallengeMap.length,
        totalMembers: committeeMembers.length,
        message: `분석 완료! ${memberChallengeMap.length}명의 멤버에게 챌린지 가능합니다.`,
        error: ''
      });

      // 결과 데이터를 state에 저장
      setGlobalChallengeCandidates(memberChallengeMap as any);

      console.log(`✅ 챌린지 분석 완료: ${memberChallengeMap.length}명 멤버 분석`);

    } catch (error) {
      console.error('❌ 챌린지 분석 실패:', error);
      setChallengeProgress({
        step: 'error',
        currentMemberIndex: 0,
        totalMembers: 0,
        message: '',
        error: '챌린지 분석 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsCheckingGlobal(false);
    }
  }

    // Layer2 로딩 완료 시 자동 분석 시작
  useEffect(() => {
    console.log('🔍 useEffect 조건 체크:', {
      showGlobalChallenge,
      isLoadingLayer2,
      hasLoadedLayer2Once,
      layer2CandidatesLength: layer2Candidates.length,
      shouldStartAnalysis: shouldStartAnalysisRef.current,
      challengeProgressStep: challengeProgress.step
    });

    // 모달이 열려있고, Layer2 로딩이 완료되었고, 실제 데이터가 있고, 자동 분석이 요청된 상태이면 분석 시작
    if (showGlobalChallenge && !isLoadingLayer2 && hasLoadedLayer2Once && layer2Candidates.length > 0 && shouldStartAnalysisRef.current) {
      shouldStartAnalysisRef.current = false; // 플래그 리셋
      console.log('🎯 Layer2 데이터 업데이트 감지, 자동 분석 시작');
      performChallengeAnalysis();
    }

    // 추가: Layer2 로딩이 완료되었지만 분석이 시작되지 않은 경우를 위한 fallback
    if (showGlobalChallenge && !isLoadingLayer2 && hasLoadedLayer2Once && layer2Candidates.length > 0 && challengeProgress.step === 'loading-layer2') {
      console.log('🔄 Layer2 로딩 완료 감지, fallback 분석 시작');
      performChallengeAnalysis();
    }
  }, [isLoadingLayer2, hasLoadedLayer2Once, showGlobalChallenge, layer2Candidates.length, challengeProgress.step]);

  // 트랜잭션 완료 시 모달 자동 닫기 (3초 후)
  useEffect(() => {
    if (isDAOCandidateSuccess && showTransactionModal) {
      const timer = setTimeout(() => {
        setShowTransactionModal(false);
        resetDAOCandidate(); // 상태 리셋
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isDAOCandidateSuccess, showTransactionModal, resetDAOCandidate]);

    // 전역 "Check the challenge" 버튼 클릭 핸들러
  const handleGlobalChallengeCheck = async () => {
    console.log('🎯 Check the challenge 클릭');
    console.log('isLoadingLayer2', isLoadingLayer2);
    console.log('hasLoadedLayer2Once', hasLoadedLayer2Once);

    if (!committeeMembers || committeeMembers.length === 0) {
      return;
    }

    // 무조건 모달 먼저 열기
    setShowGlobalChallenge(true);

    // 현재 로딩 중인 경우
    if (isLoadingLayer2) {
      setChallengeProgress({
        step: 'loading-layer2',
        currentMemberIndex: 0,
        totalMembers: 0,
        message: '정보가 수집중입니다. 잠시만 기다려주세요...',
        error: ''
      });
      shouldStartAnalysisRef.current = true; // 로딩 완료 후 자동 분석 플래그 설정
      return;
    }

    // 아직 로드하지 않은 경우 또는 데이터가 없는 경우
    if (!hasLoadedLayer2Once || layer2Candidates.length === 0) {
      console.log('🚀 Layer2 데이터 로딩 시작');
      setChallengeProgress({
        step: 'loading-layer2',
        currentMemberIndex: 0,
        totalMembers: 0,
        message: '정보 수집을 시작합니다...',
        error: ''
      });
      shouldStartAnalysisRef.current = true; // 로딩 완료 후 자동 분석 플래그 설정
      // 로딩 시작 후 완료되면 useEffect에서 자동 분석
      loadLayer2Candidates(false, (current, total, message) => {
        setChallengeProgress(prev => ({
          ...prev,
          currentMemberIndex: current,
          totalMembers: total,
          message: message
        }));
      });
      return;
    }

    // 3. 정보가 다 로딩된 상태이면, 즉시 챌린지 분석 시작
    console.log('✅ Layer2 데이터 이미 존재, 즉시 분석 시작');
    performChallengeAnalysis();

  }

  const handleRetireMember = async (member: CommitteeMember) => {
    if (!address) {
      console.error('❌ 지갑 미연결');
      return;
    }

    try {
      console.log('👋 멤버 은퇴 실행:', member.name);

      // 트랜잭션 모달 열기
      setShowTransactionModal(true);

      await retireMember({
        candidateContract: member.candidateContract
      });

    } catch (error) {
      console.error('❌ 멤버 은퇴 실행 중 오류:', error);
    }
  }

  const handleClaimActivityReward = async (member: CommitteeMember) => {
    if (!address) {
      console.error('❌ 지갑 미연결');
      return;
    }

    try {
      console.log('💰 활동 보상 청구 실행:', member.name, 'Amount:', member.claimableActivityReward);

      // 트랜잭션 모달 열기
      setShowTransactionModal(true);

      await claimActivityReward({
        candidateContract: member.candidateContract
      });

    } catch (error) {
      console.error('❌ 활동 보상 청구 실행 중 오류:', error);
    }
  }

  // 해당 멤버가 현재 연결된 지갑의 소유자인지 확인 (creationAddress 또는 manager 주소)
  const isOwnMember = (member: any) => {
    if (!address) return false;

    const lowerAddress = address.toLowerCase();
    const isCreator = member.creationAddress.toLowerCase() === lowerAddress;
    const isManager = member.manager && member.manager.toLowerCase() === lowerAddress;

    // console.log('🔍 Checking ownership:', {
    //   memberName: member.name,
    //   connectedAddress: address,
    //   creationAddress: member.creationAddress,
    //   managerAddress: member.manager,
    //   isCreator,
    //   isManager,
    //   canManage: isCreator || isManager
    // });

    return isCreator || isManager;
  }

  // 현재 연결된 지갑으로 해당 멤버에게 챌린지할 수 있는지 확인


  // console.log("🚀 committeeMembers ", committeeMembers);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-normal text-zinc-900 font-['Inter']">
              DAO Committee Members
            </h1>
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
              <span className="text-xs text-gray-600 font-medium">?</span>
            </div>
          </div>

          {/* Check the challenge 버튼 */}
          {!isMember && (
            <div className="flex flex-col gap-2">
              <button
                onClick={handleGlobalChallengeCheck}
                // disabled={isCheckingGlobal}
                className="p-3 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex justify-center items-center gap-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-center justify-start text-slate-700 text-sm font-semibold font-['Inter'] leading-none">
                Check the challenge
                </div>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Loading state */}
      {isLoadingMembers && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading committee members...</p>
        </div>
      )}

      {/* Error state */}
      {membersError && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-red-500 text-lg">{membersError}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => refreshCommitteeMembers()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Data display */}
      {!isLoadingMembers && committeeMembers && committeeMembers.length > 0 && (
        <div className="flex flex-col gap-4">
          {committeeMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >

              {/* Member Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 text-xs font-normal font-['Inter']">Total Staked </span>
                    <span className="text-slate-700 text-xs font-normal font-['Inter']">{formatTONWithUnit(member.totalStaked)}</span>
                  </div>
                  <div className="self-stretch justify-start text-slate-700 text-xl font-semibold font-['Inter']">{member.name}</div>
                  <div className="self-stretch justify-start text-gray-600 text-sm font-normal font-['Inter']">{member.description}</div>
                </div>
              </div>

              {/* Status with clock icon */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span className="text-gray-600 text-[10px] font-normal font-['Inter']">
                  Staking reward last updated {formatRelativeTime(member.lastUpdateSeigniorageTime)}
                </span>
              </div>

              {/* Buttons at bottom */}
              <div className="flex justify-between items-center">
                <div
                  data-size="Small"
                  data-state="Default"
                  data-type="Primary"
                  className="w-32 px-4 py-1 rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer border"
                  style={{
                    backgroundColor: expandedMember === index ? 'transparent' : '#2A72E5',
                    borderColor: expandedMember === index ? '#D1D5DB' : '#2A72E5'
                  }}
                  onClick={() => handleViewDetails(index)}
                >
                  <div
                    className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose"
                    style={{color: expandedMember === index ? '#374151' : '#FFFFFF'}}
                  >
                    {expandedMember === index ? "Close" : "View Details"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Challenge 버튼 - 실제 챌린지 권한이 있을 때만 표시 */}
                  {(() => {
                    const { canChallenge, myLayer2, myLayer2s } = canChallengeWith(member);
                    if (canChallenge && myLayer2 && myLayer2s) {
                      return (
                        <div
                          className="px-4 py-1 rounded-md inline-flex justify-center items-center cursor-pointer"
                          style={{backgroundColor: '#2A72E5'}}
                          onClick={() => {
                            // 여러 Layer2가 있으면 선택 모달 표시
                            if (myLayer2s.length > 1) {
                              console.log('🎯 여러 Layer2 감지, 선택 모달 표시:', {
                                availableLayer2s: myLayer2s.map(l => l.name),
                                targetMember: member.name
                              });
                              setSelectedMemberForChallenge(member);
                              setAvailableLayer2s(myLayer2s);
                              setSelectedLayer2Index(0); // 첫 번째 옵션을 기본 선택
                              setShowLayer2SelectModal(true);
                            } else {
                              // 1개만 있으면 바로 실행
                              console.log('🚀 단일 Layer2로 바로 챌린지 실행!', {
                                challenger: myLayer2.name,
                                target: member.name,
                                myStaking: myLayer2.totalStaked,
                                targetStaking: member.totalStaked,
                                myAddress: address,
                                canExecute: true
                              });
                              handleChallenge(member);
                            }
                          }}
                          title={
                            myLayer2s.length > 1
                              ? `${myLayer2s.length}개 Layer2 중 선택`
                              : `${myLayer2.name}로 챌린지 실행 (${(Number(myLayer2.totalStaked) / 1e27).toLocaleString()} WTON)`
                          }
                        >
                          <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                            Challenge
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Creator 또는 Manager인 경우에만 표시되는 버튼들 */}
                  {isOwnMember(member) && (
                    <>
                      <div
                        className="px-4 py-1 rounded-md inline-flex justify-center items-center cursor-pointer"
                        style={{backgroundColor: '#DC2626'}}
                        onClick={() => handleRetireMember(member)}
                      >
                        <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                          Retire
                        </div>
                      </div>

                      {/* Claim Reward 버튼: 항상 표시, claimableActivityReward에 따라 활성화/비활성화 */}
                      <div
                        className={`px-4 py-1 rounded-md inline-flex justify-center items-center ${
                          member.claimableActivityReward && Number(member.claimableActivityReward) > 0
                            ? 'cursor-pointer'
                            : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{
                          backgroundColor: member.claimableActivityReward && Number(member.claimableActivityReward) > 0
                            ? '#059669'  // 활성화: 초록색
                            : '#9CA3AF'  // 비활성화: 회색
                        }}
                        onClick={() => {
                          if (member.claimableActivityReward && Number(member.claimableActivityReward) > 0) {
                            handleClaimActivityReward(member);
                          }
                        }}
                      >
                                                <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                          Claim Reward
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMember === index && (
                <div className="border-t border-gray-100 pt-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-sm text-gray-900 text-right">{member.name}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Candidate Address</label>
                      <a
                        href={`https://etherscan.io/address/${member.creationAddress}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-mono ml-4"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={member.creationAddress}
                      >
                        {member.creationAddress}
                      </a>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Candidate Contract</label>
                      <a
                        href={`https://etherscan.io/address/${member.candidateContract}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-mono ml-4"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={member.candidateContract}
                      >
                        {member.candidateContract}
                      </a>
                    </div>

                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Total Staked</label>
                      <p className="text-sm text-gray-900 font-medium text-right">
                        {formatTONWithUnit(member.totalStaked)}
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Claimable Activity Reward</label>
                      <p className="text-sm text-gray-900 font-medium text-right">
                        {member.claimableActivityReward ? formatTONWithUnit(member.claimableActivityReward) : "Not available"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Last Reward Update</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 text-right">
                          {formatDateTime(member.lastUpdateSeigniorageTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No data state */}
      {!isLoadingMembers && !membersError && (!committeeMembers || committeeMembers.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-gray-500 text-lg">No committee members found</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => refreshCommitteeMembers()}
          >
            Load Data
          </button>
        </div>
      )}

      {committeeMembers && committeeMembers.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            {!isMounted ? (
              <>💡 Loading wallet status...</>
            ) : !isWalletConnected ? (
              <>💡 Connect your wallet to interact with committee members</>
            ) : (
              <>ℹ️ You can challenge any committee member. Retire and claim buttons appear only for memberships you created or manage.</>
            )}
          </p>
        </div>
      )}

      {/* 전역 Challenge 분석 진행사항 모달 */}
      {showGlobalChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Challenge Analysis
                </h3>
                <button
                  onClick={() => {
                    setShowGlobalChallenge(false);
                    setChallengeProgress(prev => ({ ...prev, step: 'idle' }));
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-8">
              {/* 로딩 상태 */}
              {challengeProgress.step !== 'completed' && challengeProgress.step !== 'error' && (
                <div className="text-center space-y-6">
                  {/* 중앙 스피너/아이콘 */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>

                  {/* 상태 메시지 */}
                  <div className="space-y-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {challengeProgress.step === 'loading-layer2' && 'Loading Layer2 Data'}
                      {challengeProgress.step === 'checking-members' && 'Analyzing Members'}
                    </h4>
                    <p className="text-gray-600">{challengeProgress.message}</p>
                  </div>

                  {/* 진행률 바 */}
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {challengeProgress.step === 'loading-layer2' && 'Layer2 Registry'}
                        {challengeProgress.step === 'checking-members' && 'Committee Members'}
                      </span>
                      <span>{challengeProgress.currentMemberIndex}/{challengeProgress.totalMembers}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${challengeProgress.totalMembers > 0 ? (challengeProgress.currentMemberIndex / challengeProgress.totalMembers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 에러 상태 */}
              {challengeProgress.step === 'error' && (
                <div className="text-center py-8">
                  <div className="text-red-500 text-2xl mb-4">❌</div>
                  <p className="text-red-600 font-medium mb-2">Analysis Failed</p>
                  <p className="text-gray-600 text-sm mb-4">{challengeProgress.error}</p>
                  <button
                    onClick={handleGlobalChallengeCheck}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* 완료 상태 - 결과 표시 */}
              {challengeProgress.step === 'completed' && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-green-500 text-xl mb-1">✅</div>
                    <p className="text-gray-800 font-medium text-sm">{challengeProgress.message}</p>
                  </div>

                                                      {globalChallengeCandidates.length > 0 ? (
                    <div className="space-y-6">
                      {/* 상단: 내가 도전 가능한 멤버들만 따로 표시 */}
                      {(() => {
                        const myOpportunities = globalChallengeCandidates.filter((item: any) => item.hasMyLayer2);

                        return (
                          <>
                            {/* 내 도전 기회 */}
                            {myOpportunities.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-green-800 text-lg">
                                    🚀 내가 도전할 수 있는 멤버 ({myOpportunities.length}명)
                                  </h4>
                                </div>
                                <div className="space-y-4">
                                  {myOpportunities.map((item: any, index) => {
                                    const myChallengers = item.challengers.filter((challenger: Candidate) => {
                                      // 쿨다운 시간이 설정되어 있고, 아직 쿨다운이 끝나지 않았으면 챌린지 불가
                                      const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
                                      if (challenger.cooldown > 0 && currentTime < challenger.cooldown) {
                                        return false;
                                      }

                                      return address && (
                                        challenger.creationAddress.toLowerCase() === address.toLowerCase() ||
                                        (challenger.operator && challenger.operator.toLowerCase() === address.toLowerCase()) ||
                                        (challenger.manager && challenger.manager.toLowerCase() === address.toLowerCase())
                                      );
                                    });

                                    return (
                                      <div key={item.member.candidateContract} className="border-2 border-green-300 bg-green-50 rounded-xl p-5">
                                        {/* 타겟 멤버 정보 */}
                                        <div className="flex justify-between items-start mb-4">
                                          <div>
                                            <h5 className="text-lg font-bold text-gray-900">{item.member.name}</h5>
                                            <p className="text-green-700 font-medium">
                                              💰 스테이킹: {(Number(item.member.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                                            </p>
                                          </div>
                                          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                                            🎯 도전 가능!
                                          </span>
                                        </div>

                                        {/* 내 Layer2들만 표시 */}
                                        <div className="space-y-3">
                                          <h6 className="font-semibold text-gray-800 mb-3">내 도전 가능한 Layer2 ({myChallengers.length}개):</h6>

                                          {myChallengers.map((challenger: Candidate, idx: number) => (
                                            <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-md">
                                              <div className="flex justify-between items-center">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg font-bold text-gray-900">{challenger.name}</span>
                                                    <a
                                                      href={getExplorerUrl(challenger.candidateContract, chainId)}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                                      title={`익스플로러에서 ${challenger.name} 확인하기`}
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                      </svg>
                                                    </a>
                                                    <div className="flex items-center gap-1">
                                                      <span className="bg-green-600 text-white px-2 py-1 text-xs font-bold rounded-full">
                                                        ✅ 챌린지 실행 가능
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="text-sm space-y-1">
                                                    <p className="font-bold text-green-800">
                                                      💪 내 스테이킹: {(Number(challenger.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                                                    </p>
                                                    <p className="text-xs font-mono text-gray-600">
                                                      📍 {challenger.candidateContract.slice(0, 8)}...{challenger.candidateContract.slice(-6)}
                                                    </p>
                                                    <p className="text-xs text-green-700 font-medium">
                                                      🔑 연결된 계정으로 실제 챌린지 트랜잭션 실행 가능
                                                    </p>
                                                  </div>
                                                </div>
                                                <button
                                                  className="ml-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                                                  onClick={() => console.log('🚀 챌린지 시작!', {
                                                    challenger: challenger.name,
                                                    target: item.member.name,
                                                    myStaking: challenger.totalStaked,
                                                    targetStaking: item.member.totalStaked
                                                  })}
                                                >
                                                  ⚡ 실행하기!
                                                </button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 하단: 원래 분석 내용 전체 (모든 멤버와 그들을 도전할 수 있는 모든 Layer2들) */}
                            <div className="space-y-4">
                              {myOpportunities.length > 0 && (
                                <div className="border-t pt-6" />
                              )}
                              <h4 className="font-medium text-gray-800 text-lg mb-4">
                                📊 전체 분석 결과 ({globalChallengeCandidates.length}명)
                              </h4>
                              <div className="space-y-4">
                                {globalChallengeCandidates.map((item: any, index) => (
                                  <div key={item.member.candidateContract} className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                                    {/* 멤버 기본 정보 */}
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <span className="font-bold text-gray-900 text-lg">{item.member.name}</span>
                                        <p className="text-sm text-gray-600">
                                          💰 {(Number(item.member.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                                        </p>
                                      </div>
                                      {item.hasMyLayer2 && (
                                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                          내 도전 가능
                                        </span>
                                      )}
                                    </div>

                                    {/* 도전 가능한 모든 Layer2들 */}
                                    <div className="border-t pt-3">
                                      <p className="text-sm font-semibold text-gray-700 mb-2">
                                        🏆 도전 가능한 Layer2 ({item.challengers.length}개):
                                      </p>
                                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                        {item.challengers.map((challenger: Candidate, idx: number) => {
                                          // 내 Layer2인지 확인 (쿨다운 체크 포함)
                                          const currentTime = Math.floor(Date.now() / 1000); // 현재 시간 (초 단위)
                                          const isMyLayer2 = address && (
                                            challenger.creationAddress.toLowerCase() === address.toLowerCase() ||
                                            (challenger.operator && challenger.operator.toLowerCase() === address.toLowerCase()) ||
                                            (challenger.manager && challenger.manager.toLowerCase() === address.toLowerCase())
                                          ) && !(challenger.cooldown > 0 && currentTime < challenger.cooldown); // 쿨다운 체크 추가

                                          return (
                                            <div key={idx} className={`border rounded-md p-2 ${
                                              isMyLayer2 ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                                            }`}>
                                              <div className="flex justify-between items-center">
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <span className={`font-medium text-sm ${
                                                      isMyLayer2 ? 'text-green-800' : 'text-gray-900'
                                                    }`}>
                                                      {challenger.name}
                                                    </span>
                                                    <a
                                                      href={getExplorerUrl(challenger.candidateContract, chainId)}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                                      title={`익스플로러에서 ${challenger.name} 확인하기`}
                                                    >
                                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                      </svg>
                                                    </a>
                                                    {isMyLayer2 && (
                                                      <span className="bg-green-600 text-white px-1 py-0.5 text-xs rounded">
                                                        내 소유
                                                      </span>
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-gray-600">
                                                    💪 {(Number(challenger.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                                                  </p>
                                                </div>
                                                <span className="text-xs text-green-600 font-medium">
                                                  +{((Number(challenger.totalStaked) - Number(item.member.totalStaked)) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} WTON
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">😔 현재 챌린지할 수 있는 위원회 멤버가 없습니다.</p>
                      <p className="text-sm text-gray-400 mt-2">
                        위원회 멤버들보다 높은 스테이킹을 가진 Layer2가 필요합니다.
                      </p>
                    </div>
                  )}

                                    <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 text-center">
                      ⚡ Results from cached data • Analysis completed in real-time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

            {/* Layer2 선택 모달 - 이미지와 동일한 깔끔한 디자인 */}
      {showLayer2SelectModal && selectedMemberForChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl">
            {/* 모달 헤더 */}
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Choose a challenge
                </h3>
                <button
                  onClick={() => {
                    setShowLayer2SelectModal(false);
                    setSelectedMemberForChallenge(null);
                    setAvailableLayer2s([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

                        {/* 큰 박스 - 타겟 멤버와 챌린저들을 포함 */}
            <div className="px-6 pb-4">
              <div className="border border-gray-200 rounded-xl p-4">
                {/* 타겟 멤버 정보 */}
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">
                    {selectedMemberForChallenge.name}
                  </h4>
                  <p className="text-gray-600">
                    {(Number(selectedMemberForChallenge.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                  </p>
                </div>

                {/* 구분선과 챌린저 섹션 제목 */}
                <div className="border-t border-gray-200 pt-3">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Challenging Layer2 ({availableLayer2s.length})
                  </h5>

                  {/* 작은 챌린저 박스들 */}
                  <div className="space-y-2">
                    {availableLayer2s.map((layer2, index) => (
                      <div
                        key={index}
                        className="p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors"
                        onClick={() => {
                          setSelectedLayer2Index(index);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            {/* 라디오 버튼 */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedLayer2Index === index
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedLayer2Index === index && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>

                            {/* Layer2 정보 */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 text-sm">{layer2.name}</span>
                                <a
                                  href={`https://etherscan.io/address/${layer2.candidateContract}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                              <p className="text-gray-600 text-sm mt-0.5">
                                {(Number(layer2.totalStaked) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                              </p>
                            </div>
                          </div>

                          {/* 우위 표시 */}
                          <div className="text-right">
                            <p className="text-blue-500 font-medium text-sm">
                              +{((Number(layer2.totalStaked) - Number(selectedMemberForChallenge.totalStaked)) / 1e27).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} WTON
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="p-6 pt-3 flex justify-center">
              <button
                onClick={() => {
                  if (selectedLayer2Index >= 0 && selectedLayer2Index < availableLayer2s.length && selectedMemberForChallenge) {
                    const selectedLayer2 = availableLayer2s[selectedLayer2Index];
                    setSelectedLayer2ForChallenge(selectedLayer2);
                    setShowLayer2SelectModal(false);
                    setSelectedMemberForChallenge(null);
                    setAvailableLayer2s([]);
                    setSelectedLayer2Index(-1);
                    handleChallenge(selectedMemberForChallenge);
                  }
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold text-lg transition-colors ${
                  selectedLayer2Index >= 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                disabled={selectedLayer2Index < 0}
              >
                Choose
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 트랜잭션 진행 모달 */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          resetDAOCandidate();
        }}
        isExecuting={isDAOCandidateExecuting}
        isSuccess={isDAOCandidateSuccess}
        error={daoCandidateError}
        txHash={txHash}
        operation={lastOperation}
      />
    </div>
  )
}