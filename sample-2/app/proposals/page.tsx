"use client";

import { useAgenda } from "@/contexts/AgendaContext";
import ProposalLists from "@/components/proposal-lists";

export default function Proposals() {
  const { agendas, isLoading, error, contract, daoContract } = useAgenda();

  return (
    <main className="container mx-auto px-4 py-8 relative min-h-screen">
      {error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <ProposalLists
          agendas={agendas}
          contract={contract}
          daoContract={daoContract}
          isLoading={isLoading}
        />
      )}
    </main>
  );
}
