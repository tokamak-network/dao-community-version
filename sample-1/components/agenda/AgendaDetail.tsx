'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

import { useRouter } from 'next/navigation'
import { AgendaWithMetadata } from '@/types/agenda'
import { CommitteeMember } from '@/types/dao'
import { formatDateSimple, getStatusMessage, calculateAgendaStatus,
    getAgendaResult, formatAddress, getEtherscanUrl, AgendaStatus } from '@/lib/utils'
import AgendaInfo from './AgendaInfo'
import AgendaEffects from './AgendaEffects'
import AgendaComments from './AgendaComments'
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransactionReceipt
} from 'wagmi'

import {
  DAO_COMMITTEE_PROXY_ADDRESS,
  DAO_AGENDA_MANAGER_ADDRESS
} from '@/config/contracts'
import { DAO_ABI } from '@/abis/dao'
import { chain } from '@/config/chain'
import { useCombinedDAOContext } from "@/contexts/CombinedDAOContext"
import { isAddress } from "ethers"
import { Copy, ExternalLink, Vote, Zap, MoreVertical, PlayCircle, RefreshCw} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { toast } from "sonner";
import { METADATA_CACHE_CONFIG } from "@/constants/dao";
import { getExplorerUrl } from "@/utils/explorer";
import { TransactionModal as CommonTransactionModal } from '@/components/ui/TransactionModal';

