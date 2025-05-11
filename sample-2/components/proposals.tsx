"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import Header from "@/components/header"
import Navbar from "@/components/navbar";
import Link from "next/link";
import ProposalLists from "./proposal-lists";
import { useContractRead, useContractReads } from "wagmi";

const DAO_AGENDA_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_AGENDA_MANAGER_ADDRESS as `0x${string}`;

const DAO_COMMITTEE_PROXY_ADDRESS = process.env
  .NEXT_PUBLIC_DAO_COMMITTEE_PROXY_ADDRESS as `0x${string}`;

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID);

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

const AgendaStatus = {
  NOTICE: 0,
  VOTING: 1,
  EXECUTABLE: 2,
  EXECUTED: 3,
  REJECTED: 4,
  CANCELLED: 5,
} as const;

const AgendaResult = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  CANCELLED: 3,
} as const;

interface Agenda {
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
}

type AgendaContractResult = [
  bigint, // createdTimestamp
  bigint, // noticeEndTimestamp
  bigint, // votingPeriodInSeconds
  bigint, // votingStartedTimestamp
  bigint, // votingEndTimestamp
  bigint, // executableLimitTimestamp
  bigint, // executedTimestamp
  bigint, // countingYes
  bigint, // countingNo
  bigint, // countingAbstain
  number, // status
  number, // result
  string[], // voters
  boolean // executed
];

export default function Proposals() {
  const [activeTab, setActiveTab] = useState("onchain");
  const [daoProposalIds, setDaoProposalIds] = useState<number[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);

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
            createdTimestamp: result[0],
            noticeEndTimestamp: result[1],
            votingPeriodInSeconds: result[2],
            votingStartedTimestamp: result[3],
            votingEndTimestamp: result[4],
            executableLimitTimestamp: result[5],
            executedTimestamp: result[6],
            countingYes: result[7],
            countingNo: result[8],
            countingAbstain: result[9],
            status: result[10],
            result: result[11],
            voters: result[12],
            executed: result[13],
          };
        })
        .filter((agenda): agenda is Agenda => agenda !== null);

      console.log("Processed DAO Agendas:", agendaList);
      setAgendas(agendaList);
    }
  }, [
    agendaDetails,
    daoProposalIds,
    isAgendaDetailsError,
    isAgendaDetailsLoading,
  ]);

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
              <ProposalLists proposals={proposals} />
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
              <ProposalLists
                proposals={agendas.map((agenda) => ({
                  title: `Agenda #${agenda.id}`,
                  status:
                    agenda.status === AgendaStatus.EXECUTED
                      ? "EXECUTED"
                      : agenda.status === AgendaStatus.REJECTED
                      ? "DEFEATED"
                      : agenda.status === AgendaStatus.CANCELLED
                      ? "CANCELLED"
                      : agenda.status === AgendaStatus.EXECUTABLE
                      ? "PENDING EXECUTION"
                      : agenda.status === AgendaStatus.VOTING
                      ? "ACTIVE"
                      : "ACTIVE",
                  date: formatDate(Number(agenda.createdTimestamp)),
                  votesFor: Number(agenda.countingYes).toLocaleString(),
                  votesAgainst: Number(agenda.countingNo).toLocaleString(),
                  totalVotes: (
                    Number(agenda.countingYes) +
                    Number(agenda.countingNo) +
                    Number(agenda.countingAbstain)
                  ).toLocaleString(),
                  addresses: `${agenda.voters?.length || 0} addresses`,
                }))}
              />
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
