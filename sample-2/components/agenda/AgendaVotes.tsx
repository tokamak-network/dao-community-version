import { AgendaWithMetadata } from "@/types/agenda";
import { formatAddress } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface AgendaVotesProps {
  agenda: AgendaWithMetadata;
}

export default function AgendaVotes({ agenda }: AgendaVotesProps) {
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
      {agenda.voters && agenda.voters.length > 0 && (
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
              {agenda.voters.map((voter, index) => (
                <div key={index} className="px-4 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-700 font-mono">
                      {formatAddress(voter)}
                    </div>
                    <div className="text-gray-700">
                      {/* TODO: Add actual vote data when available */}
                      <span className="text-emerald-500">For</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
