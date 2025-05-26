"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAgenda } from "@/contexts/AgendaContext";
import { AgendaWithMetadata } from "@/types/agenda";
import AgendaDetail from "@/components/agenda/AgendaDetail";

export default function ProposalDetail() {
  const params = useParams();
  const agendaId = Number(params?.id);
  const { getAgenda } = useAgenda();
  const [localAgenda, setLocalAgenda] = useState<AgendaWithMetadata | null>(
    null
  );
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);
  const [localStatusMessage, setLocalStatusMessage] = useState("");
  const isFirstRender = useRef(true);

  if (!params?.id) return null;

  const fetchAgendaFromContract = async () => {
    setIsLoadingLocal(true);
    setLocalStatusMessage("Loading agenda details...");
    try {
      const agenda = await getAgenda(agendaId);
      if (agenda) {
        console.log("Agenda from context:", agenda);
        setLocalAgenda(agenda);
      }
    } catch (err) {
      console.error("Error fetching agenda:", err);
      setLocalStatusMessage("Error loading agenda details");
    } finally {
      setIsLoadingLocal(false);
      setLocalStatusMessage("");
    }
  };

  useEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;

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
