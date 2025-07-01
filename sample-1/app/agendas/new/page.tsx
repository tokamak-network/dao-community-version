'use client';

import { useAccount, useWriteContract } from 'wagmi';
import { useCombinedDAOContext } from '@/contexts/CombinedDAOContext';
import ProposalForm from "@/components/proposal-form";

export default function NewProposalPage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: writeData, error: writeError, isPending } = useWriteContract();
  const { createAgendaFees, minimumNoticePeriodSeconds, minimumVotingPeriodSeconds } = useCombinedDAOContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <ProposalForm
        address={address}
        isConnected={isConnected}
        writeContract={writeContract}
        writeData={writeData}
        writeError={writeError}
        isPending={isPending}
        createAgendaFees={createAgendaFees}
        minimumNoticePeriodSeconds={minimumNoticePeriodSeconds}
        minimumVotingPeriodSeconds={minimumVotingPeriodSeconds}
      />
    </div>
  );
}