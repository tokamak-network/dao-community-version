'use client';

import { useMemo } from 'react';

interface AgendaData {
  countingYes: bigint | null;
  countingNo: bigint | null;
  countingAbstain: bigint | null;
  voters: string[];
}

interface VotingVisualizationProps {
  agenda: AgendaData;
}

export default function VotingVisualization({ agenda }: VotingVisualizationProps) {
  const votingData = useMemo(() => {
    const yes = Number(agenda.countingYes || BigInt(0));
    const no = Number(agenda.countingNo || BigInt(0));
    const abstain = Number(agenda.countingAbstain || BigInt(0));
    const total = yes + no + abstain;

    return {
      yes,
      no,
      abstain,
      total,
      yesPercentage: total > 0 ? (yes / total) * 100 : 0,
      noPercentage: total > 0 ? (no / total) * 100 : 0,
      abstainPercentage: total > 0 ? (abstain / total) * 100 : 0,
      totalVoters: agenda.voters.length,
      participationRate: agenda.voters.length > 0 ? (total / agenda.voters.length) * 100 : 0
    };
  }, [agenda]);

  const ProgressBar: React.FC<{ label: string; value: number; percentage: number; color: string; bgColor: string }> = ({
    label,
    value,
    percentage,
    color,
    bgColor
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900">{value}</span>
          <span className="text-sm text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
        </div>
      </div>
      <div className={`w-full ${bgColor} rounded-full h-3`}>
        <div
          className={`${color} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Voting Results Visualization</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600">{votingData.yes}</div>
          <div className="text-sm text-green-700">Yes Votes</div>
          <div className="text-xs text-green-600">{votingData.yesPercentage.toFixed(1)}%</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-red-600">{votingData.no}</div>
          <div className="text-sm text-red-700">No Votes</div>
          <div className="text-xs text-red-600">{votingData.noPercentage.toFixed(1)}%</div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-gray-600">{votingData.abstain}</div>
          <div className="text-sm text-gray-700">Abstain</div>
          <div className="text-xs text-gray-600">{votingData.abstainPercentage.toFixed(1)}%</div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-blue-600">{votingData.total}</div>
          <div className="text-sm text-blue-700">Total Votes</div>
          <div className="text-xs text-blue-600">of {votingData.totalVoters} voters</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Vote Distribution</h3>
        
        <ProgressBar
          label="Yes Votes"
          value={votingData.yes}
          percentage={votingData.yesPercentage}
          color="bg-green-500"
          bgColor="bg-green-100"
        />
        
        <ProgressBar
          label="No Votes"
          value={votingData.no}
          percentage={votingData.noPercentage}
          color="bg-red-500"
          bgColor="bg-red-100"
        />
        
        <ProgressBar
          label="Abstain Votes"
          value={votingData.abstain}
          percentage={votingData.abstainPercentage}
          color="bg-gray-500"
          bgColor="bg-gray-100"
        />
      </div>

      {/* Participation Rate */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Participation Rate</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Voter Participation</span>
          <span className="text-lg font-bold text-gray-900">
            {votingData.participationRate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${votingData.participationRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>{votingData.total} voted</span>
          <span>{votingData.totalVoters - votingData.total} didn't vote</span>
        </div>
      </div>

      {/* Visual Pie Chart Representation */}
      {votingData.total > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Vote Distribution Chart</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 42 42" className="w-full h-full">
                <circle
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                
                {/* Yes votes */}
                {votingData.yesPercentage > 0 && (
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray={`${votingData.yesPercentage} ${100 - votingData.yesPercentage}`}
                    strokeDashoffset="25"
                    transform="rotate(-90 21 21)"
                  />
                )}
                
                {/* No votes */}
                {votingData.noPercentage > 0 && (
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeDasharray={`${votingData.noPercentage} ${100 - votingData.noPercentage}`}
                    strokeDashoffset={`${25 - votingData.yesPercentage}`}
                    transform="rotate(-90 21 21)"
                  />
                )}
                
                {/* Abstain votes */}
                {votingData.abstainPercentage > 0 && (
                  <circle
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke="#6b7280"
                    strokeWidth="3"
                    strokeDasharray={`${votingData.abstainPercentage} ${100 - votingData.abstainPercentage}`}
                    strokeDashoffset={`${25 - votingData.yesPercentage - votingData.noPercentage}`}
                    transform="rotate(-90 21 21)"
                  />
                )}
              </svg>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Yes ({votingData.yesPercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">No ({votingData.noPercentage.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Abstain ({votingData.abstainPercentage.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}

      {/* No votes message */}
      {votingData.total === 0 && (
        <div className="border-t pt-6 text-center">
          <div className="text-gray-500">
            <div className="text-4xl mb-2">🗳️</div>
            <p className="text-lg font-medium">No votes recorded yet</p>
            <p className="text-sm">Voting results will appear here once votes are cast.</p>
          </div>
        </div>
      )}
    </div>
  );
}