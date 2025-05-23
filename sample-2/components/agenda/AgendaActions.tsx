import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress } from "@/lib/utils";
import {
  Send,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { Interface } from "ethers";

interface AgendaActionsProps {
  agenda: AgendaWithMetadata;
}

interface DecodedParam {
  name: string;
  type: string;
  value: any;
}

export default function AgendaActions({ agenda }: AgendaActionsProps) {
  const [expandedParams, setExpandedParams] = useState<{
    [key: string]: boolean;
  }>({});

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

  const openTransaction = (txHash: string) => {
    const explorerUrl =
      process.env.NEXT_PUBLIC_EXPLORER_URL || "https://etherscan.io";
    window.open(`${explorerUrl}/tx/${txHash}`, "_blank");
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

  return (
    <div className="space-y-6">
      {/* Transaction Section */}
      {agenda.transaction && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transaction</h3>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4">
              <div
                className="flex items-center text-blue-600 cursor-pointer hover:underline"
                onClick={() => openTransaction(agenda.transaction!)}
              >
                <span className="font-mono">
                  {agenda.transaction.slice(0, 6)}...
                  {agenda.transaction.slice(-4)}
                </span>
                <ExternalLink className="h-4 w-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
          <div className="flex items-center text-sm text-gray-500">
            <span>{agenda.actions?.length || 0} actions</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>

        <div className="border rounded-lg divide-y overflow-hidden">
          <div className="grid grid-cols-[200px_300px_120px_1fr] gap-4 p-3 text-sm font-medium text-gray-500 bg-gray-50">
            <div>Contract</div>
            <div>Method</div>
            <div className="text-right">Parameters</div>
            <div>Calldata</div>
          </div>

          {agenda.actions?.map((action, index) => (
            <div key={index} className="border-b hover:bg-gray-50">
              <div className="grid grid-cols-[200px_300px_120px_1fr] gap-4 p-3 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 mr-2">#{index + 1}</span>
                  <div
                    className="flex items-center text-blue-600 cursor-pointer hover:underline"
                    onClick={() => openEtherscan(action.contractAddress)}
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
                    onClick={() => toggleParams(`action-${index}`)}
                  >
                    <span>{decodeCalldata(action)?.length || 0} params</span>
                    <ChevronDown
                      className={`h-4 w-4 ml-1 transition-transform ${
                        expandedParams[`action-${index}`] ? "rotate-180" : ""
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
              {expandedParams[`action-${index}`] && decodeCalldata(action) && (
                <div className="bg-gray-50 p-4">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">
                        Parameters
                      </h4>
                      <div className="mt-3 space-y-3">
                        {decodeCalldata(action)?.map(
                          (param: DecodedParam, paramIndex: number) => (
                            <div
                              key={paramIndex}
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
      </div>
    </div>
  );
}
