"use client";

interface Proposal {
  title: string;
  status: string;
  date: string;
  votesFor: string;
  votesAgainst: string;
  totalVotes: string;
  addresses: string;
}

interface ProposalListsProps {
  proposals: Proposal[];
}

export default function ProposalLists({ proposals }: ProposalListsProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-sm text-gray-500 border-b">
            <th className="text-left py-4 font-medium">Proposal</th>
            <th className="text-right py-4 font-medium">Votes for</th>
            <th className="text-right py-4 font-medium">Votes against</th>
            <th className="text-right py-4 font-medium">Total votes</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal, index) => (
            <tr key={index} className="border-b">
              <td className="py-4">
                <div className="flex flex-col">
                  <h3 className="font-medium">{proposal.title}</h3>
                  <div className="flex items-center mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getStatusClass(
                        proposal.status
                      )}`}
                    >
                      {proposal.status}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {proposal.date}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    Tokamak Network Governor
                  </span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-green-500">
                    {proposal.votesFor}
                  </span>
                  <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number.parseFloat(
                            proposal.votesFor.replace(/,/g, "")
                          ) /
                            (Number.parseFloat(
                              proposal.votesFor.replace(/,/g, "")
                            ) +
                              Number.parseFloat(
                                proposal.votesAgainst.replace(/,/g, "") || "0"
                              ))) *
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
                      Number.parseFloat(proposal.votesAgainst) > 0
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {proposal.votesAgainst}
                  </span>
                  {Number.parseFloat(proposal.votesAgainst) > 0 && (
                    <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number.parseFloat(
                              proposal.votesAgainst.replace(/,/g, "")
                            ) /
                              (Number.parseFloat(
                                proposal.votesFor.replace(/,/g, "")
                              ) +
                                Number.parseFloat(
                                  proposal.votesAgainst.replace(/,/g, "")
                                ))) *
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
                    {proposal.totalVotes}
                  </span>
                  <span className="text-xs text-gray-500">
                    {proposal.addresses}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-100 text-purple-600";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    case "PENDING EXECUTION":
      return "bg-blue-100 text-blue-600";
    case "EXECUTED":
      return "bg-green-100 text-green-600";
    case "DEFEATED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}
