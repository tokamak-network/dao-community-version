"use client";

import { useEffect, useState, useMemo } from "react";
import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useAgenda } from "@/contexts/AgendaContext";
import { useContractRead } from "wagmi";
import { DAO_AGENDA_MANAGER_ADDRESS } from "@/config/contracts";
import { chain } from "@/config/chain";
import dynamic from "next/dynamic";

interface AgendaVotesProps {
  agenda: AgendaWithMetadata;
}

interface VoteInfo {
  address: string;
  vote: number;
  hasVoted: boolean;
}

const voterInfosAbi = [
  {
    name: "voterInfos",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "_agendaID", type: "uint256" },
      { name: "_voter", type: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "isVoter", type: "bool" },
          { name: "hasVoted", type: "bool" },
          { name: "vote", type: "uint256" },
        ],
      },
    ],
  },
] as const;

function AgendaVotesContent({ agenda }: AgendaVotesProps) {
  const { refreshAgendas, getVoterInfos, getAgenda } = useAgenda();
  const [votes, setVotes] = useState<VoteInfo[]>([]);
  const [voterInfos, setVoterInfos] = useState<any[]>([]);

  // Get vote information for each voter
  useEffect(() => {
    const fetchVoterInfos = async () => {
      if (!agenda.voters) {
        // 초기에 voter가 없을 때 3명의 투표자에 대한 기본 UI 생성
        const defaultVotes = Array(3)
          .fill(null)
          .map((_, index) => ({
            address: `Committee Member ${index + 1}`,
            vote: 0,
            hasVoted: false,
          }));
        setVotes(defaultVotes);
        return;
      }
      const results = await getVoterInfos(agenda.id, agenda.voters);
      setVoterInfos(results);
    };
    fetchVoterInfos();
  }, [agenda.id, agenda.voters, getVoterInfos]);

  // Update votes when voterInfos changes
  useEffect(() => {
    if (agenda.voters) {
      const votesInfo = agenda.voters.map((voter, index) => {
        const result = voterInfos[index] as
          | {
              isVoter: boolean;
              hasVoted: boolean;
              vote: bigint;
            }
          | undefined;
        return {
          address: voter,
          vote: result ? Number(result.vote) : 0,
          hasVoted: result?.hasVoted || false,
        };
      });
      setVotes(votesInfo);
    }
  }, [agenda.voters, voterInfos]);

  // 투표 상태 갱신을 위한 이벤트 리스너
  useEffect(() => {
    const handleVoteUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent<{ agendaId: number }>;
      if (customEvent.detail.agendaId === agenda.id) {
        // 아젠다 컨텍스트에서 최신 데이터 가져오기
        const updatedAgenda = await getAgenda(agenda.id);
        console.log("Agenda Votes updatedAgenda", updatedAgenda);
        if (updatedAgenda && updatedAgenda.voters) {
          // 최신 voterInfos 가져오기
          const results = await getVoterInfos(agenda.id, updatedAgenda.voters);
          console.log("Agenda Votes results", results);
          setVoterInfos(results);
        }
      }
    };

    window.addEventListener("agendaVoteUpdated", handleVoteUpdate);
    return () => {
      window.removeEventListener("agendaVoteUpdated", handleVoteUpdate);
    };
  }, [agenda.id, getAgenda, getVoterInfos]);

  const totalVotes =
    Number(agenda.countingYes) +
    Number(agenda.countingNo) +
    Number(agenda.countingAbstain);
  const yesPercentage =
    totalVotes > 0 ? (Number(agenda.countingYes) / totalVotes) * 100 : 0;
  const noPercentage =
    totalVotes > 0 ? (Number(agenda.countingNo) / totalVotes) * 100 : 0;
  const abstainPercentage =
    totalVotes > 0 ? (Number(agenda.countingAbstain) / totalVotes) * 100 : 0;

  const getVoteText = (vote: number, hasVoted: boolean) => {
    if (!hasVoted) {
      return <span className="text-gray-500">Not voted</span>;
    }
    switch (vote) {
      case 1:
        return <span className="text-emerald-500">For</span>;
      case 2:
        return <span className="text-red-500">Against</span>;
      case 0:
        return <span className="text-gray-500">Abstain</span>;
      default:
        return <span className="text-gray-500">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Voting Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Voting Summary
          </h3>
          <div className="text-sm text-gray-500">Total Votes: {totalVotes}</div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Yes Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">For</span>
              </div>
              <div className="text-sm text-gray-500">
                {Number(agenda.countingYes)} ({yesPercentage.toFixed(1)}%)
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${yesPercentage}%` }}
              />
            </div>
          </div>

          {/* No Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Against
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {Number(agenda.countingNo)} ({noPercentage.toFixed(1)}%)
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${noPercentage}%` }}
              />
            </div>
          </div>

          {/* Abstain Votes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <MinusCircle className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">
                  Abstain
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {Number(agenda.countingAbstain)} ({abstainPercentage.toFixed(1)}
                %)
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-500 rounded-full"
                style={{ width: `${abstainPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voters List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Voters</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-600">
              <div>Address</div>
              <div>Vote</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {votes.map((voteInfo, index) => (
              <div key={index} className="px-4 py-3 hover:bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-gray-700 font-mono">
                    {formatAddress(voteInfo.address)}
                  </div>
                  <div className="text-gray-700">
                    {getVoteText(voteInfo.vote, voteInfo.hasVoted)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 클라이언트 사이드에서만 렌더링되도록 설정
const AgendaVotes = dynamic(() => Promise.resolve(AgendaVotesContent), {
  ssr: false,
});

export default AgendaVotes;
