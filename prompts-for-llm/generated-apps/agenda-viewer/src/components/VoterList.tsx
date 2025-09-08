'use client';

import { useState, useMemo } from 'react';
import { safe } from '@/lib/safe-utils';

interface VoterListProps {
  voters: string[];
  chainId: number;
}

export default function VoterList({ voters, chainId }: VoterListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  const getEtherscanUrl = (address: string, chainId: number): string => {
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
    return `${baseUrl}/address/${address}`;
  };

  const filteredVoters = useMemo(() => {
    if (!searchTerm) return voters;
    return voters.filter(voter => 
      voter.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [voters, searchTerm]);

  const paginatedVoters = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVoters.slice(startIndex, endIndex);
  }, [filteredVoters, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      // Simple visual feedback - you could enhance this with a toast notification
      const button = document.getElementById(`copy-${address}`);
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Voter Information</h2>
        <div className="text-sm text-gray-600">
          Total: {voters.length} voters
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-blue-600">{voters.length}</div>
          <div className="text-sm text-blue-700">Total Voters</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600">{filteredVoters.length}</div>
          <div className="text-sm text-green-700">Matching Search</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-md text-center">
          <div className="text-2xl font-bold text-purple-600">{totalPages}</div>
          <div className="text-sm text-purple-700">Pages</div>
        </div>
      </div>

      {voters.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-lg font-medium">No voters yet</p>
            <p className="text-sm">Voter addresses will appear here once voting begins.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Voter Addresses
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter address or part of address..."
            />
          </div>

          {/* Voter List */}
          <div className="space-y-3 mb-6">
            {paginatedVoters.map((voter, index) => (
              <div
                key={voter}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {((currentPage - 1) * itemsPerPage + index + 1)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-mono text-sm text-gray-900">{voter}</div>
                    <div className="text-xs text-gray-500">
                      {safe.formatAddress(voter)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    id={`copy-${voter}`}
                    onClick={() => copyToClipboard(voter)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-medium transition-colors"
                  >
                    📋 Copy
                  </button>
                  
                  <a
                    href={getEtherscanUrl(voter, chainId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
                  >
                    🔗 Etherscan
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* No results message */}
          {filteredVoters.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-lg font-medium">No matching addresses found</p>
                <p className="text-sm">Try adjusting your search term.</p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-6">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredVoters.length)} of{' '}
                {filteredVoters.length} voters
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  const csvContent = voters.map((voter, index) => `${index + 1},${voter}`).join('\n');
                  const blob = new Blob([`Number,Address\n${csvContent}`], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'voters.csv';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                📊 Export CSV
              </button>
              
              <button
                onClick={() => {
                  const jsonContent = JSON.stringify(voters, null, 2);
                  const blob = new Blob([jsonContent], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'voters.json';
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                📄 Export JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}