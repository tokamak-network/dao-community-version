'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatDateSimple, getStatusMessage, calculateAgendaStatus,
    getAgendaResult, formatAddress, getEtherscanUrl, AgendaStatus } from '@/lib/utils'
import AgendaInfo from './AgendaInfo'
import AgendaEffects from './AgendaEffects'
import AgendaComments from './AgendaComments'
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransactionReceipt,
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

interface AgendaDetailProps {
  agenda: AgendaWithMetadata
}

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState('info')
  const [voteComment, setVoteComment] = useState("")
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [localAgenda, setLocalAgenda] = useState<AgendaWithMetadata>(agenda)

  const { address } = useAccount()
  const { isCommitteeMember, refreshAgenda, getAgenda, refreshAgendaWithoutCache } = useCombinedDAOContext()

  // agenda prop이 변경될 때 localAgenda 업데이트
  useEffect(() => {
    setLocalAgenda(agenda)
  }, [agenda])

  // Calculate dynamic status
  const currentStatus = calculateAgendaStatus(localAgenda, BigInt(Math.floor(Date.now() / 1000)))
  const statusMessage = getStatusMessage(localAgenda, currentStatus)

  // Get candidate contract address
  const { data: candidateContractAddress } = useContractRead({
    address: DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`,
    abi: DAO_ABI,
    functionName: "candidateContract",
    args: [address as `0x${string}`],
    chainId: chain.id,
  })

  // Check if user has already voted
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

  // Memoize hasVoted value
  const hasVoted = useMemo(() => {
    return hasVotedData ?? false
  }, [hasVotedData])


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

  // 🔍 디버깅: 트랜잭션 해시 추적
  useEffect(() => {
    if (voteData) {
      console.log("📄 Vote transaction hash received:", voteData);
    }
    if (executeData) {
      console.log("📄 Execute transaction hash received:", executeData);
    }
  }, [voteData, executeData])

  // Handle transaction success/error
  useEffect(() => {
    // 🔍 디버깅: 트랜잭션 상태 로그
    console.log("🔍 Transaction States:", {
      isSuccess,
      isError,
      isExecuteError,
      isVoting,
      isWriteError,
      voteData,
      executeData,
      waitError: waitError?.message,
      writeError: writeError?.message,
    });

    if (isSuccess) {
      if (voteData) {
        console.log("✅ Vote transaction successful:", voteData);
        toast.success("Vote cast successfully!");
        // 모달을 자동으로 닫지 않고 성공 상태를 보여줌
        // setShowTransactionModal(false);
        setShowVoteModal(false);
        setVoteComment("");

        // 🔄 투표 성공 후 데이터 새로고침
        refetch(); // hasVoted 상태 갱신
        handleRefresh(); // 아젠다 데이터 전체 갱신
      } else if (executeData) {
        console.log("✅ Execute transaction successful:", executeData);
        toast.success("Agenda executed successfully!");
        // 모달을 자동으로 닫지 않고 성공 상태를 보여줌
        // setShowTransactionModal(false);

        // 🔄 실행 성공 후 데이터 새로고침
        handleRefresh(); // 아젠다 데이터 전체 갱신
      }
    }

    if (isError || isExecuteError) {
      console.log("❌ Transaction receipt error:", waitError?.message);
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
        console.log("🚫 User rejected transaction")
        // 트랜잭션 모달에서 에러 상태를 보여주기 위해 모달을 닫지 않음
        // 트랜잭션 모달은 계속 열려있고, 에러 상태로 표시됨
      } else {
        console.log("❌ Transaction failed with error:", writeError?.message)
        // 트랜잭션 모달에서 에러 상태를 보여주기 위해 모달을 닫지 않음
      }
    }
  }, [isWriteError, writeError])

  // 🔍 디버깅: 모달 상태 추적
  useEffect(() => {
    if (showTransactionModal) {
      const modalState = isWriteError && writeError ? "ERROR" :
                        isSuccess && (voteData || executeData) ? "SUCCESS" : "LOADING";

      console.log("🔍 Transaction Modal State:", {
        modalState,
        isWriteError,
        writeError: writeError?.message,
        isSuccess,
        voteData,
        executeData,
        isVoting,
        isError,
        waitError: waitError?.message
      });
    }
  }, [showTransactionModal, isWriteError, writeError, isSuccess, voteData, executeData, isVoting, isError, waitError])

  // 아젠다 실행 이벤트 구독
  useEffect(() => {
    const handleAgendaExecuted = async (event: Event) => {
      const customEvent = event as CustomEvent<{ agendaId: number }>;
      if (customEvent.detail.agendaId === localAgenda.id) {
        console.log(
          "[AgendaDetail] agendaExecuted event received:",
          customEvent.detail
        );

        // 컨트랙트에서 최신 아젠다 데이터 가져오기
        const latestAgenda = await getAgenda(localAgenda.id);
        if (latestAgenda) {
          console.log(
            "[AgendaDetail] Latest agenda data received:",
            latestAgenda
          );
          setLocalAgenda(latestAgenda);
        }
      }
    };

    console.log(
      "[AgendaDetail] Setting up agendaExecuted event listener for agenda ID:",
      localAgenda.id
    );
    window.addEventListener("agendaExecuted", handleAgendaExecuted);

    return () => {
      console.log(
        "[AgendaDetail] Removing agendaExecuted event listener for agenda ID:",
        localAgenda.id
      );
      window.removeEventListener("agendaExecuted", handleAgendaExecuted);
    };
  }, [localAgenda.id, getAgenda]);

   // 투표 상태 갱신을 위한 이벤트 리스너
   useEffect(() => {
    const handleVoteUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent<{ agendaId: number }>;
      console.log(
        "[AgendaDetail] agendaVoteUpdated event received:",
        customEvent.detail
      );
      if (customEvent.detail.agendaId === localAgenda.id) {
        console.log(
          "[AgendaDetail] Fetching latest agenda data for ID:",
          localAgenda.id
        );
        // 컨트랙트에서 최신 아젠다 데이터 가져오기
        const latestAgenda = await getAgenda(localAgenda.id);
        if (latestAgenda) {
          console.log(
            "[AgendaDetail] Latest agenda data received:",
            latestAgenda
          );
          setLocalAgenda(latestAgenda);
          // 투표 상태도 갱신
          await refetch();
        }
      }
    };

    console.log(
      "[AgendaDetail] Setting up agendaVoteUpdated event listener for agenda ID:",
      localAgenda.id
    );
    window.addEventListener("agendaVoteUpdated", handleVoteUpdate);
    return () => {
      console.log(
        "[AgendaDetail] Removing agendaVoteUpdated event listener for agenda ID:",
        localAgenda.id
      );
      window.removeEventListener("agendaVoteUpdated", handleVoteUpdate);
    };
  }, [localAgenda.id, getAgenda, refetch]);


  // 🔬 TEST: isVoter 중복 정의 에러로 인한 임시 주석처리
  const isVoter = useMemo(() => {
    return address && (
      localAgenda.voters?.includes(address) ||
      isCommitteeMember(address as string)
    )
  }, [address, localAgenda.voters, isCommitteeMember])

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
    if (!writeContract || !candidateContractAddress) {
      alert("Contract not available. Please try again.")
      return
    }

    // 투표 모달 닫고 트랜잭션 모달 열기
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
      address: candidateContractAddress as `0x${string}`,
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
    const updatedAgenda = await refreshAgendaWithoutCache(localAgenda.id);
    if (updatedAgenda) {
      setLocalAgenda(updatedAgenda)
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
        <DropdownMenuItem onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderActionButton = () => {
    switch (currentStatus) {
      case AgendaStatus.VOTING:
        return (
          <div className="flex items-center gap-2">
            <button
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                isVoter && !hasVoted
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!isVoter || isVoting || hasVoted}
              onClick={() => setShowVoteModal(true)}
            >
              <Vote className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isVoting ? "Voting..." : hasVoted ? "Already Voted" : "Vote"}
              </span>
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
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleExecute}
              >
                <PlayCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Execute</span>
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
        <Link
          href="/agenda"
          className="px-3 py-1.5 bg-white border border-gray-300 text-blue-600 text-xs rounded-md hover:bg-gray-50 transition-colors"
        >
          ← BACK TO ALL AGENDAS
        </Link>

        <div className="flex gap-3">
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-500 text-xs rounded-md hover:bg-gray-50 transition-colors">
            ← PREVIOUS AGENDA
          </button>
          <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-500 text-xs rounded-md hover:bg-gray-50 transition-colors">
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
                <span className="text-sm font-medium">
                {!localAgenda.voters || localAgenda.voters.length === 0
                  ? "Voting not started"
                  : currentStatus === AgendaStatus.WAITING_EXEC &&
                    Number(localAgenda.countingYes) <=
                      Number(localAgenda.countingNo)
                  ? "Proposal not approved"
                  : currentStatus === AgendaStatus.ENDED &&
                    Number(localAgenda.countingYes) <=
                      Number(localAgenda.countingNo)
                  ? "Proposal not approved"
                  : statusMessage}
                </span>
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
            <textarea
              className="w-full p-2 border rounded-md mb-4"
              placeholder="Add a comment (optional)"
              value={voteComment}
              onChange={(e) => setVoteComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-4">
              <button
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                onClick={() => handleVote(1)}
                disabled={isVoting}
              >
                For
              </button>
              <button
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                onClick={() => handleVote(2)}
                disabled={isVoting}
              >
                Against
              </button>
              <button
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                onClick={() => handleVote(0)}
                disabled={isVoting}
              >
                Abstain
              </button>
            </div>
            <button
              className="mt-4 w-full text-gray-600 hover:text-gray-800"
              onClick={() => setShowVoteModal(false)}
              disabled={isVoting}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        {/* 에러 상태 */}
            {isWriteError && writeError ? (
              <>
                <h3 className="text-lg font-medium mb-4 text-red-600">
                  Transaction Failed
                </h3>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-2xl">✕</span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-gray-800 font-medium">
                      {writeError?.message?.includes("User rejected") ||
                       writeError?.message?.includes("denied") ||
                       writeError?.message?.includes("rejected") ||
                       writeError?.message?.includes("cancelled")
                        ? "Transaction was cancelled by user"
                        : "Transaction failed"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {writeError?.message?.includes("User rejected") ||
                       writeError?.message?.includes("denied") ||
                       writeError?.message?.includes("rejected") ||
                       writeError?.message?.includes("cancelled")
                        ? "You cancelled the transaction in your wallet."
                        : writeError?.message || "An unknown error occurred"}
                    </p>
                  </div>
                  <button
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    onClick={() => setShowTransactionModal(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : isSuccess && (voteData || executeData) ? (
              /* 성공 상태 */
              <>
                <h3 className="text-lg font-medium mb-4 text-green-600">
                  Transaction Successful
                </h3>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-2xl">✓</span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-gray-800 font-medium">
                      {voteData ? "Vote cast successfully!" : "Agenda executed successfully!"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Your transaction has been confirmed on the blockchain.
                    </p>
                  </div>

                  {(voteData || executeData) && (
                    <div className="w-full space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Transaction Hash
                        </p>
                        <div className="flex items-center justify-between bg-white rounded-md p-2 border">
                          <code className="text-sm text-gray-600 break-all">
                            {voteData || executeData}
                          </code>
                          <button
                            className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                            onClick={() => {
                              navigator.clipboard.writeText((voteData || executeData) || "")
                              alert("Transaction hash copied to clipboard!")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <a
                        href={getEtherscanUrl((voteData || executeData) || "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          View on Etherscan
                        </span>
                      </a>
                    </div>
                  )}

                  <button
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    onClick={() => setShowTransactionModal(false)}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              /* 로딩 상태 */
              <>
                <h3 className="text-lg font-medium mb-4">
                  Transaction in Progress
                </h3>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-600 text-center">
                    Your vote is being processed on the blockchain...
                  </p>
                  {voteData && (
                    <div className="w-full space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Transaction Hash
                        </p>
                        <div className="flex items-center justify-between bg-white rounded-md p-2 border">
                          <code className="text-sm text-gray-600 break-all">
                            {voteData}
                          </code>
                          <button
                            className="ml-2 text-gray-400 hover:text-gray-600 p-1"
                            onClick={() => {
                              navigator.clipboard.writeText(voteData || "")
                              alert("Transaction hash copied to clipboard!")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <a
                        href={getEtherscanUrl(voteData || "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          View on Etherscan
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}