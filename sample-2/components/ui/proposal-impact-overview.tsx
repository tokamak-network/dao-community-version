"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ProposalImpactOverviewProps {
  simulationStep: "initial" | "results";
  generalSimulationLogs: string[];
  simulatedActions: any[];
  pendingText: string;
  expandedActionLogs: { [actionId: string]: boolean };
  onSimulateExecution: () => void;
  onToggleActionLogs: (actionId: string) => void;
}

export function ProposalImpactOverview({
  simulationStep,
  generalSimulationLogs,
  simulatedActions,
  pendingText,
  expandedActionLogs,
  onSimulateExecution,
  onToggleActionLogs,
}: ProposalImpactOverviewProps) {
  const rpcUrl = process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL || "Local Node";

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
          onClick={onSimulateExecution}
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
                            onClick={() => onToggleActionLogs(action.id)}
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
