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
  JsonRpcProvider,
  isAddress,
  parseUnits,
  AbiCoder,
  BrowserProvider,
  getAddress,
} from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { TON_ABI } from "@/lib/contracts/abis/TON";
import { IDAOAgendaManager } from "@/lib/contracts/interfaces/IDAOAgendaManager";
import { useRouter } from "next/navigation";
import { useAgenda } from "@/contexts/AgendaContext";
import { chain } from "@/config/chain";

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

interface ProposalPreviewProps {
  title: string;
  description: string;
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

export function ProposalPreview({
  title,
  description,
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
      const provider = new BrowserProvider(window.ethereum);
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
          // Get agenda number immediately
          const ethersProvider = new BrowserProvider(window.ethereum);

          // const daoAgendaManager = new ethers.Contract(
          //   DAO_AGENDA_MANAGER_ADDRESS,
          //   ["function numAgendas() view returns (uint256)"],
          //   ethersProvider
          // );
          // const numAgendas = await daoAgendaManager.numAgendas();
          // setAgendaNumber(numAgendas.toString());
          // setIsTransactionPending(false);

          // Wait for transaction confirmation in the background
          const receipt = await ethersProvider.waitForTransaction(
            txHashValue,
            1
          );
          if (receipt) {
            setTxStatus("confirmed");
            setTxState("success");
            // get agenda
          }
        } catch (err) {
          console.error("Error processing transaction:", err);
          setTxState("idle");
          setShowSuccessModal(false);
          setIsTransactionPending(false);
        }
      }
    };
    processTx();
  }, [publishData]);

  const getAgendaData = () => {
    const agendaData = {
      id: agendaNumber ? parseInt(agendaNumber) : "",
      network: chain.network?.toLowerCase(),
      transaction: txHash,
      creator: {
        address: address,
        signature: "",
      },
      title,
      description,
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

  const signMessage = async (message: string, account: string) => {
    try {
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, account],
      });
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      alert("Failed to sign message. Please try again.");
    }
  };

  const handleSaveAgendaWithSignature = async () => {
    // console.log("handleSaveAgendaWithSignature");
    if (!address) {
      alert("Wallet not connected. Please connect your wallet first.");
      return;
    }
    if (!isAddress(address)) {
      alert("Invalid wallet address. Please reconnect your wallet.");
      return;
    }
    const agendaData = getAgendaData();
    const message = `I am the one who submitted agenda #${agendaData.id} via transaction ${agendaData.transaction}. This signature proves that I am the one who submitted this agenda.`;
    const signature = await signMessage(message, address);
    agendaData.creator.signature = signature;
    saveAgendaData(agendaData);
  };

  const handleSaveAgenda = () => {
    saveAgendaData(getAgendaData());
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
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {txStatus === "confirmed"
                    ? "Transaction Confirmed"
                    : "Transaction in Progress"}
                </h3>
                {txStatus !== "confirmed" && (
                  <div className="flex space-x-1">
                    <div
                      className="animate-bounce w-2 h-2 rounded-full bg-blue-500"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="animate-bounce w-2 h-2 rounded-full bg-blue-500"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="animate-bounce w-2 h-2 rounded-full bg-blue-500"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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

              <div className="flex justify-end space-x-3 pt-4">
                {txStatus === "confirmed" && (
                    <Button
                      onClick={handleSaveAgenda}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Agenda Locally
                    </Button>
                  ) && (
                    <Button
                      onClick={handleSaveAgendaWithSignature}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Agenda Locally With Signature
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
