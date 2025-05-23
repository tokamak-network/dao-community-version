"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { AgendaWithMetadata, AgendaCreatedEvent } from "@/types/agenda";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import {
  getAllAgendaMetadata,
  fetchAgendaEvents,
  getLatestBlockNumber,
} from "@/lib/utils";
import { createPublicClient, http } from "viem";
import { CONTRACT_READ_SETTINGS } from "@/config/contracts";

interface AgendaContextType {
  agendas: AgendaWithMetadata[];
  isLoading: boolean;
  error: string | null;
  refreshAgendas: () => Promise<void>;
  statusMessage: string;
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
  events: AgendaCreatedEvent[];
  isPolling: boolean;
  progress: {
    current: bigint;
    total: bigint;
    percentage: number;
  } | null;
  createAgendaFees: bigint | null;
  minimumNoticePeriodSeconds: bigint | null;
  minimumVotingPeriodSeconds: bigint | null;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [totalAgendaCount, setTotalAgendaCount] = useState<number>(0);
  const [agendas, setAgendas] = useState<AgendaWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number>(0);
  const [events, setEvents] = useState<AgendaCreatedEvent[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [progress, setProgress] = useState<{
    current: bigint;
    total: bigint;
    percentage: number;
  } | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [createAgendaFees, setCreateAgendaFees] = useState<bigint | null>(null);
  const [minimumNoticePeriodSeconds, setMinimumNoticePeriodSeconds] = useState<
    bigint | null
  >(null);
  const [minimumVotingPeriodSeconds, setMinimumVotingPeriodSeconds] = useState<
    bigint | null
  >(null);

  const fetchAgendas = async () => {
    try {
      const { BATCH_SIZE, BATCH_DELAY_MS, CACHE_DURATION_MS } =
        CONTRACT_READ_SETTINGS;
      if (
        agendas.length > 0 &&
        Date.now() - lastFetchTimestamp < CACHE_DURATION_MS
      ) {
        setStatusMessage(
          `Data was recently loaded (${
            CACHE_DURATION_MS / 1000
          }s cache). Skipping reload.`
        );
        return;
      }

      setIsLoading(true);
      setError(null);
      setStatusMessage("Loading agenda data...");

      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
        },
        transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
      });

      // Fetch contract parameters
      const [fees, noticePeriod, votingPeriod] = await Promise.all([
        publicClient.readContract({
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          functionName: "createAgendaFees",
        }),
        publicClient.readContract({
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          functionName: "minimumNoticePeriodSeconds",
        }),
        publicClient.readContract({
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          functionName: "minimumVotingPeriodSeconds",
        }),
      ]);

      console.log(
        "fees, noticePeriod, votingPeriod",
        fees,
        noticePeriod,
        votingPeriod
      );

      setCreateAgendaFees(fees as bigint);
      setMinimumNoticePeriodSeconds(noticePeriod as bigint);
      setMinimumVotingPeriodSeconds(votingPeriod as bigint);

      setStatusMessage("Checking total number of agendas...");
      const numAgendas = await publicClient.readContract({
        address: DAO_AGENDA_MANAGER_ADDRESS,
        abi: DAO_AGENDA_MANAGER_ABI,
        functionName: "numAgendas",
      });

      if (!numAgendas) {
        setAgendas([]);
        setStatusMessage("No agendas available.");
        return;
      }

      const totalAgendas = Number(numAgendas);

      setTotalAgendaCount(totalAgendas);

      const agendaData: AgendaWithMetadata[] = [];

