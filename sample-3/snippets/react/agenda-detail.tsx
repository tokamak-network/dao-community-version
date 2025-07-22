// React example: Fetch agenda detail and status from blockchain using wagmi
import React from 'react';
import { useContractRead } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../../common/contract-addresses';
import agendaAbi from '../../common/abi/DAOAgendaManager.json';
import daoCommitteeAbi from '../../common/abi/daoCommittee.json';

interface AgendaDetailProps {
  agendaNo: number;
}

const AgendaDetail: React.FC<AgendaDetailProps> = ({ agendaNo }) => {
  // 1. 아젠다 기본 정보
  const { data: agenda, isLoading: loadingAgenda, error: errorAgenda } = useContractRead({
    address: CONTRACT_ADDRESSES.mainnet.DAO_AGENDA_MANAGER,
    abi: agendaAbi,
    functionName: 'agendas',
    args: [agendaNo],
    watch: true,
  });

  // 2. 상태 정보
  const { data: statusInfo, isLoading: loadingStatus, error: errorStatus } = useContractRead({
    address: CONTRACT_ADDRESSES.mainnet.DAO_COMMITTEE,
    abi: daoCommitteeAbi,
    functionName: 'currentAgendaStatus',
    args: [agendaNo],
    watch: true,
  });

  if (loadingAgenda || loadingStatus) return <div>Loading agenda detail...</div>;
  if (errorAgenda) return <div>Error: {errorAgenda.message}</div>;
  if (errorStatus) return <div>Error: {errorStatus.message}</div>;
  if (!agenda) return <div>No data</div>;

  // statusInfo는 [agendaResult, agendaStatus] 형태
  return (
    <div>
      <h2>Agenda #{agendaNo}</h2>
      <p><b>Created:</b> {agenda?.result?.createdTimestamp?.toString?.()}</p>
      <p><b>Status:</b> {agenda?.result?.status?.toString?.()}</p>
      {statusInfo && (
        <>
          <p><b>Agenda Result:</b> {statusInfo[0]?.toString?.()}</p>
          <p><b>Agenda Status:</b> {statusInfo[1]?.toString?.()}</p>
        </>
      )}
      {/* 필요한 필드 추가 */}
    </div>
  );
};

export default AgendaDetail;