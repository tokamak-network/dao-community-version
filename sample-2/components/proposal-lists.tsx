"use client";

import { Agenda } from "./proposals";
import {
  getStatusClass,
  getStatusText,
  formatDate,
  formatAddress,
  calculateAgendaStatus,
  getAgendaMetadata,
  getAllAgendaMetadata,
} from "@/lib/utils";
import { useEffect, useState } from "react";

interface ProposalListsProps {
  agendas: Agenda[];
}

interface AgendaWithMetadata extends Agenda {
  title?: string;
  description?: string;
}

export default function ProposalLists({ agendas }: ProposalListsProps) {
  const [agendasWithMetadata, setAgendasWithMetadata] = useState<
    AgendaWithMetadata[]
  >([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      const metadata = await getAllAgendaMetadata(agendas.map((a) => a.id));
      const updatedAgendas = agendas.map((agenda) => ({
        ...agenda,
        title: metadata[agenda.id]?.title,
        description: metadata[agenda.id]?.description,
      }));
      setAgendasWithMetadata(updatedAgendas);
    };

    fetchMetadata();
  }, [agendas]);

  if (!agendas || agendas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No agendas available</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-500 border-b">
            <th className="text-left py-4 font-medium">Proposal</th>
            <th className="text-right py-4 font-medium">Status</th>
            <th className="text-right py-4 font-medium">Result</th>
            <th className="text-right py-4 font-medium">Executed</th>
          </tr>
        </thead>
        <tbody>
          {agendasWithMetadata.map((agenda, index) => {
            const currentStatus = calculateAgendaStatus(agenda);
            return (
              <tr key={index} className="border-b">
                <td className="py-4">
                  <div className="flex flex-col">
                    <h3 className="font-medium">
                      {agenda.title || `Agenda #${agenda.id}`}
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${getStatusClass(
                          currentStatus
                        )}`}
                      >
                        {getStatusText(currentStatus)}
                      </span>
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {agenda.creator ? (
                        <>
                          This agenda was made by{" "}
                          {formatAddress(agenda.creator)} on{" "}
                          {formatDate(Number(agenda.createdTimestamp))}
                        </>
                      ) : (
                        <>
                          This agenda was made on{" "}
                          {formatDate(Number(agenda.createdTimestamp))}
                        </>
                      )}
                    </div>
                    {agenda.description && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {agenda.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-green-500">
                      {Number(agenda.countingYes).toLocaleString()}
                    </span>
                    <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(agenda.countingYes) /
                              (Number(agenda.countingYes) +
                                Number(agenda.countingNo))) *
                              100 || 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col items-end">
                    <span
                      className={`text-sm font-medium ${
                        Number(agenda.countingNo) > 0
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                    >
                      {Number(agenda.countingNo).toLocaleString()}
                    </span>
                    {Number(agenda.countingNo) > 0 && (
                      <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(agenda.countingNo) /
                                (Number(agenda.countingYes) +
                                  Number(agenda.countingNo))) *
                                100 || 0
                            )}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium">
                      {(
                        Number(agenda.countingYes) +
                        Number(agenda.countingNo) +
                        Number(agenda.countingAbstain)
                      ).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {`${agenda.voters?.length || 0} addresses`}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
