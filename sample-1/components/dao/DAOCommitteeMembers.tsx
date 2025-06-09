'use client'
import { useState } from 'react'
import { useDAOContext } from '@/contexts/DAOContext'
import { useAccount } from 'wagmi'
import { formatTONWithUnit, formatRelativeTime, formatDateTime } from '@/utils/format'

export default function DAOCommitteeMembers() {
  const {
    committeeMembers,
    isLoadingMembers,
    membersError,
    refreshCommitteeMembers,
  } = useDAOContext()

  const { isConnected: isWalletConnected, address } = useAccount()
  const [expandedMember, setExpandedMember] = useState<number | null>(null)

  const handleViewDetails = (index: number) => {
    setExpandedMember(expandedMember === index ? null : index)
  }

  const handleChallenge = (member: any) => {
    console.log('Challenge member:', member.name)
  }

  const handleRetireMember = (member: any) => {
    console.log('Retire member:', member.name)
    // TODO: Implement retire member functionality
  }

  const handleClaimActivityReward = (member: any) => {
    console.log('Claim activity reward for member:', member.name, 'Amount:', member.claimableActivityReward)
    // TODO: Implement claim activity reward functionality
  }

  // 해당 멤버가 현재 연결된 지갑의 소유자인지 확인 (creationAddress 또는 manager 주소)
  const isOwnMember = (member: any) => {
    if (!address) return false;

    const lowerAddress = address.toLowerCase();
    const isCreator = member.creationAddress.toLowerCase() === lowerAddress;
    const isManager = member.manager && member.manager.toLowerCase() === lowerAddress;

    // console.log('🔍 Checking ownership:', {
    //   memberName: member.name,
    //   connectedAddress: address,
    //   creationAddress: member.creationAddress,
    //   managerAddress: member.manager,
    //   isCreator,
    //   isManager,
    //   canManage: isCreator || isManager
    // });

    return isCreator || isManager;
  }

  console.log("🚀 committeeMembers ", committeeMembers);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-normal text-zinc-900 font-['Inter']">
              DAO Committee Members
            </h1>
            <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
              <span className="text-xs text-gray-600 font-medium">?</span>
            </div>
          </div>

          {/* Check the challenge 버튼 - 지갑이 연결되었을 때만 표시 */}
          {isWalletConnected && (
            <a href="#" className="no-underline">
              <div className="p-3 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-slate-200 inline-flex justify-center items-center gap-1.5">
                <div className="text-center justify-start text-slate-700 text-sm font-semibold font-['Inter'] leading-none">
                  Check the challenge
                </div>
              </div>
            </a>
          )}
        </div>

      </div>

      {/* Loading state */}
      {isLoadingMembers && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading committee members...</p>
        </div>
      )}

      {/* Error state */}
      {membersError && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-red-500 text-lg">{membersError}</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => refreshCommitteeMembers()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Data display */}
      {!isLoadingMembers && committeeMembers && committeeMembers.length > 0 && (
        <div className="flex flex-col gap-4">
          {committeeMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >

              {/* Member Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-900 text-[9px] font-normal font-['Inter']">Total Staked </span>
                    <span className="text-slate-700 text-[9px] font-normal font-['Inter']">{formatTONWithUnit(member.totalStaked)}</span>
                  </div>
                  <div className="self-stretch justify-start text-slate-700 text-xl font-semibold font-['Inter']">{member.name}</div>
                  <div className="self-stretch justify-start text-gray-600 text-sm font-normal font-['Inter']">{member.description}</div>
                </div>
              </div>

              {/* Status with clock icon */}
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span className="text-gray-600 text-[10px] font-normal font-['Inter']">
                  Staking reward last updated {formatRelativeTime(member.lastUpdateSeigniorageTime)}
                </span>
              </div>

              {/* Buttons at bottom */}
              <div className="flex justify-between items-center">
                <div
                  data-size="Small"
                  data-state="Default"
                  data-type="Primary"
                  className="w-32 px-4 py-1 rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer border"
                  style={{
                    backgroundColor: expandedMember === index ? 'transparent' : '#2A72E5',
                    borderColor: expandedMember === index ? '#D1D5DB' : '#2A72E5'
                  }}
                  onClick={() => handleViewDetails(index)}
                >
                  <div
                    className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose"
                    style={{color: expandedMember === index ? '#374151' : '#FFFFFF'}}
                  >
                    {expandedMember === index ? "Close" : "View Details"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Challenge 버튼 - 항상 표시 */}
                  <div
                    className="px-4 py-1 rounded-md inline-flex justify-center items-center cursor-pointer"
                    style={{backgroundColor: '#2A72E5'}}
                    onClick={() => handleChallenge(member)}
                  >
                    <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                      Challenge
                    </div>
                  </div>

                                    {/* Creator 또는 Manager인 경우에만 표시되는 버튼들 */}
                  {isOwnMember(member) && (
                    <>
                      <div
                        className="px-4 py-1 rounded-md inline-flex justify-center items-center cursor-pointer"
                        style={{backgroundColor: '#DC2626'}}
                        onClick={() => handleRetireMember(member)}
                      >
                        <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                          Retire
                        </div>
                      </div>

                      <div
                        className="px-4 py-1 rounded-md inline-flex justify-center items-center cursor-pointer"
                        style={{backgroundColor: '#059669'}}
                        onClick={() => handleClaimActivityReward(member)}
                      >
                        <div className="text-center justify-start text-sm font-semibold font-['Proxima_Nova'] leading-loose" style={{color: '#FFFFFF'}}>
                          Claim Reward
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedMember === index && (
                <div className="border-t border-gray-100 pt-6 mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-sm text-gray-900 text-right">{member.name}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Candidate Address</label>
                      <a
                        href={`https://etherscan.io/address/${member.creationAddress}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-mono ml-4"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={member.creationAddress}
                      >
                        {member.creationAddress}
                      </a>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Candidate Contract</label>
                      <a
                        href={`https://etherscan.io/address/${member.candidateContract}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-mono ml-4"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={member.candidateContract}
                      >
                        {member.candidateContract}
                      </a>
                    </div>

                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Total Staked</label>
                      <p className="text-sm text-gray-900 font-medium text-right">
                        {formatTONWithUnit(member.totalStaked)}
                      </p>
                    </div>

                    <div className="flex justify-between">
                      <label className="text-sm font-medium text-gray-600">Claimable Activity Reward</label>
                      <p className="text-sm text-gray-900 font-medium text-right">
                        {member.claimableActivityReward ? formatTONWithUnit(member.claimableActivityReward) : "Not available"}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600">Last Reward Update</label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 text-right">
                          {formatDateTime(member.lastUpdateSeigniorageTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No data state */}
      {!isLoadingMembers && !membersError && (!committeeMembers || committeeMembers.length === 0) && (
        <div className="flex flex-col items-center gap-4 py-8">
          <p className="text-gray-500 text-lg">No committee members found</p>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => refreshCommitteeMembers()}
          >
            Load Data
          </button>
        </div>
      )}

      {committeeMembers && committeeMembers.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            {!isWalletConnected ? (
              <>💡 Connect your wallet to interact with committee members</>
            ) : (
              <>ℹ️ You can challenge any committee member. Retire and claim buttons appear only for memberships you created or manage.</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}