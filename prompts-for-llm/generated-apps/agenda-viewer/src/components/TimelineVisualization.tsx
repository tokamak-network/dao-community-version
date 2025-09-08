'use client';

import { useMemo } from 'react';
import { safe } from '@/lib/safe-utils';

interface AgendaData {
  createdTimestamp: bigint | null;
  noticeEndTimestamp: bigint | null;
  votingStartedTimestamp: bigint | null;
  votingEndTimestamp: bigint | null;
  executableLimitTimestamp: bigint | null;
  executedTimestamp: bigint | null;
  status: number;
  executed: boolean;
}

interface TimelineVisualizationProps {
  agenda: AgendaData;
}

interface TimelineStage {
  id: string;
  title: string;
  description: string;
  timestamp: bigint | null;
  status: 'completed' | 'current' | 'upcoming' | 'overdue';
  icon: string;
}

export default function TimelineVisualization({ agenda }: TimelineVisualizationProps) {
  const currentTime = useMemo(() => BigInt(Math.floor(Date.now() / 1000)), []);

  const timelineStages = useMemo((): TimelineStage[] => {
    const stages: TimelineStage[] = [
      {
        id: 'created',
        title: 'Agenda Created',
        description: 'Agenda was submitted to the DAO',
        timestamp: agenda.createdTimestamp,
        status: 'completed',
        icon: '📝'
      },
      {
        id: 'notice',
        title: 'Notice Period',
        description: 'Members can review the agenda',
        timestamp: agenda.noticeEndTimestamp,
        status: 'completed',
        icon: '📢'
      },
      {
        id: 'voting_start',
        title: 'Voting Started',
        description: 'Committee members can cast their votes',
        timestamp: agenda.votingStartedTimestamp,
        status: 'completed',
        icon: '🗳️'
      },
      {
        id: 'voting_end',
        title: 'Voting Ends',
        description: 'Voting period concludes',
        timestamp: agenda.votingEndTimestamp,
        status: 'upcoming',
        icon: '⏰'
      },
      {
        id: 'executable_limit',
        title: 'Execution Deadline',
        description: 'Final deadline for agenda execution',
        timestamp: agenda.executableLimitTimestamp,
        status: 'upcoming',
        icon: '⚡'
      }
    ];

    // Add execution stage if executed
    if (agenda.executed && agenda.executedTimestamp) {
      stages.push({
        id: 'executed',
        title: 'Executed',
        description: 'Agenda has been executed',
        timestamp: agenda.executedTimestamp,
        status: 'completed',
        icon: '✅'
      });
    }

    // Determine current status for each stage
    stages.forEach((stage, index) => {
      if (!stage.timestamp) {
        stage.status = 'upcoming';
        return;
      }

      const stageTime = stage.timestamp;
      
      if (stage.id === 'executed') {
        stage.status = 'completed';
      } else if (stageTime <= currentTime) {
        if (stage.id === 'executable_limit' && !agenda.executed) {
          stage.status = 'overdue';
        } else {
          stage.status = 'completed';
        }
      } else {
        // Find if this is the next upcoming stage
        const completedStages = stages.slice(0, index).filter(s => 
          s.timestamp && s.timestamp <= currentTime
        );
        
        if (completedStages.length === index) {
          stage.status = 'current';
        } else {
          stage.status = 'upcoming';
        }
      }
    });

    return stages;
  }, [agenda, currentTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'current':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'upcoming':
        return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'overdue':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getConnectorColor = (currentStatus: string, nextStatus: string) => {
    if (currentStatus === 'completed') {
      return 'bg-green-300';
    } else if (currentStatus === 'current') {
      return 'bg-blue-300';
    } else if (currentStatus === 'overdue') {
      return 'bg-red-300';
    } else {
      return 'bg-gray-300';
    }
  };

  const getTimeRemaining = (timestamp: bigint | null): string | null => {
    if (!timestamp) return null;
    
    const remaining = Number(timestamp) - Number(currentTime);
    if (remaining <= 0) return null;
    
    return safe.formatDuration(remaining);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Agenda Timeline</h2>

      <div className="relative">
        {timelineStages.map((stage, index) => (
          <div key={stage.id} className="relative flex items-start">
            {/* Timeline dot and connector */}
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getStatusColor(stage.status)}`}
              >
                <span className="text-lg">{stage.icon}</span>
              </div>
              {index < timelineStages.length - 1 && (
                <div
                  className={`w-0.5 h-16 mt-2 ${getConnectorColor(
                    stage.status,
                    timelineStages[index + 1]?.status || 'upcoming'
                  )}`}
                />
              )}
            </div>

            {/* Timeline content */}
            <div className="ml-4 pb-8 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{stage.title}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(stage.status)}`}
                >
                  {stage.status}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mt-1">{stage.description}</p>
              
              <div className="mt-2 space-y-1">
                {stage.timestamp && (
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Date:</span> {safe.formatDate(stage.timestamp)}
                  </p>
                )}
                
                {stage.status === 'current' && stage.timestamp && (
                  <p className="text-sm text-blue-600 font-medium">
                    Time remaining: {getTimeRemaining(stage.timestamp) || 'Time expired'}
                  </p>
                )}
                
                {stage.status === 'overdue' && (
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Deadline passed
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Stage Summary */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Stage Summary</h3>
        
        {(() => {
          const currentStage = timelineStages.find(s => s.status === 'current');
          const completedStages = timelineStages.filter(s => s.status === 'completed').length;
          const totalStages = timelineStages.length;
          
          if (currentStage) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{currentStage.title}</h4>
                  <span className="text-sm text-blue-700">
                    Stage {completedStages + 1} of {totalStages}
                  </span>
                </div>
                <p className="text-blue-700 text-sm">{currentStage.description}</p>
                {currentStage.timestamp && getTimeRemaining(currentStage.timestamp) && (
                  <p className="text-blue-800 font-medium mt-2">
                    ⏱️ {getTimeRemaining(currentStage.timestamp)} remaining
                  </p>
                )}
              </div>
            );
          } else if (agenda.executed) {
            return (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-900">Agenda Completed</h4>
                  <span className="text-sm text-green-700">✅ Executed</span>
                </div>
                <p className="text-green-700 text-sm">
                  This agenda has been successfully executed.
                </p>
              </div>
            );
          } else {
            const overdueStage = timelineStages.find(s => s.status === 'overdue');
            if (overdueStage) {
              return (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-900">Deadline Passed</h4>
                    <span className="text-sm text-red-700">⚠️ Overdue</span>
                  </div>
                  <p className="text-red-700 text-sm">
                    The execution deadline has passed without execution.
                  </p>
                </div>
              );
            } else {
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900">All Stages Completed</h4>
                  <p className="text-gray-700 text-sm">
                    All timeline stages have been completed.
                  </p>
                </div>
              );
            }
          }
        })()}
      </div>

      {/* Progress Bar */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(timelineStages.filter(s => s.status === 'completed').length / timelineStages.length) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>
            {timelineStages.filter(s => s.status === 'completed').length} of {timelineStages.length} stages completed
          </span>
          <span>
            {((timelineStages.filter(s => s.status === 'completed').length / timelineStages.length) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}