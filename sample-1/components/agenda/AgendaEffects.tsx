'use client'
import { useState, useEffect } from 'react'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatAddress } from '@/lib/utils'
import { Interface } from 'ethers'
import { useCombinedDAOContext } from '@/contexts/CombinedDAOContext'
import { TON_CONTRACT_ADDRESS, getCurrentChain } from '@/config/contracts'

interface AgendaEffectsProps {
  agenda: AgendaWithMetadata
}

interface DecodedParam {
  name: string
  type: string
  value: any
}

interface SubmissionData {
  contract: string
  function: string
  parameters: {
    spender: string
    amount: string
    data: string
  }
}

export default function AgendaEffects({ agenda }: AgendaEffectsProps) {
  const { getTransactionData } = useCombinedDAOContext()
  const [expandedParams, setExpandedParams] = useState<{
    [key: string]: boolean
  }>({})
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null)
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false)

  // Load submission data once when component mounts
  useEffect(() => {
    const loadSubmissionData = async () => {
      if (isLoadingSubmission) return

      // First check if we already have cached creation calldata
      if (agenda.creationCalldata) {
        const parsed = parseTransactionCalldata(agenda.creationCalldata)
        setSubmissionData(parsed)
        return
      }

      // If no cached calldata, show unavailable message
      setSubmissionData(null)
    }

    loadSubmissionData()
  }, [agenda.creationCalldata, isLoadingSubmission])

  const openEtherscan = (address: string) => {
    const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://etherscan.io'
    window.open(`${explorerUrl}/address/${address}`, '_blank')
  }

  const decodeCalldata = (action: any) => {
    if (!action.abi || !action.calldata) return null

    try {
      const func = action.abi.find((item: any) => {
        if (!item || !item.inputs) return false
        const paramTypes = item.inputs
          .map((input: any) => input.type)
          .join(',')
        return `${item.name}(${paramTypes})` === action.method
      })

      if (func) {
        const iface = new Interface([func])
        const decodedParams = iface.decodeFunctionData(
          func.name,
          action.calldata
        )

        return func.inputs.map(
          (input: any, index: number): DecodedParam => ({
            name: input.name,
            type: input.type,
            value: decodedParams[index],
          })
        )
      }
    } catch (error) {
      console.error('Error decoding calldata:', error)
    }
    return null
  }

  function parseTransactionCalldata(transactionData: string): SubmissionData | null {
    if (!transactionData || !transactionData.startsWith('0x')) {
      return null
    }

    try {
      // For TON contract approveAndCall function
      // Function signature: approveAndCall(address,uint256,bytes)
      // Selector: 0xcae9ca51

      if (transactionData.length < 10) {
        return null
      }

      const selector = transactionData.slice(0, 10)
      const calldata = transactionData.slice(10)

      // Check if this is approveAndCall function
      if (selector === '0xcae9ca51') {
        // Decode the parameters manually
        // address spender: 32 bytes (20 bytes address padded)
        // uint256 amount: 32 bytes
        // bytes data: dynamic, starts with offset and length

        if (calldata.length < 192) { // Minimum for 3 parameters
          return null
        }

        // Parse spender address (first 32 bytes, take last 20 bytes)
        const spenderHex = calldata.slice(24, 64)
        const spender = '0x' + spenderHex

        // Parse amount (second 32 bytes)
        const amountHex = calldata.slice(64, 128)
        const amount = parseInt(amountHex, 16)
        const formattedAmount = (amount / 1e18).toFixed(1) + ' TON'

        // Parse data offset (third 32 bytes)
        const dataOffsetHex = calldata.slice(128, 192)
        const dataOffset = parseInt(dataOffsetHex, 16) * 2 // Convert to hex chars

        // Parse data length
        const dataLengthHex = calldata.slice(192, 256)
        const dataLength = parseInt(dataLengthHex, 16) * 2 // Convert to hex chars

        // Extract actual data
        const data = '0x' + calldata.slice(256, 256 + dataLength)

        return {
          contract: TON_CONTRACT_ADDRESS || '',
          function: 'approveAndCall(address spender, uint256 amount, bytes data)',
          parameters: {
            spender,
            amount: formattedAmount,
            data
          }
        }
      }

      return null
    } catch (error) {
      console.error('Error parsing transaction calldata:', error)
      return null
    }
  }

  // Use real data only, no mock data fallback
  const displayActions = agenda.actions && agenda.actions.length > 0
    ? agenda.actions
    : []

  return (
    <div className="space-y-6">
      {agenda.transaction ? (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Action</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Contract</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Method</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Parameters</th>
                </tr>
              </thead>
              <tbody>
                {displayActions.length > 0 ? displayActions.map((action, index) => {
                  const decodedParams = decodeCalldata(action)
                  return (
                    <>
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 text-sm text-gray-900">#{index + 1}</td>
                        <td className="py-3 text-sm">
                          <a
                            href="#"
                            className="text-blue-600 hover:text-blue-700 font-mono"
                            onClick={(e) => {
                              e.preventDefault()
                              if (action.contractAddress.startsWith('0x') && action.contractAddress.length > 10) {
                                openEtherscan(action.contractAddress)
                              }
                            }}
                          >
                            {action.contractAddress.startsWith('0x')
                              ? formatAddress(action.contractAddress)
                              : action.contractAddress} ↗
                          </a>
                        </td>
                        <td className="py-3 text-sm text-gray-900">
                          📋 {action.method}
                        </td>
                        <td className="py-3 text-sm text-blue-600">
                          <button
                            onClick={() => setExpandedParams(prev => ({
                              ...prev,
                              [`action-${index}`]: !prev[`action-${index}`]
                            }))}
                            className="hover:text-blue-700"
                          >
                            {decodedParams?.length || 'View'} params
                            <span className="ml-1">
                              {expandedParams[`action-${index}`] ? '⌃' : '⌄'}
                            </span>
                          </button>
                        </td>
                      </tr>
                      {expandedParams[`action-${index}`] && (
                        <tr>
                          <td colSpan={4} className="px-0 py-0">
                            <div className="bg-gray-50 p-4 border-t border-gray-200">
                              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="p-4">
                                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    Function Parameters
                                  </h4>
                                  {decodedParams && decodedParams.length > 0 ? (
                                    <div className="space-y-3">
                                      {decodedParams.map((param: DecodedParam, paramIndex: number) => (
                                        <div key={paramIndex} className="flex items-start space-x-3">
                                          <div className="w-32 flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-700">
                                              {param.name || `Parameter ${paramIndex + 1}`}
                                            </span>
                                            <div className="text-xs text-gray-500">
                                              {param.type}
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <div className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                                              {param.value.toString()}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Raw Calldata</h5>
                                      <div className="font-mono text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all whitespace-pre-wrap">
                                        {action.calldata || 'No calldata available'}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                }) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 text-sm">
                      No actions available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DAO Agenda Submission Parameters</h3>

            <div className="space-y-4">
              {isLoadingSubmission ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    Loading submission parameters...
                  </div>
                </div>
              ) : !submissionData ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    No submission parameters available
                  </div>
                </div>
              ) : (
                <>
                  {/* TON Contract */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">TON Contract</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <a
                        href="#"
                        className="text-sm font-mono text-gray-700 hover:text-blue-600"
                        onClick={(e) => {
                          e.preventDefault()
                          if (submissionData.contract) {
                            openEtherscan(submissionData.contract)
                          }
                        }}
                      >
                        {submissionData.contract} ↗
                      </a>
                    </div>
                  </div>

                  {/* Function */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Function</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <span className="text-sm text-gray-700">
                        {submissionData.function} ↗
                      </span>
                    </div>
                  </div>

                  {/* Function Parameters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Function Parameters</h4>

                    <div className="space-y-3">
                      {/* spender */}
                      <div>
                        <div className="text-sm text-gray-500 mb-1">spender</div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <a
                            href="#"
                            className="text-sm font-mono text-gray-700 hover:text-blue-600"
                            onClick={(e) => {
                              e.preventDefault()
                              if (submissionData.parameters.spender) {
                                openEtherscan(submissionData.parameters.spender)
                              }
                            }}
                          >
                            {submissionData.parameters.spender} ↗
                          </a>
                        </div>
                      </div>

                      {/* amount */}
                      <div>
                        <div className="text-sm text-gray-500 mb-1">amount</div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <span className="text-sm font-mono text-gray-700">
                            {submissionData.parameters.amount}
                          </span>
                        </div>
                      </div>

                      {/* data */}
                      <div>
                        <div className="text-sm text-gray-500 mb-1">data</div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="text-xs font-mono text-gray-600 break-all whitespace-pre-wrap">
                            {submissionData.parameters.data}
                          </div>
                        </div>

                        {/* Encoded Data Structure */}
                        {agenda.transaction && (
                          <div className="mt-4 bg-white border border-gray-200 rounded-lg">
                            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                              <span className="text-xs font-medium text-gray-700">
                                Encoded Data Structure
                              </span>
                            </div>
                            <div className="p-3 space-y-2 text-xs">
                              {/* Target Addresses */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">address[]:</span>
                                <span className="font-mono text-gray-700">
                                  [
                                  {displayActions
                                    .map((a) => `"${a.contractAddress}"`)
                                    .join(', ')}
                                  ]
                                </span>
                              </div>

                              {/* Notice Period - sample data for now */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">uint128:</span>
                                <span className="font-mono text-gray-700">
                                  300 (notice period seconds)
                                </span>
                              </div>

                              {/* Voting Period - sample data for now */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">uint128:</span>
                                <span className="font-mono text-gray-700">
                                  600 (voting period seconds)
                                </span>
                              </div>

                              {/* Atomic Execute */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">bool:</span>
                                <span className="font-mono text-gray-700">
                                  true (atomic execute)
                                </span>
                              </div>

                              {/* Calldata Array */}
                              <div className="grid grid-cols-[120px_1fr] gap-2">
                                <span className="text-gray-500 font-medium">bytes[]:</span>
                                <div className="font-mono text-gray-700">
                                  {displayActions.length === 0
                                    ? '[]'
                                    : displayActions.map((action, index) => (
                                        <div key={index} className="mb-1">
                                          <span className="text-gray-500">
                                            #{index + 1}:
                                          </span>{' '}
                                          {action.calldata || '0x'}
                                        </div>
                                      ))}
                                </div>
                              </div>

                              {/* Memo Field */}
                              {agenda.snapshotUrl && (
                                <div className="grid grid-cols-[120px_1fr] gap-2">
                                  <span className="text-gray-500 font-medium">string:</span>
                                  <span className="font-mono text-gray-700">
                                    "{agenda.snapshotUrl}" (memo: reference URL)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-500 text-sm mb-4">
            This agenda is not registered in the DAO Agenda Metadata Repository.
          </div>
          <div className="text-center">
            <a
              href={`https://github.com/tokamak-network/dao-agenda-metadata-repository/tree/main/data/agendas/${getCurrentChain().name.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
            >
              DAO Agenda Metadata Repository
              <span className="ml-1">↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}