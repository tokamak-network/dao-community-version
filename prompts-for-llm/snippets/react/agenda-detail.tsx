// React example: Fetch agenda detail and status from blockchain using wagmi v2
import React from 'react'
import { useReadContract, useChainId } from 'wagmi'
import { getContracts } from '../../lib/wagmi'
import { AGENDA_MANAGER_ABI, COMMITTEE_ABI } from '../../lib/abis'

interface AgendaDetailProps {
  agendaNo: number;
}

const AgendaDetail: React.FC<AgendaDetailProps> = ({ agendaNo }) => {
  const chainId = useChainId()
  const contracts = getContracts(chainId)

  // 1. 아젠다 기본 정보
  const { data: agenda, isLoading: loadingAgenda, error: errorAgenda } = useReadContract({
    address: contracts?.agendaManager as `0x${string}`,
    abi: AGENDA_MANAGER_ABI,
    functionName: 'agendas',
    args: [BigInt(agendaNo)],
  })

  // 2. 상태 정보
  const { data: statusInfo, isLoading: loadingStatus, error: errorStatus } = useReadContract({
    address: contracts?.committee as `0x${string}`,
    abi: COMMITTEE_ABI,
    functionName: 'currentAgendaStatus',
    args: [BigInt(agendaNo)],
  })

  if (loadingAgenda || loadingStatus) return <div>Loading agenda detail...</div>
  if (errorAgenda) return <div>Error: {errorAgenda.message}</div>
  if (errorStatus) return <div>Error: {errorStatus.message}</div>
  if (!agenda) return <div>No data</div>

  const agendaData = agenda as any
  const [agendaResult, agendaStatus] = statusInfo as [bigint, bigint] || [0n, 0n]

  return (
    <div>
      <h2>Agenda #{agendaNo}</h2>
      <p><b>Created:</b> {new Date(Number(agendaData.createdTimestamp) * 1000).toLocaleString()}</p>
      <p><b>Voting Period:</b> {Number(agendaData.votingPeriodInSeconds)} seconds</p>
      <p><b>Yes Votes:</b> {agendaData.countingYes?.toString()}</p>
      <p><b>No Votes:</b> {agendaData.countingNo?.toString()}</p>
      <p><b>Abstain Votes:</b> {agendaData.countingAbstain?.toString()}</p>
      <p><b>Internal Status:</b> {agendaData.status?.toString()}</p>
      <p><b>Committee Result:</b> {agendaResult.toString()}</p>
      <p><b>Committee Status:</b> {agendaStatus.toString()}</p>
      <p><b>Executed:</b> {agendaData.executed ? 'Yes' : 'No'}</p>
    </div>
  )
};

export default AgendaDetail;