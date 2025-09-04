import { useContractRead } from "wagmi";
import {
  DAO_AGENDA_MANAGER_ADDRESS,
  DAO_COMMITTEE_PROXY_ADDRESS,
} from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import { formatDate } from "@/lib/utils";
import { ExternalLink, RefreshCw } from "lucide-react";
import { BrowserProvider, ethers } from "ethers";
import { useEffect, useState } from "react";

interface AgendaStorageInfoProps {
  agendaId: number;
}

interface AgendaContract {
  createdTimestamp: bigint;
  noticeEndTimestamp: bigint;
  votingPeriodInSeconds: bigint;
  votingStartedTimestamp: bigint;
  votingEndTimestamp: bigint;
  executableLimitTimestamp: bigint;
  executedTimestamp: bigint;
  countingYes: bigint;
  countingNo: bigint;
  countingAbstain: bigint;
  status: number;
  result: number;
  voters: string[];
  executed: boolean;
}

interface CurrentAgendaStatus {
  currentResult: number;
  currentStatus: number;
}

export default function AgendaStorageInfo({
  agendaId,
}: AgendaStorageInfoProps) {
  const [contractVersion, setContractVersion] = useState<string | null>(null);
  const [currentStatusData, setCurrentStatusData] =
    useState<CurrentAgendaStatus | null>(null);
  const [agendaMemo, setAgendaMemo] = useState<string | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canExecuteAgenda, setCanExecuteAgenda] = useState<boolean | null>(
    null
  );

  // Read agenda data directly from contract
  const {
    data: agendaData,
    isLoading,
    error,
  } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "agendas",
    args: [BigInt(agendaId)],
    chainId: chain.id,
  }) as { data: AgendaContract | undefined; isLoading: boolean; error: any };

  // Check contract version and get current status if v2.0.0
  useEffect(() => {
    const checkVersionAndGetCurrentStatus = async () => {
      try {
        setIsLoadingVersion(true);
        const provider = new BrowserProvider(window.ethereum as any);

        // Check version
        const daoContract = new ethers.Contract(
          DAO_COMMITTEE_PROXY_ADDRESS,
          ["function version() view returns (string)"],
          provider
        );

        try {
          const version = await daoContract.version();
          setContractVersion(version);
          console.log("✅ Contract version detected:", version);

          // If version 2.0.0, call currentAgendaStatus
          if (version === "2.0.0") {
            console.log(
              "📋 Version 2.0.0 detected, calling currentAgendaStatus..."
            );
            try {
              const currentStatusContract = new ethers.Contract(
                DAO_COMMITTEE_PROXY_ADDRESS,
                [
                  "function currentAgendaStatus(uint256 _agendaID) external view returns (uint256 currentResult, uint256 currentStatus)",
                ],
                provider
              );

              const [currentResult, currentStatus] =
                await currentStatusContract.currentAgendaStatus(agendaId);
              setCurrentStatusData({
                currentResult: Number(currentResult),
                currentStatus: Number(currentStatus),
              });
              console.log("✅ Current agenda status data:", {
                currentResult: Number(currentResult),
                currentStatus: Number(currentStatus),
              });

              // Get agendaMemo for v2.0.0
              console.log("📋 Fetching agendaMemo for agenda", agendaId);
              try {
                const memoContract = new ethers.Contract(
                  DAO_COMMITTEE_PROXY_ADDRESS,
                  ["function agendaMemo(uint256) public view returns (string)"],
                  provider
                );

                const memo = await memoContract.agendaMemo(agendaId);
                setAgendaMemo(memo);
                console.log("✅ AgendaMemo fetched:", memo);
              } catch (memoError) {
                console.error("❌ Error calling agendaMemo:", memoError);
                setAgendaMemo("");
              }
            } catch (statusError) {
              console.error(
                "❌ Error calling currentAgendaStatus:",
                statusError
              );

              // Still try to get agendaMemo even if currentAgendaStatus fails
              console.log("📋 Still fetching agendaMemo for agenda", agendaId);
              try {
                const memoContract = new ethers.Contract(
                  DAO_COMMITTEE_PROXY_ADDRESS,
                  ["function agendaMemo(uint256) public view returns (string)"],
                  provider
                );

                const memo = await memoContract.agendaMemo(agendaId);
                setAgendaMemo(memo);
                console.log("✅ AgendaMemo fetched:", memo);
              } catch (memoError) {
                console.error("❌ Error calling agendaMemo:", memoError);
                setAgendaMemo("");
              }
            }
          }
        } catch (versionError) {
          console.log("❌ version() function not found - legacy contract");
          setContractVersion("legacy");
        }

        // Check if agenda can be executed (available for all versions)
        console.log("📋 Checking canExecuteAgenda...");
        try {
          const agendaManagerContract = new ethers.Contract(
            DAO_AGENDA_MANAGER_ADDRESS,
            ["function canExecuteAgenda(uint256) external view returns (bool)"],
            provider
          );

          const canExecute = await agendaManagerContract.canExecuteAgenda(
            agendaId
          );
          setCanExecuteAgenda(canExecute);
          console.log("✅ canExecuteAgenda result:", canExecute);
        } catch (executeError) {
          console.error("❌ Error calling canExecuteAgenda:", executeError);
          setCanExecuteAgenda(null);
        }
      } catch (error) {
        console.error("Error checking version:", error);
        setContractVersion("error");
      } finally {
        setIsLoadingVersion(false);
        setLastUpdated(new Date());
      }
    };

    if (typeof window !== "undefined" && window.ethereum) {
      checkVersionAndGetCurrentStatus();
    } else {
      setIsLoadingVersion(false);
      setLastUpdated(new Date());
    }
  }, [agendaId]);

  // 데이터 새로고침 함수
  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      const provider = new BrowserProvider(window.ethereum as any);

      // Refresh basic agenda data from wagmi hook by invalidating cache
      // This will trigger the useContractRead to refetch
      console.log("📊 Refreshing agenda contract data...");

      const daoContract = new ethers.Contract(
        DAO_COMMITTEE_PROXY_ADDRESS,
        ["function version() view returns (string)"],
        provider
      );

      try {
        const version = await daoContract.version();
        setContractVersion(version);
        console.log("✅ Contract version refreshed:", version);

        // If version 2.0.0, refresh current status and memo
        if (version === "2.0.0") {
          console.log("📋 Refreshing v2.0.0 specific data...");
          try {
            const currentStatusContract = new ethers.Contract(
              DAO_COMMITTEE_PROXY_ADDRESS,
              [
                "function currentAgendaStatus(uint256 _agendaID) external view returns (uint256 currentResult, uint256 currentStatus)",
              ],
              provider
            );

            const [currentResult, currentStatus] =
              await currentStatusContract.currentAgendaStatus(agendaId);
            setCurrentStatusData({
              currentResult: Number(currentResult),
              currentStatus: Number(currentStatus),
            });
            console.log("✅ Current status refreshed");

            // Refresh agendaMemo
            const memoContract = new ethers.Contract(
              DAO_COMMITTEE_PROXY_ADDRESS,
              ["function agendaMemo(uint256) public view returns (string)"],
              provider
            );

            const memo = await memoContract.agendaMemo(agendaId);
            setAgendaMemo(memo);
            console.log("✅ Agenda memo refreshed");
          } catch (error) {
            console.error("❌ Error refreshing v2.0.0 data:", error);
          }
        }
      } catch (versionError) {
        console.log("❌ version() function not found - legacy contract");
        setContractVersion("legacy");
      }

      // Refresh canExecuteAgenda (available for all versions)
      console.log("📋 Refreshing canExecuteAgenda...");
      try {
        const agendaManagerContract = new ethers.Contract(
          DAO_AGENDA_MANAGER_ADDRESS,
          ["function canExecuteAgenda(uint256) external view returns (bool)"],
          provider
        );

        const canExecute = await agendaManagerContract.canExecuteAgenda(
          agendaId
        );
        setCanExecuteAgenda(canExecute);
        console.log("✅ canExecuteAgenda refreshed:", canExecute);
      } catch (executeError) {
        console.error("❌ Error refreshing canExecuteAgenda:", executeError);
        setCanExecuteAgenda(null);
      }

      setLastUpdated(new Date());
      console.log("✅ All data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading || isLoadingVersion || isRefreshing) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">
          {isRefreshing
            ? "Refreshing on-chain data..."
            : isLoadingVersion
            ? "Checking contract version..."
            : "Loading contract data..."}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-800 mb-2">
          Error loading contract data
        </h4>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!agendaData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">No contract data available</p>
      </div>
    );
  }

  const getStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      0: "NONE",
      1: "NOTICE",
      2: "VOTING",
      3: "WAITING_EXEC",
      4: "EXECUTED",
      5: "ENDED",
    };
    return statusMap[status] || `Unknown (${status})`;
  };

  const getResultText = (result: number) => {
    const resultMap: { [key: number]: string } = {
      0: "PENDING",
      1: "ACCEPT",
      2: "REJECT",
      3: "DISMISS",
    };
    return resultMap[result] || `Unknown (${result})`;
  };

  // V2.0.0 specific enums
  const getCurrentResultText = (result: number) => {
    const resultMap: { [key: number]: string } = {
      0: "PENDING",
      1: "ACCEPT",
      2: "REJECT",
      3: "DISMISS",
      4: "NO_CONSENSUS",
      5: "NO_AGENDA",
    };
    return resultMap[result] || `Unknown (${result})`;
  };

  const getCurrentStatusText = (status: number) => {
    const statusMap: { [key: number]: string } = {
      0: "NONE",
      1: "NOTICE",
      2: "VOTING",
      3: "WAITING_EXEC",
      4: "EXECUTED",
      5: "ENDED",
      6: "NO_AGENDA",
    };
    return statusMap[status] || `Unknown (${status})`;
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Data Status and Refresh */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-indigo-700 mb-2">
              📊 On-chain Data Status
            </h4>
            <div className="text-sm text-indigo-600">
              {lastUpdated ? (
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Last Updated:</span>{" "}
                    {lastUpdated.toLocaleString()}
                  </div>
                  <div className="text-xs text-indigo-500">
                    Data retrieved directly from blockchain contracts
                  </div>
                </div>
              ) : (
                <span className="text-indigo-500">Loading data status...</span>
              )}
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing || isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${
                isRefreshing || isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }
            `}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>

      {/* Contract Version Info */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-700 mb-3">
          Contract Version Information
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-blue-200">
            <span className="text-sm text-blue-600">Contract Address</span>
            <span className="text-sm font-mono text-blue-800">
              {DAO_COMMITTEE_PROXY_ADDRESS}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-blue-200">
            <span className="text-sm text-blue-600">Version</span>
            <span className="text-sm font-mono text-blue-800">
              {contractVersion || "Unknown"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-blue-600">Enhanced Status</span>
            <span className="text-sm font-mono text-blue-800">
              {contractVersion === "2.0.0" ? "Available" : "Not Available"}
            </span>
          </div>
        </div>
      </div>

      {/* V2.0.0 Current Status - Only show if version 2.0.0 */}
      {contractVersion === "2.0.0" && currentStatusData && (
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-700 mb-3">
            Current Status (v2.0.0)
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="text-sm text-green-600">Current Result</span>
              <span className="text-sm font-mono text-green-800">
                {getCurrentResultText(currentStatusData.currentResult)} (
                {currentStatusData.currentResult})
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-green-600">Current Status</span>
              <span className="text-sm font-mono text-green-800">
                {getCurrentStatusText(currentStatusData.currentStatus)} (
                {currentStatusData.currentStatus})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* V2.0.0 Agenda Memo - Only show if version 2.0.0 */}
      {contractVersion === "2.0.0" && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-700 mb-3">
            Agenda Memo (v2.0.0)
          </h4>
          <div className="space-y-2">
            <div className="py-2">
              <span className="text-sm text-purple-600 block mb-2">
                On-chain Reference URL
              </span>
              {agendaMemo !== null ? (
                agendaMemo ? (
                  <div className="bg-white border border-purple-200 rounded p-3">
                    <div className="text-sm font-mono break-all text-purple-800">
                      {agendaMemo}
                    </div>
                    {agendaMemo.startsWith("http") && (
                      <div className="mt-2">
                        <a
                          href={agendaMemo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
                        >
                          Open Link
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-purple-500 italic">
                    Empty memo
                  </div>
                )
              ) : (
                <div className="text-sm text-purple-500 italic">
                  Loading memo...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Basic Information
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Agenda ID</span>
            <span className="text-sm font-mono">{agendaId}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm font-mono">
              {getStatusText(agendaData.status)} ({agendaData.status})
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Result</span>
            <span className="text-sm font-mono">
              {getResultText(agendaData.result)} ({agendaData.result})
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Executed</span>
            <span className="text-sm font-mono">
              {agendaData.executed ? "true" : "false"}
            </span>
          </div>
        </div>
      </div>

      {/* Execution Status */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-700 mb-3">
          Execution Status
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-yellow-600">Can Execute Agenda</span>
            <span className="text-sm font-mono">
              {canExecuteAgenda !== null ? (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    canExecuteAgenda
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {canExecuteAgenda ? "✅ Executable" : "❌ Not Executable"}
                </span>
              ) : (
                <span className="text-gray-400">Loading...</span>
              )}
            </span>
          </div>
          <div className="text-xs text-yellow-600 bg-yellow-100 rounded p-2">
            <strong>Note:</strong> This function checks if the agenda meets all
            conditions required for execution, including voting results, time
            periods, and approval status.
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Timestamps</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Created</span>
            <span className="text-sm font-mono">
              {formatDate(Number(agendaData.createdTimestamp))}
              <span className="text-xs text-gray-500 ml-2">
                ({agendaData.createdTimestamp.toString()})
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Notice End</span>
            <span className="text-sm font-mono">
              {formatDate(Number(agendaData.noticeEndTimestamp))}
              <span className="text-xs text-gray-500 ml-2">
                ({agendaData.noticeEndTimestamp.toString()})
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Voting Started</span>
            <span className="text-sm font-mono">
              {Number(agendaData.votingStartedTimestamp) === 0
                ? "Not started"
                : formatDate(Number(agendaData.votingStartedTimestamp))}
              <span className="text-xs text-gray-500 ml-2">
                ({agendaData.votingStartedTimestamp.toString()})
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Voting End</span>
            <span className="text-sm font-mono">
              {formatDate(Number(agendaData.votingEndTimestamp))}
              <span className="text-xs text-gray-500 ml-2">
                ({agendaData.votingEndTimestamp.toString()})
              </span>
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Execution Limit</span>
            <span className="text-sm font-mono">
              {formatDate(Number(agendaData.executableLimitTimestamp))}
              <span className="text-xs text-gray-500 ml-2">
                ({agendaData.executableLimitTimestamp.toString()})
              </span>
            </span>
          </div>
          {Number(agendaData.executedTimestamp) > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">Executed</span>
              <span className="text-sm font-mono">
                {formatDate(Number(agendaData.executedTimestamp))}
                <span className="text-xs text-gray-500 ml-2">
                  ({agendaData.executedTimestamp.toString()})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Voting Period */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Voting Period
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Period (seconds)</span>
            <span className="text-sm font-mono">
              {agendaData.votingPeriodInSeconds.toString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Period (days)</span>
            <span className="text-sm font-mono">
              {(Number(agendaData.votingPeriodInSeconds) / 86400).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Vote Counts */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Vote Counts</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Yes Votes</span>
            <span className="text-sm font-mono text-green-600">
              {agendaData.countingYes.toString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">No Votes</span>
            <span className="text-sm font-mono text-red-600">
              {agendaData.countingNo.toString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Abstain Votes</span>
            <span className="text-sm font-mono text-gray-600">
              {agendaData.countingAbstain.toString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 font-medium">
              Total Votes
            </span>
            <span className="text-sm font-mono font-medium">
              {(
                Number(agendaData.countingYes) +
                Number(agendaData.countingNo) +
                Number(agendaData.countingAbstain)
              ).toString()}
            </span>
          </div>
        </div>
      </div>

      {/* Voters */}
      {agendaData.voters && agendaData.voters.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Eligible Voters ({agendaData.voters.length})
          </h4>
          <div className="space-y-2">
            {agendaData.voters.map((voter, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-200"
              >
                <span className="text-sm text-gray-600">Voter {index + 1}</span>
                <a
                  href={`${
                    process.env.NEXT_PUBLIC_EXPLORER_URL ||
                    "https://etherscan.io"
                  }/address/${voter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-blue-600 hover:text-blue-800 flex items-center"
                >
                  {voter.slice(0, 6)}...{voter.slice(-4)}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Contract Data */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Raw Contract Data
        </h4>
        <div className="bg-white rounded border p-3">
          <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(
              {
                version: contractVersion,
                ...(currentStatusData && {
                  currentAgendaStatus: currentStatusData,
                }),
                agendaData: {
                  createdTimestamp: agendaData.createdTimestamp.toString(),
                  noticeEndTimestamp: agendaData.noticeEndTimestamp.toString(),
                  votingPeriodInSeconds:
                    agendaData.votingPeriodInSeconds.toString(),
                  votingStartedTimestamp:
                    agendaData.votingStartedTimestamp.toString(),
                  votingEndTimestamp: agendaData.votingEndTimestamp.toString(),
                  executableLimitTimestamp:
                    agendaData.executableLimitTimestamp.toString(),
                  executedTimestamp: agendaData.executedTimestamp.toString(),
                  countingYes: agendaData.countingYes.toString(),
                  countingNo: agendaData.countingNo.toString(),
                  countingAbstain: agendaData.countingAbstain.toString(),
                  status: agendaData.status,
                  result: agendaData.result,
                  voters: agendaData.voters,
                  executed: agendaData.executed,
                },
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
