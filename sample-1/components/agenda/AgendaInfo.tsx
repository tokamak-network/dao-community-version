'use client'
import { AgendaWithMetadata } from '@/types/agenda'
import { formatDate, formatDateSimple, getStatusMessage, calculateAgendaStatus, getAgendaResult, formatAddress, formatTxHash } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { DAO_COMMITTEE_PROXY_ADDRESS } from '@/config/contracts'
import { getTransactionUrl, getExplorerUrl } from '@/utils/explorer'
import { chain } from '@/config/chain'

interface AgendaInfoProps {
  agenda: AgendaWithMetadata
}

// v2.0.0 기준 currentStatus/result 텍스트 매핑
const getCurrentResultText = (result: number) => {
  const resultMap: { [key: number]: string } = {
    0: 'PENDING',
    1: 'ACCEPT',
    2: 'REJECT',
    3: 'DISMISS',
    4: 'NO_CONSENSUS',
    5: 'NO_AGENDA',
  }
  return resultMap[result] || `Unknown (${result})`
}

const getCurrentStatusText = (status: number) => {
  const statusMap: { [key: number]: string } = {
    0: 'NONE',
    1: 'NOTICE',
    2: 'VOTING',
    3: 'WAITING_EXEC',
    4: 'EXECUTED',
    5: 'ENDED',
    6: 'NO_AGENDA',
  }
  return statusMap[status] || `Unknown (${status})`
}

export default function AgendaInfo({ agenda }: AgendaInfoProps) {
  const chainId = chain.id

  // Calculate dynamic status
  const currentStatus = calculateAgendaStatus(agenda, BigInt(Math.floor(Date.now() / 1000)))
  const statusMessage = getStatusMessage(agenda, currentStatus)
  const agendaResult = getAgendaResult(agenda, currentStatus)

  // v2.0.0 컨트랙트용 current status/result
  const [contractVersion, setContractVersion] = useState<string | null>(null)
  const [currentStatusData, setCurrentStatusData] = useState<{ currentResult: number; currentStatus: number } | null>(null)

  useEffect(() => {
    async function fetchCurrentStatus() {
      try {
        if (typeof window === 'undefined' || !(window as any).ethereum) return
        if (!DAO_COMMITTEE_PROXY_ADDRESS) return
        const provider = new ethers.BrowserProvider((window as any).ethereum)
        // 버전 확인
        const daoContract = new ethers.Contract(
          DAO_COMMITTEE_PROXY_ADDRESS,
          ['function version() view returns (string)'],
          provider
        )
        let version = 'legacy'
        try {
          version = await daoContract.version()
        } catch {
          version = 'legacy'
        }
        setContractVersion(version)
        if (version === '2.0.0') {
          // currentAgendaStatus 호출
          const statusContract = new ethers.Contract(
            DAO_COMMITTEE_PROXY_ADDRESS!,
            ['function currentAgendaStatus(uint256) external view returns (uint256 currentResult, uint256 currentStatus)'],
            provider
          )
          const [currentResult, currentStatus] = await statusContract.currentAgendaStatus(agenda.id)
          setCurrentStatusData({ currentResult: Number(currentResult), currentStatus: Number(currentStatus) })
        }
      } catch (e) {
        setContractVersion('error')
      }
    }
    fetchCurrentStatus()
  }, [agenda.id])

  const openTransaction = (txHash: string) => {
    const explorerUrl = getTransactionUrl(txHash, chainId)
    window.open(explorerUrl, '_blank')
  }

  // Use a more user-friendly fallback for description
  const description = agenda.description || "-";

  // Check if description is a valid URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Creator</span>
        <a
          href={getExplorerUrl(agenda.creator?.address ?? "0x0000000000000000000000000000000000000000", chainId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 text-sm font-mono break-all"
        >
          {formatAddress((agenda.creator?.address ?? "0x0000000000000000000000000000000000000000") as string)}
        </a>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Creation Time</span>
        <span className="text-gray-900 text-sm">{formatDate(Number(agenda.createdTimestamp))}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Notice End Time</span>
        <span className="text-gray-900 text-sm">{formatDate(Number(agenda.noticeEndTimestamp))}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Voting Start Time</span>
        <span className="text-gray-900 text-sm">
          {agenda.votingStartedTimestamp > BigInt(0) ? formatDate(Number(agenda.votingStartedTimestamp)) : "-"}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Voting End Time</span>
        <span className="text-gray-900 text-sm">
          {agenda.votingEndTimestamp > BigInt(0) ? formatDate(Number(agenda.votingEndTimestamp)) : "-"}
        </span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Status</span>
        <span className="text-gray-900 text-sm">{statusMessage}</span>
      </div>

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Result</span>
        <span className="text-gray-900 text-sm font-medium">
          {agendaResult}
        </span>
      </div>

      {/* v2.0.0 Current Status/Result (moved below Agenda Result) */}
      {contractVersion === '2.0.0' && currentStatusData && (
        <div className="mb-2">
          <div className="flex justify-between py-2">
            <span className="text-gray-600 text-sm">Current Result</span>
            <span className="text-gray-900 text-sm font-mono">
              {getCurrentResultText(currentStatusData.currentResult)} ({currentStatusData.currentResult})
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600 text-sm">Current Status</span>
            <span className="text-gray-900 text-sm font-mono">
              {getCurrentStatusText(currentStatusData.currentStatus)} ({currentStatusData.currentStatus})
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Execution Time Limit</span>
        <span className="text-gray-900 text-sm">
          {agenda.executableLimitTimestamp > BigInt(0) ? formatDate(Number(agenda.executableLimitTimestamp)) : "-"}
        </span>
      </div>

      {agenda.executed && (
        <div className="flex justify-between py-2">
          <span className="text-gray-600 text-sm">Executed Time</span>
          <span className="text-gray-900 text-sm">
            {agenda.executedTimestamp > BigInt(0) ? formatDate(Number(agenda.executedTimestamp)) : "-"}
          </span>
        </div>
      )}

      {agenda.transaction && (
        <div className="flex justify-between py-2">
          <span className="text-gray-600 text-sm">Transaction</span>
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700 text-sm font-mono break-all"
            onClick={(e) => {
              e.preventDefault()
              openTransaction(agenda.transaction!)
            }}
          >
            {agenda.transaction ? formatTxHash(agenda.transaction) : "-"} ↗
          </a>
        </div>
      )}

      {agenda.snapshotUrl && (
        <div className="flex justify-between py-2">
          <span className="text-gray-600 text-sm">Snapshot URL (including official announcements)</span>
          <a
            href={agenda.snapshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm break-all"
          >
            {agenda.snapshotUrl} ↗
          </a>
        </div>
      )}

      {agenda.discourseUrl && (
        <div className="flex justify-between py-2">
          <span className="text-gray-600 text-sm">Discussion</span>
          <a
            href={agenda.discourseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm break-all"
          >
            View Discussion ↗
          </a>
        </div>
      )}

      <div className="flex justify-between py-2">
        <span className="text-gray-600 text-sm">Agenda Description</span>
        {isValidUrl(description) ? (
          <a
            href={description}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm break-all"
          >
            {description}
          </a>
        ) : (
          <span className="text-gray-900 text-sm">{description}</span>
        )}
      </div>
    </div>
  )
}