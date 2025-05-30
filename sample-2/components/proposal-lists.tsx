"use client";

import {
  Agenda,
  AgendaCreatedEvent,
  AgendaContractResult,
  AgendaWithMetadata,
} from "@/types/agenda";
import {
  getStatusClass,
  getStatusText,
  formatDate,
  formatAddress,
  calculateAgendaStatus,
  getAgendaMetadata,
  getAllAgendaMetadata,
  getAgendaTimeInfo,
  getStatusMessage,
  AgendaStatus,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgenda } from "@/contexts/AgendaContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProposalListsProps {
  agendas: AgendaWithMetadata[];
  contract: {
    address: `0x${string}`;
    abi: any;
    chainId: number;
  };
  daoContract: {
    address: `0x${string}`;
    abi: any;
    chainId: number;
  };
  isLoading: boolean;
}

export default function ProposalLists({
  agendas: initialAgendas,
  contract,
  daoContract,
  isLoading,
}: ProposalListsProps) {
  const router = useRouter();
  const { events, quorum } = useAgenda();
  const [agendasWithMetadata, setAgendasWithMetadata] = useState<
    AgendaWithMetadata[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // 이벤트에서 creator 정보를 추출하여 아젠다 목록 업데이트하는 함수
  const updateAgendasWithCreatorInfo = (
    agendas: AgendaWithMetadata[],
    events: AgendaCreatedEvent[]
  ) => {
    return agendas.map((agenda) => {
      const event = events.find((e) => Number(e.id) === agenda.id);
      if (event) {
        return {
          ...agenda,
          creator: {
            address: event.from,
            signature: agenda.creator?.signature,
          },
        } as AgendaWithMetadata;
      }
      return agenda;
    });
  };

  // 이벤트가 변경될 때마다 아젠다 목록 업데이트
  useEffect(() => {
    if (events.length > 0) {
      const updatedAgendas = updateAgendasWithCreatorInfo(
        initialAgendas,
        events
      );
      setAgendasWithMetadata(updatedAgendas);
    } else {
      setAgendasWithMetadata(initialAgendas);
    }
  }, [events, initialAgendas]);

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!agendasWithMetadata || agendasWithMetadata.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {isLoading ? "Loading agendas..." : "No agendas available"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Proposals</h2>
          <Link href="/proposals/new">
            <Button>Create Proposal</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4">Agenda</th>
                <th className="text-right py-4">Status</th>
                <th className="text-right py-4">Executed</th>
                <th className="text-right py-4">Result</th>
              </tr>
            </thead>
            <tbody>
              {agendasWithMetadata.map((agenda, index) => {
                const currentStatus = calculateAgendaStatus(
                  agenda,
                  quorum ?? BigInt(2)
                );
                const timeInfo = getAgendaTimeInfo(agenda);
                return (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/proposals/${agenda.id}`)}
                  >
                    <td className="py-4">
                      <div className="flex flex-col">
                        <h3 className="font-medium">
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getStatusClass(
                              currentStatus
                            )}`}
                          >
                            {currentStatus === AgendaStatus.WAITING_EXEC &&
                            Number(agenda.countingYes) <=
                              Number(agenda.countingNo)
                              ? "NOT APPROVED"
                              : getStatusText(currentStatus)}
                          </span>{" "}
                          Agenda #{agenda.id}
                          {agenda.title ? ". " + agenda.title : ""}
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          {agenda.creator?.address ? (
                            <>
                              This agenda was made by{" "}
                              {formatAddress(agenda.creator.address)} on{" "}
                              {formatDate(Number(agenda.createdTimestamp))}
                            </>
                          ) : (
                            <>
                              This agenda was made on{" "}
                              {formatDate(Number(agenda.createdTimestamp))}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {currentStatus === 1 && (
                            <span>
                              Notice period ends in:{" "}
                              {timeInfo.noticePeriod.remaining}
                            </span>
                          )}
                          {currentStatus === 2 && (
                            <span>
                              Voting ends in: {timeInfo.votingPeriod.remaining}
                            </span>
                          )}
                          {currentStatus === 3 && (
                            <span>
                              Execution period ends in:{" "}
                              {timeInfo.executionPeriod.remaining}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded ${getStatusClass(
                          currentStatus
                        )}`}
                      >
                        {!agenda.voters || agenda.voters.length === 0
                          ? "Voting not started"
                          : (currentStatus === AgendaStatus.WAITING_EXEC ||
                              currentStatus === AgendaStatus.ENDED) &&
                            Number(agenda.countingYes) <=
                              Number(agenda.countingNo)
                          ? "Proposal not approved"
                          : getStatusMessage(agenda, currentStatus)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {agenda.executed ? (
                        <span className="text-green-500">Executed</span>
                      ) : (
                        <span className="text-gray-500">Pending</span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      {agenda.executed ? (
                        <span className="text-green-500">Yes</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
