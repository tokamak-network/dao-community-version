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
import { useAccount } from 'wagmi';
import {
  AgendaWithMetadata,
  AgendaCreatedEvent,
  AgendaAction,
} from "@/types/agenda";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { daoAgendaManagerAbi } from "@/abis/dao-agenda-manager";
import { DAO_ABI } from "@/abis/dao";
import { chain } from "@/config/chain";
import { createRobustPublicClient, readContractWithRetry } from "@/lib/rpc-utils";
import { MESSAGES, AGENDA_STATUS } from "@/constants/dao";
import { createPublicClient, http } from "viem";
import {
  getAllAgendaMetadata,
  fetchAgendaEvents,
  getLatestBlockNumber,
  getNetworkName,
  getMetadataUrl,
  AgendaMetadata
} from "@/lib/utils";

interface AgendaContextType {
  agendas: AgendaWithMetadata[];
  isLoading: boolean;
  error: string | null;
  refreshAgendas: () => Promise<void>;
  refreshAgenda: (agendaId: number) => Promise<void>;
  refreshAgendaWithoutCache: (agendaId: number) => Promise<AgendaWithMetadata | null>;
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
  getTransactionData: (txHash: string) => Promise<string | null>;
  updateAgendaCalldata: (agendaId: number) => Promise<void>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

// Creator 정보 처리 헬퍼 함수들
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

// 아젠다 상태 텍스트 변환
const getAgendaStatusText = (status: number): string => {
  switch (status) {
    case 1: return "NOTICE";
    case 2: return "VOTING";
    case 3: return "WAITING EXECUTION";
    case 4: return "EXECUTED";
    case 5: return "ENDED";
    default: return "UNKNOWN";
  }
};

// 아젠다 상태 색상
const getAgendaStatusColor = (status: number): string => {
  switch (status) {
    case 1: return "yellow"; // NOTICE
    case 2: return "purple"; // VOTING
    case 3: return "blue"; // WAITING EXECUTION
    case 4: return "green"; // EXECUTED
    case 5: return "red"; // ENDED
    default: return "gray";
  }
};

export function AgendaProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();

