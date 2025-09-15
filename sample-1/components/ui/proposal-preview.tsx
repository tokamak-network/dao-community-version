"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import { ethers, AbiCoder, BrowserProvider } from "ethers";
import { useCombinedDAOContext } from "@/contexts/CombinedDAOContext";
import { getExplorerUrl, openEtherscan } from "@/utils/explorer";
import { isValidUrl } from "@/utils/format";
import { chain } from "@/config/chain";
import { TON_CONTRACT_ADDRESS } from "@/config/contracts";

// Contract addresses
const DAO_COMMITTEE_PROXY_ADDRESS =
  process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS ||
  "0x0dE5B7Bf5bB867ce98B9C9dA0D2B3C1F6C6d1d8";

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  method: string;
  calldata: string;
  abi?: any[];
  sendEth: boolean;
}

interface ProposalPreviewProps {
  title: string;
  description: string;
  snapshotUrl: string;
  discourseUrl: string;
  actions: Action[];
  onModeChange?: (mode: "preview" | "edit", section?: string) => void;
  onActionSelect?: (actionId: string | null) => void;
  selectedActionId?: string | null;
  onEditButtonActivate?: (section: string) => void;
  isEditMode?: boolean;
  onImpactOverviewClick?: () => void;
  showSimulation?: boolean;
  onTransactionSuccess?: () => void;
  onSubmitStatusChange?: (canSubmit: boolean) => void;
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
  onTransactionSuccess,
  onSubmitStatusChange,
}: ProposalPreviewProps) {
  const [expandedParams, setExpandedParams] = useState<{[key: string]: boolean}>({});
  const [encodedData, setEncodedData] = useState<string>("");
  const [contractVersion, setContractVersion] = useState<string>("unknown");
  const [supportsMemoField, setSupportsMemoField] = useState<boolean>(false);
  const [memoField, setMemoField] = useState<string>("");

  const {
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
  } = useCombinedDAOContext();

    const chainId = chain.id;
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
          // console.log(
          //   "\n=== createAgendaFees ||  minimumNoticePeriodSeconds || minimumVotingPeriodSeconds are null"
          // );
          return;
        }

        // Prepare parameters for encoding
        const targetAddresses = actions.map((a) => a.contractAddress);
        const calldataArray = actions.map((a) => a.calldata || "0x");

        // console.log("\n=== Parameters for Encoding ===");
        // console.log("Target Addresses:", targetAddresses);
        // console.log("Notice Period:", minimumNoticePeriodSeconds.toString());
        // console.log("Voting Period:", minimumVotingPeriodSeconds.toString());
        // console.log("Is Emergency:", true);
        // console.log("Calldata Array:", calldataArray);

        // Check contract version to determine encoding format
        let supportsMemoField = false;
        let contractVersion = "unknown";

        try {
          const provider = new BrowserProvider(window.ethereum as any);
          const daoContract = new ethers.Contract(
            DAO_COMMITTEE_PROXY_ADDRESS,
            ["function version() view returns (string)"],
            provider
          );

          const version = await daoContract.version();
          contractVersion = version;
          // console.log(
          //   "✅ Contract version() function found, version:",
          //   version
          // );

          // Version 2.0.0 and above support memo field
          if (version === "2.0.0") {
            supportsMemoField = true;

          }
        } catch (error) {
          contractVersion = "legacy (pre-2.0.0)";
          console.log(
            "❌ version() function not found or error occurred - assuming legacy version"
          );
          console.log("Error details:", error);
          // If version() function doesn't exist or fails, assume legacy version
          supportsMemoField = false;
        }

        // Determine memo field - prioritize snapshot URL, then discourse URL
        const memoField = snapshotUrl?.trim() || discourseUrl?.trim() || "";

        // Update state variables
        setContractVersion(contractVersion);
        setSupportsMemoField(supportsMemoField);
        setMemoField(memoField);

        // Encode parameters based on contract version
        const abiCoder = AbiCoder.defaultAbiCoder();
        let encoded: string;

        if (supportsMemoField) {
          // New version with memo field support

          const types = [
            "address[]",
            "uint128",
            "uint128",
            "bool",
            "bytes[]",
            "string",
          ];
          const values = [
            targetAddresses,
            minimumNoticePeriodSeconds,
            minimumVotingPeriodSeconds,
            true,
            calldataArray,
            memoField,
          ];

          encoded = abiCoder.encode(types, values);
        } else {
          // Legacy version without memo field

          const types = ["address[]", "uint128", "uint128", "bool", "bytes[]"];
          const values = [
            targetAddresses,
            minimumNoticePeriodSeconds,
            minimumVotingPeriodSeconds,
            true,
            calldataArray,
          ];

          encoded = abiCoder.encode(types, values);
        }


        setEncodedData(encoded);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        if (error.code) console.error("Error code:", error.code);
        if (error.message) console.error("Error message:", error.message);
        if (error.data) console.error("Error data:", error.data);
      }
    };

    fetchData();
  }, [
    actions,
    snapshotUrl,
    discourseUrl,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
     ]);

   // Notify parent about submit status changes
   useEffect(() => {
     if (onSubmitStatusChange) {
       const canSubmit = isSubmitEnabled();
       onSubmitStatusChange(canSubmit);
     }
   }, [encodedData, supportsMemoField, onSubmitStatusChange, title, description, snapshotUrl, actions]);

  const toggleParams = (actionId: string) => {
    setExpandedParams(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

    const parseCalldata = (action: Action) => {
    if (!action.abi || !action.calldata || action.calldata === "0x") {
      return null;
    }

    try {
      const iface = new ethers.Interface(action.abi);
      const decodedData = iface.parseTransaction({ data: action.calldata });

      if (!decodedData) return null;

      const functionFragment = decodedData.fragment;
      const args = decodedData.args;

      return functionFragment.inputs.map((input, index) => ({
        name: input.name || `param${index}`,
        type: input.type,
        value: args[index]
      }));
    } catch (error) {
      console.error("Error parsing calldata:", error);
      return null;
    }
  };

  const parseTransactionCalldata = (transactionData: string) => {
    if (!transactionData || !transactionData.startsWith('0x')) {
      return null;
    }

    try {
      // For TON contract approveAndCall function
      // Function signature: approveAndCall(address,uint256,bytes)
      // Selector: 0xcae9ca51

      if (transactionData.length < 10) {
        return null;
      }

      const selector = transactionData.slice(0, 10);
      const calldata = transactionData.slice(10);

      // Check if this is approveAndCall function
      if (selector === '0xcae9ca51') {
        // Decode the parameters manually
        // address spender: 32 bytes (20 bytes address padded)
        // uint256 amount: 32 bytes
        // bytes data: dynamic, starts with offset and length

        if (calldata.length < 192) { // Minimum for 3 parameters
          return null;
        }

        // Parse spender address (first 32 bytes, take last 20 bytes)
        const spenderHex = calldata.slice(24, 64);
        const spender = '0x' + spenderHex;

        // Parse amount (second 32 bytes)
        const amountHex = calldata.slice(64, 128);
        const amount = parseInt(amountHex, 16);
        const formattedAmount = (amount / 1e18).toFixed(1) + ' TON';

        // Parse data offset (third 32 bytes)
        const dataOffsetHex = calldata.slice(128, 192);
        const dataOffset = parseInt(dataOffsetHex, 16) * 2; // Convert to hex chars

        // Parse data length
        const dataLengthHex = calldata.slice(192, 256);
        const dataLength = parseInt(dataLengthHex, 16) * 2; // Convert to hex chars

        // Extract actual data
        const data = '0x' + calldata.slice(256, 256 + dataLength);

        return {
          spender,
          amount: formattedAmount,
          data
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing transaction calldata:', error);
      return null;
    }
  };

  const parseEncodedData = (encodedData: string) => {
    if (!encodedData || encodedData === "Encoding parameters...") {
      return null;
    }

    try {
      const abiCoder = AbiCoder.defaultAbiCoder();

      if (supportsMemoField) {
        // v2.0.0 with memo field
        const types = ["address[]", "uint128", "uint128", "bool", "bytes[]", "string"];
        const decoded = abiCoder.decode(types, encodedData);
        return {
          addresses: decoded[0],
          noticePeriod: decoded[1],
          votingPeriod: decoded[2],
          isEmergency: decoded[3],
          calldataArray: decoded[4],
          memo: decoded[5]
        };
      } else {
        // Legacy version
        const types = ["address[]", "uint128", "uint128", "bool", "bytes[]"];
        const decoded = abiCoder.decode(types, encodedData);
        return {
          addresses: decoded[0],
          noticePeriod: decoded[1],
          votingPeriod: decoded[2],
          isEmergency: decoded[3],
          calldataArray: decoded[4],
          memo: ""
        };
      }
    } catch (error) {
      console.error("Error parsing encoded data:", error);
      return null;
    }
  };

  const isSubmitEnabled = () => {
    // Check if required fields are filled
    if (!title || !title.trim()) {
      return false;
    }

    if (!description || !description.trim()) {
      return false;
    }

    if (!snapshotUrl || !snapshotUrl.trim()) {
      return false;
    }

    if (!encodedData || encodedData === "Encoding parameters...") {
      return false;
    }

    const parsed = parseEncodedData(encodedData);
    if (!parsed) {
      return false;
    }

    // Check if there's any actual calldata in the bytes[] array
    const hasValidCalldata = parsed.calldataArray &&
      parsed.calldataArray.length > 0 &&
      parsed.calldataArray.some((calldata: string) => calldata && calldata !== "0x");

    return hasValidCalldata;
  };



  return (
    <div className="bg-white p-6">


      {/* Title Section */}
      <div className="mb-6">
        <h2 className={`text-2xl font-semibold mb-4 ${
          title ? "text-gray-900" : "text-red-400 italic"
        }`}>
          {title || "The area where the title you wrote is displayed. (Required)"}
        </h2>

                {/* Description & Snapshot Links */}
        <div className="flex gap-3">
          {description && isValidUrl(description) ? (
            <a
              href={description}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Description
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 border-2 border-red-300 rounded-full cursor-not-allowed">
              <ExternalLink className="w-4 h-4 mr-1" />
              Description (Required)
            </span>
          )}

          {snapshotUrl ? (
            <a
              href={snapshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Snapshot
            </a>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-500 bg-red-50 border-2 border-red-300 rounded-full cursor-not-allowed">
              <ExternalLink className="w-4 h-4 mr-1" />
              Snapshot (Required)
            </span>
          )}


        </div>
      </div>

      {/* Actions Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

        {actions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
            No actions added yet
          </div>
        ) : (
          <div className="border rounded-lg divide-y overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[80px_150px_200px_1fr] gap-4 p-3 text-sm font-medium text-gray-500 bg-gray-50">
              <div>Action</div>
              <div>Contract</div>
              <div>Method</div>
              <div className="text-right">Parameters</div>
            </div>

            {/* Responsive Rows */}
            {actions.map((action, index) => (
              <div key={action.id}>
                {/* Mobile card */}
                <div className="md:hidden p-3 text-sm hover:bg-gray-50 cursor-pointer space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">#{index + 1}</span>
                    <div className="text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => toggleParams(action.id)}>
                      <span>
                        {(() => {
                          const parsedParams = parseCalldata(action);
                          const paramCount = parsedParams ? parsedParams.length : 0;
                          return `${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                      <ChevronDown className={`inline h-4 w-4 ml-1 transition-transform ${expandedParams[action.id] ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  <div className="text-blue-600 flex items-center break-all">
                    <a href={getExplorerUrl(action.contractAddress, chainId)} target="_blank" rel="noopener noreferrer" className="underline">
                      {formatAddress(action.contractAddress)}
                    </a>
                    <ExternalLink className="inline w-4 h-4 ml-1" />
                  </div>
                  <div className="break-words" title={action.method}>📋 {action.method}</div>
                </div>

                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[80px_150px_200px_1fr] gap-4 p-3 text-sm hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center">
                    <span className="text-gray-500">#{index + 1}</span>
                  </div>

                  <div className="flex items-center">
                    <a
                      href={getExplorerUrl(action.contractAddress, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline cursor-pointer flex items-center"
                    >
                      {formatAddress(action.contractAddress)}
                      <ExternalLink className="inline w-4 h-4 ml-1" />
                    </a>
                  </div>

                  <div className="flex items-center">
                    <span className="truncate" title={action.method}>
                      {action.method}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <div
                      className="flex items-center text-gray-500 cursor-pointer hover:text-gray-700"
                      onClick={() => toggleParams(action.id)}
                    >
                      <span>
                        {(() => {
                          const parsedParams = parseCalldata(action);
                          const paramCount = parsedParams ? parsedParams.length : 0;
                          return `${paramCount} parameter${paramCount !== 1 ? 's' : ''}`;
                        })()}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 ml-1 transition-transform ${
                          expandedParams[action.id] ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Parameters */}
                {expandedParams[action.id] && (
                  <div className="bg-gray-50 p-4 border-t">
                    {(() => {
                      const parsedParams = parseCalldata(action);

                      if (!parsedParams || parsedParams.length === 0) {
                        return (
                          <div className="text-sm text-gray-500">
                            No parameters
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 text-sm">
                          <div className="font-medium text-gray-700 mb-2">Function Parameters:</div>
                          {parsedParams.map((param, index) => (
                            <div key={index} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-600 font-medium">{param.name}</span>
                                <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                                  {param.type}
                                </span>
                              </div>
                              <div className="font-mono text-xs bg-white px-2 py-1 rounded border break-all leading-relaxed">
                                {typeof param.value === 'string' ? param.value : param.value.toString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DAO Agenda Submission Parameters Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          DAO Agenda Submission Parameters
        </h3>

        <div className="space-y-6 bg-white border border-gray-200 rounded-lg p-4 md:p-6">
          {/* TON Contract */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">TON Contract</h4>
            <div
              className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100 text-blue-600 hover:underline break-all"
              onClick={() => TON_CONTRACT_ADDRESS && window.open(getExplorerUrl(TON_CONTRACT_ADDRESS, chainId), '_blank')}
            >
              {TON_CONTRACT_ADDRESS || 'Not configured'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </div>
          </div>

          {/* Function */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Function</h4>
            <div className="text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
              approveAndCall(address spender, uint256 amount, bytes data)
            </div>
          </div>

          {/* Function Parameters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Function Parameters</h4>

            <div className="space-y-4">
              {/* Spender */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Spender</div>
                <div
              className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200 flex items-center cursor-pointer hover:bg-gray-100 break-all"
              onClick={() =>
                window.open(getExplorerUrl(DAO_COMMITTEE_PROXY_ADDRESS, chainId), '_blank')
              }
            >
                  <span className="underline text-blue-600">{DAO_COMMITTEE_PROXY_ADDRESS}</span>
                  <ExternalLink className="w-4 h-4 ml-2" />
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

                            {/* Data */}
              <div>
                <div className="text-sm text-gray-500 mb-1">Data</div>
                <div className="space-y-3">
                  {/* Encoded Data */}
                  <div className="font-mono text-sm bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    <div className="break-all">
                      {encodedData || "Encoding parameters..."}
                    </div>
                  </div>
                   {/* Data Structure Breakdown */}
                   {encodedData && (
                          <div className="bg-white border border-gray-200 rounded-lg">
                            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                              <span className="text-xs font-medium text-gray-700">
                                Encoded Data Structure
                              </span>
                            </div>
                            <div className="p-3 space-y-2 text-xs">
                              {/* Target Addresses */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">
                                  address[]:
                                </span>
                                <span className="font-mono text-gray-700">
                                  [
                                  {actions
                                    .map((a) => `"${a.contractAddress}"`)
                                    .join(", ")}
                                  ]
                                </span>
                              </div>

                              {/* Notice Period */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">
                                  uint128:
                                </span>
                                <span className="font-mono text-gray-700">
                                  {minimumNoticePeriodSeconds?.toString()}{" "}
                                  (notice period seconds)
                                </span>
                              </div>

                              {/* Voting Period */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">
                                  uint128:
                                </span>
                                <span className="font-mono text-gray-700">
                                  {minimumVotingPeriodSeconds?.toString()}{" "}
                                  (voting period seconds)
                                </span>
                              </div>

                              {/* Atomic Execute */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">
                                  bool:
                                </span>
                                <span className="font-mono text-gray-700">
                                  true (atomic execute)
                                </span>
                              </div>

                              {/* Calldata Array */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">
                                  bytes[]:
                                </span>
                                <div className="font-mono text-gray-700">
                                  {actions.length === 0
                                    ? "[]"
                                    : actions.map((action, index) => (
                                        <div key={`${action.id}-${index}`} className="mb-1">
                                          <span className="text-gray-500">
                                            #{index + 1}:
                                          </span>{" "}
                                          {action.calldata || "0x"}
                                        </div>
                                      ))}
                                </div>
                              </div>

                              {/* Memo Field (only for v2.0.0) */}
                              {supportsMemoField && (
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                  <span className="text-gray-500 font-medium">
                                    string:
                                  </span>
                                  <span className="font-mono text-gray-700">
                                    {memoField ? `"${memoField}"` : '""'} (memo:
                                    reference URL)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}


                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