      for (let i = totalAgendas - 1; i >= 0; i -= BATCH_SIZE) {
        const startIndex = Math.max(0, i - BATCH_SIZE + 1);
        const currentBatch = i - startIndex + 1;
        const progress = Math.round(((totalAgendas - i) / totalAgendas) * 100);

        if (progress % 10 === 0) {
          setStatusMessage(
            `Loading agenda data... (${i + 1}~${
              startIndex + 1
            }/${totalAgendas}) [${progress}%]`
          );
        }

        const batchPromises = Array.from({ length: currentBatch }, (_, j) => {
          const agendaId = i - j;
          return publicClient
            .readContract({
              address: DAO_AGENDA_MANAGER_ADDRESS,
              abi: DAO_AGENDA_MANAGER_ABI,
              functionName: "agendas",
              args: [BigInt(agendaId)],
            })
            .then((result) => ({
              ...(result as unknown as AgendaWithMetadata),
              id: agendaId,
            }));
        });

        const batchResults = await Promise.all(batchPromises);
        const batchData = batchResults;

        setStatusMessage(
          `Loading agenda metadata... (${i + 1}~${
            startIndex + 1
          }/${totalAgendas}) [${progress}%]`
        );
        const batchMetadata = await getAllAgendaMetadata(
          batchData.map((a) => a.id)
        );

        const batchDataWithMetadata = batchData.map((agenda) => ({
          ...agenda,
          title: batchMetadata[agenda.id]?.title,
          description: batchMetadata[agenda.id]?.description,
          creator: batchMetadata[agenda.id]?.creator?.address,
          snapshotUrl: batchMetadata[agenda.id]?.snapshotUrl,
          discourseUrl: batchMetadata[agenda.id]?.discourseUrl,
          network: batchMetadata[agenda.id]?.network,
          transaction: batchMetadata[agenda.id]?.transaction,
          actions: batchMetadata[agenda.id]?.actions,
        }));

        setAgendas((prev) => {
          const existingAgendas = new Map(prev.map((a) => [a.id, a]));
          let hasChanges = false;

          batchDataWithMetadata.forEach((newAgenda) => {
            const existingAgenda = existingAgendas.get(newAgenda.id);
            if (!existingAgenda) {
              existingAgendas.set(newAgenda.id, newAgenda);
              hasChanges = true;
            } else {
              // BigInt 값을 문자열로 변환하여 비교
              const existingStr = JSON.stringify(existingAgenda, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
              );
              const newStr = JSON.stringify(newAgenda, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
              );

              if (existingStr !== newStr) {
                existingAgendas.set(newAgenda.id, newAgenda);
                hasChanges = true;
              }
            }
          });

          return hasChanges ? Array.from(existingAgendas.values()) : prev;
        });

        agendaData.push(...batchDataWithMetadata);

        if (startIndex > 0) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      setLastFetchTimestamp(Date.now());
      setStatusMessage("Data loading completed.");
    } catch (err) {
      console.error("Error fetching agendas:", err);
      setError("Failed to fetch agendas. Please try again later.");
      setStatusMessage("Error occurred while loading data.");
    } finally {
      setIsLoading(false);
    }
  };

  // 백그라운드에서 이벤트를 가져오는 함수
  const fetchEvents = async () => {
    let isMounted = true;
    let allFetchedEvents = false;
    let abortController = new AbortController();

    const startBlock = BigInt(process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0");
    const blockRange = BigInt(process.env.NEXT_PUBLIC_BLOCK_RANGE || "500");
    let fromBlock = startBlock;
    let toBlock = fromBlock + blockRange;

    try {
      const latestBlock = BigInt(await getLatestBlockNumber());
      const totalBlocks = latestBlock - startBlock;
      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
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
            {
              address: DAO_AGENDA_MANAGER_ADDRESS,
              abi: DAO_AGENDA_MANAGER_ABI,
              chainId: chain.id,
            },
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
                return;
              }
              const eventArgs = event.args;
              setEvents((prev) => [...prev, eventArgs]);
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

          fromBlock = toBlock;
          toBlock = fromBlock + blockRange;
          if (toBlock >= latestBlock) {
            toBlock = latestBlock;
          }

          if (fromBlock === toBlock || fromBlock > latestBlock) {
            allFetchedEvents = true;
          }

          await new Promise((resolve) => {
            const timeoutId = setTimeout(
              resolve,
              CONTRACT_READ_SETTINGS.BATCH_DELAY_MS
            );
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
        setIsPolling(false);
      }
      allFetchedEvents = true;
    }

    return () => {
      isMounted = false;
      abortController.abort();
    };
  };

  useEffect(() => {
    if (agendas.length === 0) {
      fetchAgendas().then(() => {
        // const cleanup = fetchEvents();
        // return () => {
        //   cleanup?.then(() => {
        //     console.log("Background event fetching completed or cancelled");
        //   });
        // };
      });
    }
    return () => {
      console.log("AgendaProvider 언마운트", {
        agendas,
        isLoading,
        error,
        statusMessage,
      });
    };
  }, []);

  return (
    <AgendaContext.Provider
      value={{
        agendas,
        isLoading,
        error,
        refreshAgendas: fetchAgendas,
        statusMessage,
        contract: {
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          chainId: chain.id,
        },
        daoContract: {
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          chainId: chain.id,
        },
        events,
        isPolling,
        progress,
        createAgendaFees,
        minimumNoticePeriodSeconds,
        minimumVotingPeriodSeconds,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);

  if (context === undefined) {
    throw new Error("useAgenda must be used within an AgendaProvider");
  }
  return context;
}
