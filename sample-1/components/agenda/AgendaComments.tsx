'use client'
import { useState, useEffect, useCallback } from 'react'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatAddress } from '@/lib/utils'
import { useCombinedDAOContext } from "@/contexts/CombinedDAOContext"
import { useAccount } from 'wagmi'

interface AgendaCommentsProps {
  agenda: AgendaWithMetadata
}

interface VoteInfo {
  address: string
  vote: number
  hasVoted: boolean
  synced: boolean
}

export default function AgendaComments({ agenda }: AgendaCommentsProps) {
  // 🎯 sample-2 방식: 이중 상태 관리
  const [votes, setVotes] = useState<VoteInfo[]>([])
  const [voterInfos, setVoterInfos] = useState<any[]>([])
  const [isLoadingVotes, setIsLoadingVotes] = useState(true)

  const { address } = useAccount()
  const { getVoterInfos, refreshAgenda } = useCombinedDAOContext()

  // 🔍 디버깅: 현재 사용자와 투표자 목록 확인
  useEffect(() => {
    console.log("🔍 AgendaComments Debug:", {
      currentUser: address,
      agendaVoters: agenda.voters,
      isUserInVoters: agenda.voters?.includes(address || ""),
      agendaId: agenda.id,
      voteCounts: {
        yes: agenda.countingYes,
        no: agenda.countingNo,
        abstain: agenda.countingAbstain
      }
    });
  }, [address, agenda.voters, agenda.id, agenda.countingYes, agenda.countingNo, agenda.countingAbstain])

    useEffect(() => {
      const fetchVoterInfos = async () => {
        setIsLoadingVotes(true);
        console.log("🔄 AgendaComments: Fetching voter infos for agenda", agenda.id);

        if (!agenda.voters) {
          // 초기에 voter가 없을 때 3명의 투표자에 대한 기본 UI 생성
          const defaultVotes = Array(3)
            .fill(null)
            .map((_, index) => ({
              address: `Committee Member ${index + 1}`,
              vote: 0,
              hasVoted: false,
              synced: true,
            }));
          setVotes(defaultVotes);
          setIsLoadingVotes(false);
          return;

        } else {
          const defaultVotes = agenda.voters.map((voter) => ({
            address: voter,
            vote: 0,
            hasVoted: false,
            synced: false,
          }));
          setVotes(defaultVotes);
          setIsLoadingVotes(false);
        }

        try {
          const results = await getVoterInfos(agenda.id, agenda.voters);
          console.log("✅ AgendaComments: Voter infos received:", results);

          // 🚀 바로 votes 업데이트
          const votesInfo = agenda.voters.map((voter, index) => {
            const result = results[index] as
              | {
                  isVoter: boolean;
                  hasVoted: boolean;
                  vote: bigint;
                  synced: boolean;
                }
              | undefined;
            return {
              address: voter,
              vote: result ? Number(result.vote) : 0,
              hasVoted: result?.hasVoted || false,
              synced: true,
            };
          });
          setVotes(votesInfo);
          setVoterInfos(results);
        } catch (error) {
          console.error("❌ AgendaComments: Failed to fetch voter infos:", error);
        } finally {
          setIsLoadingVotes(false);
        }
      };
      fetchVoterInfos();
  }, [agenda.id, agenda.voters, agenda.countingYes, agenda.countingNo, agenda.countingAbstain, getVoterInfos])

  // 🔬 TEST: 이벤트 리스너 전체 주석처리 (부모에서 props로 받음)
  // useEffect(() => {
  //   const handleVoteUpdate = async (event: Event) => {
  //     const customEvent = event as CustomEvent<{ agendaId: number }>;
  //     console.log("handleVoteUpdate", customEvent.detail);
  //     if (customEvent.detail.agendaId === agenda.id) {
  //       // 투표 데이터 새로고침
  //       try {
  //         if (agenda.voters && agenda.voters.length > 0) {
  //           const results = await getVoterInfos(agenda.id, agenda.voters);
  //           setVoterInfos(results);
  //         }
  //       } catch (error) {
  //         console.error('Failed to refresh vote data:', error);
  //       }
  //     }
  //   };

  //   const handleExecutedUpdate = async (event: Event) => {
  //     const customEvent = event as CustomEvent<{ agendaId: number }>;
  //     console.log("handleExecutedUpdate", customEvent.detail);
  //     if (customEvent.detail.agendaId === agenda.id) {
  //       // 아젠다 실행 상태 갱신
  //       await refreshAgenda(agenda.id);
  //     }
  //   };

  //   // 이벤트 리스닝 (테스트 목적으로 주석처리)
  //   // window.addEventListener("agendaVoteUpdated", handleVoteUpdate);
  //   // window.addEventListener("agendaExecuted", handleExecutedUpdate);

  //   return () => {
  //     // window.removeEventListener("agendaVoteUpdated", handleVoteUpdate);
  //     // window.removeEventListener("agendaExecuted", handleExecutedUpdate);
  //   };
  // }, [agenda.id, agenda.voters, refreshAgenda, getVoterInfos]);

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


  // 투표 텍스트 포맷팅 함수 (memoized)
  const getVoteText = useCallback((vote: number, hasVoted: boolean, isLoading: boolean, synced: boolean) => {
    if (!synced) {
      return <span className="text-gray-400"> -</span>
    }
    if (!hasVoted) {
      return <span className="text-gray-500"> Not voted</span>
    }
    switch (vote) {
      case 1:
        return <span className="text-green-600 font-medium"> For</span>
      case 2:
        return <span className="text-red-600 font-medium"> Against</span>
      case 0:
        return <span className="text-gray-600 font-medium"> Abstain</span>
      default:
        return <span className="text-gray-500"> Unknown</span>
    }
  }, [])


  return (
    <div className="space-y-6">
    {/* Individual Votes */}
    <div>
      {votes.length > 0 ? (
          <div className="divide-y divide-gray-200">
          {votes.map((voteInfo, index) => (
              <div key={index} className="py-4">
                <div className="text-sm">
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">
                    {formatAddress(voteInfo.address)}
                  </a>
                  <span className="text-gray-700 ml-1">voted</span>
                  <span className="ml-1">{getVoteText(voteInfo.vote, voteInfo.hasVoted, isLoadingVotes, voteInfo.synced)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-600">No voting records available</div>
          </div>
        )}

    </div>
  </div>
  )
}