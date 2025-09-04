"use client";

import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col items-center space-y-8 text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">
          DAO Community Platform
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl">
          A decentralized autonomous organization platform for community governance and decision making.
        </p>
      </div>


      {/* Navigation Links */}
      <div className="flex flex-col items-center space-y-4">
        <Link
          href="/dao-committee"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          👥 View DAO Committee Members
        </Link>

        <Link
          href="/agenda"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          📋 Browse Agendas
        </Link>
      </div>
    </div>
  )
}