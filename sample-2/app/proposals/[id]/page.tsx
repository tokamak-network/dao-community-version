"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AgendaWithMetadata } from "@/types/agenda";
import { useContractRead } from "wagmi";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import AgendaDetail from "@/components/agenda/AgendaDetail";

export default function ProposalDetail() {
  const params = useParams();
  if (!params?.id) return null;
  const agendaId = BigInt(params.id as string);
  const [agenda, setAgenda] = useState<AgendaWithMetadata | null>(null);

  // 아젠다 데이터 가져오기
  const { data: agendaData } = useContractRead({
    address: DAO_AGENDA_MANAGER_ADDRESS,
    abi: DAO_AGENDA_MANAGER_ABI,
    functionName: "agendas",
    args: [agendaId],
    chainId: chain.id,
  });

  useEffect(() => {
    if (agendaData) {
      const result = agendaData as unknown as AgendaWithMetadata;
      setAgenda({
        ...result,
        id: Number(agendaId),
      });
    }
  }, [agendaData, agendaId]);

  if (!agenda) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-4">
      <AgendaDetail agenda={agenda} />
    </main>
  );
}
