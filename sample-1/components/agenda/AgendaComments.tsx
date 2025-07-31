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
  const { getVoterInfos } = useCombinedDAOContext()

      useEffect(() => {
    const fetchVoterInfos = async () => {
      // 🔥 기존 투표 데이터가 있고 voter 구성이 동일하다면 불필요한 fetch 방지
      if (votes.length > 0 && agenda.voters &&
          votes.length === agenda.voters.length &&
          votes.every((vote, idx) => vote.address === agenda.voters![idx])) {
        console.log('AgendaComments: Skipping unnecessary fetch - voters unchanged');
        return;
      }

      // 🔄 실제 데이터 변경이 필요한 경우에만 로딩 표시
      setIsLoadingVotes(true);

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

        // 🎯 기존 데이터와 비교하여 변경사항이 있을 때만 업데이트
        const hasChanges = votesInfo.some((newVote, idx) => {
          const existingVote = votes[idx];
          return !existingVote ||
                 existingVote.hasVoted !== newVote.hasVoted ||
                 existingVote.vote !== newVote.vote ||
                 existingVote.synced !== newVote.synced;
        });

        if (hasChanges) {
          console.log('AgendaComments: Updating votes due to changes');
          setVotes(votesInfo);
          setVoterInfos(results);
        } else {
          console.log('AgendaComments: No changes detected, skipping update');
        }
      } catch (error) {
        console.error("❌ AgendaComments: Failed to fetch voter infos:", error);
      } finally {
        setIsLoadingVotes(false);
      }
    };
    fetchVoterInfos();
    // 🎯 의존성 배열에서 counting 값들 제거 - 이들은 실제 투표 내용 변경과 무관
}, [agenda.id, agenda.voters, getVoterInfos])


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
                  {voteInfo.hasVoted && <span className="text-gray-700 ml-1">voted</span>}
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