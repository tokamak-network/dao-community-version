import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress } from "@/lib/utils";
import { Send, ArrowUpRight, ChevronRight } from "lucide-react";

interface AgendaActionsProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaActions({ agenda }: AgendaActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span>{agenda.targets?.length || 0} actions</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600">
            <div>Type</div>
            <div>Address</div>
            <div>Details</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {agenda.targets?.map((target, index) => (
            <div
              key={index}
              className="px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center text-gray-700">
                  <Send className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{target.type}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="font-mono">
                    {formatAddress(target.address)}
                  </span>
                  <ArrowUpRight className="h-4 w-4 ml-1 text-gray-400" />
                </div>
                <div className="text-gray-500 text-sm">
                  {target.value ? `${target.value} WTON` : "No parameters"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
