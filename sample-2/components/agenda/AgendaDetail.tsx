import { useState } from "react";
import Image from "next/image";
import { AgendaWithMetadata } from "@/types/agenda";
import {
  getStatusClass,
  getStatusText,
  formatDate,
  formatAddress,
  calculateAgendaStatus,
  getAgendaTimeInfo,
} from "@/lib/utils";
import {
  Zap,
  MoreVertical,
  Copy,
  CheckCircle2,
  Square,
  Hourglass,
  Bolt,
  PlusCircle,
  ChevronRight,
  Circle,
  Timer,
} from "lucide-react";
import AgendaDescription from "./AgendaDescription";
import AgendaActions from "./AgendaActions";
import AgendaStatusTimeline from "./AgendaStatusTimeline";
import AgendaVotes from "./AgendaVotes";

interface AgendaDetailProps {
  agenda: AgendaWithMetadata;
}

type TabType = "description" | "actions" | "votes";

export default function AgendaDetail({ agenda }: AgendaDetailProps) {
  const [activeTab, setActiveTab] = useState<TabType>("description");
  const currentStatus = calculateAgendaStatus(agenda);
  const timeInfo = getAgendaTimeInfo(agenda);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Proposal Header */}
      <div className="p-6">
        <div
          className={`inline-block px-3 py-1 ${getStatusClass(
            currentStatus
          )} text-xs font-medium rounded-md mb-4`}
        >
          {getStatusText(currentStatus)}
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {agenda.title || `Agenda #${agenda.id}`}
          </h1>
          <div className="flex items-center">
            <div className="flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md mr-2">
              <Zap className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">
                {agenda.executed ? "Proposal executed" : "Proposal active"}
              </span>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Proposal Meta */}
        <div className="flex items-center mt-4 text-sm">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gray-300 mr-2 overflow-hidden"></div>
            <span className="text-gray-700">
              by {agenda.creator ? formatAddress(agenda.creator) : "Unknown"}
            </span>
          </div>
          <div className="flex items-center ml-4">
            <span className="text-gray-500">ID {agenda.id}</span>
            <button className="ml-1 text-gray-400 hover:text-gray-600">
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="ml-4 text-gray-500">
            • Proposed on: {formatDate(Number(agenda.createdTimestamp))}
          </div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="border-t border-gray-200">
        <div className="flex">
          <div className="w-2/3 border-r border-gray-200">
            <div className="p-6">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "description"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("description")}
                  >
                    Description
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "actions"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("actions")}
                  >
                    Actions
                  </button>
                  <button
                    className={`px-4 py-2 ${
                      activeTab === "votes"
                        ? "text-indigo-600 border-b-2 border-indigo-600 font-medium"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    onClick={() => setActiveTab("votes")}
                  >
                    Votes
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === "description" ? (
                  <AgendaDescription agenda={agenda} />
                ) : activeTab === "actions" ? (
                  <AgendaActions agenda={agenda} />
                ) : (
                  <AgendaVotes agenda={agenda} />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-1/3">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Final Votes
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-gray-700">Quorum</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(agenda.countingYes) +
                      Number(agenda.countingNo) +
                      Number(agenda.countingAbstain)}{" "}
                    votes
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 mr-2" />
                    <span className="text-gray-700">Majority support</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(agenda.countingYes) > Number(agenda.countingNo)
                      ? "Yes"
                      : "No"}
                  </span>
                </div>
              </div>

              {/* Voting Progress Bar */}
              <div className="h-2 w-full bg-gray-200 rounded-full mb-4">
                <div
                  className="h-2 bg-emerald-500 rounded-full"
                  style={{
                    width: `${
                      (Number(agenda.countingYes) /
                        (Number(agenda.countingYes) +
                          Number(agenda.countingNo) +
                          Number(agenda.countingAbstain))) *
                      100
                    }%`,
                  }}
                ></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 mr-2"></div>
                    <span className="text-gray-700">For</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(agenda.countingYes)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-gray-700">Against</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(agenda.countingNo)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-4 w-4 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-700">Abstain</span>
                  </div>
                  <span className="text-gray-700">
                    {Number(agenda.countingAbstain)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="border-t border-gray-200 pt-6">
                <AgendaStatusTimeline agenda={agenda} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
