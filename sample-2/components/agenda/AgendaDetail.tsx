import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { AgendaWithMetadata } from "@/types/agenda";
import {
  getStatusClass,
  getStatusText,
  formatDate,
  formatAddress,
  calculateAgendaStatus,
  getAgendaTimeInfo,
  getStatusMessage,
  AgendaStatus,
} from "@/lib/utils";
import {
  Zap,
  MoreVertical,
  Copy,
  CheckCircle2,
  Square,
  Hourglass,
  Bolt,
  PlusCircle,
  ChevronRight,
  Circle,
  Timer,
  Vote,
  PlayCircle,
  ExternalLink,
  GitPullRequest,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  DAO_COMMITTEE_PROXY_ADDRESS,
  DAO_AGENDA_MANAGER_ADDRESS,
} from "@/config/contracts";
import { DAO_ABI } from "@/abis/dao";
import { chain } from "@/config/chain";
import AgendaDescription from "./AgendaDescription";
import AgendaActions from "./AgendaActions";
import AgendaStatusTimeline from "./AgendaStatusTimeline";
import AgendaVotes from "./AgendaVotes";
import AgendaCommunity from "./AgendaCommunity";
import { useAgenda } from "@/contexts/AgendaContext";
import { toast } from "sonner";
import { SubmitPRButton } from "@/components/ui/submit-pr-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface AgendaDetailProps {
  agenda: AgendaWithMetadata;
}