interface AgendaDetailProps {
  agenda: AgendaWithMetadata
}

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [voteComment, setVoteComment] = useState("")
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [localAgenda, setLocalAgenda] = useState<AgendaWithMetadata>(agenda)
  const [selectedMemberForVote, setSelectedMemberForVote] = useState<CommitteeMember | null>(null)
  const [memberVoteInfos, setMemberVoteInfos] = useState<{ hasVoted: boolean }[]>([])
  const [isCheckingVotes, setIsCheckingVotes] = useState(false)
  const [txType, setTxType] = useState<"vote" | "execute" | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 수동 업데이트 디바운스를 위한 ref
  const lastRefreshTimeRef = useRef<number>(0)

  const router = useRouter()
  const { address } = useAccount()
  const { isCommitteeMember, getCommitteeMemberInfo, committeeMembers, isLoadingMembers, refreshAgenda, getAgenda, refreshAgendaWithoutCache, getVoterInfos, quorum, upsertAgenda, paginationState, loadNextPage, hasMore, hasValidAgendaWithMetadata, refreshMetadataIdList } = useCombinedDAOContext()

    // 지갑 연결/변경 시 짧은 로딩 피드백 제공
  useEffect(() => {
    if (address) {
      setIsCheckingAuth(true)
      const timer = setTimeout(() => {
        setIsCheckingAuth(false)
      }, 800) // 0.8초간 로딩 표시

      return () => clearTimeout(timer)
    } else {
      setIsCheckingAuth(false)
    }
  }, [address])

  const chainId = chain.id;

  // agenda prop이 변경될 때 localAgenda 업데이트
  useEffect(() => {
    setLocalAgenda(agenda)
  }, [agenda])

  // Calculate dynamic status (use quorum for consistency with list)
  const currentStatus = calculateAgendaStatus(localAgenda, quorum ?? BigInt(2));
  const statusMessage = getStatusMessage(localAgenda, currentStatus, quorum ?? BigInt(2));

  // Get candidate contract address
  const { data: candidateContractAddress } = useContractRead({
    address: DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`,
    abi: DAO_ABI,
    functionName: "candidateContract",
    args: [address as `0x${string}`],
    chainId: chain.id,
  })

    // Check if user has already voted (using wallet address as fallback)
  const { data: hasVotedData, refetch } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS as `0x${string}`,
    abi: [
      {
        name: "hasVoted",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "_agendaID", type: "uint256" },
          { name: "_user", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "hasVoted",
    args: address
      ? [BigInt(localAgenda.id), address as `0x${string}`]
      : undefined,
    chainId: chain.id,
  })

  // Local state to immediately reflect voting status for specific memberships
  const [localVotedMemberships, setLocalVotedMemberships] = useState<Set<string>>(new Set())


    // Prepare vote transaction
  const { writeContract, data: voteData, error: writeError, isError: isWriteError } = useContractWrite()

  // Prepare execute transaction
  const {
    writeContract: writeExecuteContract,
    data: executeData,
    isError: isExecuteError,
  } = useContractWrite();

  // Wait for transaction
  const {
    isLoading: isVoting,
    isSuccess,
    isError,
    error: waitError,
  } = useWaitForTransactionReceipt({
    hash: voteData || executeData,
  })


  // Handle transaction success/error
  useEffect(() => {


    if (isSuccess) {
      if (voteData) {

        toast.success("Vote cast successfully!");
        // 모달을 자동으로 닫지 않고 성공 상태를 보여줌
        // setShowTransactionModal(false);
        setShowVoteModal(false);
        setVoteComment("");

        // 🔄 즉시 로컬 상태 업데이트 (UI 즉시 반영)
        if (selectedMemberForVote?.creationAddress) {
          setLocalVotedMemberships(prev => {
            const newSet = new Set(prev);
            newSet.add(selectedMemberForVote.creationAddress);
            return newSet;
          });
        }

        // 🔄 투표 성공 후 데이터 새로고침 (블록체인 데이터와 동기화)
        refetch(); // hasVoted 상태 갱신
        handleRefresh(); // 아젠다 데이터 전체 갱신
      } else if (executeData) {

        toast.success("Agenda executed successfully!");
        // 모달을 자동으로 닫지 않고 성공 상태를 보여줌
        // setShowTransactionModal(false);

        // 🔄 실행 성공 후 데이터 새로고침
        handleRefresh(); // 아젠다 데이터 전체 갱신
      }
    }

    if (isError || isExecuteError) {

      toast.error(
        `Transaction failed: ${
          waitError?.message || "Transaction was cancelled"
        }`
      );
      setShowTransactionModal(false);
    }
  }, [isSuccess, isError, isExecuteError, waitError, voteData, executeData, isVoting, isWriteError, writeError])

    // Handle writeContract errors (지갑 승인 거부 등)
  useEffect(() => {
    if (isWriteError && writeError) {
      console.error("Vote transaction failed:", writeError)
      console.error("Error details:", {
        message: writeError?.message,
        name: writeError?.name,
        cause: writeError?.cause,
        fullError: writeError
      })

      // 지갑 승인 거부 또는 기타 에러 처리
      if (
        writeError?.message?.includes("User rejected") ||
        writeError?.message?.includes("denied") ||
        writeError?.message?.includes("rejected") ||
        writeError?.message?.includes("cancelled")
      ) {

        // 트랜잭션 모달에서 에러 상태를 보여주기 위해 모달을 닫지 않음
        // 트랜잭션 모달은 계속 열려있고, 에러 상태로 표시됨
      } else {

        // 트랜잭션 모달에서 에러 상태를 보여주기 위해 모달을 닫지 않음
      }
    }
  }, [isWriteError, writeError])

  // 🔍 디버깅: 모달 상태 추적
  useEffect(() => {
    if (showTransactionModal) {
      const modalState = isWriteError && writeError ? "ERROR" :
                        isSuccess && (voteData || executeData) ? "SUCCESS" : "LOADING";


    }
  }, [showTransactionModal, isWriteError, writeError, isSuccess, voteData, executeData, isVoting, isError, waitError])

  // 아젠다 실행 이벤트 구독
  useEffect(() => {
    const handleAgendaExecuted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ agendaId: number }>;
      if (customEvent.detail.agendaId === localAgenda.id) {
        // console.log(`🔍 [AgendaDetail] Execution event for agenda ${localAgenda.id}`);

        // refreshAgendaWithoutCache 내부에서 hasValidAgendaWithMetadata 체크 수행
        const latestAgenda = await refreshAgendaWithoutCache(localAgenda.id);
        if (latestAgenda) {
          setLocalAgenda(latestAgenda);
        }
      }
    };


    window.addEventListener("agendaExecuted", handleAgendaExecuted);

    return () => {

      window.removeEventListener("agendaExecuted", handleAgendaExecuted);
    };
  }, [localAgenda.id, refreshAgendaWithoutCache]);

   // 투표 상태 갱신을 위한 이벤트 리스너
   useEffect(() => {
    const handleVoteUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent<{ agendaId: number }>;

      if (customEvent.detail.agendaId === localAgenda.id) {
        // console.log(`🔍 [AgendaDetail] Vote update event for agenda ${localAgenda.id}`);

        // refreshAgendaWithoutCache 내부에서 hasValidAgendaWithMetadata 체크 수행
        const latestAgenda = await refreshAgendaWithoutCache(localAgenda.id);
        if (latestAgenda) {
          setLocalAgenda(latestAgenda);
          // 투표 상태도 갱신
          await refetch();
        }
      }
    };


    window.addEventListener("agendaVoteUpdated", handleVoteUpdate);
    return () => {

      window.removeEventListener("agendaVoteUpdated", handleVoteUpdate);
    };
  }, [localAgenda.id, refreshAgendaWithoutCache, refetch]);


      // 투표 권한 확인 중인지 상태
  const isCheckingVotingAuth = useMemo(() => {
    // 인위적 로딩 상태 또는 실제 멤버 데이터 로딩 중
    return Boolean(address && (isLoadingMembers || isCheckingAuth))
  }, [address, isLoadingMembers, isCheckingAuth])

      // 투표 권한이 있는지 확인
  const isVoter = useMemo(() => {
    // 권한 확인 중이면 false 반환 (로딩 상태에서는 투표 불가)
    if (isCheckingVotingAuth) return false

    return address && (
      localAgenda.voters?.includes(address) ||
      isCommitteeMember(address as string)
    )
  }, [address, localAgenda.voters, isCommitteeMember, isCheckingVotingAuth])

  // 멤버 정보 가져오기
  const memberInfo = useMemo(() => {
    if (!address) return null;
    return getCommitteeMemberInfo(address);
  }, [address, getCommitteeMemberInfo])

  // 이전/다음 아젠다 ID 계산 (아젠다 ID 기준)
  const { previousAgendaId, nextAgendaId } = useMemo(() => {
    if (!paginationState?.agendas || paginationState.agendas.length === 0) {
      return { previousAgendaId: null, nextAgendaId: null };
    }

    const currentAgendaId = localAgenda.id;

    // 아젠다 ID 기준으로 이전/다음 찾기
    const previousAgendaId = currentAgendaId > 1 ? currentAgendaId - 1 : null;
    const nextAgendaId = currentAgendaId + 1;

    // 실제로 해당 ID의 아젠다가 목록에 있는지 확인
    const previousExists = previousAgendaId ? paginationState.agendas.some((a: any) => a.id === previousAgendaId) : false;
    const nextExists = paginationState.agendas.some((a: any) => a.id === nextAgendaId);

    return {
      previousAgendaId: previousExists ? previousAgendaId : null,
      nextAgendaId: nextExists ? nextAgendaId : null
    };
  }, [paginationState?.agendas, localAgenda.id])

  // 이전 아젠다 로딩 상태
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // 이전/다음 아젠다로 이동하는 함수
  const navigateToAgenda = (agendaId: number) => {
    router.push(`/agenda/${agendaId}`);
  }

  // 이전 아젠다로 이동 (필요시 더 로드)
  const navigateToPreviousAgenda = async () => {
    const targetId = localAgenda.id - 1;
    if (targetId < 1) return;

    setIsLoadingPrevious(true);

    try {
      // 현재 목록에서 해당 아젠다 찾기
      const exists = paginationState?.agendas?.some((a: any) => a.id === targetId);

      if (exists) {
        // 있으면 바로 이동
        navigateToAgenda(targetId);
      } else if (hasMore && hasMore()) {
        // 없고 더 로드할 데이터가 있으면 로드 후 이동
        await loadNextPage?.();
        navigateToAgenda(targetId);
      }
      // 없고 더 로드할 데이터도 없으면 아무것도 하지 않음
    } catch (error) {
      console.error('Error loading previous agenda:', error);
    } finally {
      setIsLoadingPrevious(false);
    }
  }

  // 사용자가 여러 멤버의 소유자인지 확인
  const userMemberships = useMemo(() => {
    if (!address || !committeeMembers) return [];

    const memberships: { member: CommitteeMember; ownershipType: 'creation' | 'manager' }[] = [];

    committeeMembers.forEach(member => {
      const lowerAddress = address.toLowerCase();

      // creationAddress와 비교
      if (member.creationAddress.toLowerCase() === lowerAddress) {
        memberships.push({ member, ownershipType: 'creation' });
      }

      // manager 주소와 비교
      if (member.manager &&
          member.manager.toLowerCase() !== '0x0000000000000000000000000000000000000000' &&
          member.manager.toLowerCase() === lowerAddress) {
        memberships.push({ member, ownershipType: 'manager' });
      }
    });

    return memberships;
  }, [address, committeeMembers]);

  // Check if ALL user memberships have voted
  const hasVoted = useMemo(() => {
    if (!userMemberships.length) return hasVotedData ?? false; // Fallback to wallet address check

    // Check if all memberships have voted (either locally or from blockchain data)
    return userMemberships.every((membership, idx) => {
      const creationAddress = membership.member.creationAddress;
      const hasVotedLocally = localVotedMemberships.has(creationAddress);
      const hasVotedOnChain = memberVoteInfos[idx]?.hasVoted ?? false;
      return hasVotedLocally || hasVotedOnChain;
    });
  }, [userMemberships, localVotedMemberships, memberVoteInfos, hasVotedData])

  // 투표 모달이 열릴 때 각 멤버의 투표 여부를 가져옴
  useEffect(() => {
    if (!showVoteModal) return;
    setIsCheckingVotes(true);
    // userMemberships의 각 멤버의 creationAddress로 투표 여부 조회
    const fetchVoted = async () => {
      if (!userMemberships.length) {
        setMemberVoteInfos([]);
        setIsCheckingVotes(false);
        return;
      }
      // 각 멤버의 creationAddress를 address 배열로 만듦
      const addresses = userMemberships.map(m => m.member.creationAddress);
      // getVoterInfos 호출 (agendaId, addresses)
      const infos = await getVoterInfos(localAgenda.id, addresses);
      setMemberVoteInfos(infos.map(i => ({ hasVoted: i.hasVoted })));
      // 기본 선택: 아직 투표하지 않은 첫 번째 멤버
      const firstAvailableIdx = infos.findIndex(i => !i.hasVoted);
      if (firstAvailableIdx !== -1) {
        setSelectedMemberForVote(userMemberships[firstAvailableIdx].member);
      } else {
        setSelectedMemberForVote(null);
      }
      setIsCheckingVotes(false);
    };
    fetchVoted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVoteModal, localAgenda.id, userMemberships.length]);

  const handleVote = (vote: number) => {
    // Add wallet connection validation
    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.")
      return
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.")
      return
    }

    // 멤버 선택 확인
    let targetMember: CommitteeMember | null = null;
    if (userMemberships.length === 1) {
      targetMember = userMemberships[0].member;
    } else if (userMemberships.length > 1) {
      if (!selectedMemberForVote) {
        alert("Please select a committee member to vote with.")
        return
      }
      targetMember = selectedMemberForVote;
    } else {
      alert("You are not a committee member.")
      return
    }

    if (!writeContract || !targetMember.candidateContract) {
      alert("Contract not available. Please try again.")
      return
    }

    // 투표 모달 닫고 트랜잭션 모달 열기
    setTxType("vote");
    setShowVoteModal(false)
    setShowTransactionModal(true)

    writeContract({
      abi: [
        {
          name: "castVote",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "_agendaID", type: "uint256" },
            { name: "_vote", type: "uint256" },
            { name: "_comment", type: "string" },
          ],
          outputs: [],
        },
      ],
      address: targetMember.candidateContract as `0x${string}`,
      functionName: "castVote",
      args: [BigInt(localAgenda.id), BigInt(vote), voteComment],
    })
  }


  const handleExecute = async () => {
    // Add wallet connection validation
    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.");
      return;
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.");
      return;
    }

    try {
      setTxType("execute");
      setShowTransactionModal(true);
      await writeContract({
        address: DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`,
        abi: DAO_ABI,
        functionName: "executeAgenda",
        args: [BigInt(localAgenda.id)],
      });
    } catch (error: any) {
      console.error("Error executing agenda:", error);
      toast.error(
        `Transaction failed: ${error?.message || "Transaction was cancelled"}`
      );
      setShowTransactionModal(false);
    }
  };


  const handleRefresh = async () => {
    // 디바운스 체크: 연속 호출 방지
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

    if (timeSinceLastRefresh < METADATA_CACHE_CONFIG.MANUAL_UPDATE_DEBOUNCE_MS) {
      const remainingTime = Math.ceil((METADATA_CACHE_CONFIG.MANUAL_UPDATE_DEBOUNCE_MS - timeSinceLastRefresh) / 1000);
      toast.warning(`Please wait ${remainingTime} seconds before refreshing again`);
      // console.log(`⏰ [AgendaDetail] Refresh debounced. Please wait ${remainingTime} seconds`);
      return;
    }

    if (isRefreshing) {
      // console.log('🔄 [AgendaDetail] Already refreshing, skipping...');
      return;
    }

    setIsRefreshing(true);
    lastRefreshTimeRef.current = now;
    // console.log('🔄 [AgendaDetail] Starting manual refresh...');

                try {
      // 1. 가장 먼저 메타데이터 캐시 갱신하고 새로운 캐시 받기
      let freshMetadataCache: Set<number> | null = null;
      if (typeof refreshMetadataIdList === 'function') {
        try {
          // console.log('🔄 [AgendaDetail] Refreshing metadata cache...');
          freshMetadataCache = await refreshMetadataIdList(); // 새로운 캐시 Set 반환
          // console.log('✅ [AgendaDetail] Metadata cache refreshed successfully');
        } catch (error) {
          console.warn('⚠️ [AgendaDetail] Failed to refresh metadata cache:', error);
          // 메타데이터 캐시 갱신 실패는 치명적이지 않으므로 계속 진행
        }
      }

      // 2. 아젠다 데이터 갱신 (새로운 캐시를 매개변수로 전달)
      // console.log('🔄 [AgendaDetail] Refreshing agenda data with fresh cache...');
      const updatedAgenda = await refreshAgendaWithoutCache(
        localAgenda.id,
        freshMetadataCache || undefined // null이면 undefined로 변환
      );
      if (updatedAgenda) {
        setLocalAgenda(updatedAgenda);
        if (upsertAgenda) {
          upsertAgenda(updatedAgenda);
        }
        // console.log('✅ [AgendaDetail] Agenda data refreshed successfully');
        toast.success('Agenda refreshed successfully!');
      } else {
        console.warn('⚠️ [AgendaDetail] Failed to refresh agenda data');
        toast.error('Failed to refresh agenda data');
      }
    } catch (error) {
      console.error('❌ [AgendaDetail] Refresh failed:', error);
      toast.error('Refresh failed. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }

  // 🔧 모듈화: 드롭다운 메뉴 컴포넌트
  const renderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-md hover:bg-gray-100">
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderActionButton = () => {
    switch (currentStatus) {
      case AgendaStatus.VOTING:

        return (
          <div className="flex items-center gap-1">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                isCheckingVotingAuth
                  ? "bg-blue-100 text-blue-600 cursor-wait"
                  : isVoter && !hasVoted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!isVoter || isVoting || hasVoted || isCheckingVotingAuth}
              onClick={() => {
                setShowVoteModal(true);
              }}
            >
              {isCheckingVotingAuth ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent flex-shrink-0"></div>
                  <span className="text-sm font-medium">Checking...</span>
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {isVoting ? "Voting..." : hasVoted ? "Already Voted" : "Vote"}
                  </span>
                </>
              )}
            </button>
            {renderDropdownMenu()}
          </div>
        );

      case AgendaStatus.WAITING_EXEC:

        if (
          !agenda.executed &&
          Number(agenda.countingYes) > Number(agenda.countingNo)
        ) {
          return (
            <div className="flex items-center gap-1">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                onClick={handleExecute}
              >
                <PlayCircle className="h-4 w-4" strokeWidth={2} />
                Execute
              </button>
              {renderDropdownMenu()}
            </div>
          );
        }
        return renderDropdownMenu();

      default:

        return renderDropdownMenu();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => router.push(`/agenda?focus=${localAgenda.id}`)}
          className="px-3 py-1.5 bg-white border border-gray-300 text-blue-600 text-xs rounded-md hover:bg-gray-50 transition-colors"
        >
          ← BACK TO ALL AGENDAS
        </button>

                <div className="flex gap-3">
          <button
            onClick={navigateToPreviousAgenda}
            disabled={localAgenda.id <= 1 || isLoadingPrevious}
            className={`px-3 py-1.5 bg-white border border-gray-300 text-xs rounded-md transition-colors ${
              localAgenda.id > 1 && !isLoadingPrevious
                ? 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoadingPrevious ? '← LOADING...' : '← PREVIOUS AGENDA'}
          </button>
          <button
            onClick={() => nextAgendaId && navigateToAgenda(nextAgendaId)}
            disabled={!nextAgendaId}
            className={`px-3 py-1.5 bg-white border border-gray-300 text-xs rounded-md transition-colors ${
              nextAgendaId
                ? 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            NEXT AGENDA →
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 text-sm font-medium">#{localAgenda.id}</span>
            <span className="text-gray-400 text-sm">Posted {formatDateSimple(Number(localAgenda.createdTimestamp))}</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-700 font-['Inter'] mb-4">
            {localAgenda.title || `Agenda #${localAgenda.id}`}
          </h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex justify-between items-baseline">
            <div className="flex gap-8">
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'effects'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('effects')}
              >
                On-Chain Effects
              </button>
              <button
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
            </div>

            {/* Voting Status - 같은 baseline */}
            <div className="flex items-center gap-4">
              <span className="text-gray-700 text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 mr-0.5" />
                <span className="text-sm font-medium">{statusMessage}</span>
              </span>
              {renderActionButton()}
            </div>
          </div>
        </div>



        {/* Content */}
        <div className={activeTab === 'info' ? 'block' : 'hidden'}>
          <AgendaInfo agenda={localAgenda} />
        </div>
        <div className={activeTab === 'effects' ? 'block' : 'hidden'}>
          <AgendaEffects agenda={localAgenda} />
        </div>
        <div className={activeTab === 'comments' ? 'block' : 'hidden'}>
          <AgendaComments agenda={localAgenda} />
        </div>
      </div>

      {/* Vote Modal */}
      {showVoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Cast Your Vote</h3>
            {/* 멤버 선택 (라디오 버튼, 이미 투표한 멤버는 disabled) */}
            <div className="mb-4 flex flex-col gap-2">
              {isCheckingVotes ? (
                <div className="text-center text-gray-500 py-4">Checking available members...</div>
              ) : (
                userMemberships
                  .slice()
                  .map((membership, idx) => {
                    const voted = memberVoteInfos[idx]?.hasVoted;
                    return (
                      <label
                        key={`${membership.member.creationAddress}-${membership.ownershipType}`}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${selectedMemberForVote?.creationAddress === membership.member.creationAddress && !voted ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} ${voted ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="radio"
                          name="vote-member"
                          value={membership.member.creationAddress}
                          checked={selectedMemberForVote?.creationAddress === membership.member.creationAddress && !voted}
                          onChange={() => !voted && setSelectedMemberForVote(membership.member)}
                          disabled={voted || isCheckingVotes}
                          className="form-radio h-4 w-4 text-blue-600"
                        />
                        <span className="text-gray-900 text-sm font-medium">{membership.member.name}</span>
                        <a
                          href={getExplorerUrl(membership.member.candidateContract || '', chainId ?? null)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-blue-500 hover:text-blue-700"
                          title={membership.member.candidateContract}
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="inline h-4 w-4 text-blue-500" />
                        </a>
                        {voted && (
                          <span className="ml-2 text-xs text-red-500">Already Voted</span>
                        )}
                      </label>
                    );
                  })
              )}
            </div>
            <textarea
              className="w-full p-2 border rounded-md mb-4"
              placeholder="Add a comment (optional)"
              value={voteComment}
              onChange={(e) => setVoteComment(e.target.value)}
              rows={3}
              disabled={isCheckingVotes}
            />
            <div className="flex gap-4">
              <button
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                onClick={() => handleVote(1)}
                disabled={isVoting || !selectedMemberForVote || isCheckingVotes}
              >
                For
              </button>
              <button
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                onClick={() => handleVote(2)}
                disabled={isVoting || !selectedMemberForVote || isCheckingVotes}
              >
                Against
              </button>
              <button
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                onClick={() => handleVote(0)}
                disabled={isVoting || !selectedMemberForVote || isCheckingVotes}
              >
                Abstain
              </button>
            </div>
            <button
              className="mt-4 w-full text-gray-600 hover:text-gray-800"
              onClick={() => {
                setShowVoteModal(false);
                setSelectedMemberForVote(null);
              }}
              disabled={isVoting || isCheckingVotes}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <CommonTransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          state={{
            isSuccess,
            error: (waitError?.message || writeError?.message) ?? null,
            isExecuting: isVoting,
            txHash: voteData || executeData || null,
            operation: voteData ? "castVote" : executeData ? "executeAgenda" : "transaction",
          }}
          title={txType === "vote" ? "Cast Your Vote" : txType === "execute" ? "Execute Agenda" : "Transaction"}
          txHash={(voteData || executeData) ? (voteData || executeData) as string : null}
          stepLabels={["Approve wallet", "Check blockchain", "Done"]}
          successMessage={txType === "vote" ? "Vote cast successfully!" : txType === "execute" ? "Agenda executed successfully!" : "Transaction successful!"}
          errorMessage={txType === "vote" ? "Vote failed" : txType === "execute" ? "Agenda execution failed" : "Transaction failed"}
          explorerUrl={getEtherscanUrl('' , chainId)}
          subMessage={txType === "vote" ? "Your vote has been recorded." : txType === "execute" ? "Agenda was executed on-chain." : undefined}
        />
      )}
    </div>
  )
}