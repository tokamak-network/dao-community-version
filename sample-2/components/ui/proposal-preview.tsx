import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AgendaWithMetadata } from "@/types/agenda";
import { Components } from "react-markdown";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  BarChart2,
  Code,
  Send,
  X,
  Save,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  ethers,
  Interface,
  isAddress,
  AbiCoder,
  BrowserProvider,
} from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { TON_ABI } from "@/lib/contracts/abis/TON";
import { useRouter } from "next/navigation";
import { useAgenda } from "@/contexts/AgendaContext";
import { chain } from "@/config/chain";
import { createAgendaSignatureMessage, signMessage } from "@/lib/signature";

// // Add type declaration for window.ethereum
// declare global {
//   interface Window {
//     ethereum: any;
//   }
// }

// PR 제출 상태를 나타내는 enum 추가
enum PrSubmissionStatus {
  IDLE = "idle",
  SUBMITTING = "submitting",
  SUCCESS = "success",
  ERROR = "error",
}

interface ProposalPreviewProps {
  title: string;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  actions: Array<{
    id: string;
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi?: any[];
  }>;
  onModeChange?: (mode: "preview" | "edit", section?: string) => void;
  onActionSelect?: (actionId: string | null) => void;
  selectedActionId?: string | null;
  onEditButtonActivate?: (section: string) => void;
  isEditMode?: boolean;
  onImpactOverviewClick?: () => void;
  showSimulation?: boolean;
}

interface DecodedParam {
  name: string;
  type: string;
  value: any;
}

// Update contract addresses to use environment variables
const TON_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TON_CONTRACT_ADDRESS ||
  "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5";
const DAO_COMMITTEE_PROXY_ADDRESS =
  process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS ||
  "0x0dE5B7Bf5bB867ce98B9C9dA0D2B3C1F6C6d1d8";
const DAO_AGENDA_MANAGER_ADDRESS =
  process.env.NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS ||
  "0xcD4421d082752f363E1687544a09d5112cD4f484";

interface AgendaData {
  id: number;
  network: string;
  title: string;
  description: string;
  transaction: string | null;
  creator: {
    address: `0x${string}` | undefined;
    signature: string;
  };
  actions: Array<{
    id: string;
    title: string;
    contractAddress: string;
    method: string;
    calldata: string;
    abi?: any[];
  }>;
  timestamp: string;
}

interface AgendaMetadata {
  id: number;
  network: string;
  title: string;
  transaction: string;
  creator: {
    address: string;
    signature: string;
  };
}