  // 상태 관리
  const [agendas, setAgendas] = useState<AgendaWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [events, setEvents] = useState<AgendaCreatedEvent[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [progress, setProgress] = useState<{
    current: bigint;
    total: bigint;
    percentage: number;
  } | null>(null);

  // 컨트랙트 설정값들
  const [createAgendaFees, setCreateAgendaFees] = useState<bigint | null>(null);
  const [minimumNoticePeriodSeconds, setMinimumNoticePeriodSeconds] = useState<bigint | null>(null);
  const [minimumVotingPeriodSeconds, setMinimumVotingPeriodSeconds] = useState<bigint | null>(null);
  const [quorum, setQuorum] = useState<bigint | null>(null);
  const [committeeMembers, setCommitteeMembers] = useState<string[]>([]);

  // 컨트랙트 설정값들 로드
  useEffect(() => {
    const loadContractSettings = async () => {
      try {
        const publicClient = await createRobustPublicClient();

        // AgendaManager에서 설정값들 가져오기
        const [fees, minNotice, minVoting] = await Promise.all([
          readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
              abi: daoAgendaManagerAbi,
              functionName: 'createAgendaFees',
            }) as Promise<bigint>,
            'Create agenda fees'
          ),
          readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoAgendaManager.address,
              abi: daoAgendaManagerAbi,
              functionName: 'minimumNoticePeriodSeconds',
            }) as Promise<bigint>,
            'Minimum notice period'
          ),
          readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoAgendaManager.address,
              abi: daoAgendaManagerAbi,
              functionName: 'minimumVotingPeriodSeconds',
            }) as Promise<bigint>,
            'Minimum voting period'
          ),
        ]);

        setCreateAgendaFees(fees);
        setMinimumNoticePeriodSeconds(minNotice);
        setMinimumVotingPeriodSeconds(minVoting);

        // DAO Committee에서 quorum 가져오기
        const quorumValue = await readContractWithRetry(
          () => publicClient.readContract({
            address: CONTRACTS.daoCommittee.address,
            abi: DAO_ABI,
            functionName: 'quorum',
          }) as Promise<bigint>,
          'Quorum value'
        );
        setQuorum(quorumValue);

      } catch (error) {
        console.error('Failed to load contract settings:', error);
      }
    };

    loadContractSettings();
  }, []);

  // 위원회 멤버 정보 로드
  useEffect(() => {
    const loadCommitteeMembers = async () => {
      try {
        const publicClient = await createRobustPublicClient();

        // maxMember 가져오기
        const maxMember = await readContractWithRetry(
          () => publicClient.readContract({
            address: CONTRACTS.daoCommittee.address,
            abi: DAO_ABI,
            functionName: 'maxMember',
          }) as Promise<bigint>,
          'Max member count'
        );

        const members: string[] = [];
        for (let i = 0; i < Number(maxMember); i++) {
          try {
            const member = await readContractWithRetry(
              () => publicClient.readContract({
                address: CONTRACTS.daoCommittee.address,
                abi: DAO_ABI,
                functionName: 'members',
                args: [BigInt(i)],
              }) as Promise<string>,
              `Member at slot ${i}`
            );

            if (member && member !== '0x0000000000000000000000000000000000000000') {
              members.push(member);
            }
          } catch (error) {
            // 빈 슬롯은 무시
            continue;
          }
        }

        setCommitteeMembers(members);
      } catch (error) {
        console.error('Failed to load committee members:', error);
      }
    };

    loadCommitteeMembers();
  }, []);

  // 아젠다 로드 함수
  const loadAgendas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStatusMessage(MESSAGES.LOADING.AGENDAS);

    try {
      const publicClient = await createRobustPublicClient();

      // 총 아젠다 개수 가져오기
      const numAgendas = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address,
          abi: daoAgendaManagerAbi,
          functionName: 'numAgendas',
        }) as Promise<bigint>,
        'Total agendas count'
      );

      const totalAgendas = Number(numAgendas);
      console.log('📊 Total agendas:', totalAgendas);

      if (totalAgendas === 0) {
        setAgendas([]);
        setHasLoadedOnce(true);
        setStatusMessage("No agendas found");
        return;
      }

      // 각 아젠다 데이터 가져오기 (최신순으로 처리)
      const { BATCH_SIZE, BATCH_DELAY_MS } = CONTRACT_READ_SETTINGS;

      for (let i = totalAgendas - 1; i >= 0; i -= BATCH_SIZE) {
        const startIndex = Math.max(0, i - BATCH_SIZE + 1);
        const currentBatch = i - startIndex + 1;
        const progress = Math.round(((totalAgendas - i) / totalAgendas) * 100);

        setStatusMessage(`Loading agendas... (${totalAgendas - i}/${totalAgendas}) [${progress}%]`);

        const batchPromises = Array.from({ length: currentBatch }, (_, j) => {
          const agendaId = i - j; // 최신순으로 가져오기
          return readContractWithRetry(
            () => publicClient.readContract({
              address: CONTRACTS.daoAgendaManager.address,
              abi: daoAgendaManagerAbi,
              functionName: 'agendas',
              args: [BigInt(agendaId)],
            }) as Promise<{
              createdTimestamp: bigint;
              noticeEndTimestamp: bigint;
              votingPeriodInSeconds: bigint;
              votingStartedTimestamp: bigint;
              votingEndTimestamp: bigint;
              executableLimitTimestamp: bigint;
              executedTimestamp: bigint;
              countingYes: bigint;
              countingNo: bigint;
              countingAbstain: bigint;
              status: number;
              result: number;
              voters: readonly string[];
              executed: boolean;
            }>,
            `Agenda ${agendaId}`
          ).then((agendaData) => {
            // AgendaWithMetadata 인터페이스에 맞게 변환
            const agenda: AgendaWithMetadata = {
              ...agendaData,
              id: agendaId,
              voters: Array.from(agendaData.voters),
              creator: {
                address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
                signature: ""
              }
            };

            return agenda;
          }).catch((error) => {
            console.warn(`Failed to fetch agenda ${agendaId}:`, error);
            return null;
          });
        });

        const batchResults = await Promise.all(batchPromises);
        const validResults = batchResults.filter((result): result is AgendaWithMetadata => result !== null);

        // 메타데이터 로딩 (배치 단위로)
        const agendaIds = validResults.map(agenda => agenda.id);
        if (agendaIds.length > 0) {
          try {
            const metadataMap = await getAllAgendaMetadata(agendaIds);

                        // 메타데이터를 아젠다 데이터와 결합
            validResults.forEach((agenda) => {
              const metadata = metadataMap[agenda.id];
              if (metadata) {
                agenda.title = metadata.title || agenda.title;
                agenda.description = metadata.description || agenda.description;
                agenda.creator = {
                  address: getCreatorAddress(metadata.creator),
                  signature: getCreatorSignature(metadata.creator),
                };
                agenda.snapshotUrl = metadata.snapshotUrl;
                agenda.discourseUrl = metadata.discourseUrl;
                agenda.network = metadata.network;
                agenda.transaction = metadata.transaction;
                agenda.actions = metadata.actions;
              }
            });

            // 순차적으로 calldata 가져오기 (rate limiting 방지)
            for (const agenda of validResults) {
              const metadata = metadataMap[agenda.id];
              if (metadata?.transaction && !agenda.creationCalldata) {
                try {
                  const calldata = await getTransactionData(metadata.transaction);
                  if (calldata) {
                    agenda.creationCalldata = calldata;
                  }
                  // Rate limiting을 위한 짧은 대기
                  await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                  console.warn(`Failed to fetch calldata for agenda ${agenda.id}:`, error);
                }
              }
            }
          } catch (error) {
            console.warn('Failed to load metadata for batch:', error);
          }
        }
        console.log(validResults)
        // 배치 결과를 즉시 상태에 추가 (점진적 표시)
        setAgendas((prev) => {
          const existingAgendas = new Map(prev.map((a) => [a.id, a]));
          let hasChanges = false;

          validResults.forEach((newAgenda) => {
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

        // 마지막 배치가 아니면 잠시 대기 (Rate limiting)
        if (startIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }
      setHasLoadedOnce(true);
      setStatusMessage(`Loaded ${totalAgendas} agendas from AgendaManager contract`);

    } catch (err) {
      console.error("Failed to load agendas from AgendaManager:", err);
      setError("Failed to load agendas from blockchain");
      setStatusMessage("Error loading agendas from AgendaManager contract");
      setAgendas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 이벤트 로딩 함수
  const fetchEvents = useCallback(async () => {
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
          id: chain.id,
          name: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls,
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
              address: CONTRACTS.daoAgendaManager.address,
              abi: daoAgendaManagerAbi,
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
          break;
        }
      }
    } catch (err) {
      if (!isMounted || abortController.signal.aborted) return;
      console.error("Error fetching events:", err);
      setError("Failed to fetch events. Please try again later.");
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
  }, []);

  // 초기 아젠다 로드
  useEffect(() => {
    if (!hasLoadedOnce) {
      loadAgendas();
    }
  }, [hasLoadedOnce, loadAgendas]);

  // 이벤트 로딩 시작
  useEffect(() => {
    if (hasLoadedOnce && agendas.length > 0) {
      fetchEvents();
    }
  }, [hasLoadedOnce, agendas.length, fetchEvents]);

  // 이벤트와 아젠다 결합하는 함수
  const updateAgendasWithCreatorInfo = useCallback((
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
  }, []);

  // 이벤트가 변경될 때마다 아젠다 목록 업데이트
  useEffect(() => {
    if (events.length > 0 && agendas.length > 0) {
      const updatedAgendas = updateAgendasWithCreatorInfo(agendas, events);
      setAgendas(updatedAgendas);
    }
  }, [events, updateAgendasWithCreatorInfo]);

  // VoterInfos 조회 함수
  const getVoterInfos = useCallback(async (agendaId: number, voters: string[]) => {
    try {
      const publicClient = await createRobustPublicClient();

      const voterInfos = await Promise.all(
        voters.map(async (voter) => {
          try {
            const info = await readContractWithRetry(
              () => publicClient.readContract({
                address: CONTRACTS.daoAgendaManager.address,
                abi: daoAgendaManagerAbi,
                functionName: 'voterInfos',
                args: [BigInt(agendaId), voter as `0x${string}`],
              }) as Promise<{
                isVoter: boolean;
                hasVoted: boolean;
                vote: bigint;
              }>,
              `Voter info for ${voter}`
            );

            return info;
          } catch (error) {
            console.error(`Failed to get voter info for ${voter}:`, error);
            return {
              isVoter: false,
              hasVoted: false,
              vote: BigInt(0),
            };
          }
        })
      );

      return voterInfos;
    } catch (error) {
      console.error('Failed to get voter infos:', error);
      return [];
    }
  }, []);

  // 특정 아젠다 새로고침
  const refreshAgenda = useCallback(async (agendaId: number) => {
    try {
      const publicClient = await createRobustPublicClient();

      const agendaData = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address,
          abi: daoAgendaManagerAbi,
          functionName: 'agendas',
          args: [BigInt(agendaId)],
        }) as Promise<{
          createdTimestamp: bigint;
          noticeEndTimestamp: bigint;
          votingPeriodInSeconds: bigint;
          votingStartedTimestamp: bigint;
          votingEndTimestamp: bigint;
          executableLimitTimestamp: bigint;
          executedTimestamp: bigint;
          countingYes: bigint;
          countingNo: bigint;
          countingAbstain: bigint;
          status: number;
          result: number;
          voters: readonly string[];
          executed: boolean;
        }>,
        `Refresh agenda ${agendaId}`
      );

             // 기존 agenda 목록에서 해당 agenda만 업데이트
       setAgendas(prev => prev.map(agenda =>
         agenda.id === agendaId
           ? {
               ...agenda,
               ...agendaData,
               voters: Array.from(agendaData.voters),
             }
           : agenda
       ));

      console.log(`✅ Refreshed agenda ${agendaId}`);
    } catch (error) {
      console.error(`Failed to refresh agenda ${agendaId}:`, error);
    }
  }, []);

  // 아젠다 새로고침 (캐시 없이)
  const refreshAgendaWithoutCache = useCallback(async (agendaId: number): Promise<AgendaWithMetadata | null> => {
    try {
      const publicClient = await createRobustPublicClient();

      const agendaData = await readContractWithRetry(
        () => publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address,
          abi: daoAgendaManagerAbi,
          functionName: 'agendas',
          args: [BigInt(agendaId)],
        }) as Promise<{
          createdTimestamp: bigint;
          noticeEndTimestamp: bigint;
          votingPeriodInSeconds: bigint;
          votingStartedTimestamp: bigint;
          votingEndTimestamp: bigint;
          executableLimitTimestamp: bigint;
          executedTimestamp: bigint;
          countingYes: bigint;
          countingNo: bigint;
          countingAbstain: bigint;
          status: number;
          result: number;
          voters: readonly string[];
          executed: boolean;
        }>,
        `Get agenda ${agendaId} without cache`
      );

             // 메타데이터 로딩
      let metadata: AgendaMetadata | null = null;
      try {
        const networkName = getNetworkName(chain.id);
        const metadataUrl = getMetadataUrl(agendaId, networkName);

        const response = await fetch(metadataUrl, {
          cache: "no-store", // 캐시 비활성화
        });

        if (response.ok) {
          metadata = await response.json();
        }
      } catch (error) {
        console.warn(`Failed to load metadata for agenda ${agendaId}:`, error);
      }

      const updatedAgenda: AgendaWithMetadata = {
         ...agendaData,
         id: agendaId,
         voters: Array.from(agendaData.voters),
         creator: {
           address: metadata ? getCreatorAddress(metadata.creator) : "0x0000000000000000000000000000000000000000" as `0x${string}`,
           signature: metadata ? getCreatorSignature(metadata.creator) : undefined,
         },
         title: metadata?.title || `Agenda #${agendaId}`,
         description: metadata?.description || `Agenda ${agendaId} from blockchain`,
         snapshotUrl: metadata?.snapshotUrl,
         discourseUrl: metadata?.discourseUrl,
         network: metadata?.network,
         transaction: metadata?.transaction,
         actions: metadata?.actions,
       };

      // 기존 아젠다 목록 업데이트
      setAgendas(prev => {
        const existingAgendas = new Map(prev.map(a => [a.id, a]));
        existingAgendas.set(agendaId, updatedAgenda);
        return Array.from(existingAgendas.values());
      });

      return updatedAgenda;
    } catch (error) {
      console.error(`Failed to refresh agenda without cache ${agendaId}:`, error);
      return null;
    }
  }, []);

  // 아젠다 가져오기
  const getAgenda = useCallback(async (agendaId: number): Promise<AgendaWithMetadata | null> => {
    // 메모리에서 찾기
    const existingAgenda = agendas.find(agenda => agenda.id === agendaId);
    if (existingAgenda) {
      return existingAgenda;
    }

    // 메모리에 없으면 블록체인에서 가져오기
    return await refreshAgendaWithoutCache(agendaId);
  }, [agendas, refreshAgendaWithoutCache]);

  // 전체 아젠다 새로고침
  const refreshAgendas = useCallback(async () => {
    setHasLoadedOnce(false);
    await loadAgendas();
  }, [loadAgendas]);

  // 트랜잭션 데이터 가져오기
  const getTransactionData = useCallback(async (txHash: string): Promise<string | null> => {
    try {
      const publicClient = await createRobustPublicClient();

      const transaction = await publicClient.getTransaction({
        hash: txHash as `0x${string}`
      });

      return transaction.input;
    } catch (error) {
      console.error(`Failed to get transaction data for ${txHash}:`, error);
      return null;
    }
  }, []);

  // 아젠다 업데이트 함수
  const updateAgendaCalldata = useCallback(async (agendaId: number) => {
    try {
      const agenda = await getAgenda(agendaId);
      if (agenda && agenda.transaction) {
        const calldata = await getTransactionData(agenda.transaction);
        if (calldata) {
          setAgendas(prev => prev.map(agenda =>
            agenda.id === agendaId
              ? {
                  ...agenda,
                  creationCalldata: calldata,
                }
              : agenda
          ));
        }
      }
    } catch (error) {
      console.error(`Failed to update agenda ${agendaId} calldata:`, error);
    }
  }, [getAgenda, getTransactionData]);

  const contextValue = useMemo(() => ({
    agendas,
    isLoading,
    error,
    refreshAgendas,
    refreshAgenda,
    refreshAgendaWithoutCache,
    getAgenda,
    statusMessage,
    contract: {
      address: CONTRACTS.daoAgendaManager.address,
      abi: daoAgendaManagerAbi,
      chainId: chain.id,
    },
    daoContract: {
      address: CONTRACTS.daoCommittee.address,
      abi: DAO_ABI,
      chainId: chain.id,
    },
    events,
    isPolling,
    progress,
    createAgendaFees,
    minimumNoticePeriodSeconds,
    minimumVotingPeriodSeconds,
    quorum,
    getVoterInfos,
    getTransactionData,
    updateAgendaCalldata,
  }), [
    agendas,
    isLoading,
    error,
    refreshAgendas,
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
    getVoterInfos,
    getTransactionData,
    updateAgendaCalldata,
  ]);

  return (
    <AgendaContext.Provider value={contextValue}>
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