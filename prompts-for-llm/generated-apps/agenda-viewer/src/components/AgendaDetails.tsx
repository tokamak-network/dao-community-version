'use client';

import { useMemo } from 'react';
import { AGENDA_STATUS, AGENDA_RESULT, COMMITTEE_STATUS, COMMITTEE_RESULT } from '@/lib/constants';
import { safe } from '@/lib/safe-utils';

interface AgendaData {
  createdTimestamp: bigint | null;
  noticeEndTimestamp: bigint | null;
  votingPeriodInSeconds: bigint | null;
  votingStartedTimestamp: bigint | null;
  votingEndTimestamp: bigint | null;
  executableLimitTimestamp: bigint | null;
  executedTimestamp: bigint | null;
  countingYes: bigint | null;
  countingNo: bigint | null;
  countingAbstain: bigint | null;
  status: number;
  result: number;
  voters: string[];
  executed: boolean;
}

interface CommitteeStatusData {
  status: number;
  result: number;
}

interface AgendaDetailsProps {
  agenda: AgendaData;
  committeeStatus: CommitteeStatusData | null;
  agendaId: number;
}

const StatusBadge: React.FC<{ status: number; statusMap: any; label: string }> = ({ status, statusMap, label }) => {
  const statusInfo = statusMap[status] || { text: 'UNKNOWN', color: 'gray' };
  
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo.color as keyof typeof colorClasses]}`}>
        {statusInfo.text}
      </span>
      {statusInfo.description && (
        <span className="text-xs text-gray-500">({statusInfo.description})</span>
      )}
    </div>
  );
};

export default function AgendaDetails({ agenda, committeeStatus, agendaId }: AgendaDetailsProps) {
  const currentTime = useMemo(() => Math.floor(Date.now() / 1000), []);

  const timeUntilVotingEnd = useMemo(() => {
    if (!agenda.votingEndTimestamp) return null;
    const endTime = Number(agenda.votingEndTimestamp);
    const remaining = endTime - currentTime;
    return remaining > 0 ? remaining : 0;
  }, [agenda.votingEndTimestamp, currentTime]);

  const timeUntilExecutableLimit = useMemo(() => {
    if (!agenda.executableLimitTimestamp) return null;
    const limitTime = Number(agenda.executableLimitTimestamp);
    const remaining = limitTime - currentTime;
    return remaining > 0 ? remaining : 0;
  }, [agenda.executableLimitTimestamp, currentTime]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Agenda #{agendaId} Information
        </h2>
        <div className="flex items-center space-x-4">
          <StatusBadge status={agenda.status} statusMap={AGENDA_STATUS} label="AgendaManager Status" />
          <StatusBadge status={agenda.result} statusMap={AGENDA_RESULT} label="Result" />
        </div>
      </div>

      {/* Real-time Status Comparison */}
      {committeeStatus && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Real-time Status (Committee)</h3>
          <div className="flex items-center space-x-6">
            <StatusBadge status={committeeStatus.status} statusMap={COMMITTEE_STATUS} label="Committee Status" />
            <StatusBadge status={committeeStatus.result} statusMap={COMMITTEE_RESULT} label="Committee Result" />
          </div>
          
          {/* Status Comparison */}
          {(agenda.status !== committeeStatus.status || agenda.result !== committeeStatus.result) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ Status difference detected between AgendaManager and Committee contracts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Basic Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Timestamps Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-3">Timeline</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <p className="text-gray-800">
                {agenda.createdTimestamp ? safe.formatDate(agenda.createdTimestamp) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Notice End:</span>
              <p className="text-gray-800">
                {agenda.noticeEndTimestamp ? safe.formatDate(agenda.noticeEndTimestamp) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Voting Started:</span>
              <p className="text-gray-800">
                {agenda.votingStartedTimestamp ? safe.formatDate(agenda.votingStartedTimestamp) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Voting Ends:</span>
              <p className="text-gray-800">
                {agenda.votingEndTimestamp ? safe.formatDate(agenda.votingEndTimestamp) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Voting Period & Deadlines */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-3">Voting Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Voting Period:</span>
              <p className="text-gray-800">
                {agenda.votingPeriodInSeconds ? safe.formatDuration(agenda.votingPeriodInSeconds) : 'N/A'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Executable Until:</span>
              <p className="text-gray-800">
                {agenda.executableLimitTimestamp ? safe.formatDate(agenda.executableLimitTimestamp) : 'N/A'}
              </p>
            </div>
            {agenda.executed && (
              <div>
                <span className="font-medium text-gray-600">Executed At:</span>
                <p className="text-gray-800">
                  {agenda.executedTimestamp ? safe.formatDate(agenda.executedTimestamp) : 'N/A'}
                </p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-600">Execution Status:</span>
              <p className={`text-sm font-medium ${agenda.executed ? 'text-green-600' : 'text-orange-600'}`}>
                {agenda.executed ? 'Executed' : 'Not Executed'}
              </p>
            </div>
          </div>
        </div>

        {/* Vote Counts */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="font-medium text-gray-900 mb-3">Vote Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-600">Yes:</span>
              <span className="text-lg font-bold text-green-600">
                {agenda.countingYes ? agenda.countingYes.toString() : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-red-600">No:</span>
              <span className="text-lg font-bold text-red-600">
                {agenda.countingNo ? agenda.countingNo.toString() : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Abstain:</span>
              <span className="text-lg font-bold text-gray-600">
                {agenda.countingAbstain ? agenda.countingAbstain.toString() : '0'}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Voters:</span>
                <span className="text-lg font-bold text-gray-900">
                  {agenda.voters.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timers */}
      {(timeUntilVotingEnd !== null && timeUntilVotingEnd > 0) && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-medium text-green-900 mb-2">Time Until Voting Ends</h3>
          <p className="text-2xl font-bold text-green-700">
            {safe.formatDuration(timeUntilVotingEnd)}
          </p>
        </div>
      )}

      {(timeUntilExecutableLimit !== null && timeUntilExecutableLimit > 0 && !agenda.executed) && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h3 className="font-medium text-orange-900 mb-2">Time Until Execution Deadline</h3>
          <p className="text-2xl font-bold text-orange-700">
            {safe.formatDuration(timeUntilExecutableLimit)}
          </p>
        </div>
      )}

      {/* Status Alerts */}
      {agenda.status === 2 && timeUntilVotingEnd === 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-medium text-red-900 mb-2">Voting Period Ended</h3>
          <p className="text-red-700">
            The voting period for this agenda has concluded.
          </p>
        </div>
      )}

      {agenda.status === 3 && timeUntilExecutableLimit === 0 && !agenda.executed && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="font-medium text-red-900 mb-2">Execution Deadline Passed</h3>
          <p className="text-red-700">
            The execution deadline for this agenda has passed without execution.
          </p>
        </div>
      )}
    </div>
  );
}