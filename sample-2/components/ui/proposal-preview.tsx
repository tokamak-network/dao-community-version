import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, BarChart2, Code } from "lucide-react";
import { useState, useEffect } from "react";
import {
  ethers,
  Interface,
  JsonRpcProvider,
  isAddress,
  parseUnits,
  AbiCoder,
  BrowserProvider,
} from "ethers";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  DAOCommitteeProxy,
  DAOAgendaManagerProxy,
} from "@/lib/contracts/addresses";
import { TON_ABI } from "@/lib/contracts/abis/TON";
import { IDAOAgendaManager } from "@/lib/contracts/interfaces/IDAOAgendaManager";
import { useRouter } from "next/navigation";

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
  const [agendaFee, setAgendaFee] = useState<string>("");
  const [encodedData, setEncodedData] = useState<string>("");
  const { address } = useAccount();
  const router = useRouter();

  // Fetch agenda fee and encode parameters when component mounts or actions change
  useEffect(() => {
    const fetchData = async () => {
      if (!window.ethereum) {
        console.error("Ethereum provider not found");
        setAgendaFee("Provider not found");
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const daoAgendaManager = new ethers.Contract(
          DAO_AGENDA_MANAGER_ADDRESS,
          [
            "function createAgendaFees() external view returns (uint256)",
            "function minimumNoticePeriodSeconds() external view returns (uint128)",
            "function minimumVotingPeriodSeconds() external view returns (uint128)",
          ],
          provider
        );

        // Fetch agenda fee
        const fee = await daoAgendaManager.createAgendaFees();
        const feeInTON = ethers.formatUnits(fee, 18);
        setAgendaFee(feeInTON);
        console.log("=== Agenda Fee ===");
        console.log("Raw fee:", fee.toString());
        console.log("Fee in TON:", feeInTON);

        // Fetch periods
        const noticePeriod =
          await daoAgendaManager.minimumNoticePeriodSeconds();
        const votingPeriod =
          await daoAgendaManager.minimumVotingPeriodSeconds();
        console.log("\n=== Periods ===");
        console.log("Notice Period:", noticePeriod.toString());
        console.log("Voting Period:", votingPeriod.toString());

        // Prepare parameters for encoding
        const targetAddresses = actions.map((a) => a.contractAddress);
        const calldataArray = actions.map((a) => a.calldata || "0x");

        console.log("\n=== Parameters for Encoding ===");
        console.log("Target Addresses:", targetAddresses);
        console.log("Notice Period:", noticePeriod.toString());
        console.log("Voting Period:", votingPeriod.toString());
        console.log("Is Emergency:", true);
        console.log("Calldata Array:", calldataArray);

        // Encode parameters
        const abiCoder = AbiCoder.defaultAbiCoder();
        const types = ["address[]", "uint128", "uint128", "bool", "bytes[]"];
        const values = [
          targetAddresses,
          noticePeriod,
          votingPeriod,
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
        setAgendaFee("Error fetching fee");
      }
    };

    fetchData();
  }, [actions]);

  const toggleParams = (actionId: string) => {
    setExpandedParams((prev) => ({
      ...prev,
      [actionId]: !prev[actionId],
    }));
  };

  const openEtherscan = (address: string) => {
    const explorerUrl =
      process.env.NEXT_PUBLIC_EXPLORER_URL || "https://etherscan.io";
    window.open(`${explorerUrl}/address/${address}`, "_blank");
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
    const targets = actions.map((action) => action.contractAddress);
    const params = actions.map((action) => action.calldata);

    // Get DAO Agenda Manager contract
    const provider = new JsonRpcProvider(window.ethereum);
    const daoAgendaManager = new ethers.Contract(
      DAOAgendaManagerProxy,
      [
        "function minimumNoticePeriodSeconds() view returns (uint128)",
        "function minimumVotingPeriodSeconds() view returns (uint128)",
        "function createAgendaFees() view returns (uint256)",
        "function numAgendas() view returns (uint256)",
        "function getExecutionInfo(uint256) view returns (address[], bytes[], uint128, uint128, bool)",
      ],
      provider
    );

    // Get required parameters
    const noticePeriod = await daoAgendaManager.minimumNoticePeriodSeconds();
    const votingPeriod = await daoAgendaManager.minimumVotingPeriodSeconds();
    const agendaFee = await daoAgendaManager.createAgendaFees();

    // Encode parameters
    const param = AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint128", "uint128", "bool", "bytes[]"],
      [targets, noticePeriod, votingPeriod, true, params]
    ) as `0x${string}`;

    return { param, agendaFee };
  };

  const { writeContract, data: publishData } = useWriteContract();

  const { isLoading: isTransactionPending } = useWaitForTransactionReceipt({
    hash: publishData as `0x${string}`,
  });

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const { param, agendaFee } = await prepareAgenda();

      if (!writeContract) {
        throw new Error("Contract write not ready");
      }

      await writeContract({
        address: DAOCommitteeProxy as `0x${string}`,
        abi: TON_ABI,
        functionName: "approveAndCall",
        args: [DAOCommitteeProxy as `0x${string}`, agendaFee, param],
      });

      // Wait for transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Get the new agenda ID
      const provider = new JsonRpcProvider(window.ethereum);
      const daoAgendaManager = new ethers.Contract(
        DAOAgendaManagerProxy,
        [
          "function minimumNoticePeriodSeconds() view returns (uint128)",
          "function minimumVotingPeriodSeconds() view returns (uint128)",
          "function createAgendaFees() view returns (uint256)",
          "function numAgendas() view returns (uint256)",
          "function getExecutionInfo(uint256) view returns (address[], bytes[], uint128, uint128, bool)",
        ],
        provider
      );

      const numAgendas = await daoAgendaManager.numAgendas();
      const agendaId = numAgendas - BigInt(1);
      const executionInfo = await daoAgendaManager.getExecutionInfo(agendaId);

      console.log("Agenda published successfully!");
      console.log("Agenda ID:", agendaId.toString());
      console.log("Execution Info:", executionInfo);
    } catch (error) {
      console.error("Error publishing proposal:", error);
    } finally {
      setIsPublishing(false);
    }
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
        <div>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || isTransactionPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isPublishing || isTransactionPending
              ? "Publishing..."
              : "Submit DAO Agenda"}
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
                      onClick={() => openEtherscan(DAO_COMMITTEE_PROXY_ADDRESS)}
                    >
                      {DAO_COMMITTEE_PROXY_ADDRESS}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>

                  {/* amount */}
                  <div>
                    <div className="text-sm text-gray-500 mb-1">amount</div>
                    <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                      {agendaFee ? `${agendaFee} TON` : "Loading..."}
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
      </div>
    </div>
  );
}
