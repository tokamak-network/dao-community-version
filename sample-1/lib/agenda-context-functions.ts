/**
 * 아젠다 컨텍스트 함수들 모듈화
 * DAO 패턴과 같은 방식으로 Factory 함수 사용
 */
import { AgendaWithMetadata, AgendaCreatedEvent } from "@/types/agenda";
import { CONTRACTS, CONTRACT_READ_SETTINGS } from "@/config/contracts";
import { daoAgendaManagerAbi } from "@/abis/dao-agenda-manager";
import { DAO_ABI } from "@/abis/dao";
import { chain } from "@/config/chain";
import { queueRPCRequest, getSharedPublicClient } from "@/lib/shared-rpc-client";
import { MESSAGES } from "@/constants/dao";
import {
  getAllAgendaMetadata,
  getNetworkName,
  getMetadataUrl,
  AgendaMetadata
} from "@/lib/utils";
// useCallback 제거 - 팩토리 함수에서는 일반 function 사용

// 상태 setter 타입 정의
interface AgendaStateSetters {
  setAgendas: React.Dispatch<React.SetStateAction<AgendaWithMetadata[]>>;
  setIsLoadingAgendas: React.Dispatch<React.SetStateAction<boolean>>;
  setAgendasError: React.Dispatch<React.SetStateAction<string | null>>;
  setStatusMessage?: React.Dispatch<React.SetStateAction<string>>;
  setAgendaStatusMessage: React.Dispatch<React.SetStateAction<string>>;
  setHasLoadedOnce: React.Dispatch<React.SetStateAction<boolean>>;
  setEvents: React.Dispatch<React.SetStateAction<AgendaCreatedEvent[]>>;
  setIsPolling: React.Dispatch<React.SetStateAction<boolean>>;
  setProgress: React.Dispatch<React.SetStateAction<{
    current: bigint;
    total: bigint;
    percentage: number;
  } | null>>;
  setCreateAgendaFees: React.Dispatch<React.SetStateAction<bigint | null>>;
  setMinimumNoticePeriodSeconds: React.Dispatch<React.SetStateAction<bigint | null>>;
  setMinimumVotingPeriodSeconds: React.Dispatch<React.SetStateAction<bigint | null>>;
  setAgendaQuorum: React.Dispatch<React.SetStateAction<bigint | null>>;
}

// Creator 정보 처리 헬퍼 함수들
export const getCreatorAddress = (creator: unknown): `0x${string}` => {
  if (typeof creator === "string" && creator.startsWith("0x")) {
    return creator as `0x${string}`;
  }
  if (typeof creator === "object" && creator && "address" in creator) {
    return (creator as any).address as `0x${string}`;
  }
  return "0x0000000000000000000000000000000000000000" as `0x${string}`;
};

export const getCreatorSignature = (creator: unknown): string | undefined => {
  if (typeof creator === "object" && creator && "signature" in creator) {
    return (creator as any).signature;
  }
  return undefined;
};

// 아젠다와 이벤트 정보 결합 함수
export const updateAgendasWithCreatorInfo = (
  agendas: AgendaWithMetadata[],
  events: AgendaCreatedEvent[]
) => {
  if (!events.length || !agendas.length) return agendas;

  return agendas.map(agenda => {
    const createdEvent = events.find(event => Number(event.id) === agenda.id);
    if (createdEvent && createdEvent.from) {
      return {
        ...agenda,
        creator: {
          ...agenda.creator,
          address: createdEvent.from as `0x${string}`
        }
      };
    }
    return agenda;
  });
};

