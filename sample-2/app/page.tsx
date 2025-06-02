"use client";

import { Button } from "@/components/ui/button";
import { FileEdit, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Tokamak Network DAO
          </h1>
          <p className="text-xl text-gray-600">Community Proposal Platform</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A platform for creating, voting, and executing proposals for Tokamak
            Network DAO. Help make better decisions by gathering community
            opinions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Link href="/proposals">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
              <FileEdit className="w-5 h-5 mr-2" />
              View Proposals
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/proposals/new">
            <Button
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-6 text-lg"
            >
              <FileEdit className="w-5 h-5 mr-2" />
              Create Proposal
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Create Proposals
            </h3>
            <p className="text-gray-600">
              Write and submit new proposals for the community.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Participate in Voting
            </h3>
            <p className="text-gray-600">
              Vote on active proposals and share your opinions.
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Execution Management
            </h3>
            <p className="text-gray-600">
              Manage and monitor the execution of approved proposals.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