export function ProposalPreview({
  title,
  description,
  snapshotUrl,
  discourseUrl,
  actions,
  onModeChange,
  onActionSelect,
  selectedActionId,
  onEditButtonActivate,
  isEditMode = false,
  onImpactOverviewClick,
  showSimulation = false,
}: ProposalPreviewProps) {
  const [expandedParams, setExpandedParams] = useState<{
    [key: string]: boolean;
  }>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [encodedData, setEncodedData] = useState<string>("");
  const [submittingDots, setSubmittingDots] = useState<string>("...");
  const [txState, setTxState] = useState<
    "idle" | "submitting" | "pending" | "success"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showTxAlert, setShowTxAlert] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [agendaNumber, setAgendaNumber] = useState<string | null>(null);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [txStatus, setTxStatus] = useState<"pending" | "confirmed">("pending");
  const [shouldSubmitPR, setShouldSubmitPR] = useState(false);
  const [shouldSaveLocally, setShouldSaveLocally] = useState(false);
  const [prStatus, setPrStatus] = useState<PrSubmissionStatus>(
    PrSubmissionStatus.IDLE
  );
  const [prError, setPrError] = useState<string | null>(null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [isPrSubmitted, setIsPrSubmitted] = useState(false);
  const { address } = useAccount();
  const router = useRouter();

  const {
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
  } = useAgenda();

  const components: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || "");
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  // Encode parameters when component mounts or actions change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch periods
        if (
          !createAgendaFees ||
          !minimumNoticePeriodSeconds ||
          !minimumVotingPeriodSeconds
        ) {
          console.log(
            "\n=== createAgendaFees ||  minimumNoticePeriodSeconds || minimumVotingPeriodSeconds are null"
          );
          return;
        }
        // Prepare parameters for encoding
        const targetAddresses = actions.map((a) => a.contractAddress);
        const calldataArray = actions.map((a) => a.calldata || "0x");

        console.log("\n=== Parameters for Encoding ===");
        console.log("Target Addresses:", targetAddresses);
        console.log("Notice Period:", minimumNoticePeriodSeconds.toString());
        console.log("Voting Period:", minimumVotingPeriodSeconds.toString());
        console.log("Is Emergency:", true);
        console.log("Calldata Array:", calldataArray);

        // Encode parameters
        const abiCoder = AbiCoder.defaultAbiCoder();
        const types = ["address[]", "uint128", "uint128", "bool", "bytes[]"];
        const values = [
          targetAddresses,
          minimumNoticePeriodSeconds,
          minimumVotingPeriodSeconds,
          true,
          calldataArray,
        ];

        console.log("\n=== Encoding Details ===");
        console.log("Types:", types);
        console.log("Values:", values);

        const encoded = abiCoder.encode(types, values);
        console.log("\n=== Encoded Result ===");
        console.log(encoded);

        setEncodedData(encoded);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.code) console.error("Error code:", error.code);
        if (error.message) console.error("Error message:", error.message);
        if (error.data) console.error("Error data:", error.data);
      }
    };

    fetchData();
  }, [actions]);

  const {
    writeContract,
    data: publishData,
    error: wagmiError,
  } = useWriteContract();

  // Remove the destructured isLoading since we're using our own state
  const {} = useWaitForTransactionReceipt({
    hash: publishData as `0x${string}`,
  });

  // Animate submitting dots
  useEffect(() => {
    if (txState === "submitting") {
      let count = 0;
      const interval = setInterval(() => {
        count = (count + 1) % 4;
        setSubmittingDots(".".repeat(count === 0 ? 1 : count));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setSubmittingDots("...");
    }
  }, [txState]);

  // Handle wagmi error (MetaMask rejection, contract error, etc)
  useEffect(() => {
    if (wagmiError) {
      console.error("Wagmi error (MetaMask or contract):", wagmiError);
      if (wagmiError && typeof wagmiError === "object") {
        if ((wagmiError as any).code)
          console.error("Error code:", (wagmiError as any).code);
        if ((wagmiError as any).message)
          console.error("Error message:", (wagmiError as any).message);
        if ((wagmiError as any).data)
          console.error("Error data:", (wagmiError as any).data);
      }
      setTxState("idle");
    }
  }, [wagmiError]);

  const toggleParams = (actionId: string) => {
    setExpandedParams((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const openEtherscan = (userAddress: string) => {
    const explorerUrl =
      process.env.NEXT_PUBLIC_EXPLORER_URL || "https://etherscan.io";
    window.open(`${explorerUrl}/address/${userAddress}`, "_blank");
  };

  const decodeCalldata = (action: any) => {
    if (!action.abi || !action.calldata) return null;

    try {
      const func = action.abi.find((item: any) => {
        if (!item || !item.inputs) return false;
        const paramTypes = item.inputs
          .map((input: any) => input.type)
          .join(",");
        return `${item.name}(${paramTypes})` === action.method;
      });

      if (func) {
        const iface = new Interface([func]);
        const decodedParams = iface.decodeFunctionData(
          func.name,
          action.calldata
        );

        return func.inputs.map(
          (input: any, index: number): DecodedParam => ({
            name: input.name,
            type: input.type,
            value: decodedParams[index],
          })
        );
      }
    } catch (error) {
      console.error("Error decoding calldata:", error);
    }
    return null;
  };

  const prepareAgenda = async () => {
    console.log("prepareAgenda", actions);
    const targets = actions.map((action) => action.contractAddress);
    const params = actions.map((action) => action.calldata);
    console.log("targets", targets);
    console.log("params", params);

    // Validate all contract addresses
    for (const addr of targets) {
      if (!isAddress(addr)) {
        alert(`Invalid contract address detected: ${addr}`);
        throw new Error(`Invalid contract address: ${addr}`);
      }
    }

    // Encode parameters
    const param = AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint128", "uint128", "bool", "bytes[]"],
      [
        targets,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
        true,
        params,
      ]
    ) as `0x${string}`;

    return {
      param,
    };
  };

  const handlePublish = async () => {
    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.");
      return;
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.");
      return;
    }

    if (!createAgendaFees) {
      alert("Invalid createAgendaFees. Please reconnect your wallet.");
      return;
    }

    try {
      setTxState("submitting");
      const { param } = await prepareAgenda();

      // Check TON balance
      const provider = new BrowserProvider(window.ethereum as any);
      const tonContract = new ethers.Contract(
        TON_CONTRACT_ADDRESS,
        TON_ABI,
        provider
      );
      const tonBalanceRaw = await tonContract.balanceOf(address);
      const balanceInTon = Number(ethers.formatUnits(tonBalanceRaw, 18));
      const feeInTon = Number(ethers.formatUnits(createAgendaFees, 18));
      if (balanceInTon < feeInTon) {
        alert(
          `The agenda fee is ${feeInTon} TON, but your wallet TON balance is insufficient. Current TON balance: ${balanceInTon} TON`
        );
        setTxState("idle");
        return;
      }

      // Get agenda number before transaction
      console.log("Getting agenda number before transaction...");
      const daoAgendaManager = new ethers.Contract(
        DAO_AGENDA_MANAGER_ADDRESS,
        ["function numAgendas() view returns (uint256)"],
        provider
      );
      const numAgendas = await daoAgendaManager.numAgendas();
      const agendaNumber = numAgendas.toString();
      console.log("Current agenda number:", agendaNumber);
      setAgendaNumber(agendaNumber);

      if (!writeContract) {
        throw new Error("Contract write not ready");
      }

      await writeContract({
        address: TON_CONTRACT_ADDRESS as `0x${string}`,
        abi: TON_ABI,
        functionName: "approveAndCall",
        args: [
          DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`,
          createAgendaFees,
          param,
        ],
      });
    } catch (error) {
      console.error("Error publishing proposal:", error);
      if (error && typeof error === "object") {
        if ((error as any).code)
          console.error("Error code:", (error as any).code);
        if ((error as any).message)
          console.error("Error message:", (error as any).message);
        if ((error as any).data)
          console.error("Error data:", (error as any).data);
        if (
          (error as any).message &&
          (error as any).message.includes("User denied transaction signature")
        ) {
          setTxState("idle");
          setShowSuccessModal(false);
          setIsTransactionPending(false);
          return;
        }
      }
      setTxState("idle");
      setShowSuccessModal(false);
      setIsTransactionPending(false);
    }
  };

  const [submittedAgendaData, setSubmittedAgendaData] = useState<any>(null);

  // Handle txHash and confirmations when publishData changes
  useEffect(() => {
    const processTx = async () => {
      if (txState === "submitting" && publishData) {
        const txHashValue = publishData as string;
        if (!txHashValue) {
          setTxState("idle");
          return;
        }

        // Immediately show modal with transaction hash
        setTxHash(txHashValue);
        setTxState("pending");
        setShowSuccessModal(true);
        setIsTransactionPending(true);
        setTxStatus("pending");

        try {
          // Wait for transaction confirmation
          const ethersProvider = new BrowserProvider(window.ethereum as any);
          const receipt = await ethersProvider.waitForTransaction(
            txHashValue,
            1
          );

          if (receipt) {
            setTxStatus("confirmed");
            setTxState("success");

            // 아젠다 제목 길이 제한 (100자)
            const MAX_TITLE_LENGTH = 100;
            const truncatedTitle =
              title && title.length > MAX_TITLE_LENGTH
                ? title.substring(0, MAX_TITLE_LENGTH)
                : title;

            // Save the original agenda data with all fields
            const originalAgendaData = {
              id: parseInt(agendaNumber || "0"),
              network: chain.network?.toLowerCase(),
              transaction: txHashValue,
              creator: {
                address: address,
                signature: "",
              },
              title: truncatedTitle?.trim(),
              description: description?.trim(),
              snapshotUrl: snapshotUrl?.trim(),
              discourseUrl: discourseUrl?.trim(),
              actions: actions.map((action) => ({
                id: action.id,
                title: action.title,
                contractAddress: action.contractAddress,
                method: action.method,
                calldata: action.calldata,
                abi: action.abi,
                sendEth: false,
                type: "contract",
              })),
              timestamp: new Date().toISOString(),
            };
            setSubmittedAgendaData(originalAgendaData);
            setIsTransactionPending(false);
          }
        } catch (err) {
          console.error("Error processing transaction:", err);
          setTxState("idle");
          setShowSuccessModal(false);
          setIsTransactionPending(false);
          alert("Failed to process transaction. Please try again.");
        }
      }
    };
    processTx();
  }, [publishData]);

  // Add effect to track agendaNumber changes
  useEffect(() => {
    console.log("agendaNumber changed:", agendaNumber);
  }, [agendaNumber]);

  const getAgendaData = () => {
    console.log("getAgendaData agendaNumber", agendaNumber);
    if (!agendaNumber) {
      throw new Error("Agenda number is not available. Please try again.");
    }
    const agendaData = {
      id: parseInt(agendaNumber),
      network: chain.network?.toLowerCase(),
      transaction: txHash,
      creator: {
        address: address,
        signature: "",
      },
      title: title?.trim(),
      description: description?.trim(),
      actions,
      timestamp: new Date().toISOString(),
    };
    return agendaData;
  };

  const saveAgendaData = (agendaData: any) => {
    const blob = new Blob([JSON.stringify(agendaData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenda-${agendaData.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveAgendaWithSignature = async () => {
    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.");
      return;
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.");
      return;
    }
    if (!submittedAgendaData) {
      alert("No agenda data available. Please submit the agenda first.");
      return;
    }
    const message = createAgendaSignatureMessage(
      submittedAgendaData.id,
      submittedAgendaData.transaction
    );
    const signature = await signMessage(message, address);
    const signedAgendaData = {
      ...submittedAgendaData,
      creator: {
        ...submittedAgendaData.creator,
        signature,
      },
    };
    saveAgendaData(signedAgendaData);
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    setTxState("idle");
    setTxHash(null);
    setShowTxAlert(false);
  };

  const handleEditAction = (actionId: string) => {
    onModeChange?.("edit", "actions");
    onActionSelect?.(actionId);
    onEditButtonActivate?.("actions");
    router.push(`/proposals/edit?actionId=${actionId}&mode=edit`);
  };

  const handleNavigation = (section: string) => {
    onModeChange?.("edit", section);
    onActionSelect?.(null);
    onEditButtonActivate?.(section);
    router.push(`/proposals/edit?section=${section}&mode=edit`);
  };

  const handleImpactOverview = () => {
    onModeChange?.("edit", "impact");
    onActionSelect?.(null);
    onEditButtonActivate?.("impact");
    onImpactOverviewClick?.();
    router.push("/proposals/edit?section=impact&mode=edit&view=simulation");
  };

  // Clear selected action when component mounts (preview mode)
  useEffect(() => {
    if (!isEditMode) {
      onModeChange?.("preview");
      onActionSelect?.(null);
    }
  }, [isEditMode]);

  // Handle preview tab click
  const handlePreviewClick = () => {
    onModeChange?.("preview");
    onActionSelect?.(null); // Clear selected action when switching to preview mode
    router.push("/proposals/preview");
  };

  const handleActionClick = (action: any) => {
    if (isEditMode) {
      onModeChange?.("edit");
      onActionSelect?.(action.id);
      onEditButtonActivate?.("actions");
      router.push(`/proposals/edit?actionId=${action.id}&mode=edit`);
    }
  };

  const handleAddAction = () => {
    onModeChange?.("edit", "actions");
    onActionSelect?.(null);
    onEditButtonActivate?.("actions");
    router.push("/proposals/edit?section=actions&mode=edit");
  };

  // Check if all required proposal information exists
  const hasRequiredProposalInfo =
    title && description && title.trim() !== "" && description.trim() !== "";

  // Check if there is at least one action
  const hasActions = actions && actions.length > 0;

  // Check if all DAO Agenda parameters are valid
  const hasValidAgendaParams =
    createAgendaFees && encodedData && encodedData !== "Encoding parameters...";

  const handleSubmitPR = async (signedAgendaData: any) => {
    try {
      setTxStatus("pending");
      setPrStatus(PrSubmissionStatus.SUBMITTING);

      // 데이터 검증
      if (!signedAgendaData.id) {
        throw new Error("Agenda ID is missing");
      }
      if (!signedAgendaData.network) {
        throw new Error("Network is missing");
      }
      if (!signedAgendaData.title) {
        throw new Error("Title is missing");
      }
      if (!signedAgendaData.transaction) {
        throw new Error("Transaction hash is missing");
      }
      if (!signedAgendaData.creator?.address) {
        throw new Error("Creator address is missing");
      }
      if (!signedAgendaData.creator?.signature) {
        throw new Error("Creator signature is missing");
      }

      const response = await fetch("/api/submit-pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agendaData: signedAgendaData,
          message: "Agenda metadata submission",
        }),
      });

      if (!response.ok) {
        throw new Error("PR submission failed");
      }

      const responseData = await response.json();

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      // PR 제출 성공 시 상태 업데이트 및 PR URL 열기
      setTxStatus("confirmed");
      setPrStatus(PrSubmissionStatus.SUCCESS);
      if (responseData.prUrl) {
        console.log("PR URL received:", responseData.prUrl);
        setPrUrl(responseData.prUrl);
        window.open(responseData.prUrl, "_blank");
      } else {
        console.warn("No PR URL in response:", responseData);
      }

      return responseData;
    } catch (error) {
      console.error("Error submitting PR:", error);
      setPrStatus(PrSubmissionStatus.ERROR);
      throw error;
    }
  };

  // PR 제출 부분 수정
  const handleSaveAndSubmit = async () => {
    if (!submittedAgendaData) {
      alert("No agenda data available. Please submit the agenda first.");
      return;
    }

    if (shouldSubmitPR) {
      setPrStatus(PrSubmissionStatus.SUBMITTING);
      setPrError(null);
      try {
        if (!address) {
          throw new Error("No wallet address found");
        }

        const message = createAgendaSignatureMessage(
          submittedAgendaData.id,
          submittedAgendaData.transaction
        );
        const signature = await signMessage(message, address);
        const signedAgendaData = {
          ...submittedAgendaData,
          creator: {
            ...submittedAgendaData.creator,
            signature,
          },
        };

        // Save agenda data locally first if selected
        if (shouldSaveLocally) {
          saveAgendaData(signedAgendaData);
        }

        // Then submit PR with metadata
        const responseData = await handleSubmitPR(signedAgendaData);
      } catch (error) {
        console.error("Error submitting PR:", error);
        setPrError(
          error instanceof Error ? error.message : "Failed to submit PR"
        );
      }
    } else if (shouldSaveLocally) {
      handleSaveAgendaWithSignature();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        {showTxAlert && txState === "success" && txHash && (
          <div className="w-full mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-800 flex items-center justify-between">
            <span>
              Transaction completed!{" "}
              <a
                href={`${
                  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://etherscan.io"
                }/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-green-900"
              >
                View on Etherscan
              </a>
            </span>
          </div>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
          <div className="flex gap-3 mt-2">
            {snapshotUrl && (
              <a
                href={snapshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 transition"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Snapshot
              </a>
            )}
            {discourseUrl && (
              <a
                href={discourseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Discourse
              </a>
            )}
          </div>
        </div>
        <div>
          <Button
            onClick={handlePublish}
            disabled={
              !hasRequiredProposalInfo ||
              !hasActions ||
              !hasValidAgendaParams ||
              txState === "submitting" ||
              txState === "pending"
            }
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {txState === "submitting" && !showSuccessModal ? (
              <>Transaction request {submittingDots}</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit DAO Agenda
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
        <div className="border rounded-lg divide-y overflow-hidden">
          <div className="grid grid-cols-[200px_300px_120px_1fr] gap-4 p-3 text-sm font-medium text-gray-500 bg-gray-50">
            <div>Contract</div>
            <div>Method</div>
            <div className="text-right">Parameters</div>
            <div>Calldata</div>
          </div>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="border-b cursor-pointer hover:bg-gray-50"
              onClick={() => handleActionClick(action)}
            >
              <div className="grid grid-cols-[200px_300px_120px_1fr] gap-4 p-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 mr-2">#{index + 1}</span>
                  <div
                    className="flex items-center text-blue-600 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEtherscan(action.contractAddress);
                    }}
                  >
                    {action.contractAddress.slice(0, 6)}...
                    {action.contractAddress.slice(-4)}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
                <div className="flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="truncate" title={action.method}>
                    {action.method}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <div
                    className="flex items-center text-gray-500 cursor-pointer hover:text-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleParams(action.id);
                    }}
                  >
                    <span>{decodeCalldata(action)?.length || 0} params</span>
                    <ChevronDown
                      className={`h-4 w-4 ml-1 transition-transform ${
                        expandedParams[action.id] ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
                <div className="relative group w-full overflow-hidden">
                  <div
                    className="font-mono text-xs text-gray-600 w-full max-w-[300px] overflow-hidden"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      wordBreak: "break-all",
                    }}
                    title={action.calldata}
                  >
                    {action.calldata || "-"}
                  </div>
                </div>
              </div>
              {expandedParams[action.id] && decodeCalldata(action) && (
                <div
                  className="bg-gray-50 p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">
                        Parameters
                      </h4>
                      <div className="mt-3 space-y-3">
                        {decodeCalldata(action)?.map(
                          (param: DecodedParam, index: number) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3"
                            >
                              <div className="w-32 flex-shrink-0">
                                <span className="text-sm text-gray-500">
                                  {param.name}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                  {param.value.toString()}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-4 w-4 text-gray-500"
                        >
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">
                          Generated Calldata
                        </span>
                      </div>
                      <div className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all whitespace-pre-wrap">
                        {action.calldata || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* DAO Agenda Submission Parameters */}
        {hasRequiredProposalInfo && hasActions && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              DAO Agenda Submission Parameters
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 space-y-4">
                {/* TON Contract */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    TON Contract
                  </h4>
                  <div
                    className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
                    onClick={() => openEtherscan(TON_CONTRACT_ADDRESS)}
                  >
                    {TON_CONTRACT_ADDRESS}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>

                {/* approveAndCall Function */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Function
                  </h4>
                  <div
                    className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      openEtherscan(`${TON_CONTRACT_ADDRESS}#writeContract#F3`)
                    }
                  >
                    approveAndCall(address spender, uint256 amount, bytes data)
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>

                {/* Function Parameters */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Function Parameters
                  </h4>
                  <div className="space-y-2">
                    {/* spender */}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">spender</div>
                      <div
                        className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100"
                        onClick={() =>
                          openEtherscan(DAO_COMMITTEE_PROXY_ADDRESS)
                        }
                      >
                        {DAO_COMMITTEE_PROXY_ADDRESS}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </div>

                    {/* amount */}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">amount</div>
                      <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                        {createAgendaFees
                          ? `${ethers.formatUnits(createAgendaFees, 18)} TON`
                          : "Loading..."}
                      </div>
                    </div>

                    {/* data */}
                    <div>
                      <div className="text-sm text-gray-500 mb-1">data</div>
                      <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                        <div className="break-all">
                          {encodedData || "Encoding parameters..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <p></p>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Description
        </h2>

        <div className="bg-gray-50 rounded-lg shadow-xl border border-gray-200 relative mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200 transform rotate-45 translate-x-16 -translate-y-16 shadow-lg border-b-2 border-r-2 border-gray-300"></div>
          </div>

          <div className="p-6">
            <div className="prose max-w-none overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {description || "No description available"}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {txStatus === "confirmed"
                ? "Transaction Confirmed"
                : "Transaction in Progress"}
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Transaction Hash
                </h4>
                <div className="flex items-center space-x-2">
                  <a
                    href={`${
                      process.env.NEXT_PUBLIC_EXPLORER_URL ||
                      "https://etherscan.io"
                    }/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex-1 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                  >
                    <code className="text-blue-600 break-all">{txHash}</code>
                    <ExternalLink className="h-4 w-4 text-gray-500 ml-2 flex-shrink-0" />
                  </a>
                </div>
              </div>

              {txStatus === "pending" && (
                <div className="flex items-center justify-center space-x-2 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="text-sm text-gray-600">
                    Waiting for confirmation...
                  </span>
                </div>
              )}

              {txStatus === "confirmed" && !agendaNumber && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-gray-600">
                      Retrieving agenda number...
                    </span>
                  </div>
                </div>
              )}

              {agendaNumber && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    Agenda Number
                  </h4>
                  <div className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    #{agendaNumber}
                  </div>
                </div>
              )}

              {txStatus === "confirmed" && agendaNumber && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="save-locally"
                        checked={shouldSaveLocally}
                        onChange={(e) => setShouldSaveLocally(e.target.checked)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="save-locally"
                        className="text-sm text-gray-700"
                      >
                        Save Agenda Locally
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="submit-pr"
                        checked={shouldSubmitPR}
                        onChange={(e) => {
                          setShouldSubmitPR(e.target.checked);
                          setPrError(null);
                          setPrStatus(PrSubmissionStatus.IDLE);
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="submit-pr"
                        className="text-sm text-gray-700"
                      >
                        Submit PR to Repository
                      </label>
                    </div>
                  </div>

                  {prStatus === PrSubmissionStatus.SUBMITTING && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                      <span>Submitting PR to repository...</span>
                    </div>
                  )}

                  {prStatus === PrSubmissionStatus.ERROR && shouldSubmitPR && (
                    <div className="text-sm text-red-600">
                      Error submitting PR: {prError}
                    </div>
                  )}

                  {prStatus === PrSubmissionStatus.SUCCESS && (
                    <div className="space-y-2">
                      <div className="text-sm text-green-600">
                        PR submitted successfully! You can now save the agenda
                        locally if needed.
                      </div>
                      {prUrl && (
                        <div className="text-sm">
                          <a
                            href={prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 flex items-center"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Pull Request
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                {txStatus === "confirmed" && agendaNumber && (
                  <Button
                    onClick={handleSaveAndSubmit}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={
                      prStatus === PrSubmissionStatus.SUBMITTING ||
                      (!shouldSubmitPR && !shouldSaveLocally)
                    }
                  >
                    <Save className="w-4 h-7 mr-2" />
                    {shouldSubmitPR && shouldSaveLocally
                      ? "Save Locally & Submit PR"
                      : shouldSubmitPR
                      ? "Submit PR"
                      : "Save Locally"}
                  </Button>
                )}

                <Button onClick={handleCloseModal} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
