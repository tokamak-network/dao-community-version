"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Link from "next/link"

export default function Proposals() {
  const [activeTab, setActiveTab] = useState("onchain")

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="onchain" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger
                value="onchain"
                className={`px-4 py-2 rounded-none border-b-2 ${activeTab === "onchain" ? "border-purple-600 text-purple-600" : "border-transparent"}`}
                onClick={() => setActiveTab("onchain")}
              >
                Onchain
              </TabsTrigger>
              <TabsTrigger
                value="drafts"
                className={`px-4 py-2 rounded-none border-b-2 ${activeTab === "drafts" ? "border-purple-600 text-purple-600" : "border-transparent"}`}
                onClick={() => setActiveTab("drafts")}
              >
                My Drafts
              </TabsTrigger>
            </TabsList>
            <Link href="/proposals/new">
              <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded-full">
                + New proposal
              </Button>
            </Link>
          </div>

          <TabsContent value="onchain" className="mt-0">
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
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusClass(proposal.status)}`}>
                              {proposal.status}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">{proposal.date}</span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">Compound Governor</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-green-500">{proposal.votesFor}</span>
                          <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{
                                width: `${Math.min(100, (Number.parseFloat(proposal.votesFor.replace(/,/g, "")) / (Number.parseFloat(proposal.votesFor.replace(/,/g, "")) + Number.parseFloat(proposal.votesAgainst.replace(/,/g, "") || "0"))) * 100 || 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm font-medium ${Number.parseFloat(proposal.votesAgainst) > 0 ? "text-red-500" : "text-gray-500"}`}
                          >
                            {proposal.votesAgainst}
                          </span>
                          {Number.parseFloat(proposal.votesAgainst) > 0 && (
                            <div className="w-24 h-1 bg-gray-200 mt-1 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{
                                  width: `${Math.min(100, (Number.parseFloat(proposal.votesAgainst.replace(/,/g, "")) / (Number.parseFloat(proposal.votesFor.replace(/,/g, "")) + Number.parseFloat(proposal.votesAgainst.replace(/,/g, "")))) * 100 || 0)}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium">{proposal.totalVotes}</span>
                          <span className="text-xs text-gray-500">{proposal.addresses} addresses</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-0">
            <div className="flex items-center justify-center h-40 border rounded-md">
              <p className="text-gray-500">No drafts available</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function getStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-purple-100 text-purple-600"
    case "CANCELLED":
      return "bg-gray-100 text-gray-600"
    case "PENDING EXECUTION":
      return "bg-blue-100 text-blue-600"
    case "EXECUTED":
      return "bg-green-100 text-green-600"
    case "DEFEATED":
      return "bg-red-100 text-red-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

const proposals = [
  {
    title: "Update tETH price feed on WETH Mainnet market",
    status: "ACTIVE",
    date: "Apr 18th, 2025",
    votesFor: "419.75K",
    votesAgainst: "0",
    totalVotes: "419.75K",
    addresses: "23 addresses",
  },
  {
    title: "Update tETH price feed on WETH Mainnet market",
    status: "CANCELLED",
    date: "Apr 18th, 2025",
    votesFor: "0",
    votesAgainst: "0",
    totalVotes: "0",
    addresses: "0 addresses",
  },
  {
    title: "[Gauntlet] - Supply Cap Recommendations (4/14/25)",
    status: "ACTIVE",
    date: "Apr 17th, 2025",
    votesFor: "469.75K",
    votesAgainst: "0",
    totalVotes: "469.75K",
    addresses: "26 addresses",
  },
  {
    title: "[Gauntlet] - USDbc Deprecation Recommendations",
    status: "ACTIVE",
    date: "Apr 17th, 2025",
    votesFor: "469.75K",
    votesAgainst: "0",
    totalVotes: "469.75K",
    addresses: "24 addresses",
  },
  {
    title: "Initialize cWRONv3 on Ronin",
    status: "PENDING EXECUTION",
    date: "Apr 15th, 2025",
    votesFor: "599.86K",
    votesAgainst: "0.04",
    totalVotes: "679.86K",
    addresses: "63 addresses",
  },
  {
    title: "[Gauntlet] Risk Parameter Recommendations (02/2025) - V3...",
    status: "EXECUTED",
    date: "Apr 8th, 2025",
    votesFor: "630.12K",
    votesAgainst: "0.15",
    totalVotes: "710.82K",
    addresses: "77 addresses",
  },
  {
    title: "Formalizing the Community Multisig",
    status: "EXECUTED",
    date: "Apr 7th, 2025",
    votesFor: "630.82K",
    votesAgainst: "0.33",
    totalVotes: "710.82K",
    addresses: "69 addresses",
  },
  {
    title: "2025 Compound Growth Program Renewal V4 [AlphaGrowth]",
    status: "DEFEATED",
    date: "Mar 31st, 2025",
    votesFor: "574.38K",
    votesAgainst: "1.23M",
    totalVotes: "1.8M",
    addresses: "148 addresses",
  },
  {
    title: "[Gauntlet] - Interest Rate Curve Recommendations (03/25)",
    status: "EXECUTED",
    date: "Mar 26th, 2025",
    votesFor: "990.41K",
    votesAgainst: "2.23",
    totalVotes: "990.42K",
    addresses: "128 addresses",
  },
  {
    title: "[Gauntlet] - Cap recommendations (03/24/25)",
    status: "EXECUTED",
    date: "Mar 24th, 2025",
    votesFor: "703.9K",
    votesAgainst: "2.41",
    totalVotes: "703.9K",
    addresses: "154 addresses",
  },
]