type TabType = "description" | "community" | "actions" | "votes";

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const [voteComment, setVoteComment] = useState("");
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const { quorum, refreshAgenda, refreshAgendaWithoutCache, getAgenda } =
    useAgenda();
  const [localAgenda, setLocalAgenda] = useState<AgendaWithMetadata>(agenda);
  const currentStatus = calculateAgendaStatus(localAgenda, quorum ?? BigInt(2));
  const timeInfo = getAgendaTimeInfo(localAgenda);
  const { address } = useAccount();
  const { isCommitteeMember } = useAgenda();
  const [showPRModal, setShowPRModal] = useState(false);
  const [uploadedMetadata, setUploadedMetadata] =
    useState<AgendaWithMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // agenda prop이 변경될 때 localAgenda 업데이트
  useEffect(() => {
    setLocalAgenda(agenda);
  }, [agenda]);

  // Get candidate contract address
  const { data: candidateContractAddress } = useContractRead({
    address: DAO_COMMITTEE_PROXY_ADDRESS,
    abi: DAO_ABI,
    functionName: "candidateContract",
    args: [address as `0x${string}`],
    chainId: chain.id,
  });

  // Check if user has already voted
  const { data: hasVotedData, refetch } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
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
  });

  // Memoize hasVoted value
  const hasVoted = useMemo(() => {
    return hasVotedData ?? false;
  }, [hasVotedData]);

  // Prepare vote transaction
  const { writeContract, data: voteData } = useContractWrite();

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
  });

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess) {
      if (voteData) {
        toast.success("Vote cast successfully!");
        setShowTransactionModal(false);
        setShowVoteModal(false);
        setVoteComment("");
      } else if (executeData) {
        toast.success("Agenda executed successfully!");
        setShowTransactionModal(false);
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
  }, [isSuccess, isError, isExecuteError, waitError, voteData, executeData]);

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

  // Check if the current address is a voter
  const isVoter = useMemo(
    () =>
      address &&
      // Check if address is in agenda voters list
      (localAgenda.voters?.includes(address) ||
        // If no voters list, check if address is a committee member
        isCommitteeMember(address as string)),
    [address, localAgenda.voters, isCommitteeMember]
  );

  const handleVote = (vote: number) => {
    if (!writeContract || !candidateContractAddress) return;

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
    });

    setShowVoteModal(false);
    setShowTransactionModal(true);
  };

  const handleExecute = async () => {
    try {
      setShowTransactionModal(true);
      await writeContract({
        address: DAO_COMMITTEE_PROXY_ADDRESS,
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

  // Add getEtherscanUrl function
  const getEtherscanUrl = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  const handleRefresh = async () => {
    const updatedAgenda = await refreshAgendaWithoutCache(localAgenda.id);
    if (updatedAgenda) {
      setLocalAgenda(updatedAgenda);
    }
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-md hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuItem
                        onClick={() => setShowPRModal(true)}
                        disabled={localAgenda.transaction !== undefined}
                        className={
                          localAgenda.transaction !== undefined
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                      >
                        <GitPullRequest className="h-4 w-4 mr-2" />
                        <span>PR to Repository</span>
                      </DropdownMenuItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {localAgenda.transaction
                          ? "This agenda has already been submitted to the repository."
                          : "Submit this agenda to the community repository. This will create a pull request with the agenda data."}
                        {!address && " Please connect your wallet to submit."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-md hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => setShowPRModal(true)}
                          disabled={localAgenda.transaction !== undefined}
                          className={
                            localAgenda.transaction !== undefined
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        >
                          <GitPullRequest className="h-4 w-4 mr-2" />
                          <span>PR to Repository</span>
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          {localAgenda.transaction
                            ? "This agenda has already been submitted to the repository."
                            : "Submit this agenda to the community repository. This will create a pull request with the agenda data."}
                          {!address && " Please connect your wallet to submit."}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DropdownMenuItem onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => setShowPRModal(true)}
                      disabled={localAgenda.transaction !== undefined}
                      className={
                        localAgenda.transaction !== undefined
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      <span>PR to Repository</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {localAgenda.transaction
                        ? "This agenda has already been submitted to the repository."
                        : "Submit this agenda to the community repository. This will create a pull request with the agenda data."}
                      {!address && " Please connect your wallet to submit."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );

      default:
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-md hover:bg-gray-100">
                <MoreVertical className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      onClick={() => setShowPRModal(true)}
                      disabled={localAgenda.transaction !== undefined}
                      className={
                        localAgenda.transaction !== undefined
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }
                    >
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      <span>PR to Repository</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      {localAgenda.transaction
                        ? "This agenda has already been submitted to the repository."
                        : "Submit this agenda to the community repository. This will create a pull request with the agenda data."}
                      {!address && " Please connect your wallet to submit."}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
    }
  };

  return (
    <div className="rounded-lg overflow-hidden">
      {/* Proposal Header */}
      <div className="p-6">
        <div
          className={`inline-block px-3 py-1 ${getStatusClass(
            currentStatus
          )} text-xs font-medium rounded-md mb-4`}
        >
          {currentStatus === AgendaStatus.WAITING_EXEC &&
          Number(agenda.countingYes) <= Number(agenda.countingNo)
            ? "NOT APPROVED"
            : getStatusText(currentStatus)}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              <span className="text-gray-500">Agenda #{localAgenda.id}</span>
              <span className="ml-2">{localAgenda.title}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md">
              <Zap className="h-4 w-4 mr-1.5" />
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
                  : getStatusMessage(localAgenda, currentStatus)}
              </span>
            </div>
            {renderActionButton()}
          </div>
        </div>

        {/* Proposal Meta */}
        <div className="flex items-center mt-4 text-sm">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 overflow-hidden"></div>
            <span className="text-gray-700">
              by{" "}
              {localAgenda.creator?.address
                ? formatAddress(localAgenda.creator.address)
                : "Unknown"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <span className="text-gray-500">ID {localAgenda.id}</span>
            <button className="ml-1 text-gray-400 hover:text-gray-600">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="ml-4 text-gray-500">
            • Proposed on: {formatDate(Number(localAgenda.createdTimestamp))}
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="border-t border-gray-200">
        <div className="flex">
          <div className="w-2/3 border-r border-gray-200">
            <div className="p-6">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "description"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("description")}
                  >
                    Description
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "community"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("community")}
                  >
                    Community
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "actions"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("actions")}
                  >
                    Actions
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "votes"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("votes")}
                  >
                    Votes
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === "description" ? (
                  <AgendaDescription agenda={localAgenda} />
                ) : activeTab === "community" ? (
                  <AgendaCommunity agenda={localAgenda} />
                ) : activeTab === "actions" ? (
                  <AgendaActions agenda={localAgenda} />
                ) : (
                  <AgendaVotes agenda={localAgenda} />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-1/3">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Final Votes
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-gray-700">Quorum</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(localAgenda.countingYes) +
                      Number(localAgenda.countingNo) +
                      Number(localAgenda.countingAbstain)}{" "}
                    votes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-gray-700">Majority support</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(localAgenda.countingYes) >
                    Number(localAgenda.countingNo)
                      ? "Yes"
                      : "No"}
                  </span>
                </div>
              </div>

              {/* Voting Progress Bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      (Number(localAgenda.countingYes) /
                        (Number(localAgenda.countingYes) +
                          Number(localAgenda.countingNo) +
                          Number(localAgenda.countingAbstain))) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-gray-700">For</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(localAgenda.countingYes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-gray-700">Against</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(localAgenda.countingNo)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-700">Abstain</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(localAgenda.countingAbstain)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="border-t border-gray-200 pt-6">
                <AgendaStatusTimeline agenda={localAgenda} />
              </div>
            </div>
          </div>
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
            <h3 className="text-lg font-medium mb-4">
              Transaction in Progress
            </h3>
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-gray-600 text-center">
                {voteData
                  ? "Your vote is being processed on the blockchain..."
                  : "Your agenda execution is being processed on the blockchain..."}
              </p>
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
                          navigator.clipboard.writeText(
                            voteData || executeData || ""
                          );
                          toast.success(
                            "Transaction hash copied to clipboard!"
                          );
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <a
                    href={getEtherscanUrl(voteData || executeData || "")}
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
          </div>
        </div>
      )}

      {/* PR Modal */}
      {showPRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">PR to Repository</h3>
            <p className="text-sm text-gray-600 mb-4">
              Submit this agenda to the community repository. This will create a
              pull request with the agenda data.
              {!address && " Please connect your wallet to submit."}
            </p>

            {/* File Selection Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Agenda Metadata File
                </label>
                <span className="text-xs text-red-500">Required</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  id="metadata-file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Handle file selection
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const metadata = JSON.parse(
                            event.target?.result as string
                          );
                          console.log(
                            "[AgendaDetail] Uploaded metadata:",
                            JSON.stringify(metadata, null, 2)
                          );

                          // ID 검증
                          console.log("[AgendaDetail] Checking metadata ID:", {
                            metadataId: metadata.id,
                            agendaId: localAgenda.id,
                            type: {
                              metadataId: typeof metadata.id,
                              agendaId: typeof localAgenda.id,
                            },
                          });

                          if (Number(metadata.id) !== Number(localAgenda.id)) {
                            console.error("[AgendaDetail] ID mismatch:", {
                              metadataId: metadata.id,
                              agendaId: localAgenda.id,
                            });
                            setError(
                              `Metadata ID (${metadata.id}) does not match current agenda ID (${localAgenda.id}). Please upload the correct metadata file.`
                            );
                            setUploadedMetadata(null);
                            // 파일 입력 초기화
                            const fileInput = document.getElementById(
                              "metadata-file"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                            return;
                          }

                          // 트랜잭션 정보 체크
                          if (!metadata.transaction) {
                            console.error(
                              "[AgendaDetail] Missing transaction info"
                            );
                            setError(
                              "Metadata file must include transaction information. Please upload a valid metadata file."
                            );
                            setUploadedMetadata(null);
                            // 파일 입력 초기화
                            const fileInput = document.getElementById(
                              "metadata-file"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                            return;
                          }

                          // Store uploaded metadata separately
                          setUploadedMetadata(metadata);
                          setError(null);
                          console.log(
                            "[AgendaDetail] Metadata set to state:",
                            JSON.stringify(metadata, null, 2)
                          );

                          // 서명값이 없을 때만 creator 주소 검증
                          if (
                            !metadata.creator?.signature &&
                            address &&
                            metadata.creator?.address?.toLowerCase() !==
                              address.toLowerCase()
                          ) {
                            setError(
                              "Only the creator can submit PR without signature. Please connect with the creator's wallet."
                            );
                            setUploadedMetadata(null);
                            const fileInput = document.getElementById(
                              "metadata-file"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                            return;
                          }
                        } catch (error) {
                          console.error(
                            "[AgendaDetail] Error parsing metadata file:",
                            error
                          );
                          setError(
                            "Invalid metadata file format. Please upload a valid JSON file."
                          );
                          setUploadedMetadata(null);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <label
                  htmlFor="metadata-file"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose File</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Upload the metadata file that was generated when the agenda was
                created
              </p>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {!uploadedMetadata ? (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white w-full opacity-50 cursor-not-allowed"
                disabled
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Submit PR
              </Button>
            ) : !address ? (
              <div className="text-sm text-gray-600 text-center py-4">
                Please connect your wallet to sign before submitting PR
              </div>
            ) : (
              <>
                <SubmitPRButton
                  agendaData={uploadedMetadata}
                  onSuccess={(prUrl) => {
                    toast.success("PR submitted successfully!");
                    setShowPRModal(false);
                  }}
                  onError={(error) => {
                    setError(error.message || "Failed to submit PR");
                  }}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600 text-center">
                    {error}
                  </p>
                )}
              </>
            )}
            <button
              className="mt-4 w-full text-gray-600 hover:text-gray-800"
              onClick={() => setShowPRModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