// 아젠다 컨텍스트 함수들 Factory
export function createAgendaContextFunctions(
  stateSetters: AgendaStateSetters,
  currentAgendas: AgendaWithMetadata[]
) {
  /**
   * 컨트랙트 설정값들 로드 (LOW 우선순위 - 환경설정값) - 순차 처리
   */
  const loadContractSettings = async () => {
    /**
     * 컨트랙트 설정값 로드 시작...
     */

    try {
      // 순차적으로 처리하여 RPC 부하 방지
      const fees = await queueRPCRequest(async () => {
        const publicClient = await getSharedPublicClient();
        return await publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
          abi: daoAgendaManagerAbi,
          functionName: 'createAgendaFees',
        });
      }, "Agenda: createAgendaFees 조회", "LOW");

      const noticePeriod = await queueRPCRequest(async () => {
        const publicClient = await getSharedPublicClient();
        return await publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
          abi: daoAgendaManagerAbi,
          functionName: 'minimumNoticePeriodSeconds',
        });
      }, "Agenda: minimumNoticePeriodSeconds 조회", "LOW");

      const votingPeriod = await queueRPCRequest(async () => {
        const publicClient = await getSharedPublicClient();
        return await publicClient.readContract({
          address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
          abi: daoAgendaManagerAbi,
          functionName: 'minimumVotingPeriodSeconds',
        });
      }, "Agenda: minimumVotingPeriodSeconds 조회", "LOW");

      const quorum = await queueRPCRequest(async () => {
        const publicClient = await getSharedPublicClient();
        return await publicClient.readContract({
          address: CONTRACTS.daoCommittee.address as `0x${string}`,
          abi: DAO_ABI,
          functionName: 'quorum',
        });
      }, "Agenda: quorum 조회", "LOW");

      stateSetters.setCreateAgendaFees(fees as bigint);
      stateSetters.setMinimumNoticePeriodSeconds(noticePeriod as bigint);
      stateSetters.setMinimumVotingPeriodSeconds(votingPeriod as bigint);
      stateSetters.setAgendaQuorum(quorum as bigint);

      /**
       * 컨트랙트 설정값 로드 완료
       */
    } catch (error) {
      console.error("❌ 컨트랙트 설정값 로드 실패:", error);
    }
  };

  /**
   * 아젠다 총 개수 조회 (MEDIUM 우선순위 - 아젠다 목록)
   */
  const getTotalAgendaCount = async (): Promise<number> => {
    return await queueRPCRequest(async () => {
      const publicClient = await getSharedPublicClient();
      const result = await publicClient.readContract({
        address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
        abi: daoAgendaManagerAbi,
        functionName: "numAgendas",
      });
      return Number(result);
    }, "Load total agenda count", "MEDIUM");
  };

  /**
   * 특정 아젠다 데이터 조회 (우선순위 동적 설정)
   * @param agendaId 아젠다 ID
   * @param priority 우선순위 ("MEDIUM": 목록용, "LOW": 상세정보용)
   */
  const getAgendaData = async (agendaId: number, priority: "MEDIUM" | "LOW" = "MEDIUM") => {
    return await queueRPCRequest(async () => {
      const publicClient = await getSharedPublicClient();
      return await publicClient.readContract({
        address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
        abi: daoAgendaManagerAbi,
        functionName: "agendas",
        args: [BigInt(agendaId)],
      });
    }, `Load agenda data for ID ${agendaId}`, priority);
  };

  // 아젠다 로드 함수
  const loadAgendas = async () => {
    stateSetters.setIsLoadingAgendas(true);
    stateSetters.setAgendasError(null);
    stateSetters.setAgendaStatusMessage(MESSAGES.LOADING.AGENDAS);

    try {
      const publicClient = await getSharedPublicClient();

      // 총 아젠다 개수 가져오기
      const numAgendas = await getTotalAgendaCount();
      const totalAgendas = Number(numAgendas);

      if (totalAgendas === 0) {
        stateSetters.setAgendas([]);
        stateSetters.setHasLoadedOnce(true);
        stateSetters.setAgendaStatusMessage("No agendas found");
        return;
      }

      // 각 아젠다 데이터 가져오기 (최신순으로 처리)
      const { BATCH_SIZE, BATCH_DELAY_MS } = CONTRACT_READ_SETTINGS;

      for (let i = totalAgendas - 1; i >= 0; i -= BATCH_SIZE) {
        const startIndex = Math.max(0, i - BATCH_SIZE + 1);
        const currentBatch = i - startIndex + 1;
        const processedCount = totalAgendas - i;
        const progress = Math.round((processedCount / totalAgendas) * 100);

        stateSetters.setAgendaStatusMessage(`Loading agendas... (${processedCount}/${totalAgendas}) [${progress}%]`);

        const batchPromises = Array.from({ length: currentBatch }, (_, j) => {
          const agendaId = i - j; // 최신순으로 가져오기
          return getAgendaData(agendaId).then((agendaData: any) => {
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

        // 순차적으로 처리하여 Rate Limiting 방지
        const batchResults: (AgendaWithMetadata | null)[] = [];
        for (const promise of batchPromises) {
          try {
            const result = await promise;
            batchResults.push(result);
            // Rate limiting을 위한 짧은 대기
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (error) {
            console.warn('배치 처리 중 오류:', error);
            batchResults.push(null);
          }
        }
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

        // 배치 결과를 즉시 상태에 추가 (점진적 표시)
        stateSetters.setAgendas((prev) => {
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
      stateSetters.setHasLoadedOnce(true);
      stateSetters.setAgendaStatusMessage(`Loaded ${totalAgendas} agendas from AgendaManager contract`);

    } catch (err) {
      console.error("Failed to load agendas from AgendaManager:", err);
      stateSetters.setAgendaStatusMessage("Failed to load agendas from blockchain");
      stateSetters.setAgendas([]);
    } finally {
      stateSetters.setIsLoadingAgendas(false);
    }
  };

  // 실시간 아젠다 데이터 업데이트 함수
  const updateAgendaData = async (agendaId: number, shouldSort: boolean = false) => {
    try {
      const publicClient = await getSharedPublicClient();
      const agendaData = await getAgendaData(agendaId, "LOW");

      // 메타데이터 가져오기
      let metadata: AgendaMetadata | null = null;
      try {
        const networkName = getNetworkName(chain.id);
        const metadataUrl = getMetadataUrl(agendaId, networkName);
        const response = await fetch(metadataUrl, { cache: "no-store" });
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (error) {
        console.warn(`Failed to load metadata for agenda ${agendaId}:`, error);
      }

      // 상태 업데이트 및 반환값 준비
      let updatedAgenda: AgendaWithMetadata;
      stateSetters.setAgendas((prevAgendas) => {
        const existingAgenda = prevAgendas.find((a) => a.id === agendaId);
        updatedAgenda = {
          ...agendaData,
          id: agendaId,
          voters: Array.from(agendaData.voters),
          title: metadata?.title || existingAgenda?.title || `Agenda #${agendaId}`,
          description: metadata?.description || existingAgenda?.description || `-`,
          creator: {
            address: metadata ? getCreatorAddress(metadata.creator) : (existingAgenda?.creator?.address || "0x0000000000000000000000000000000000000000" as `0x${string}`),
            signature: metadata ? getCreatorSignature(metadata.creator) : existingAgenda?.creator?.signature,
          },
          snapshotUrl: metadata?.snapshotUrl || existingAgenda?.snapshotUrl,
          discourseUrl: metadata?.discourseUrl || existingAgenda?.discourseUrl,
          network: metadata?.network || existingAgenda?.network,
          transaction: metadata?.transaction || existingAgenda?.transaction,
          actions: metadata?.actions || existingAgenda?.actions,
        };
        const existingAgendas = new Map(prevAgendas.map((a) => [a.id, a]));
        existingAgendas.set(agendaId, updatedAgenda);
        const newAgendas = Array.from(existingAgendas.values());
        return shouldSort ? newAgendas.sort((a, b) => b.id - a.id) : newAgendas;
      });
      return updatedAgenda!;
    } catch (error) {
      console.error("❌ updateAgendaData error:", error);
      return null;
    }
  };

  // 트랜잭션 데이터 가져오기
  const getTransactionData = async (txHash: string): Promise<string | null> => {
    try {
      const publicClient = await getSharedPublicClient();

      const transaction = await queueRPCRequest(
        () => publicClient.getTransaction({
          hash: txHash as `0x${string}`
        }),
        `Get transaction data for ${txHash}`,
        'LOW' // LOW 우선순위
      );

      return transaction.input;
    } catch (error) {
      console.error(`Failed to get transaction data for ${txHash}:`, error);
      return null;
    }
  };

  // VoterInfos 조회 함수
  const getVoterInfos = async (agendaId: number, voters: string[]) => {
    try {
      const publicClient = await getSharedPublicClient();

      // 순차적으로 처리하여 Rate Limiting 방지
      const voterInfos = [];
      for (const voter of voters) {
        try {
          const info = await queueRPCRequest(
            () => publicClient.readContract({
              address: CONTRACTS.daoAgendaManager.address as `0x${string}`,
              abi: daoAgendaManagerAbi,
              functionName: 'voterInfos',
              args: [BigInt(agendaId), voter as `0x${string}`],
            }),
            `Get voter info for ${voter} on agenda ${agendaId}`,
            'LOW' // LOW 우선순위
          ) as {
            isVoter: boolean;
            hasVoted: boolean;
            vote: bigint;
          };

          voterInfos.push(info);
          // Rate limiting을 위한 짧은 대기
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to get voter info for ${voter}:`, error);
          voterInfos.push({
            isVoter: false,
            hasVoted: false,
            vote: BigInt(0),
          });
        }
      }

      return voterInfos;
    } catch (error) {
      console.error('Failed to get voter infos:', error);
      return [];
    }
  };

  // 특정 아젠다 새로고침
  const refreshAgenda = async (agendaId: number) => {
    try {
      const publicClient = await getSharedPublicClient();

      const agendaData = await getAgendaData(agendaId, "LOW");

      // 기존 agenda 목록에서 해당 agenda만 업데이트
      stateSetters.setAgendas(prev => prev.map(agenda =>
        agenda.id === agendaId
          ? {
              ...agenda,
              ...agendaData,
              voters: Array.from(agendaData.voters),
            }
          : agenda
      ));

      /**
       * Refreshed agenda
       */
    } catch (error) {
      console.error(`Failed to refresh agenda ${agendaId}:`, error);
    }
  };

  // 아젠다 새로고침 (캐시 없이)
  const refreshAgendaWithoutCache = async (agendaId: number): Promise<AgendaWithMetadata | null> => {
    try {
      const publicClient = await getSharedPublicClient();

      const agendaData = await getAgendaData(agendaId, "LOW");

      // 메타데이터 로딩
      let metadata: AgendaMetadata | null = null;
      try {
        const networkName = getNetworkName(chain.id);
        const metadataUrl = getMetadataUrl(agendaId, networkName);

        const response = await fetch(metadataUrl, {
          cache: "no-store",
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
        description: metadata?.description || `-`,
        snapshotUrl: metadata?.snapshotUrl,
        discourseUrl: metadata?.discourseUrl,
        network: metadata?.network,
        transaction: metadata?.transaction,
        actions: metadata?.actions,
      };

      // creationCalldata 가져오기 (transaction이 있는 경우)
      if (metadata?.transaction) {
        try {
          const calldata = await getTransactionData(metadata.transaction);
          if (calldata) {
            updatedAgenda.creationCalldata = calldata;
          }
        } catch (error) {
          console.warn(`Failed to fetch calldata for agenda ${agendaId}:`, error);
        }
      }

      // 기존 아젠다 목록 업데이트
      stateSetters.setAgendas(prev => {
        const existingAgendas = new Map(prev.map(a => [a.id, a]));
        existingAgendas.set(agendaId, updatedAgenda);
        return Array.from(existingAgendas.values());
      });

      return updatedAgenda;
    } catch (error) {
      console.error(`Failed to refresh agenda without cache ${agendaId}:`, error);
      return null;
    }
  };

  // 아젠다 가져오기
  const getAgenda = async (agendaId: number): Promise<AgendaWithMetadata | null> => {
    // 메모리에서 찾기
    const existingAgenda = currentAgendas.find(agenda => agenda.id === agendaId);
    if (existingAgenda) {
      return existingAgenda;
    }

    // 메모리에 없으면 블록체인에서 가져오기
    return await refreshAgendaWithoutCache(agendaId);
  };

  // 전체 아젠다 새로고침
  const refreshAgendas = async () => {
    stateSetters.setHasLoadedOnce(false);
    await loadAgendas();
  };

  // 아젠다 업데이트 함수
  const updateAgendaCalldata = async (agendaId: number) => {
    try {
      const agenda = await getAgenda(agendaId);
      if (agenda && agenda.transaction) {
        const calldata = await getTransactionData(agenda.transaction);
        if (calldata) {
          stateSetters.setAgendas(prev => prev.map(agenda =>
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
  };

  return {
    loadContractSettings,
    loadAgendas,
    updateAgendaData,
    getVoterInfos,
    refreshAgenda,
    refreshAgendaWithoutCache,
    getAgenda,
    refreshAgendas,
    getTransactionData,
    updateAgendaCalldata,
  };
}