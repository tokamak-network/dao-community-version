"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";

interface Action {
  id: string;
  title: string;
  contractAddress: string;
  abi: any[];
  method: string;
  calldata: string;
  sendEth: boolean;
  simulationResult?: "Passed" | "Failed" | "Simulating..." | "Pending";
  gasUsed?: string;
  errorMessage?: string;
  logs?: string[];
}

interface ProposalImpactOverviewProps {
  actions: Action[];
}

export function ProposalImpactOverview({
  actions,
}: ProposalImpactOverviewProps) {
  // Simulation state management
  const [simulationStep, setSimulationStep] = useState<"initial" | "results">("initial");
  const [simulatedActions, setSimulatedActions] = useState<Action[]>([]);
  const [generalSimulationLogs, setGeneralSimulationLogs] = useState<string[]>([]);
  const [expandedActionLogs, setExpandedActionLogs] = useState<{ [actionId: string]: boolean }>({});
  const [eventSourceInstance, setEventSourceInstance] = useState<EventSource | null>(null);
  const [pendingText, setPendingText] = useState("Pending...");

  const rpcUrl = process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL || "Local Node";

  // Pending text animation
  useEffect(() => {
    let dotCount = 0;
    const interval = setInterval(() => {
      dotCount = (dotCount % 3) + 1;
      setPendingText(`Pending${Array(dotCount + 1).join(".")}`);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceInstance) {
        eventSourceInstance.close();
      }
    };
  }, [eventSourceInstance]);

  const handleSimulateExecution = async () => {
    // Close existing SSE connection
    if (eventSourceInstance) {
      eventSourceInstance.close();
      setEventSourceInstance(null);
    }

    const initialSimActions = actions.map((action) => ({
      ...action,
      simulationResult: "Pending" as "Pending",
      gasUsed: "",
      errorMessage: "",
      logs: [],
    }));

    setSimulationStep("results");
    setSimulatedActions(initialSimActions);
    setGeneralSimulationLogs(["Connecting to simulation server..."]);
    setExpandedActionLogs({});

    const daoAddress = process.env.NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS;
    const forkRpc = process.env.NEXT_PUBLIC_RPC_URL;
    const localRpc = process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL;

    if (!daoAddress || !forkRpc || !localRpc) {
      alert("Required environment variables are not set.");
      const errorActions = actions.map((a) => ({
        ...a,
        simulationResult: "Failed" as "Failed",
        errorMessage: "Config error",
      }));
      setSimulationStep("results");
      setSimulatedActions(errorActions);
      setGeneralSimulationLogs(["Configuration error. Check .env.local file."]);
      return;
    }

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: actions,
          daoContractAddress: daoAddress,
          forkRpcUrl: forkRpc,
          localRpcUrl: localRpc,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg =
          errorData.message ||
          `API request failed with status ${response.status}`;
        setSimulatedActions(prevActions =>
          prevActions.map((sa) => ({
            ...sa,
            simulationResult: "Failed",
            errorMessage:
              sa.simulationResult === "Pending" ||
              sa.simulationResult === "Simulating..."
                ? errorMsg
                : sa.errorMessage,
            logs: [...(sa.logs || []), `API Request Error: ${errorMsg}`],
          }))
        );
        setGeneralSimulationLogs(prevLogs =>
          prevLogs.filter(log => log !== "Connecting to simulation server...").concat(`Error: ${errorMsg}`)
        );
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read response body");
      }

            const processStream = async () => {
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let currentEventType = "";
            let currentData = "";

            for (const line of lines) {
              if (line.trim() === "") {
                // Empty line indicates end of SSE message
                if (currentEventType && currentData) {

                  if (currentData === "[DONE]") {

                    return;
                  }

                  try {
                    const eventData = JSON.parse(currentData);
                    const completeEvent = { ...eventData, type: currentEventType };

                    handleSSEEvent(completeEvent);
                  } catch (parseError) {
                    console.error("Failed to parse SSE data:", parseError, "Raw data:", currentData);
                  }
                }
                currentEventType = "";
                currentData = "";
                continue;
              }

              if (line.startsWith("event: ")) {
                currentEventType = line.slice(7).trim();

              } else if (line.startsWith("data: ")) {
                currentData = line.slice(6);

              }
            }

            // Handle any remaining event at the end
            if (currentEventType && currentData) {

              if (currentData === "[DONE]") {

                return;
              }

              try {
                const eventData = JSON.parse(currentData);
                const completeEvent = { ...eventData, type: currentEventType };

                handleSSEEvent(completeEvent);
              } catch (parseError) {
                console.error("Failed to parse final SSE data:", parseError, "Raw data:", currentData);
              }
            }
          }
        } catch (streamError) {
          console.error("Stream processing error:", streamError);
        }
      };

      await processStream();

    } catch (error) {
      console.error("Simulation error:", error);
    }
  };

  const handleSSEEvent = (event: any) => {
    switch (event.type) {
      case "log":
        setGeneralSimulationLogs(prevLogs => [...prevLogs, event.message]);
        break;

      case "actionLog":
        setSimulatedActions(prevActions =>
          prevActions.map((action) =>
            action.id === event.actionId
              ? {
                  ...action,
                  logs: [...(action.logs || []), event.message],
                }
              : action
          )
        );
        break;

      case "actionUpdate":

        setSimulatedActions(prevActions =>
          prevActions.map((action) =>
            action.id === event.action?.id
              ? {
                  ...action,
                  simulationResult: event.action.simulationResult,
                  gasUsed: event.action.gasUsed || action.gasUsed,
                  errorMessage: event.action.errorMessage || action.errorMessage,
                }
              : action
          )
        );
        break;

      case "error":
        setGeneralSimulationLogs(prevLogs => [...prevLogs, `Error: ${event.message}`]);
        break;

      case "simulationComplete":
        setGeneralSimulationLogs(prevLogs => [...prevLogs, "Simulation completed"]);
        break;

      default:
        console.log("Unknown SSE event type:", event.type);
    }
  };

  const toggleActionLogs = (actionId: string) => {
    setExpandedActionLogs(prev => ({
      ...prev,
      [actionId]: !prev[actionId]
    }));
  };

  return simulationStep === "initial" ? (
    <div className="flex-1 border rounded-md p-6">
      <div className="flex flex-col items-start">
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            Before running simulation
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            You need to run a local Hardhat node with forked network before
            running the simulation:
          </p>
          <div className="bg-gray-800 text-gray-200 p-4 rounded-md text-sm font-mono mb-4">
            <p>cd simulation-node</p>
            <p>npm i</p>
            <p>npx hardhat node --fork &lt;RPC URL&gt;</p>
          </div>
          <p className="text-sm text-gray-600">
            After the Hardhat node is running, you can proceed with the
            simulation.
          </p>
        </div>
        <Button
          variant="secondary"
          className="bg-slate-100 hover:bg-slate-200 text-sm"
          onClick={handleSimulateExecution}
        >
          Simulate execution
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex-1 p-6">
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl font-semibold">Simulations</h1>
        </div>
        {generalSimulationLogs.length > 0 && (
          <div className="mb-4 p-3 bg-gray-800 text-gray-200 rounded-md text-xs font-mono max-h-32 overflow-y-auto">
            {generalSimulationLogs.map((log, index) => (
              <p key={index} className="whitespace-pre-wrap">
                {log}
              </p>
            ))}
          </div>
        )}
        <p className="text-gray-500 mb-4">
          Detailed simulation results per proposal action provided by {rpcUrl}
        </p>
        <div className="border rounded-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-16">
                    Action #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Simulation
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Gas Used
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-12">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody>
                {simulatedActions.map((action, index) => (
                  <React.Fragment key={action.id}>
                    <tr className="border-b">
                      <td className="px-4 py-3 text-sm w-16">{index + 1}</td>
                      <td className="px-4 py-3 text-sm">{action.title}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          {action.simulationResult === "Pending" ? (
                            <span className="text-gray-500">{pendingText}</span>
                          ) : action.simulationResult === "Simulating..." ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-400" />
                              <span className="text-gray-500">
                                Simulating...
                              </span>
                            </>
                          ) : action.simulationResult === "Passed" ? (
                            <>
                              <div className="w-2 h-2 rounded-full mr-2 bg-emerald-400"></div>
                              <span className="text-emerald-500">Passed</span>
                            </>
                          ) : action.simulationResult === "Failed" ? (
                            <>
                              <div className="w-2 h-2 rounded-full mr-2 bg-red-400"></div>
                              <span className="text-red-500">Failed</span>
                            </>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {action.gasUsed || "-"}
                      </td>
                      <td className="px-4 py-3 text-center w-12">
                        {action.logs && action.logs.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleActionLogs(action.id)}
                            className="h-8 w-8"
                          >
                            {expandedActionLogs[action.id] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expandedActionLogs[action.id] &&
                      action.logs &&
                      action.logs.length > 0 && (
                        <tr className="border-b">
                          <td colSpan={5} className="p-0">
                            <div className="bg-gray-900 text-gray-200">
                              <pre className="text-xs whitespace-pre-wrap p-3 m-0 overflow-x-auto max-h-48 break-all">
                                {action.logs.join("\n")}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}