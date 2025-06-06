"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import {
  AgendaWithMetadata,
  AgendaCreatedEvent,
  AgendaAction,
} from "@/types/agenda";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import {
  getAllAgendaMetadata,
  fetchAgendaEvents,
  getLatestBlockNumber,
  calculateAgendaStatus,
  AgendaStatus,
  getAgendaMetadata,
  getMetadataUrl,
  getNetworkName,
} from "@/lib/utils";
import { createPublicClient, http } from "viem";
import { CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { useContractRead, useContractWrite } from "wagmi";
import { DAO_COMMITTEE_PROXY_ADDRESS } from "@/config/contracts";
import { DAO_ABI } from "@/abis/dao";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

interface AgendaContextType {
  agendas: AgendaWithMetadata[];
  isLoading: boolean;
  error: string | null;
  refreshAgendas: () => Promise<void>;
  refreshAgenda: (agendaId: number) => Promise<void>;
  refreshAgendaWithoutCache: (
    agendaId: number
  ) => Promise<AgendaWithMetadata | null>;
  getAgenda: (agendaId: number) => Promise<AgendaWithMetadata | null>;
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
  quorum: bigint | null;
  isCommitteeMember: (address: string) => boolean;
  getVoterInfos: (
    agendaId: number,
    voters: string[]
  ) => Promise<
    {
      isVoter: boolean;
      hasVoted: boolean;
      vote: bigint;
    }[]
  >;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

const voterInfosAbi = [
  {
    name: "voterInfos",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_agendaID", type: "uint256" },
      { name: "_voter", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "isVoter", type: "bool" },
          { name: "hasVoted", type: "bool" },
          { name: "vote", type: "uint256" },
        ],
      },
    ],
  },
] as const;

const isCreatorString = (creator: unknown): creator is `0x${string}` => {
  return typeof creator === "string" && creator.startsWith("0x");
};

const isCreatorObject = (
  creator: unknown
): creator is { address: `0x${string}`; signature?: string } => {
  return (
    typeof creator === "object" &&
    creator !== null &&
    "address" in creator &&
    typeof (creator as any).address === "string" &&
    (creator as any).address.startsWith("0x")
  );
};

const getCreatorAddress = (creator: unknown): `0x${string}` => {
  if (isCreatorString(creator)) {
    return creator as `0x${string}`;
  }
  if (isCreatorObject(creator)) {
    return creator.address as `0x${string}`;
  }
  return "0x0000000000000000000000000000000000000000" as `0x${string}`;
};

