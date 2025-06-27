'use client'
import { useState } from 'react'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatAddress } from '@/lib/utils'
import { Interface } from 'ethers'

interface AgendaEffectsProps {
  agenda: AgendaWithMetadata
}

interface DecodedParam {
  name: string
  type: string
  value: any
}

export default function AgendaEffects({ agenda }: AgendaEffectsProps) {
  const [expandedParams, setExpandedParams] = useState<{
    [key: string]: boolean
  }>({})

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

  // Use real data if available, fallback to mock data for UI consistency
  const displayActions = agenda.actions && agenda.actions.length > 0
    ? agenda.actions
    : [
        {
          contractAddress: '0xTO0...8770',
          method: 'TransferAddresstosc,uir(256)',
          calldata: '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000330d4aae433bae8f8b967be31e67ceaa04ef501950000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d42395423ae883bae8f8b6734e62ea049ef501950000000000000000000000000000000000000000000000000000000000000000000000000',
          abi: null
        }
      ]

  return (
    <div className="space-y-6">
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
            {displayActions.map((action, index) => {
              const decodedParams = decodeCalldata(action)
              return (
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
                        : action.contractAddress}
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
                      {decodedParams?.length || 'View'} params &gt;
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DAO Agenda Submission Parameters</h3>

        <div className="space-y-4">
          {displayActions.length > 0 && (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Contract</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <a
                    href="#"
                    className="text-sm font-mono text-gray-700 hover:text-blue-600"
                    onClick={(e) => {
                      e.preventDefault()
                      if (displayActions[0].contractAddress.startsWith('0x') && displayActions[0].contractAddress.length > 10) {
                        openEtherscan(displayActions[0].contractAddress)
                      }
                    }}
                  >
                    {displayActions[0].contractAddress} ↗
                  </a>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Function</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-700">
                    {displayActions[0].method} ↗
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Function Parameters</h4>

                <div className="space-y-3">
                  {displayActions.map((action, actionIndex) => {
                    const decodedParams = decodeCalldata(action)

                                         if (decodedParams && decodedParams.length > 0) {
                       return decodedParams.map((param: DecodedParam, paramIndex: number) => (
                        <div key={`${actionIndex}-${paramIndex}`}>
                          <h5 className="text-sm font-medium text-gray-700 mb-1 capitalize">
                            {param.name || `Parameter ${paramIndex + 1}`}
                          </h5>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <span className="text-sm font-mono text-gray-700">
                              {param.value.toString()}
                            </span>
                          </div>
                        </div>
                      ))
                    } else {
                      // Fallback to show calldata if no ABI decoding available
                      return (
                        <div key={actionIndex}>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Data</h5>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <div className="text-xs font-mono text-gray-600 break-all">
                              {action.calldata || 'No calldata available'}
                            </div>
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}