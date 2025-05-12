"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Header from "@/components/header"
import Navbar from "@/components/navbar";
import Link from "next/link";
import ProposalLists from "./proposal-lists";
import {
  useContractRead,
  useContractReads,
  useWatchContractEvent,
  usePublicClient,
} from "wagmi";
import { AgendaStatus } from "@/lib/utils";

const DAO_AGENDA_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS as `0x${string}`;

const DAO_COMMITTEE_PROXY_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`;

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

const EVENT_START_BLOCK = BigInt(
  process.env.NEXT_PUBLIC_EVENT_START_BLOCK || "0"
);

const DAO_AGENDA_MANAGER_ABI = [
  {
    inputs: [],
    name: "numAgendas",
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ type: "uint256", name: "_index" }],
    name: "agendas",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "createdTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "noticeEndTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingPeriodInSeconds",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingStartedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "votingEndTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "executableLimitTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "executedTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingYes",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingNo",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "countingAbstain",
            type: "uint256",
          },
          {
            internalType: "enum LibAgenda.AgendaStatus",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "enum LibAgenda.AgendaResult",
            name: "result",
            type: "uint8",
          },
          {
            internalType: "address[]",
            name: "voters",
            type: "address[]",
          },
          {
            internalType: "bool",
            name: "executed",
            type: "bool",
          },
        ],
        internalType: "struct LibAgenda.Agenda",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const AgendaResult = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
} as const;

interface AgendaCreatedEvent {
  from: `0x${string}`;
  id: bigint;
  targets: `0x${string}`[];
  noticePeriodSeconds: bigint;
  votingPeriodSeconds: bigint;
  atomicExecute: boolean;
}

export interface Agenda {
  id: number;
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
  voters: string[];
  executed: boolean;
  creator: string;
  targets?: string[];
  atomicExecute?: boolean;
}

type AgendaContractResult = {
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
  voters: string[];
  executed: boolean;
  creator: string;
};

export default function Proposals() {
  const [activeTab, setActiveTab] = useState("onchain");
  const [daoProposalIds, setDaoProposalIds] = useState<number[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<AgendaCreatedEvent[]>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [hasFetchedEvents, setHasFetchedEvents] = useState(false);

  const {
    data: agendaCount,
    isError,
    error,
    isLoading,
  } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "numAgendas",
    chainId: CHAIN_ID,
  });

  useEffect(() => {
    console.log("Component mounted");
    console.log("DAO_AGENDA_MANAGER_ADDRESS:", DAO_AGENDA_MANAGER_ADDRESS);
    console.log("Current agendaCount:", agendaCount);
    console.log("Is loading:", isLoading);
    if (isError) {
      console.error("Contract read error:", error);
    }
  }, [isLoading, isError, error]);

  useEffect(() => {
    console.log("agendaCount changed:", agendaCount);
    if (agendaCount) {
      console.log(
        "Total number of agendas from contract:",
        Number(agendaCount)
      );
      const count = Number(agendaCount);
      const ids = Array.from({ length: count }, (_, i) => count - i - 1);
      console.log("DAO Agenda IDs:", ids);
      setDaoProposalIds(ids);
    } else {
      console.log("agendaCount is undefined or null");
    }
  }, [agendaCount]);

  const {
    data: agendaDetails,
    isError: isAgendaDetailsError,
    error: agendaDetailsError,
    isLoading: isAgendaDetailsLoading,
  } = useContractReads({
    contracts: daoProposalIds.map((id) => ({
      address: DAO_AGENDA_MANAGER_ADDRESS,
      abi: DAO_AGENDA_MANAGER_ABI,
      functionName: "agendas",
      args: [id],
      chainId: CHAIN_ID,
    })),
  });

  useEffect(() => {
    console.log("agendaDetails changed:", agendaDetails);
    console.log("isAgendaDetailsLoading:", isAgendaDetailsLoading);
    if (isAgendaDetailsError) {
      console.error("Agenda details error:", agendaDetailsError);
    }
    if (agendaDetails) {
      const agendaList = agendaDetails
        .map((detail, index) => {
          if (!detail.result) {
            console.log(
              `No result for agenda ${daoProposalIds[index]}:`,
              detail
            );
            return null;
          }
          const result = detail.result as unknown as AgendaContractResult;
          return {
            id: daoProposalIds[index],
            createdTimestamp: result.createdTimestamp,
            noticeEndTimestamp: result.noticeEndTimestamp,
            votingPeriodInSeconds: result.votingPeriodInSeconds,
            votingStartedTimestamp: result.votingStartedTimestamp,
            votingEndTimestamp: result.votingEndTimestamp,
            executableLimitTimestamp: result.executableLimitTimestamp,
            executedTimestamp: result.executedTimestamp,
            countingYes: result.countingYes,
            countingNo: result.countingNo,
            countingAbstain: result.countingAbstain,
            status: result.status,
            result: result.result,
            voters: result.voters,
            executed: result.executed,
            creator: result.creator || "",
            targets: [] as string[],
            atomicExecute: false,
          } as Agenda;
        })
        .filter((agenda): agenda is Agenda => agenda !== null);

      console.log("Agendas data:", agendaList);
      setAgendas(agendaList);
      // Reset hasFetchedEvents when agendas are loaded
      setHasFetchedEvents(false);
    }
  }, [
    agendaDetails,
    daoProposalIds,
    isAgendaDetailsError,
    isAgendaDetailsLoading,
  ]);

  // Fetch historical events and watch for new events using wagmi
  const publicClient = usePublicClient();

  // Watch for new events
  useWatchContractEvent({
    address: DAO_COMMITTEE_PROXY_ADDRESS,
    abi: [
      {
        anonymous: false,
        inputs: [
          { indexed: true, name: "from", type: "address" },
          { indexed: true, name: "id", type: "uint256" },
          { indexed: false, name: "targets", type: "address[]" },
          { indexed: false, name: "noticePeriodSeconds", type: "uint128" },
          { indexed: false, name: "votingPeriodSeconds", type: "uint128" },
          { indexed: false, name: "atomicExecute", type: "bool" },
        ],
        name: "AgendaCreated",
        type: "event",
      },
    ],
    eventName: "AgendaCreated",
    onLogs(logs) {
      console.log("Received new AgendaCreated event logs:", logs);
      const events = logs
        .map((log) => {
          if (!log.args) return null;
          return {
            from: log.args.from as `0x${string}`,
            id: log.args.id as bigint,
            targets: (log.args.targets as readonly `0x${string}`[]).map(
              (addr) => addr
            ),
            noticePeriodSeconds: log.args.noticePeriodSeconds as bigint,
            votingPeriodSeconds: log.args.votingPeriodSeconds as bigint,
            atomicExecute: log.args.atomicExecute as boolean,
          } as AgendaCreatedEvent;
        })
        .filter((event): event is AgendaCreatedEvent => event !== null);

      setAgendaEvents((prev) => {
        const existingIds = new Set(prev.map((e) => Number(e.id)));
        const newEvents = events.filter((e) => !existingIds.has(Number(e.id)));
        return [...prev, ...newEvents];
      });
    },
  });

  // Add progress state
  const [fetchProgress, setFetchProgress] = useState({
    currentBlock: BigInt(0),
    totalBlocks: BigInt(0),
    percentage: 0,
  });

  // Fetch historical events
  useEffect(() => {
    const fetchHistoricalEvents = async () => {
      console.log("\n=== Checking Event Fetch Status ===");
      console.log("hasFetchedEvents:", hasFetchedEvents);
      console.log("publicClient available:", !!publicClient);

      if (!publicClient || hasFetchedEvents) {
        console.log(
          "Skipping event fetch - publicClient not available or events already fetched"
        );
        return;
      }

      let currentBlock: bigint = BigInt(0);
      let totalBlocksChecked = 0;

      try {
        // Check if we need to fetch historical events
        const agendasWithoutCreator = agendas.filter(
          (agenda: Agenda) => !agenda.creator
        );
        console.log("\n=== Checking Agendas ===");
        console.log("Total agendas:", agendas.length);
        console.log("Agendas without creator:", agendasWithoutCreator.length);

        if (agendasWithoutCreator.length === 0) {
          console.log(
            "All agendas have creators, skipping historical event fetch"
          );
          setHasFetchedEvents(true);
          return;
        }

        setIsFetchingEvents(true);
        console.log("\n=== Starting Historical Event Fetch ===");
        console.log(
          `Found ${agendasWithoutCreator.length} agendas without creators`
        );
        console.log(
          "Agendas without creators:",
          agendasWithoutCreator.map((a) => a.id)
        );

        // Get current block number
        currentBlock = await publicClient.getBlockNumber();
        console.log("Current block number:", currentBlock);
        const blockRange = BigInt(10000); // 10000 blocks per request
        let fromBlock = currentBlock - blockRange;
        let allLogs: any[] = [];
        let checkedBlocks = new Set<string>();

        // Calculate total blocks to check
        const totalBlocks = currentBlock - EVENT_START_BLOCK;
        setFetchProgress({
          currentBlock: currentBlock,
          totalBlocks: totalBlocks,
          percentage: 0,
        });

        // Fetch logs in chunks
        while (fromBlock > EVENT_START_BLOCK) {
          const blockRangeKey = `${fromBlock}-${fromBlock + blockRange}`;
          if (checkedBlocks.has(blockRangeKey)) {
            console.log(
              `Skipping already checked block range: ${blockRangeKey}`
            );
            fromBlock -= blockRange;
            continue;
          }

          console.log("\n=== Fetching Block Range ===");
          console.log(`From block: ${fromBlock}`);
          console.log(`To block: ${fromBlock + blockRange}`);

          // Update progress
          const progress =
            (Number(currentBlock - fromBlock) / Number(totalBlocks)) * 100;
          setFetchProgress((prev) => ({
            ...prev,
            currentBlock: fromBlock,
            percentage: progress,
          }));

          try {
            const logs = await publicClient.getLogs({
              address: DAO_COMMITTEE_PROXY_ADDRESS,
              event: {
                type: "event",
                name: "AgendaCreated",
                inputs: [
                  { indexed: true, name: "from", type: "address" },
                  { indexed: true, name: "id", type: "uint256" },
                  { indexed: false, name: "targets", type: "address[]" },
                  {
                    indexed: false,
                    name: "noticePeriodSeconds",
                    type: "uint128",
                  },
                  {
                    indexed: false,
                    name: "votingPeriodSeconds",
                    type: "uint128",
                  },
                  { indexed: false, name: "atomicExecute", type: "bool" },
                ],
              },
              fromBlock,
              toBlock: fromBlock + blockRange,
            });

            if (logs.length > 0) {
              console.log("=== Found Events ===");
              console.log(`Number of events: ${logs.length}`);
              console.log(
                "Event details:",
                logs.map((log) => ({
                  id: log.args.id,
                  from: log.args.from,
                  targets: log.args.targets,
                }))
              );
            } else {
              console.log("No events found in this block range");
            }

            allLogs = [...allLogs, ...logs];
            checkedBlocks.add(blockRangeKey);
            totalBlocksChecked += Number(blockRange);
            console.log(`Total blocks checked: ${totalBlocksChecked}`);
          } catch (error) {
            console.error("=== Error Fetching Events ===");
            console.error(
              `Block range: ${fromBlock} to ${fromBlock + blockRange}`
            );
            console.error("Error details:", error);

            // If error occurs, try with smaller block range
            const smallerBlockRange = blockRange / BigInt(2);
            if (smallerBlockRange > BigInt(1000)) {
              console.log(
                `Retrying with smaller block range: ${smallerBlockRange}`
              );
              fromBlock += blockRange - smallerBlockRange;
              continue;
            }
          }

          fromBlock -= blockRange;
          // Add longer delay between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 seconds delay
        }

        // Fetch the last chunk from EVENT_START_BLOCK
        const finalBlockRangeKey = `${EVENT_START_BLOCK}-${
          fromBlock + blockRange
        }`;
        if (!checkedBlocks.has(finalBlockRangeKey)) {
          console.log("\n=== Fetching Final Block Range ===");
          console.log(`From block: ${EVENT_START_BLOCK}`);
          console.log(`To block: ${fromBlock + blockRange}`);
          console.log(`Progress: 100%`);

          try {
            const finalLogs = await publicClient.getLogs({
              address: DAO_COMMITTEE_PROXY_ADDRESS,
              event: {
                type: "event",
                name: "AgendaCreated",
                inputs: [
                  { indexed: true, name: "from", type: "address" },
                  { indexed: true, name: "id", type: "uint256" },
                  { indexed: false, name: "targets", type: "address[]" },
                  {
                    indexed: false,
                    name: "noticePeriodSeconds",
                    type: "uint128",
                  },
                  {
                    indexed: false,
                    name: "votingPeriodSeconds",
                    type: "uint128",
                  },
                  { indexed: false, name: "atomicExecute", type: "bool" },
                ],
              },
              fromBlock: EVENT_START_BLOCK,
              toBlock: fromBlock + blockRange,
            });

            if (finalLogs.length > 0) {
              console.log("=== Found Final Events ===");
              console.log(`Number of events: ${finalLogs.length}`);
              console.log(
                "Final event details:",
                finalLogs.map((log) => ({
                  id: log.args.id,
                  from: log.args.from,
                  targets: log.args.targets,
                }))
              );
            } else {
              console.log("No events found in final block range");
            }

            allLogs = [...allLogs, ...finalLogs];
            checkedBlocks.add(finalBlockRangeKey);
            totalBlocksChecked += Number(
              fromBlock + blockRange - EVENT_START_BLOCK
            );
            console.log(`Total blocks checked: ${totalBlocksChecked}`);
          } catch (error) {
            console.error("=== Error Fetching Final Events ===");
            console.error("Error details:", error);
          }
        }

        console.log("\n=== Event Fetch Summary ===");
        console.log("Total historical event logs:", allLogs.length);
        console.log("Total blocks checked:", totalBlocksChecked);

        const events = allLogs
          .map((log) => {
            const args = log.args;
            if (!args) return null;
            return {
              from: args.from as `0x${string}`,
              id: args.id as bigint,
              targets: (args.targets as readonly `0x${string}`[]).map(
                (addr) => addr
              ),
              noticePeriodSeconds: args.noticePeriodSeconds as bigint,
              votingPeriodSeconds: args.votingPeriodSeconds as bigint,
              atomicExecute: args.atomicExecute as boolean,
            } as AgendaCreatedEvent;
          })
          .filter((event): event is AgendaCreatedEvent => event !== null);

        console.log("Total processed events:", events.length);
        if (events.length > 0) {
          console.log(
            "Processed events:",
            events.map((e) => ({
              id: e.id,
              from: e.from,
              targets: e.targets,
            }))
          );
        }

        // Update agendas with creators in one batch
        const updatedAgendas: Agenda[] = agendas.map((agenda: Agenda) => {
          const event = events.find((e) => Number(e.id) === agenda.id);
          if (event) {
            const tmpAgenda = agenda;
            tmpAgenda.creator = event.from;
            return tmpAgenda;
          }
          return agenda; // Return original agenda if no event found
        });

        console.log("\n=== Update Summary ===");
        console.log("Updated agendas:", updatedAgendas);

        setAgendas(updatedAgendas);
        setHasFetchedEvents(true);
      } catch (error) {
        console.error("\n=== Error in Historical Event Fetch ===");
        console.error("Error details:", error);
      } finally {
        setIsFetchingEvents(false);
        setFetchProgress({
          currentBlock: BigInt(0),
          totalBlocks: BigInt(0),
          percentage: 0,
        });
        console.log(`\n=== Historical Event Fetch Completed ===`);
        if (currentBlock > BigInt(0)) {
          console.log(`Block range: ${EVENT_START_BLOCK} to ${currentBlock}`);
          console.log(`Total blocks processed: ${totalBlocksChecked}`);
        }
      }
    };

    fetchHistoricalEvents();
  }, [publicClient, hasFetchedEvents]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Proposals</h1>
        <Tabs defaultValue="onchain" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="onchain"
                className={`px-4 py-2 rounded-none border-b-2 ${
                  activeTab === "onchain"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent"
                }`}
                onClick={() => setActiveTab("onchain")}
              >
                Onchain
              </TabsTrigger>
              <TabsTrigger
                value="dao"
                className={`px-4 py-2 rounded-none border-b-2 ${
                  activeTab === "dao"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent"
                }`}
                onClick={() => setActiveTab("dao")}
              >
                DAO
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className={`px-4 py-2 rounded-none border-b-2 ${
                  activeTab === "drafts"
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent"
                }`}
                onClick={() => setActiveTab("drafts")}
              >
                Offchain
              </TabsTrigger>
            </TabsList>
            <Link href="/proposals/new">
              <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded-full">
                + New proposal
              </Button>
            </Link>
          </div>

          <TabsContent value="onchain" className="mt-0">
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Onchain Agendas</h2>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <ProposalLists agendas={agendas} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="dao">
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">
                DAO Agendas
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({agendas.length})
                </span>
              </h2>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <ProposalLists agendas={agendas} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-0">
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Offchain Proposals</h2>
              <p className="text-gray-500">
                Offchain proposals will be displayed here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Fixed event fetching status at bottom */}
      {isFetchingEvents && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 shadow-lg">
          <div className="container mx-auto">
            <div className="text-center text-gray-500 mb-2">
              Fetching agenda events... {fetchProgress.percentage.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${fetchProgress.percentage}%` }}
              ></div>
            </div>
            <div className="text-center text-sm text-gray-400 mt-1">
              Block {fetchProgress.currentBlock.toString()} /{" "}
              {fetchProgress.totalBlocks.toString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-100 text-purple-600";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    case "PENDING EXECUTION":
      return "bg-blue-100 text-blue-600";
    case "EXECUTED":
      return "bg-green-100 text-green-600";
    case "DEFEATED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

const proposals = [
  {
    title: "Update tETH price feed on WETH Mainnet market",
    status: "ACTIVE",
    date: "Apr 18th, 2025",
    votesFor: "419.75K",
    votesAgainst: "0",
    totalVotes: "419.75K",
    addresses: "23 addresses",
  },
  {
    title: "Update tETH price feed on WETH Mainnet market",
    status: "CANCELLED",
    date: "Apr 18th, 2025",
    votesFor: "0",
    votesAgainst: "0",
    totalVotes: "0",
    addresses: "0 addresses",
  },
  {
    title: "[Gauntlet] - Supply Cap Recommendations (4/14/25)",
    status: "ACTIVE",
    date: "Apr 17th, 2025",
    votesFor: "469.75K",
    votesAgainst: "0",
    totalVotes: "469.75K",
    addresses: "26 addresses",
  },
  {
    title: "[Gauntlet] - USDbc Deprecation Recommendations",
    status: "ACTIVE",
    date: "Apr 17th, 2025",
    votesFor: "469.75K",
    votesAgainst: "0",
    totalVotes: "469.75K",
    addresses: "24 addresses",
  },
  {
    title: "Initialize cWRONv3 on Ronin",
    status: "PENDING EXECUTION",
    date: "Apr 15th, 2025",
    votesFor: "599.86K",
    votesAgainst: "0.04",
    totalVotes: "679.86K",
    addresses: "63 addresses",
  },
  {
    title: "[Gauntlet] Risk Parameter Recommendations (02/2025) - V3...",
    status: "EXECUTED",
    date: "Apr 8th, 2025",
    votesFor: "630.12K",
    votesAgainst: "0.15",
    totalVotes: "710.82K",
    addresses: "77 addresses",
  },
  {
    title: "Formalizing the Community Multisig",
    status: "EXECUTED",
    date: "Apr 7th, 2025",
    votesFor: "630.82K",
    votesAgainst: "0.33",
    totalVotes: "710.82K",
    addresses: "69 addresses",
  },
  {
    title: "2025 Tokamak Network Growth Program Renewal V4 [AlphaGrowth]",
    status: "DEFEATED",
    date: "Mar 31st, 2025",
    votesFor: "574.38K",
    votesAgainst: "1.23M",
    totalVotes: "1.8M",
    addresses: "148 addresses",
  },
  {
    title: "[Gauntlet] - Interest Rate Curve Recommendations (03/25)",
    status: "EXECUTED",
    date: "Mar 26th, 2025",
    votesFor: "990.41K",
    votesAgainst: "2.23",
    totalVotes: "990.42K",
    addresses: "128 addresses",
  },
  {
    title: "[Gauntlet] - Cap recommendations (03/24/25)",
    status: "EXECUTED",
    date: "Mar 24th, 2025",
    votesFor: "703.9K",
    votesAgainst: "2.41",
    totalVotes: "703.9K",
    addresses: "154 addresses",
  },
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}${getOrdinalSuffix(day)}, ${year}`;
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
