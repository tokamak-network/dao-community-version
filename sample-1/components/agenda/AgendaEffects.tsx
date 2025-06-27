'use client'
import { AgendaWithMetadata } from '@/types/agenda'

interface AgendaEffectsProps {
  agenda: AgendaWithMetadata
}

export default function AgendaEffects({ agenda }: AgendaEffectsProps) {
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
            <tr className="border-b border-gray-100">
              <td className="py-3 text-sm text-gray-900">#1</td>
              <td className="py-3 text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700 font-mono">
                  0xTO0...8770
                </a>
              </td>
              <td className="py-3 text-sm text-gray-900">
                📋 TransferAddresstosc,uir(256)
              </td>
              <td className="py-3 text-sm text-blue-600">
                2 params &gt;
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">DAO Agenda Submission Parameters</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">TON Contract</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <span className="text-sm font-mono text-gray-700">
                0xA2701d4Bb20BE3DD9f60ced579A4FBFfd97e3ab6 ↗
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Function</h4>
            <div className="bg-gray-50 p-3 rounded-md">
              <span className="text-sm text-gray-700">
                approveAndCallAddress spender, uint256 amount, bytes data ↗
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Function Parameters</h4>

            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Spender</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-sm font-mono text-gray-700">
                    0xA2701d4Bb20BE3DD9f60ced579A4FBFfd97e3ab6 ↗
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Amount</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <span className="text-sm text-gray-700">100.0 TON</span>
                </div>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">Data</h5>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-xs font-mono text-gray-600 break-all">
                    0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001520000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000330d4aae433bae8f8b967be31e67ceaa04ef501950000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000d42395423ae883bae8f8b6734e62ea049ef501950000000000000000000000000000000000000000000000000000000000000000000000000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}