const getCreatorSignature = (creator: unknown): string | undefined => {
  if (isCreatorObject(creator)) {
    return creator.signature;
  }
  return undefined;
};

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
  const [quorum, setQuorum] = useState<bigint | null>(null);
  const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [committeeMembers, setCommitteeMembers] = useState<string[] | null>(
    null
  );
  const { address } = useAccount();

  // Get max member count from DAO Committee
  const { data: maxMemberCount } = useContractRead({
    address: DAO_COMMITTEE_PROXY_ADDRESS,
    abi: DAO_ABI,
    functionName: "maxMember",
    chainId: chain.id,
  });

  // Get quorum from DAO Committee
  const { data: quorumData } = useContractRead({
    address: DAO_COMMITTEE_PROXY_ADDRESS,
    abi: DAO_ABI,
    functionName: "quorum",
    chainId: chain.id,
  });

  useEffect(() => {
    if (quorumData) {
      setQuorum(quorumData);
    }
  }, [quorumData]);

  // Fetch all committee members
  useEffect(() => {
    const fetchCommitteeMembers = async () => {
      if (!maxMemberCount) return;

      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
        },
        transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
      });
      console.log("maxMemberCount", maxMemberCount);
      const members = await Promise.all(
        Array.from({ length: Number(maxMemberCount) }, (_, i) =>
          publicClient.readContract({
            address: DAO_COMMITTEE_PROXY_ADDRESS,
            abi: DAO_ABI,
            functionName: "members",
            args: [BigInt(i)],
          })
        )
      );
      console.log("members", members);
      setCommitteeMembers(members as string[]);
    };

    fetchCommitteeMembers();
  }, [maxMemberCount]);

  // Helper function to check if an address is a committee member
  const isCommitteeMember = useCallback(
    (address: string) => {
      return committeeMembers?.includes(address) || false;
    },
    [committeeMembers]
  );

  const getVoterInfos = async (agendaId: number, voters: string[]) => {
    const publicClient = createPublicClient({
      chain: {
        ...chain,
        id: chain.id,
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
    });

    const results = await Promise.all(
      voters.map((voter) =>
        publicClient.readContract({
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: voterInfosAbi,
          functionName: "voterInfos",
          args: [BigInt(agendaId), voter as `0x${string}`],
        })
      )
    );

    return results;
  };

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
          creator: {
            address: getCreatorAddress(batchMetadata[agenda.id]?.creator),
            signature: getCreatorSignature(batchMetadata[agenda.id]?.creator),
          },
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

          return hasChanges
            ? Array.from(existingAgendas.values()).sort((a, b) => b.id - a.id)
            : prev;
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

  // 아젠다 데이터 업데이트 함수
  const updateAgendaData = async (
    agendaId: number,
    shouldSort: boolean = false
  ) => {
    console.log("updateAgendaData - Starting update for agenda ID:", agendaId);

    const publicClient = createPublicClient({
      chain: {
        ...chain,
        id: chain.id,
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
    });

    // 아젠다 데이터 가져오기
    console.log("updateAgendaData - Fetching contract data...");
    const agendaData = await publicClient.readContract({
      address: DAO_AGENDA_MANAGER_ADDRESS,
      abi: DAO_AGENDA_MANAGER_ABI,
      functionName: "agendas",
      args: [BigInt(agendaId)],
    });
    console.log("updateAgendaData - Contract data received:", agendaData);

    // 메타데이터 가져오기
    console.log("updateAgendaData - Fetching metadata...");
    const networkName = getNetworkName(chain.id);
    const metadataUrl = getMetadataUrl(agendaId, networkName);
    console.log("updateAgendaData - Metadata URL:", metadataUrl);

    const response = await fetch(metadataUrl, {
      cache: "no-store", // 캐시 비활성화
    });

    let metadata = null;
    if (response.ok) {
      metadata = await response.json();
      console.log("updateAgendaData - Metadata received:", metadata);
    } else {
      console.log("updateAgendaData - No metadata found");
    }

    // 상태 업데이트
    setAgendas((prevAgendas) => {
      console.log(
        "updateAgendaData - Previous agendas count:",
        prevAgendas.length
      );
      console.log(
        "updateAgendaData - Previous agenda IDs:",
        prevAgendas.map((a) => a.id)
      );

      // 기존 아젠다 데이터 가져오기
      const existingAgenda = prevAgendas.find((a) => a.id === agendaId);
      console.log(
        "updateAgendaData - Existing agenda found:",
        !!existingAgenda
      );

      // 아젠다 데이터와 메타데이터 결합
      const updatedAgenda: AgendaWithMetadata = {
        ...(agendaData as unknown as AgendaWithMetadata),
        id: agendaId,
        title: metadata?.title || existingAgenda?.title,
        description: metadata?.description || existingAgenda?.description,
        creator: {
          address: getCreatorAddress(metadata?.creator),
          signature: getCreatorSignature(metadata?.creator),
        },
        snapshotUrl: metadata?.snapshotUrl || existingAgenda?.snapshotUrl,
        discourseUrl: metadata?.discourseUrl || existingAgenda?.discourseUrl,
        network: metadata?.network || existingAgenda?.network,
        transaction: metadata?.transaction || existingAgenda?.transaction,
        actions: metadata?.actions,
      };
      console.log("updateAgendaData - Combined data:", updatedAgenda);

      const existingAgendas = new Map(prevAgendas.map((a) => [a.id, a]));
      existingAgendas.set(agendaId, updatedAgenda);
      const newAgendas = Array.from(existingAgendas.values());
      const finalAgendas = shouldSort
        ? newAgendas.sort((a, b) => b.id - a.id)
        : newAgendas;

      console.log("updateAgendaData - New agendas count:", finalAgendas.length);
      console.log(
        "updateAgendaData - New agenda IDs:",
        finalAgendas.map((a) => a.id)
      );
      console.log("updateAgendaData - Should sort:", shouldSort);

      return finalAgendas;
    });

    console.log(
      "updateAgendaData - Agenda data update completed for ID:",
      agendaId
    );
  };

  // 이벤트 모니터링을 위한 useEffect
  useEffect(() => {
    console.log("[useEffect] Setting up event monitoring");

    const publicClient = createPublicClient({
      chain: {
        ...chain,
        id: chain.id,
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
    });

    // 아젠다 생성 이벤트 모니터링
    console.log("[monitorAgendaEvents] Setting up AgendaCreated event watcher");
    console.log(
      "[monitorAgendaEvents] AgendaCreated monitoring address:",
      DAO_COMMITTEE_PROXY_ADDRESS
    );
    const unwatchCreated = publicClient.watchEvent({
      address: DAO_COMMITTEE_PROXY_ADDRESS,
      event: {
        type: "event",
        name: "AgendaCreated",
        inputs: [
          { type: "address", name: "from", indexed: true },
          { type: "uint256", name: "id", indexed: true },
          { type: "address[]", name: "targets" },
          { type: "uint128", name: "noticePeriodSeconds" },
          { type: "uint128", name: "votingPeriodSeconds" },
          { type: "bool", name: "atomicExecute" },
        ],
      },
      onLogs: async (logs) => {
        console.log("[AgendaCreated] Event logs received:", logs);
        console.log("[AgendaCreated] Number of logs:", logs.length);

        for (const log of logs) {
          console.log("[AgendaCreated] Processing log:", log);
          if (log.args) {
            const agendaId = Number(log.args.id);
            console.log("[AgendaCreated] Processing agenda ID:", agendaId);
            console.log("[AgendaCreated] Event args:", log.args);
            console.log(
              "[AgendaCreated] Transaction hash:",
              log.transactionHash
            );
            console.log("[AgendaCreated] Block number:", log.blockNumber);

            try {
              await updateAgendaData(agendaId, true);
              console.log(
                "[AgendaCreated] Successfully updated agenda data for ID:",
                agendaId
              );
            } catch (error) {
              console.error(
                "[AgendaCreated] Error updating agenda data:",
                error
              );
            }
          } else {
            console.warn("[AgendaCreated] Log has no args:", log);
          }
        }
      },
    });

    // 아젠다 투표 이벤트 모니터링
    console.log(
      "[monitorAgendaEvents] Setting up AgendaVoteCasted event watcher"
    );
    const unwatchVoteCasted = publicClient.watchEvent({
      address: DAO_COMMITTEE_PROXY_ADDRESS,
      event: {
        type: "event",
        name: "AgendaVoteCasted",
        inputs: [
          { type: "address", name: "from", indexed: true },
          { type: "uint256", name: "id", indexed: true },
          { type: "uint256", name: "voting" },
          { type: "string", name: "comment" },
        ],
      },
      onLogs: async (logs) => {
        console.log("[AgendaVoteCasted] Event logs received:", logs);
        console.log(
          "[AgendaVoteCasted] Contract address:",
          DAO_COMMITTEE_PROXY_ADDRESS
        );
        for (const log of logs) {
          if (log.args) {
            console.log("[AgendaVoteCasted] Event args:", log.args);
            console.log("[AgendaVoteCasted] Event topics:", log.topics);
            const agendaId = Number(log.args.id);
            console.log("[AgendaVoteCasted] Processing agenda ID:", agendaId);
            await updateAgendaData(agendaId);

            // 커스텀 이벤트 발생
            console.log(
              "[AgendaVoteCasted] Dispatching agendaVoteUpdated event for agenda ID:",
              agendaId
            );
            const voteEvent = new CustomEvent("agendaVoteUpdated", {
              detail: { agendaId },
            });
            window.dispatchEvent(voteEvent);
            console.log(
              "[AgendaVoteCasted] agendaVoteUpdated event dispatched"
            );
          }
        }
      },
    });

    // 아젠다 실행 이벤트 모니터링
    console.log(
      "[monitorAgendaEvents] Setting up AgendaExecuted event watcher"
    );
    const unwatchExecuted = publicClient.watchEvent({
      address: DAO_COMMITTEE_PROXY_ADDRESS,
      event: {
        type: "event",
        name: "AgendaExecuted",
        inputs: [
          { type: "uint256", name: "id", indexed: true },
          { type: "address[]", name: "target" },
        ],
      },
      onLogs: async (logs) => {
        console.log("[AgendaExecuted] Event logs received:", logs);
        for (const log of logs) {
          if (log.args) {
            console.log("[AgendaExecuted] Event args:", log.args);
            const agendaId = Number(log.args.id);
            console.log("[AgendaExecuted] Processing agenda ID:", agendaId);
            await updateAgendaData(agendaId);

            // 커스텀 이벤트 발생
            const executedEvent = new CustomEvent("agendaExecuted", {
              detail: { agendaId },
            });
            window.dispatchEvent(executedEvent);
          }
        }
      },
    });

    return () => {
      console.log("[useEffect] Cleaning up event monitoring");
      unwatchCreated();
      unwatchVoteCasted();
      unwatchExecuted();
    };
  }, []);

  // 아젠다 상태 업데이트 함수
  const updateAgendaStatus = async () => {
    const publicClient = createPublicClient({
      chain: {
        ...chain,
        id: chain.id,
      },
      transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
    });

    const currentBlock = await publicClient.getBlockNumber();
    const currentTimestamp = Math.floor(Date.now() / 1000);

    setAgendas((prevAgendas) => {
      return prevAgendas.map((agenda) => {
        const status = calculateAgendaStatus(agenda, quorum ?? BigInt(2));
        let updatedAgenda = { ...agenda };

        // Notice Period → Voting Period
        if (
          status === AgendaStatus.NOTICE &&
          currentTimestamp >= Number(agenda.noticeEndTimestamp)
        ) {
          updatedAgenda = {
            ...agenda,
            status: AgendaStatus.VOTING,
          };
        }
        // Voting Period → Waiting Execution
        else if (
          status === AgendaStatus.VOTING &&
          currentTimestamp >= Number(agenda.votingEndTimestamp)
        ) {
          updatedAgenda = {
            ...agenda,
            status: AgendaStatus.WAITING_EXEC,
          };
        }
        // Waiting Execution → Executed/Ended
        else if (
          status === AgendaStatus.WAITING_EXEC &&
          currentTimestamp >= Number(agenda.executableLimitTimestamp)
        ) {
          // Check if agenda was executed
          const isExecuted = agenda.executed;
          updatedAgenda = {
            ...agenda,
            status: isExecuted ? AgendaStatus.EXECUTED : AgendaStatus.ENDED,
          };
        }

        return updatedAgenda;
      });
    });
  };

  // 주기적인 상태 업데이트 설정
  useEffect(() => {
    // 1분마다 상태 업데이트
    const interval = setInterval(updateAgendaStatus, 60000);
    setUpdateInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [updateInterval]);

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

  // 특정 아젠다만 갱신하는 함수
  const refreshAgenda = async (agendaId: number) => {
    try {
      console.log("[refreshAgenda] Starting refresh for agenda ID:", agendaId);

      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
        },
        transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
      });

      // 1. 아젠다 데이터 가져오기
      console.log("[refreshAgenda] Fetching contract data...");
      const agendaData = await publicClient.readContract({
        address: DAO_AGENDA_MANAGER_ADDRESS,
        abi: DAO_AGENDA_MANAGER_ABI,
        functionName: "agendas",
        args: [BigInt(agendaId)],
      });
      console.log("[refreshAgenda] Contract data received:", agendaData);

      // 2. 기존 아젠다 데이터 가져오기
      const existingAgenda = agendas.find((a) => a.id === agendaId);
      console.log("[refreshAgenda] Existing agenda data:", existingAgenda);

      // 3. 메타데이터 가져오기
      console.log("[refreshAgenda] Fetching metadata...");
      const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
      const metadataUrl = getMetadataUrl(agendaId, network);
      console.log("[refreshAgenda] Metadata URL:", metadataUrl);

      const response = await fetch(metadataUrl, {
        cache: "no-store", // 캐시 비활성화
      });

      let metadata = null;
      if (response.ok) {
        metadata = await response.json();
        console.log(
          "[refreshAgenda] Metadata received from repository:",
          metadata
        );
      } else {
        console.log("[refreshAgenda] No metadata found in repository");
      }

      // 4. 아젠다 데이터와 메타데이터 결합
      const updatedAgenda: AgendaWithMetadata = {
        ...(agendaData as unknown as AgendaWithMetadata),
        id: agendaId,
        title: metadata?.title || existingAgenda?.title,
        description: metadata?.description || existingAgenda?.description,
        creator: {
          address: getCreatorAddress(metadata?.creator),
          signature: getCreatorSignature(metadata?.creator),
        },
        snapshotUrl: metadata?.snapshotUrl || existingAgenda?.snapshotUrl,
        discourseUrl: metadata?.discourseUrl || existingAgenda?.discourseUrl,
        network: metadata?.network || existingAgenda?.network,
        transaction: metadata?.transaction || existingAgenda?.transaction,
        actions: metadata?.actions,
      };
      console.log("[refreshAgenda] Combined data:", updatedAgenda);

      // 5. 기존 아젠다 목록 업데이트
      setAgendas((prevAgendas) => {
        const existingAgendas = new Map(prevAgendas.map((a) => [a.id, a]));
        existingAgendas.set(agendaId, updatedAgenda);
        return Array.from(existingAgendas.values());
      });
      console.log("[refreshAgenda] Agenda list updated");
    } catch (err) {
      console.error("[refreshAgenda] Error refreshing agenda:", err);
    }
  };

  // 특정 아젠다만 캐시 없이 갱신하는 함수
  const refreshAgendaWithoutCache = async (agendaId: number) => {
    try {
      console.log(
        "[refreshAgendaWithoutCache] Starting refresh for agenda ID:",
        agendaId
      );

      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
        },
        transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
      });

      // 1. 아젠다 데이터 가져오기
      console.log("[refreshAgendaWithoutCache] Fetching contract data...");
      const agendaData = await publicClient.readContract({
        address: DAO_AGENDA_MANAGER_ADDRESS,
        abi: DAO_AGENDA_MANAGER_ABI,
        functionName: "agendas",
        args: [BigInt(agendaId)],
      });
      console.log(
        "[refreshAgendaWithoutCache] Contract data received:",
        agendaData
      );

      // 2. 기존 아젠다 데이터 가져오기
      const existingAgenda = agendas.find((a) => a.id === agendaId);
      console.log(
        "[refreshAgendaWithoutCache] Existing agenda data:",
        existingAgenda
      );

      // 3. 메타데이터 가져오기 (최대 2번 시도)
      console.log("[refreshAgendaWithoutCache] Fetching metadata...");
      const networkName = getNetworkName(chain.id);
      const metadataUrl = getMetadataUrl(agendaId, networkName);
      console.log("[refreshAgendaWithoutCache] Metadata URL:", metadataUrl);

      let metadata = null;
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        const response = await fetch(metadataUrl, {
          cache: "no-store", // 캐시 비활성화
        });

        if (response.ok) {
          metadata = await response.json();
          console.log(
            "[refreshAgendaWithoutCache] Metadata received from repository:",
            metadata
          );
          break;
        } else {
          console.log(
            `[refreshAgendaWithoutCache] No metadata found in repository (attempt ${
              retryCount + 1
            }/${maxRetries + 1})`
          );
          if (retryCount < maxRetries) {
            console.log("[refreshAgendaWithoutCache] Retrying in 2 second...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          retryCount++;
        }
      }

      // 4. 아젠다 데이터와 메타데이터 결합
      const updatedAgenda: AgendaWithMetadata = {
        ...(agendaData as unknown as AgendaWithMetadata),
        id: agendaId,
        title: metadata?.title || existingAgenda?.title,
        description: metadata?.description || existingAgenda?.description,
        creator: {
          address: getCreatorAddress(metadata?.creator),
          signature: getCreatorSignature(metadata?.creator),
        },
        snapshotUrl: metadata?.snapshotUrl || existingAgenda?.snapshotUrl,
        discourseUrl: metadata?.discourseUrl || existingAgenda?.discourseUrl,
        network: metadata?.network || existingAgenda?.network,
        transaction: metadata?.transaction || existingAgenda?.transaction,
        actions: metadata?.actions,
      };
      console.log("[refreshAgendaWithoutCache] Combined data:", updatedAgenda);

      // 5. 기존 아젠다 목록 업데이트
      setAgendas((prevAgendas) => {
        const existingAgendas = new Map(prevAgendas.map((a) => [a.id, a]));
        existingAgendas.set(agendaId, updatedAgenda);
        return Array.from(existingAgendas.values());
      });
      console.log("[refreshAgendaWithoutCache] Agenda list updated");

      return updatedAgenda;
    } catch (err) {
      console.error(
        "[refreshAgendaWithoutCache] Error refreshing agenda:",
        err
      );
      return null;
    }
  };

  // 아젠다 가져오기 함수
  const getAgenda = async (
    agendaId: number
  ): Promise<AgendaWithMetadata | null> => {
    try {
      // 2. 컨텍스트에 없으면 컨트랙트에서 조회
      console.log("Agenda not found in context, fetching from contract...");
      const publicClient = createPublicClient({
        chain: {
          ...chain,
          id: chain.id,
        },
        transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
      });

      // 아젠다 데이터 가져오기
      const agendaData = await publicClient.readContract({
        address: DAO_AGENDA_MANAGER_ADDRESS,
        abi: DAO_AGENDA_MANAGER_ABI,
        functionName: "agendas",
        args: [BigInt(agendaId)],
      });

      // 메타데이터 가져오기
      const metadata = await getAllAgendaMetadata([agendaId]);

      // 아젠다 데이터와 메타데이터 결합
      const newAgenda: AgendaWithMetadata = {
        ...(agendaData as unknown as AgendaWithMetadata),
        id: agendaId,
        title: metadata[agendaId]?.title,
        description: metadata[agendaId]?.description,
        creator: {
          address: getCreatorAddress(metadata[agendaId]?.creator),
          signature: getCreatorSignature(metadata[agendaId]?.creator),
        },
        snapshotUrl: metadata[agendaId]?.snapshotUrl,
        discourseUrl: metadata[agendaId]?.discourseUrl,
        network: metadata[agendaId]?.network,
        transaction: metadata[agendaId]?.transaction,
        actions: metadata[agendaId]?.actions,
      };
      console.log("getAgenda", agendaId, newAgenda);

      return newAgenda;
    } catch (err) {
      console.error("Error fetching agenda:", err);
      return null;
    }
  };

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

  const value = useMemo(
    () => ({
      agendas,
      isLoading,
      error,
      refreshAgendas: fetchAgendas,
      refreshAgenda,
      refreshAgendaWithoutCache,
      getAgenda,
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
      quorum,
      isCommitteeMember,
      getVoterInfos,
    }),
    [
      agendas,
      isLoading,
      error,
      fetchAgendas,
      refreshAgenda,
      refreshAgendaWithoutCache,
      getAgenda,
      statusMessage,
      events,
      isPolling,
      progress,
      createAgendaFees,
      minimumNoticePeriodSeconds,
      minimumVotingPeriodSeconds,
      quorum,
      isCommitteeMember,
      getVoterInfos,
    ]
  );

  return (
    <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>
  );
}

export function useAgenda() {
  const context = useContext(AgendaContext);

  if (context === undefined) {
    throw new Error("useAgenda must be used within an AgendaProvider");
  }
  return context;
}
