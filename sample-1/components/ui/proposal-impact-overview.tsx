"use client";

import { Button } from "@/components/ui/button";
import { BarChart2, AlertCircle } from "lucide-react";

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
}

interface ProposalImpactOverviewProps {
  simulationStep: "initial" | "results";
  generalSimulationLogs: string[];
  simulatedActions: Action[];
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
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-purple-600" />
        <h2 className="text-xl font-medium text-purple-600">Impact Overview</h2>
      </div>

      {simulationStep === "initial" ? (
        <div className="text-center py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Simulation Feature</p>
                <p>
                  Test your proposal actions before submission to identify potential issues
                  and estimate gas usage. This helps ensure your proposal will execute successfully.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={onSimulateExecution}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Simulate Execution
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Simulation Results</h3>

          {generalSimulationLogs.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">General Logs</h4>
              <div className="space-y-1">
                {generalSimulationLogs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-700 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {simulatedActions.length > 0 ? (
            <div className="space-y-3">
              {simulatedActions.map((action, index) => (
                <div key={action.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      Action #{index + 1}: {action.title}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        action.simulationResult === "Passed"
                          ? "bg-green-100 text-green-800"
                          : action.simulationResult === "Failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {action.simulationResult || "Pending"}
                    </span>
                  </div>

                  {action.gasUsed && (
                    <p className="text-sm text-gray-600 mb-2">
                      Gas Used: {action.gasUsed}
                    </p>
                  )}

                  {action.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                      <p className="text-sm text-red-800">{action.errorMessage}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {pendingText}
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={onSimulateExecution}
              variant="outline"
              className="mr-2"
            >
              Re-run Simulation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}