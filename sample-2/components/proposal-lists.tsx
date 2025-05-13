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
  fetchAgendaEvents,
  getAgendaTimeInfo,
  getLatestBlockNumber,
} from "@/lib/utils";
import { useEffect, useState } from "react";
import { useContractRead } from "wagmi";
import { POLLING_INTERVAL } from "@/config/contracts";

import { chain } from "@/config/chain";
import { createPublicClient, http } from "viem";
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
}

export default function ProposalLists({
  agendas: initialAgendas,
  contract,
  daoContract,
}: ProposalListsProps) {
  const [agendasWithMetadata, setAgendasWithMetadata] = useState<
    AgendaWithMetadata[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [lastBlock, setLastBlock] = useState<bigint | null>(null);
  const [events, setEvents] = useState<AgendaCreatedEvent[]>([]);
  const [progress, setProgress] = useState<{
    current: bigint;
    total: bigint;
    percentage: number;
  } | null>(null);
  const [failureCount, setFailureCount] = useState(0);

  // 먼저 메타데이터를 가져와서 UI를 그립니다
  useEffect(() => {
    const updateAgendas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch metadata for all agendas
        const metadata = await getAllAgendaMetadata(
          initialAgendas.map((a) => a.id)
        );

        // Combine agendas with metadata
        const updatedAgendas = initialAgendas.map((agenda) => ({
          ...agenda,
          title: metadata[agenda.id]?.title,
          description: metadata[agenda.id]?.description,
        }));

        setAgendasWithMetadata(updatedAgendas);
        setIsLoading(false); // UI를 먼저 그리기 위해 로딩 상태 해제
      } catch (err) {
        console.error("Error updating agendas:", err);
        setError("Failed to load agenda metadata. Please try again later.");
        setIsLoading(false);
      }
    };

    updateAgendas();
  }, [initialAgendas]);

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
          creator: event.from,
        };
      }
      return agenda;
    });
  };

  // 백그라운드에서 이벤트를 가져옵니다
  useEffect(() => {
    let isMounted = true;
    let allFetchedEvents = false;
    let abortController = new AbortController();

    const startBlock = BigInt(process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0");
    const blockRange = BigInt(process.env.NEXT_PUBLIC_BLOCK_RANGE || "500");
    let fromBlock = lastBlock || startBlock;
    let toBlock = fromBlock + blockRange;

    const fetchEvents = async () => {
      if (!daoContract || !isPolling || initialAgendas.length === 0) {
        return;
      }
      try {
        const latestBlock = BigInt(await getLatestBlockNumber());
        const totalBlocks = latestBlock - startBlock;
        const publicClient = createPublicClient({
          chain: {
            ...chain,
            id: contract.chainId,
          },
          transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
        });

        while (
          toBlock < latestBlock &&
          isMounted &&
          !allFetchedEvents &&
          !abortController.signal.aborted
        ) {
          try {
            const fetchedEvents = await fetchAgendaEvents(
              daoContract,
              fromBlock,
              toBlock,
              publicClient
            );

            if (!isMounted || abortController.signal.aborted) break;

            if (fetchedEvents.length > 0) {
              fetchedEvents.forEach((event: { args?: AgendaCreatedEvent }) => {
                if (
                  !event.args?.id ||
                  !event.args?.noticePeriodSeconds ||
                  !event.args?.votingPeriodSeconds
                ) {
                } else {
                  const eventArgs = event.args;

                  console.log("eventArgs", eventArgs);
                  // 중복 체크 후 추가
                  setEvents((prev) => {
                    // if (prev.some((e) => e.id === eventArgs.id)) {
                    //   return prev;
                    // }
                    return [...prev, eventArgs];
                  });
                }
              });
            }

            const progressData = {
              current: toBlock,
              total: totalBlocks,
              percentage: Number(
                ((toBlock - startBlock) * BigInt(100)) / totalBlocks
              ),
            };
            setProgress(progressData);
            setLastBlock(toBlock);

            fromBlock = toBlock;
            toBlock = fromBlock + blockRange;
            if (toBlock >= latestBlock) {
              toBlock = latestBlock;
            }

            if (fromBlock === toBlock || fromBlock > latestBlock) {
              allFetchedEvents = true;
            }

            await new Promise((resolve) => {
              const timeoutId = setTimeout(resolve, POLLING_INTERVAL);
              abortController.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                resolve(null);
              });
            });
          } catch (err) {
            if (!isMounted || abortController.signal.aborted) break;
            console.error("Error in fetch loop:", err);
            setFailureCount((prev) => prev + 1);
            if (failureCount >= 3) {
              setIsPolling(false);
              break;
            }
          }
        }
      } catch (err) {
        if (!isMounted || abortController.signal.aborted) return;
        console.error("Error fetching events:", err);
        setError("Failed to fetch new events. Please try again later.");
        setFailureCount((prev) => prev + 1);
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setProgress(null);
          setIsPolling(false); // 이벤트 가져오기 완료 시 폴링 중지

          // 이벤트에서 creator 정보를 추출하여 아젠다 목록 업데이트
          const updatedAgendas = updateAgendasWithCreatorInfo(
            agendasWithMetadata,
            events
          );
          setAgendasWithMetadata(updatedAgendas);

          console.log("All events fetched:", events); // 최종 이벤트 목록 로그
          console.log("updatedAgendas:", updatedAgendas); // 최종 이벤트 목록 로그
        }
        allFetchedEvents = true;
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    initialAgendas,
    isPolling,
    lastBlock,
    contract,
    daoContract,
    events,
    failureCount,
  ]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">Loading agendas...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (!agendasWithMetadata || agendasWithMetadata.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No agendas available</div>
    );
  }

  return (
    <div className="space-y-4">
      {isPolling && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-600">
                  Fetching events...
                </span>
              </div>
              {progress && (
                <div className="text-sm text-gray-600">
                  {progress.percentage.toFixed(1)}%
                </div>
              )}
            </div>
            {progress && (
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
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
                const currentStatus = calculateAgendaStatus(agenda);
                const timeInfo = getAgendaTimeInfo(agenda);
                return (
                  <tr key={index} className="border-b">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <h3 className="font-medium">
                          {agenda.title || `Agenda #${agenda.id}`}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${getStatusClass(
                              currentStatus
                            )}`}
                          >
                            {getStatusText(currentStatus)}
                          </span>
                        </h3>
                        <div className="text-sm text-gray-600 mt-1">
                          {agenda.creator ? (
                            <>
                              This agenda was made by{" "}
                              {formatAddress(agenda.creator)} on{" "}
                              {formatDate(Number(agenda.createdTimestamp))}
                            </>
                          ) : (
                            <>
                              This agenda was made on{" "}
                              {formatDate(Number(agenda.createdTimestamp))}
                            </>
                          )}
                        </div>
                        {agenda.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                            {agenda.description}
                          </p>
                        )}
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
                        {getStatusText(currentStatus)}
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
