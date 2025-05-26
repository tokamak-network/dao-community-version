import { AgendaWithMetadata } from "@/types/agenda";
import {
  formatDate,
  getStatusClass,
  getAgendaTimeInfo,
  calculateAgendaStatus,
  AgendaStatus,
} from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Timer,
  Zap,
  Circle,
} from "lucide-react";
import { useContractRead } from "wagmi";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import { useAgenda } from "@/contexts/AgendaContext";

interface AgendaStatusTimelineProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaStatusTimeline({
  agenda,
}: AgendaStatusTimelineProps) {
  const timeInfo = getAgendaTimeInfo(agenda);
  const { quorum } = useAgenda();
  const currentStatus = calculateAgendaStatus(agenda, quorum ?? BigInt(2));

  // Get period information from contract
  const { data: noticePeriod } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "minimumNoticePeriodSeconds",
    chainId: chain.id,
  });

  const { data: votingPeriod } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "minimumVotingPeriodSeconds",
    chainId: chain.id,
  });

  const { data: executionPeriod } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "executingPeriodSeconds",
    chainId: chain.id,
  });

  const formatPeriod = (seconds: bigint | undefined) => {
    if (!seconds) return "";
    const totalSeconds = Number(seconds);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const timeline = [
    {
      status: "Created",
      timestamp: agenda.createdTimestamp,
      icon: Circle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      period: "Start",
      isCurrent: currentStatus === AgendaStatus.NONE,
    },
    {
      status: "Notice Period",
      timestamp: agenda.noticeEndTimestamp,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      period: formatPeriod(noticePeriod as bigint),
      isCurrent: currentStatus === AgendaStatus.NOTICE,
    },
    {
      status: "Voting Period",
      timestamp: agenda.votingEndTimestamp,
      icon: Timer,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      period: formatPeriod(votingPeriod as bigint),
      isCurrent: currentStatus === AgendaStatus.VOTING,
    },
    {
      status: "Waiting Execution",
      timestamp: agenda.executableLimitTimestamp,
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      period: formatPeriod(executionPeriod as bigint),
      isCurrent: currentStatus === AgendaStatus.WAITING_EXEC,
    },
    {
      status: agenda.executed ? "Executed" : "Ended",
      timestamp: agenda.executed
        ? agenda.executedTimestamp
        : agenda.executableLimitTimestamp,
      icon: agenda.executed ? Zap : CheckCircle2,
      color: agenda.executed ? "text-emerald-600" : "text-red-600",
      bgColor: agenda.executed ? "bg-emerald-100" : "bg-red-100",
      period: agenda.executed ? "Completed" : "Expired",
      isCurrent:
        currentStatus === AgendaStatus.EXECUTED ||
        currentStatus === AgendaStatus.ENDED,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Status Timeline</h3>
        <span className="text-xs text-gray-500">UTC</span>
      </div>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {timeline.map((item, index) => (
            <div key={index} className="relative flex items-start">
              {/* Icon */}
              <div
                className={`relative z-10 flex items-center justify-center ${
                  item.isCurrent ? "w-10 h-10 border-4" : "w-8 h-8 border-2"
                } rounded-full ${
                  item.isCurrent ? item.bgColor : "bg-white"
                } border-${item.color.split("-")[1]} shadow-lg`}
              >
                <item.icon
                  className={`${item.isCurrent ? "w-5 h-5" : "w-4 h-4"} ${
                    item.color
                  }`}
                />
                {item.isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.isCurrent
                          ? `${item.bgColor} ${item.color} ring-2 ring-${
                              item.color.split("-")[1]
                            }`
                          : `${item.bgColor} ${item.color}`
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-500">{item.period}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Number(item.timestamp) === 0
                      ? "Not set"
                      : formatDate(Number(item.timestamp), false)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
