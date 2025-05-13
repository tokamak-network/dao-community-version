"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/navbar";
import Link from "next/link";
import ProposalLists from "./proposal-lists";
import {
  useContractRead,
  useContractReads,
  useWatchContractEvent,
  usePublicClient,
} from "wagmi";
import { getStatusClass, getStatusText, formatDate } from "@/lib/utils";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { DAO_ABI } from "@/abis/dao";
import {
  DAO_AGENDA_MANAGER_ADDRESS,
  DAO_COMMITTEE_PROXY_ADDRESS,
  CHAIN_ID,
  EVENT_START_BLOCK,
  BLOCK_RANGE,
} from "@/config/contracts";
import {
  Agenda,
  AgendaCreatedEvent,
  AgendaContractResult,
} from "@/types/agenda";

export default function Proposals() {
  const [activeTab, setActiveTab] = useState("dao");
  const [daoProposalIds, setDaoProposalIds] = useState<number[]>([]);
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data: agendaCount,
    isError,
    error: countError,
  } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "numAgendas",
    chainId: CHAIN_ID,
  });

  useEffect(() => {
    if (agendaCount) {
      const count = Number(agendaCount);
      const ids = Array.from({ length: count }, (_, i) => count - i - 1);
      setDaoProposalIds(ids);
    }
  }, [agendaCount]);

  const {
    data: agendaDetails,
    isError: isAgendaDetailsError,
    error: agendaDetailsError,
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
    if (agendaDetails) {
      const agendaList = agendaDetails
        .map((detail, index) => {
          if (!detail.result) return null;
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
          };
        })
        .filter((agenda): agenda is Agenda => agenda !== null);

      console.log("agendaList", agendaList);
      setAgendas(agendaList);
    }
  }, [agendaDetails, daoProposalIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Proposals</h1>
          <Link href="/proposals/new">
            <Button>Create Proposal</Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dao">DAO</TabsTrigger>
            <TabsTrigger value="offchain">Off-Chain</TabsTrigger>
          </TabsList>

          <TabsContent value="dao">
            <ProposalLists
              agendas={agendas}
              contract={{
                address: DAO_AGENDA_MANAGER_ADDRESS,
                abi: DAO_AGENDA_MANAGER_ABI,
                chainId: CHAIN_ID,
              }}
              daoContract={{
                address: DAO_COMMITTEE_PROXY_ADDRESS,
                abi: DAO_ABI,
                chainId: CHAIN_ID,
              }}
            />
          </TabsContent>

          <TabsContent value="offchain">
            <div className="text-center py-8 text-gray-500">
              Off-chain proposals coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
