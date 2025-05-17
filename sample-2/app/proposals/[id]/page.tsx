"use client";

import { useParams } from "next/navigation";
import { useAgenda } from "@/contexts/AgendaContext";
import AgendaDetail from "@/components/agenda/AgendaDetail";
import { useEffect, useState, useRef } from "react";
import { createPublicClient, http } from "viem";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { DAO_AGENDA_MANAGER_ABI } from "@/abis/dao-agenda-manager";
import { chain } from "@/config/chain";
import { getAllAgendaMetadata } from "@/lib/utils";

export default function ProposalDetail() {
  const params = useParams();
  const { agendas, error } = useAgenda();
  const [localAgenda, setLocalAgenda] = useState<any>(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [localStatusMessage, setLocalStatusMessage] = useState("");
  const isFirstRender = useRef(true);

  if (!params?.id) return null;
  const agendaId = Number(params.id);

  useEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

    const fetchAgendaFromContract = async () => {
      if (agendas.length > 0) {
        const existingAgenda = agendas.find((a) => a.id === agendaId);
        if (existingAgenda) {
          console.log("existingAgenda from context:", {
            id: existingAgenda.id,
            title: existingAgenda.title,
            description: existingAgenda.description,
            creator: existingAgenda.creator,
            snapshotUrl: existingAgenda.snapshotUrl,
            discourseUrl: existingAgenda.discourseUrl,
          });
          setLocalAgenda(existingAgenda);
          return;
        }
      }

      setIsLoadingLocal(true);
      setLocalStatusMessage("Loading agenda details...");
      try {
        const publicClient = createPublicClient({
          chain: {
            ...chain,
            id: chain.id,
          },
          transport: http(process.env.NEXT_PUBLIC_RPC_URL as string),
        });

        setLocalStatusMessage("Fetching agenda data from contract...");
        const agendaData = await publicClient.readContract({
          address: DAO_AGENDA_MANAGER_ADDRESS,
          abi: DAO_AGENDA_MANAGER_ABI,
          functionName: "agendas",
          args: [BigInt(agendaId)],
        });

        setLocalStatusMessage("Loading agenda metadata...");
        const metadata = await getAllAgendaMetadata([agendaId]);
        const agendaWithMetadata = {
          ...(agendaData as any),
          id: agendaId,
          title: metadata[agendaId]?.title,
          description: metadata[agendaId]?.description,
        };
        console.log("agendaWithMetadata", agendaWithMetadata);
        setLocalAgenda(agendaWithMetadata);
        setLocalStatusMessage("");
      } catch (err) {
        console.error("Error fetching agenda:", err);
        setLocalStatusMessage("Error loading agenda details");
      } finally {
        setIsLoadingLocal(false);
      }
    };

    fetchAgendaFromContract();
  }, [agendaId]);

  if (isLoadingLocal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-600">
            {localStatusMessage || "Loading agenda details..."}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p className="font-semibold">Error loading agenda</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!localAgenda) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800">
            Agenda Not Found
          </p>
          <p className="text-gray-600 mt-2">
            The requested agenda (ID: {agendaId}) could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-4">
      <AgendaDetail agenda={localAgenda} />
    </main>
  );
}
